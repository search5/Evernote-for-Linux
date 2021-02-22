"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteAttachmentUploader = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
class NoteAttachmentUploader {
    async stageFileUpload(trc, stagedBlobManager, params, userID, syncContext, hash, size, takeFileOwnership) {
        const stagedBlobID = await stagedBlobManager.allocStagedBlobID(trc, en_data_model_1.CoreEntityTypes.Attachment);
        const attachmentGenID = [
            ...conduit_core_1.GuidGenerator.generateID(userID, 'Resource'),
            userID.toString(),
        ];
        const attachmentID = attachmentGenID[1];
        if (!attachmentID) {
            throw new Error('Unexpected internal Conduit error: no attachment ID generated');
        }
        const url = await stagedBlobManager.stageBlobForUploadAttachment(trc, stagedBlobID, {
            type: 'Attachment',
            noteID: params.parentID,
            attachmentID,
            hash,
            mimeType: params.mime,
            fileData: params.data,
            filePath: params.path,
            source: params.source,
            syncContext,
            takeFileOwnership: Boolean(takeFileOwnership),
        });
        return {
            nodeGenID: attachmentGenID,
            nodeID: attachmentID,
            stagedBlobID,
            url,
        };
    }
    async doFileUpload(trc, graphDB, stagedBlobManager, params, hash, size) {
        const note = await graphDB.getNodeWithoutGraphQLContext(trc, { id: params.parentID, type: en_data_model_1.CoreEntityTypes.Note });
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.parentID, 'Note not found');
        }
        const existingAttachmentID = await stagedBlobManager.checkForExistingAttachment(trc, graphDB, note, hash, size);
        if (existingAttachmentID) {
            return {
                uploadedNodeID: existingAttachmentID,
                uploadedNodeType: 'Attachmemt',
                uploadedHash: hash,
            };
        }
        const syncContext = await graphDB.getBestSyncContextForNode(trc, note);
        const syncContextMetadata = await graphDB.getSyncContextMetadataWithoutGraphQLContext(trc, syncContext);
        if (!syncContextMetadata) {
            throw new conduit_utils_1.NotFoundError(params.parentID, 'SyncContextMetadata not found for note');
        }
        const { nodeGenID: attachmentGenID, nodeID: attachmentID, stagedBlobID, url } = await this.stageFileUpload(trc, stagedBlobManager, params, syncContextMetadata.userID, syncContext, hash, size, Boolean(params.url));
        const res = await graphDB.runMutator(trc, 'attachmentCreateInternal', {
            noteID: params.parentID,
            filename: params.filename,
            mime: params.mime,
            hash,
            size,
            stagedBlobID,
            applicationData: conduit_utils_1.safeStringify(params.applicationData),
            url,
            attachmentGenID,
            sourceUrl: params.url,
        });
        if (res.result !== attachmentID) {
            throw new conduit_utils_1.InternalError(`Attachment ID from attachmentCreateInternal does not match the ID passed in (res: ${res.result}, gen: ${attachmentID})`);
        }
        return {
            uploadedNodeID: attachmentID,
            uploadedNodeType: 'Attachmemt',
            uploadedHash: hash,
        };
    }
}
exports.NoteAttachmentUploader = NoteAttachmentUploader;
//# sourceMappingURL=NoteAttachmentUploader.js.map