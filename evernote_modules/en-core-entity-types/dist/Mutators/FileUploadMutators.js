"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileInternal = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const FIVE_MB_BASE64 = 7182747; // ceil(5 MiB limit * 1.37 approximation of average increase) for Base64 encoding without compression.
// this has been moved into plugins, but needed here for a while to cover any pending mutations at the time of client upgrade
const deprecatedBlobDefLookup = {
    Board: {
        headerBG: {
            customCommandName: 'boardSetHeaderBG',
            paramIDName: 'board',
            maxSize: FIVE_MB_BASE64,
            mimeParam: 'headerBGMime',
            fileParam: 'headerBGFileName',
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        },
        headerBGPreviousUpload: {
            paramIDName: 'board',
            customCommandName: 'boardSetPreviousHeaderBG',
            maxSize: FIVE_MB_BASE64,
            mimeParam: 'headerBGPreviousUploadMime',
            fileParam: 'headerBGPreviousUploadFileName',
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        },
    },
};
// This is considered a Local type, because we expect these mutations to run locally, and then apply a custom mutation to the service
// The file upload also happens beside the blob:upload mutations inside of the thrift/local executor.
exports.uploadFileInternal = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    isInternal: true,
    params: {
        parentID: 'ID',
        parentType: 'string',
        blobRef: 'string',
        mime: 'string',
        hash: 'string',
        size: 'number',
        stagedBlobID: 'string',
        fileLocation: 'string',
        blobDef: conduit_utils_1.NullableStruct({
            customCommandName: 'string',
            paramIDName: 'string',
            maxSize: 'number',
            mimeParam: conduit_utils_1.NullableString,
            fileParam: conduit_utils_1.NullableString,
            allowedMimeTypes: conduit_utils_1.NullableListOf('string'),
        }),
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const parentRef = { type: params.parentType, id: params.parentID };
        const optimisticUrl = await ctx.generateFileUrl(trc, parentRef, params.parentType, params.parentID);
        const remoteUrl = '/v1/f/' + optimisticUrl[1];
        const blobDef = params.blobDef || (deprecatedBlobDefLookup[params.parentType] && deprecatedBlobDefLookup[params.parentType][params.blobRef]);
        if (!blobDef) {
            throw new Error(`Unknown blob reference for type ${params.parentType} with reference ${params.blobRef}`);
        }
        if (blobDef.allowedMimeTypes && !blobDef.allowedMimeTypes.includes(params.mime)) {
            throw new conduit_utils_1.InvalidParameterError(`mime type ${params.mime} not allowed for type ${params.parentType} with reference ${params.blobRef}`);
        }
        if (params.size > blobDef.maxSize) {
            // TODO: make errors use actual fields once conduit errors are fully separated from thrift errors
            throw new conduit_utils_1.LimitExceededError(`${params.blobRef}ContentSizeMax`, `commandServiceExceptionParameter=${params.blobRef}Content.size limit=${params.blobRef}ContentSizeMax`, blobDef.maxSize);
        }
        const plan = {
            ops: [
                {
                    changeType: 'File:UPLOAD',
                    stagedBlobID: params.stagedBlobID,
                    remoteFields: {
                        parentID: params.parentID,
                        parentType: params.parentType,
                        parentOwnerID: await ctx.resolveOwnerRef(trc, parentRef),
                        mime: params.mime,
                        filename: params.fileLocation,
                    },
                    remoteLocation: optimisticUrl,
                },
                {
                    changeType: 'Node:UPDATE',
                    nodeRef: parentRef,
                    node: {
                        NodeFields: {
                            [params.blobRef]: {
                                localChangeTimestamp: ctx.timestamp,
                                hash: params.hash,
                                size: params.size,
                                path: remoteUrl,
                                version: 1,
                            },
                            [blobDef.mimeParam || 'mime']: params.mime,
                            [blobDef.fileParam || 'filename']: params.fileLocation,
                        },
                    },
                },
            ],
            results: {
                result: remoteUrl,
            },
        };
        if (blobDef.customCommandName) {
            plan.ops.push({
                changeType: 'Custom',
                commandName: blobDef.customCommandName,
                params: {
                    [blobDef.paramIDName]: params.parentID,
                    mime: params.mime,
                    hash: params.hash,
                    size: params.size,
                    fileName: params.fileLocation,
                    url: remoteUrl,
                },
            });
        }
        return plan;
    },
};
//# sourceMappingURL=FileUploadMutators.js.map