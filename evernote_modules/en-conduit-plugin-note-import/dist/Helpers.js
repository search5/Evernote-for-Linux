"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfoFromNote = exports.getSyncContextForContainer = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const CONTAINER_TYPES = [en_core_entity_types_1.CoreEntityTypes.Notebook, en_core_entity_types_1.CoreEntityTypes.Workspace];
async function getSyncContextForContainer(context, container) {
    conduit_core_1.validateDB(context);
    if (!container) {
        return (await context.db.isBusinessAccount(context.trc)) ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT;
    }
    const permContext = new en_core_entity_types_1.GraphQLPermissionContext(context);
    for (const type of CONTAINER_TYPES) {
        const { syncContext, node } = await context.db.getNodeWithContext(context, { id: container, type });
        if (node && syncContext) {
            let policy = null;
            if (type === en_core_entity_types_1.CoreEntityTypes.Notebook) {
                policy = await en_core_entity_types_1.commandPolicyOfNotebook(container, permContext);
            }
            else if (type === en_core_entity_types_1.CoreEntityTypes.Workspace) {
                policy = await en_core_entity_types_1.commandPolicyOfSpace(container, permContext);
            }
            if (policy && !policy.canCreateNote) {
                throw new conduit_utils_1.PermissionError('Not allowed to create notes in the target container');
            }
            return syncContext;
        }
    }
    throw new conduit_utils_1.NotFoundError(container, 'Container not found');
}
exports.getSyncContextForContainer = getSyncContextForContainer;
async function stageAttachmentUploadsForNote(context, sourceAuth, sourceNote, sourceSyncContextMetadata, sourceSyncContext, userID, newNoteID, destSyncContext) {
    var _a, _b;
    conduit_core_1.validateDB(context);
    const fileUploader = context.db.getFileUploader();
    const sourceNoteStore = context.thriftComm.getNoteStore(sourceAuth.urls.noteStoreUrl);
    const sourceAttachmentIDs = Object.values(sourceNote.outputs.attachments).map(edge => edge.dstID);
    const sourceAttachments = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Attachment, sourceAttachmentIDs);
    const attachmentDatas = [];
    for (let i = 0; i < sourceAttachments.length; ++i) {
        const sourceAttachment = sourceAttachments[i];
        if (!sourceAttachment) {
            throw new conduit_utils_1.NotFoundError(sourceAttachmentIDs[i], 'Failed to load source note attachment');
        }
        // best effort; we may be offline or the attachment might not be created on the service yet
        const { data: applicationData } = await conduit_utils_1.withError(sourceNoteStore.getResourceApplicationData(context.trc, sourceAuth.token, en_thrift_connector_1.convertGuidToService(sourceAttachment.id, en_core_entity_types_1.CoreEntityTypes.Attachment)));
        // stage it for upload
        const stageParams = {
            parentID: newNoteID,
            parentType: en_core_entity_types_1.CoreEntityTypes.Note,
            filename: sourceAttachment.NodeFields.filename,
            mime: sourceAttachment.NodeFields.mime,
            source: {
                parentID: sourceNote.id,
                hash: sourceAttachment.NodeFields.data.hash,
                remoteUrl: (_a = sourceAttachment.NodeFields.data.url) !== null && _a !== void 0 ? _a : en_thrift_connector_1.generateResourceUrl(sourceSyncContextMetadata, 'res', en_thrift_connector_1.convertGuidToService(sourceAttachment.id, en_core_entity_types_1.CoreEntityTypes.Attachment)),
                syncContext: sourceSyncContext,
                sourceRef: {
                    id: sourceAttachment.id,
                    type: en_core_entity_types_1.CoreEntityTypes.Attachment,
                },
            },
        };
        const data = await fileUploader.stageFileUpload(context.trc, stageParams, userID, destSyncContext, sourceAttachment.NodeFields.data.hash, sourceAttachment.NodeFields.data.size);
        const attachmentData = {
            filename: sourceAttachment.NodeFields.filename,
            mime: sourceAttachment.NodeFields.mime,
            hash: sourceAttachment.NodeFields.data.hash,
            size: sourceAttachment.NodeFields.data.size,
            attachmentGenID: data.nodeGenID,
            stagedBlobID: data.stagedBlobID,
            url: (_b = data.url) !== null && _b !== void 0 ? _b : undefined,
            applicationData,
        };
        attachmentDatas.push(attachmentData);
    }
    return attachmentDatas;
}
async function getInfoFromNote(context, sourceAuth, sourceNote, sourceSyncContextMetadata, sourceSyncContext, userID, newNoteID, destSyncContext, fetchNoteApplicationData, info) {
    conduit_core_1.validateDB(context);
    const sourceNoteStore = context.thriftComm.getNoteStore(sourceAuth.urls.noteStoreUrl);
    const noteContent = await en_thrift_connector_1.resolveContent(context, info, sourceNote, 'content');
    if (!noteContent) {
        throw new conduit_utils_1.NotFoundError(sourceNote.id, 'Failed to fetch source note content');
    }
    let tags = [];
    const tagLabelsToCreate = [];
    if (sourceSyncContextMetadata.userID === userID) {
        // within the same account, reuse existing tags.
        tags = Object.values(sourceNote.outputs.tags).map(edge => edge.dstID);
    }
    else if (destSyncContext === conduit_core_1.PERSONAL_USER_CONTEXT || destSyncContext === conduit_core_1.VAULT_USER_CONTEXT) {
        // New tag can be created for personal user / vault user sync context
        const tagsInNote = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Tag, Object.values(sourceNote.outputs.tags).map(edge => edge.dstID));
        const tagsInCurrentAccount = await context.db.queryGraph(context, en_core_entity_types_1.CoreEntityTypes.Tag, 'TagsInSyncContext', { syncContext: destSyncContext, orderBy: 'label' });
        for (const tagInNote of (tagsInNote !== null && tagsInNote !== void 0 ? tagsInNote : [])) {
            if (conduit_utils_1.isNullish(tagInNote)) {
                continue;
            }
            // TODO: Fix en-ts-util
            // const { exactMatch, index } = binarySearch<Tag>(
            //   (a, b) => (a.label.localeCompare(b.label)),
            //   tagsInCurrentAccount,
            //   tagInNote,
            // );
            // const tagInAccount = exactMatch && tagsInCurrentAccount[index];
            const tagInAccount = tagsInCurrentAccount.find(t => t.label === tagInNote.label);
            if (tagInAccount) {
                tags.push(tagInAccount.id);
            }
            else {
                // Create a new tag if this is for personal user context / vault user context
                tagLabelsToCreate.push(tagInNote.label);
            }
        }
    }
    const tasksData = await en_conduit_plugin_task_1.getTasksExportData(context, sourceNote);
    // stage attachments for upload and build the attachment data for noteImportInternal
    const attachmentDatas = await stageAttachmentUploadsForNote(context, sourceAuth, sourceNote, sourceSyncContextMetadata, sourceSyncContext, userID, newNoteID, destSyncContext);
    let noteApplicationData;
    if (fetchNoteApplicationData) {
        // best effort; we may be offline or the source note might not be created on the service yet
        const appData = await conduit_utils_1.withError(sourceNoteStore.getNoteApplicationData(context.trc, sourceAuth.token, en_thrift_connector_1.convertGuidToService(sourceNote.id, en_core_entity_types_1.CoreEntityTypes.Note)));
        noteApplicationData = appData.data;
    }
    return {
        noteContent,
        tags,
        tasksData,
        attachmentDatas,
        noteApplicationData,
        tagLabelsToCreate,
    };
}
exports.getInfoFromNote = getInfoFromNote;
//# sourceMappingURL=Helpers.js.map