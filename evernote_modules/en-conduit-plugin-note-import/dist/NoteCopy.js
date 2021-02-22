"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteCopyPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_data_model_1 = require("en-data-model");
const en_thrift_connector_1 = require("en-thrift-connector");
const NoteImport_1 = require("./NoteImport");
async function sharedSetup(noteID, containerID, context) {
    conduit_core_1.validateDB(context);
    const { node: sourceNote, syncContext: sourceSyncContext } = await context.db.getNodeWithContext(context, { type: en_data_model_1.CoreEntityTypes.Note, id: noteID });
    if (!sourceNote) {
        throw new conduit_utils_1.NotFoundError(noteID, 'Source note not found');
    }
    const sourceSyncContextMetadata = await context.db.getSyncContextMetadata(context, sourceSyncContext);
    if (!sourceSyncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(sourceSyncContext, 'SyncContextMetadata not found');
    }
    // find syncContext and userID to use
    const destSyncContext = await NoteImport_1.getSyncContextForContainer(context, containerID);
    const destSyncContextMetadata = await context.db.getSyncContextMetadata(context, destSyncContext);
    if (!destSyncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(destSyncContext, 'SyncContextMetadata not found');
    }
    return {
        sourceNote,
        sourceSyncContext,
        sourceSyncContextMetadata,
        destSyncContext,
        destSyncContextMetadata,
    };
}
function getNoteCopyPlugin(thriftComm) {
    async function noteCopyResolver(parent, args, context, info) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        conduit_core_1.validateDB(context);
        const { sourceNote, sourceSyncContext, sourceSyncContextMetadata, destSyncContext, destSyncContextMetadata, } = await sharedSetup(args.note, args.container, context);
        const sourceAuth = en_thrift_connector_1.decodeAuthData(sourceSyncContextMetadata.authToken);
        const sourceNoteStore = thriftComm.getNoteStore(sourceAuth.urls.noteStoreUrl);
        const sourceAttachmentIDs = Object.values(sourceNote.outputs.attachments).map(edge => edge.dstID);
        const sourceAttachments = await context.db.batchGetNodes(context, en_data_model_1.CoreEntityTypes.Attachment, sourceAttachmentIDs);
        const noteContent = await en_thrift_connector_1.resolveContent(thriftComm, context, info, sourceNote, 'content');
        if (!noteContent) {
            throw new conduit_utils_1.NotFoundError(args.note, 'Failed to fetch source note content for noteCopy');
        }
        const userID = destSyncContextMetadata.userID;
        let tags = [];
        if (sourceSyncContextMetadata.userID === userID) {
            // within the same account, can copy tags
            tags = Object.values(sourceNote.outputs.tags).map(edge => edge.dstID);
        }
        const tasksData = await en_conduit_plugin_task_1.getTasksExportData(context, sourceNote);
        // generate noteID and seed
        const noteGenID = conduit_core_1.GuidGenerator.generateID(userID, en_data_model_1.CoreEntityTypes.Note);
        noteGenID.push(userID.toString());
        const noteID = noteGenID[1];
        // stage attachments for upload and build the attachment data for noteImportInternal
        const fileUploader = context.db.getFileUploader();
        const attachmentDatas = [];
        for (let i = 0; i < sourceAttachments.length; ++i) {
            const sourceAttachment = sourceAttachments[i];
            if (!sourceAttachment) {
                throw new conduit_utils_1.NotFoundError(sourceAttachmentIDs[i], 'Failed to load source note attachment');
            }
            // best effort; we may be offline or the attachment might not be created on the service yet
            const { data: applicationData } = await conduit_utils_1.withError(sourceNoteStore.getResourceApplicationData(context.trc, sourceAuth.token, en_thrift_connector_1.convertGuidToService(sourceAttachment.id, en_data_model_1.CoreEntityTypes.Attachment)));
            // stage it for upload
            const stageParams = {
                parentID: noteID,
                parentType: en_data_model_1.CoreEntityTypes.Note,
                filename: sourceAttachment.NodeFields.filename,
                mime: sourceAttachment.NodeFields.mime,
                source: {
                    parentID: args.note,
                    hash: sourceAttachment.NodeFields.data.hash,
                    remoteUrl: (_a = sourceAttachment.NodeFields.data.url) !== null && _a !== void 0 ? _a : en_thrift_connector_1.generateResourceUrl(sourceSyncContextMetadata, 'res', en_thrift_connector_1.convertGuidToService(sourceAttachment.id, en_data_model_1.CoreEntityTypes.Attachment)),
                    syncContext: sourceSyncContext,
                    sourceRef: {
                        id: sourceAttachment.id,
                        type: en_data_model_1.CoreEntityTypes.Attachment,
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
        // best effort; we may be offline or the source note might not be created on the service yet
        const { data: noteApplicationData } = await conduit_utils_1.withError(sourceNoteStore.getNoteApplicationData(context.trc, sourceAuth.token, en_thrift_connector_1.convertGuidToService(sourceNote.id, en_data_model_1.CoreEntityTypes.Note)));
        // dispatch noteImportInternal mutator
        const label = (_c = args.label) !== null && _c !== void 0 ? _c : (sourceNote.NodeFields.isUntitled ? undefined : sourceNote.label);
        const mutatorParams = {
            noteGenID,
            noteContent,
            untitledNoteLabel: sourceNote.label,
            attachments: conduit_utils_1.safeStringify(attachmentDatas),
            tasksData: tasksData ? conduit_utils_1.safeStringify(tasksData) : undefined,
            tags,
            container: args.container,
            label,
            created: sourceNote.NodeFields.created,
            subjectDate: (_d = sourceNote.NodeFields.Attributes.subjectDate) !== null && _d !== void 0 ? _d : undefined,
            contentClass: (_e = sourceNote.NodeFields.Attributes.contentClass) !== null && _e !== void 0 ? _e : undefined,
            latitude: (_f = sourceNote.NodeFields.Attributes.Location.latitude) !== null && _f !== void 0 ? _f : undefined,
            longitude: (_g = sourceNote.NodeFields.Attributes.Location.longitude) !== null && _g !== void 0 ? _g : undefined,
            altitude: (_h = sourceNote.NodeFields.Attributes.Location.altitude) !== null && _h !== void 0 ? _h : undefined,
            placeName: (_j = sourceNote.NodeFields.Attributes.Location.placeName) !== null && _j !== void 0 ? _j : undefined,
            reminderTime: (_k = sourceNote.NodeFields.Attributes.Reminder.reminderTime) !== null && _k !== void 0 ? _k : undefined,
            reminderDoneTime: (_l = sourceNote.NodeFields.Attributes.Reminder.reminderDoneTime) !== null && _l !== void 0 ? _l : undefined,
            reminderOrder: (_m = sourceNote.NodeFields.Attributes.Reminder.reminderOrder) !== null && _m !== void 0 ? _m : undefined,
            author: (_o = sourceNote.NodeFields.Attributes.Editor.author) !== null && _o !== void 0 ? _o : undefined,
            source: (_p = sourceNote.NodeFields.Attributes.Source.source) !== null && _p !== void 0 ? _p : undefined,
            sourceUrl: (_q = sourceNote.NodeFields.Attributes.Source.sourceURL) !== null && _q !== void 0 ? _q : undefined,
            sourceApplication: (_r = sourceNote.NodeFields.Attributes.Source.sourceApplication) !== null && _r !== void 0 ? _r : undefined,
            applicationData: noteApplicationData,
            sourceNoteID: sourceNote.id,
            deleteSourceNote: Boolean(args.deleteSourceNote),
        };
        const mutation = await context.db.runMutator(context.trc, 'noteImportInternal', mutatorParams);
        return {
            result: mutation.result,
            success: true,
        };
    }
    async function noteMoveResolver(parent, args, context, info) {
        conduit_core_1.validateDB(context);
        const { sourceSyncContext, destSyncContext, } = await sharedSetup(args.note, args.targetContainer, context);
        if (sourceSyncContext !== destSyncContext) {
            // move to a different account or share, do a copy-and-delete
            // NOTE: even two shared noteboks from the same sharer does not let you trivially move from one to the other
            return await noteCopyResolver(parent, {
                note: args.note,
                container: args.targetContainer,
                deleteSourceNote: true,
            }, context, info);
        }
        // regular noteMove (change parent)
        await context.db.runMutator(context.trc, 'noteMoveInternal', { note: args.note, targetContainer: args.targetContainer });
        return {
            result: args.note,
            success: true,
        };
    }
    return {
        noteCopy: {
            type: conduit_core_1.GenericMutationResultWithData,
            resolve: noteCopyResolver,
            args: conduit_core_1.schemaToGraphQLArgs({
                note: 'ID',
                container: 'ID',
                label: 'string?',
            }),
        },
        noteMove: {
            type: conduit_core_1.GenericMutationResultWithData,
            resolve: noteMoveResolver,
            args: conduit_core_1.schemaToGraphQLArgs({
                note: 'ID',
                targetContainer: 'ID',
            }),
        },
    };
}
exports.getNoteCopyPlugin = getNoteCopyPlugin;
//# sourceMappingURL=NoteCopy.js.map