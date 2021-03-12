"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThriftStagedBlobManager = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("./Auth");
const Converters_1 = require("./Converters/Converters");
const Helpers_1 = require("./Converters/Helpers");
const NoteConverter_1 = require("./Converters/NoteConverter");
const ResourceConverter_1 = require("./Converters/ResourceConverter");
const ThriftRpc_1 = require("./ThriftRpc");
const BLOB_STAGE_TIMEOUT = 10 * conduit_utils_1.MILLIS_IN_ONE_MINUTE;
const StagedBlobTable = 'StagedBlobs';
function validateStagedBlob(blob) {
    if (!blob || conduit_utils_1.getTypeOf(blob) !== 'object') {
        return null;
    }
    // resourceRefs had noteID renamed to parentID. Some old resources might exist. Fix it up!
    if (blob.resourceRef && blob.resourceRef.noteID) {
        blob.resourceRef.parentID = blob.resourceRef.noteID;
        delete blob.resourceRef.noteID;
    }
    return blob;
}
async function getAndValidateBlob(trc, blobStorage, stagedBlobID) {
    const blob = await blobStorage.getValidatedValue(trc, null, StagedBlobTable, stagedBlobID, validateStagedBlob);
    if (!blob) {
        // assume already uploaded
        return null;
    }
    if (!blob.type || blob.id !== stagedBlobID) {
        throw new conduit_utils_1.InternalError('Corrupt StagedBlob found');
    }
    return blob;
}
class ThriftStagedBlobManager {
    constructor(graphStorage, blobStorage, resourceManager, thriftComm, localSettings, offlineContentStrategy, quasarConnector) {
        this.graphStorage = graphStorage;
        this.blobStorage = blobStorage;
        this.resourceManager = resourceManager;
        this.thriftComm = thriftComm;
        this.localSettings = localSettings;
        this.offlineContentStrategy = offlineContentStrategy;
        this.quasarConnector = quasarConnector;
        this.stagedData = {};
    }
    async checkForExistingAttachment(trc, graphDB, note, hash, size) {
        const attachmentRefs = [];
        for (const edge of Object.values(note.outputs.attachments)) {
            attachmentRefs.push({ id: edge.dstID, type: en_core_entity_types_1.CoreEntityTypes.Attachment });
        }
        for (const edge of Object.values(note.outputs.inactiveAttachments)) {
            attachmentRefs.push({ id: edge.dstID, type: en_core_entity_types_1.CoreEntityTypes.Attachment });
        }
        const attachments = await conduit_utils_1.allSettled(attachmentRefs.map(ref => graphDB.getNodeWithoutGraphQLContext(trc, ref)));
        for (const attachment of attachments) {
            if (attachment && attachment.NodeFields.data.hash === hash && attachment.NodeFields.data.size === size) {
                return attachment.id;
            }
        }
        return null;
    }
    async allocStagedBlobID(trc, type) {
        const stagedBlobID = conduit_utils_1.uuid();
        // persist StagedBlob entry
        const blob = {
            id: stagedBlobID,
            type,
            timestamp: Date.now(),
            resourceRef: null,
        };
        await this.blobStorage.transact(trc, 'allocStagedBlobID', async (tx) => {
            await tx.setValue(trc, StagedBlobTable, stagedBlobID, blob);
        });
        return stagedBlobID;
    }
    async stageBlobForUpload(trc, stagedBlobID, params) {
        var _a;
        const blob = await getAndValidateBlob(trc, this.blobStorage, stagedBlobID);
        if (!blob) {
            throw new conduit_utils_1.InternalError('StagedBlobID must be allocated before staging the blob data');
        }
        const metadata = await this.graphStorage.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
        if (!metadata) {
            throw new Error('Personal User Context not found');
        }
        let owner = params.owner;
        if (!owner) {
            owner = metadata === null || metadata === void 0 ? void 0 : metadata.userID;
        }
        const host = Auth_1.decodeAuthData(metadata.authToken).urlHost;
        if (!host) {
            throw new Error('Unknown host');
        }
        if (!owner) {
            throw new Error('Unknown entity owner');
        }
        const resourceRef = {
            parentID: params.parentID,
            hash: params.hash,
            remoteUrl: ((_a = this.resourceManager) === null || _a === void 0 ? void 0 : _a.constructFileRemoteURL(host, params.remoteUrl)) || params.remoteUrl,
        };
        if (this.resourceManager) {
            await this.resourceManager.stageResourceForUpload(trc, Object.assign(Object.assign({}, resourceRef), { mimeType: params.mimeType, fileData: params.fileData, filePath: params.filePath, takeFileOwnership: params.takeFileOwnership }));
        }
        else if (params.fileData) {
            this.stagedData[stagedBlobID] = params.fileData;
        }
        else {
            throw new conduit_utils_1.MissingParameterError('This platform only supports uploading file data, not upload by file name');
        }
        await this.blobStorage.transact(trc, 'stageBlobForUpload', async (tx) => {
            await tx.setValue(trc, StagedBlobTable, stagedBlobID, Object.assign(Object.assign({}, blob), { resourceRef }));
        });
    }
    async stageBlobForUploadAttachment(trc, stagedBlobID, params) {
        const blob = await getAndValidateBlob(trc, this.blobStorage, stagedBlobID);
        if (!blob) {
            throw new conduit_utils_1.InternalError('StagedBlobID must be allocated before staging the blob data');
        }
        const syncContext = params.syncContext;
        // resource downloads always use the personal user id, so make sure that gets used in the resourceRef
        // and need note's sync metadata for forming url
        const metadata = await this.graphStorage.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
        const noteMetadata = syncContext !== conduit_core_1.PERSONAL_USER_CONTEXT ? await this.graphStorage.getSyncContextMetadata(trc, null, syncContext) : metadata;
        if (!metadata) {
            throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_CONTEXT, 'Missing personal syncContext metadata');
        }
        if (!noteMetadata) {
            throw new conduit_utils_1.NotFoundError(syncContext, 'Missing syncContext metadata for note');
        }
        const remoteUrl = ResourceConverter_1.generateResourceUrl(noteMetadata, 'res', Converters_1.convertGuidToService(params.attachmentID, en_core_entity_types_1.CoreEntityTypes.Attachment));
        const resourceRef = {
            parentID: params.noteID,
            hash: params.hash,
            remoteUrl,
        };
        let isAvailableViaUrl = false;
        if (this.resourceManager) {
            if (params.source) {
                try {
                    // copyResource may fail, if the source resource is not cached and we are unable to fetch it; this is ok, just make sure no remoteUrl is returned
                    await this.resourceManager.fetchResource(trc, params.source, false);
                    await this.resourceManager.copyResource(trc, params.source, resourceRef);
                    isAvailableViaUrl = true;
                }
                catch (err) {
                    if (err instanceof conduit_utils_1.RetryError) {
                        conduit_utils_1.logger.debug('Unable to fetch/copy source resource for noteCopy, this is expected while offline', err);
                    }
                    else {
                        conduit_utils_1.logger.error('Unable to fetch/copy source resource for noteCopy', err);
                    }
                }
            }
            else {
                await this.resourceManager.stageResourceForUpload(trc, Object.assign(Object.assign({}, resourceRef), { mimeType: params.mimeType, fileData: params.fileData, filePath: params.filePath, takeFileOwnership: params.takeFileOwnership }));
                isAvailableViaUrl = true;
            }
        }
        else if (params.fileData) {
            this.stagedData[stagedBlobID] = params.fileData;
        }
        else if (!params.source) {
            throw new conduit_utils_1.MissingParameterError('This platform only supports uploading file data, not upload by file name');
        }
        // persist StagedBlob entry
        await this.blobStorage.transact(trc, 'stageBlobForUpload', async (tx) => {
            await tx.setValue(trc, StagedBlobTable, stagedBlobID, Object.assign(Object.assign({}, blob), { resourceRef, source: params.source }));
        });
        return isAvailableViaUrl ? remoteUrl : null;
    }
    async deleteStagedBlob(trc, stagedBlobID) {
        await this.blobStorage.transact(trc, 'deleteStagedBlob', async (tx) => {
            await tx.removeValue(trc, StagedBlobTable, stagedBlobID);
        });
        delete this.stagedData[stagedBlobID];
    }
    async getSourceAuth(trc, source) {
        const sourceSyncContextMetadata = await this.graphStorage.getSyncContextMetadata(trc, null, source.syncContext);
        if (!sourceSyncContextMetadata) {
            // probably lost access
            throw new conduit_utils_1.NotFoundError(source.syncContext, 'SyncContextMetadata not found');
        }
        return Auth_1.decodeAuthData(sourceSyncContextMetadata.authToken);
    }
    async uploadStagedFile(trc, stagedBlobID, params) {
        const { auth, seed, remoteFields } = params;
        const { parentType, parentID, parentOwnerID } = remoteFields || {};
        if (!parentType || !parentID) {
            throw new conduit_utils_1.InternalError('Invalid remote fields');
        }
        if (!this.quasarConnector) {
            throw new conduit_utils_1.InternalError('Quasar connector not set up');
        }
        const blob = await getAndValidateBlob(trc, this.blobStorage, stagedBlobID);
        if (!blob) {
            // Assume already uploaded
            return;
        }
        const resourceRef = blob.resourceRef;
        if (!resourceRef) {
            const age = Date.now() - blob.timestamp;
            if (age > BLOB_STAGE_TIMEOUT) {
                throw new conduit_utils_1.InternalError(`File never got staged`);
            }
            throw new conduit_utils_1.RetryError('Attachment data is not staged yet', 500);
        }
        // Get the file contents
        let body = this.stagedData[stagedBlobID];
        if (!body && this.resourceManager) {
            body = await this.resourceManager.getResourceContent(trc, resourceRef);
        }
        const result = await this.quasarConnector.uploadFileToService(trc, auth, parentType, parentID, seed, body, parentOwnerID);
        if (result.error) {
            throw result.error;
        }
        // clean up StagedBlob entry
        await this.blobStorage.transact(trc, 'deleteStagedBlob', async (tx) => {
            await tx.removeValue(trc, StagedBlobTable, stagedBlobID);
        });
        // clean up staged resource data
        if (this.resourceManager) {
            await this.resourceManager.resourceUploadDone(trc, resourceRef, false);
        }
        delete this.stagedData[stagedBlobID];
    }
    // TODO clean up staged blobs on error (except RetryError and AuthError)
    async uploadStagedBlob(trc, stagedBlobID, params) {
        var _a, _b;
        const { auth, serviceGuidSeed, syncContext } = params;
        const { filename, mimeType, hash, size, attachmentID, sourceURL } = params.remoteFields || {};
        let applicationData = (_a = params.remoteFields) === null || _a === void 0 ? void 0 : _a.applicationData;
        if (!filename) {
            throw new conduit_utils_1.MissingParameterError('Missing remoteFields.filename');
        }
        if (!mimeType) {
            throw new conduit_utils_1.MissingParameterError('Missing remoteFields.mimeType');
        }
        if (!hash) {
            throw new conduit_utils_1.MissingParameterError('Missing remoteFields.hash');
        }
        if (!size) {
            throw new conduit_utils_1.MissingParameterError('Missing remoteFields.size');
        }
        if (!attachmentID) {
            throw new conduit_utils_1.MissingParameterError('Missing remoteFields.attachmentID');
        }
        const blob = await getAndValidateBlob(trc, this.blobStorage, stagedBlobID);
        if (!blob) {
            // assume already uploaded
            return;
        }
        const resourceRef = blob.resourceRef;
        if (!resourceRef) {
            const age = Date.now() - blob.timestamp;
            if (age > BLOB_STAGE_TIMEOUT) {
                throw new conduit_utils_1.InternalError(`Blob for Attachment ${attachmentID} never got staged`);
            }
            throw new conduit_utils_1.RetryError('Attachment data is not staged yet', 500);
        }
        const attachmentRef = { id: attachmentID, type: en_core_entity_types_1.CoreEntityTypes.Attachment };
        const noteGuid = Converters_1.convertGuidToService(resourceRef.parentID, en_core_entity_types_1.CoreEntityTypes.Note);
        // Get the file contents
        let body = this.stagedData[stagedBlobID];
        if (blob.source) {
            if (blob.source.sourceRef.type !== en_core_entity_types_1.CoreEntityTypes.Attachment) {
                throw new conduit_utils_1.InternalError(`Unsupported file source type for copy: ${blob.source.sourceRef.type}`);
            }
            const sourceGuid = Converters_1.convertGuidToService(blob.source.sourceRef.id, blob.source.sourceRef.type);
            try {
                if (this.resourceManager) {
                    await this.resourceManager.fetchResource(trc, blob.source, false);
                    await this.resourceManager.copyResource(trc, blob.source, resourceRef);
                }
                else if (!body) {
                    const sourceAuth = await this.getSourceAuth(trc, blob.source);
                    const sourceNoteStore = this.thriftComm.getNoteStore(sourceAuth.urls.noteStoreUrl);
                    const source = await sourceNoteStore.getResource(trc, sourceAuth.token, sourceGuid, true, false, false, false);
                    if (!source.data || !source.data.body) {
                        throw new Error('Missing resource body from notestore.getResource response');
                    }
                    body = source.data.body;
                }
            }
            catch (err) {
                // an error here is expected if the user lost access to the source resource
                conduit_utils_1.logger.warn('Failed to fetch/copy resource for noteCopy while upsyncing', { attachmentID: blob.source.sourceRef.id, err });
                await this.deleteStagedBlob(trc, stagedBlobID);
                await this.graphStorage.transact(trc, 'deleteFailedAttachment', async (graphTransaction) => {
                    await graphTransaction.removeEdges(trc, [{
                            dstID: attachmentID,
                            dstType: en_core_entity_types_1.CoreEntityTypes.Attachment,
                            dstPort: 'parent',
                        }]);
                    await graphTransaction.deleteNode(trc, syncContext, attachmentRef);
                });
                return;
            }
            if (!applicationData) {
                try {
                    const sourceAuth = await this.getSourceAuth(trc, blob.source);
                    const sourceNoteStore = this.thriftComm.getNoteStore(sourceAuth.urls.noteStoreUrl);
                    applicationData = await sourceNoteStore.getResourceApplicationData(trc, sourceAuth.token, sourceGuid);
                }
                catch (err) {
                    conduit_utils_1.logger.info('Failed to fetch resource applicationData for noteCopy while upsyncing', { attachmentID: blob.source.sourceRef.id, err });
                }
            }
        }
        if (!body && this.resourceManager && !this.resourceManager.uploadResource) {
            body = await this.resourceManager.getResourceContent(trc, resourceRef);
        }
        // Upload the resource
        let res;
        const fullMap = !conduit_utils_1.isStashEmpty(applicationData) ? applicationData : undefined;
        if ((_b = this.resourceManager) === null || _b === void 0 ? void 0 : _b.uploadResource) {
            conduit_utils_1.traceEventStart(trc, 'nativeUploadResource', { noteGuid, mimeType, hash });
            res = await conduit_utils_1.traceEventEndWhenSettled(trc, 'nativeUploadResource', ThriftRpc_1.wrapThriftCall(trc, auth.token, 'uploadResource', this.resourceManager, this.resourceManager.uploadResource, trc, auth.urls.utilityUrl, auth.token, resourceRef, noteGuid, mimeType, size, hash, filename, serviceGuidSeed, fullMap, sourceURL));
        }
        else {
            if (!body) {
                throw new conduit_utils_1.InternalError('Upload failed, staged attachment data not found');
            }
            const utilityStore = this.thriftComm.getUtilityStore(auth.urls.utilityUrl);
            res = await utilityStore.addResource(trc, auth.token, {
                noteGuid,
                mime: mimeType,
                data: {
                    body,
                    size,
                    bodyHash: hash,
                },
                attributes: {
                    fileName: filename,
                    applicationData: {
                        fullMap,
                    },
                    sourceURL,
                },
                seed: serviceGuidSeed,
            });
        }
        const resAttachmentID = res.guid && Converters_1.convertGuidFromService(res.guid, en_core_entity_types_1.CoreEntityTypes.Attachment);
        if (resAttachmentID !== attachmentID) {
            conduit_utils_1.logger.warn('Added an attachment that already exists on the service', { noteID: resourceRef.parentID, attachmentID, resAttachmentID });
            if (resAttachmentID) {
                attachmentRef.id = resAttachmentID;
            }
        }
        let isMarkedForOffline = false;
        const noteStore = this.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const noteSpec = new en_conduit_sync_types_1.TNoteResultSpec();
        const noteServiceData = await noteStore.getNoteWithResultSpec(trc, auth.token, noteGuid, noteSpec);
        await this.graphStorage.transact(trc, 'uploadStagedBlob', async (graphTransaction) => {
            var _a, _b, _c, _d;
            // convert resource from service
            const personalMetadata = await graphTransaction.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
            const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
            const vaultMetadata = await graphTransaction.getSyncContextMetadata(trc, null, conduit_core_1.VAULT_USER_CONTEXT);
            const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
            const converterParams = await Helpers_1.makeConverterParams({
                trc,
                graphTransaction,
                personalUserId,
                vaultUserId,
                localSettings: this.localSettings,
                offlineContentStrategy: this.offlineContentStrategy,
            });
            // The result of Utility.addResource does not include attributes.applicationData
            const resourceData = Object.assign(Object.assign({}, res), { attributes: res.attributes ? Object.assign({}, res.attributes) : {} });
            if (fullMap) {
                resourceData.attributes.applicationData = {
                    keysOnly: [
                        // use keys of fullMap as a fallback
                        ...((_c = (_b = (_a = res.attributes) === null || _a === void 0 ? void 0 : _a.applicationData) === null || _b === void 0 ? void 0 : _b.keysOnly) !== null && _c !== void 0 ? _c : Object.keys(fullMap)),
                    ],
                };
            }
            // Conduit has to call ResourceConverter.convertFromService first
            // because noteServiceData does not have `resources` field(null) yet when any resource is attached first time.
            await ResourceConverter_1.ResourceConverter.convertFromService(trc, converterParams, syncContext, resourceData);
            await NoteConverter_1.NoteConverter.convertFromService(trc, converterParams, syncContext, noteServiceData, { skipShares: true });
            if (this.resourceManager) {
                const noteRef = { id: resourceRef.parentID, type: en_core_entity_types_1.CoreEntityTypes.Note };
                const notebooks = await graphTransaction.traverseGraph(trc, null, noteRef, [{
                        edge: ['inputs', 'parent'],
                        type: en_core_entity_types_1.CoreEntityTypes.Notebook,
                    }]);
                const notebookID = (_d = notebooks[0]) === null || _d === void 0 ? void 0 : _d.id;
                isMarkedForOffline = Boolean(converterParams.nbsMarkedOffline && notebookID && (notebookID in converterParams.nbsMarkedOffline));
            }
        });
        const attachment = await this.graphStorage.getNode(trc, null, attachmentRef);
        if ((attachment === null || attachment === void 0 ? void 0 : attachment.NodeFields.data.hash) !== hash) {
            conduit_utils_1.logger.error('Hash mismatch after attachment upload', {
                attachmentID,
                hash,
                attachment,
                res,
            });
        }
        // clean up StagedBlob entry
        await this.deleteStagedBlob(trc, stagedBlobID);
        // clean up staged resource data
        if (this.resourceManager) {
            await this.resourceManager.resourceUploadDone(trc, resourceRef, isMarkedForOffline);
        }
    }
}
exports.ThriftStagedBlobManager = ThriftStagedBlobManager;
//# sourceMappingURL=ThriftStagedBlobManager.js.map