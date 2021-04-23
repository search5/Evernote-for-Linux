"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteImport = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_core_entity_types_1 = require("en-core-entity-types");
const Helpers_1 = require("./Helpers");
async function noteImportResolver(parent, args, context, info) {
    var _a;
    conduit_core_1.validateDB(context);
    // find syncContext and userID to use
    const syncContext = await Helpers_1.getSyncContextForContainer(context, args.container);
    const syncContextMetadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!syncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(syncContext, 'SyncContextMetadata not found');
    }
    const userID = syncContextMetadata.userID;
    // generate noteID and seed
    const noteGenID = conduit_core_1.GuidGenerator.generateID(userID, en_core_entity_types_1.CoreEntityTypes.Note);
    noteGenID.push(userID.toString());
    const noteID = noteGenID[1];
    // stage attachments for upload and build the attachment data for noteImportInternal
    const fileUploader = context.db.getFileUploader();
    const attachmentDatas = [];
    const attachmentsByHash = new Set();
    for (const attachment of args.attachments || []) {
        const stageParams = Object.assign(Object.assign({}, attachment), { parentID: noteID, parentType: en_core_entity_types_1.CoreEntityTypes.Note });
        const hashAndSize = await fileUploader.getHashAndSize(context.trc, stageParams);
        // dedupe attachments by hash, as the service keys them by hash and won't allow duplicates
        if (!attachmentsByHash.has(hashAndSize.hash)) {
            attachmentsByHash.add(hashAndSize.hash);
            // stage it for upload
            const data = await fileUploader.stageFileUpload(context.trc, stageParams, userID, syncContext, hashAndSize.hash, hashAndSize.size);
            const attachmentData = Object.assign(Object.assign(Object.assign({}, attachment), hashAndSize), { filename: stageParams.filename || attachment.filename, attachmentGenID: data.nodeGenID, stagedBlobID: data.stagedBlobID, url: (_a = data.url) !== null && _a !== void 0 ? _a : undefined, sourceURL: attachment.sourceURL });
            attachmentDatas.push(attachmentData);
        }
        if (attachment.placeholderHash) {
            args.noteContent = args.noteContent.replace(`hash="${attachment.placeholderHash}"`, `hash="${hashAndSize.hash}"`);
        }
    }
    if (attachmentDatas.length) {
        // if there is a resource that is not present in the content - add it (ION-17254)
        const hashesUsed = conduit_core_1.extractResourceHashes(args.noteContent);
        const attachmentsMissing = attachmentDatas.filter(attachment => !hashesUsed.has(attachment.hash));
        if (attachmentsMissing.length) {
            const mediaTags = attachmentsMissing.map(attachment => `<en-media hash="${attachment.hash}" type="${attachment.mime}" />`).join('');
            const insertionPoint = args.noteContent.lastIndexOf('</en-note>');
            if (insertionPoint !== -1) {
                args.noteContent = args.noteContent.slice(0, insertionPoint) + mediaTags + args.noteContent.slice(insertionPoint);
            }
        }
    }
    // dispatch noteImportInternal mutator
    const mutatorParams = {
        noteGenID,
        noteContent: args.noteContent,
        untitledNoteLabel: args.untitledNoteLabel,
        attachments: conduit_utils_1.safeStringify(attachmentDatas),
        tags: args.tags,
        tasksData: args.tasksData ? conduit_utils_1.safeStringify(args.tasksData) : undefined,
        container: args.container,
        label: args.label,
        created: args.created,
        updated: args.updated,
        subjectDate: args.subjectDate,
        contentClass: args.contentClass,
        latitude: args.latitude,
        longitude: args.longitude,
        altitude: args.altitude,
        placeName: args.placeName,
        reminderTime: args.reminderTime,
        reminderDoneTime: args.reminderDoneTime,
        reminderOrder: args.reminderOrder,
        author: args.author,
        source: args.source,
        sourceUrl: args.sourceUrl,
        sourceApplication: args.sourceApplication,
        applicationData: args.applicationData,
    };
    const mutation = await context.db.runMutator(context.trc, 'noteImportInternal', mutatorParams);
    return {
        noteID: mutation.results.result,
        attachmentHashes: attachmentDatas.map(attachment => attachment.hash),
    };
}
exports.noteImport = {
    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableStruct({
        noteID: 'ID',
        attachmentHashes: conduit_utils_1.ListOf('string'),
    }, 'noteImportResult')),
    resolve: noteImportResolver,
    args: conduit_core_1.schemaToGraphQLArgs({
        noteContent: 'string',
        untitledNoteLabel: 'string',
        tags: conduit_utils_1.NullableListOf('ID'),
        container: conduit_utils_1.NullableID,
        label: conduit_utils_1.NullableString,
        created: conduit_utils_1.NullableTimestamp,
        updated: conduit_utils_1.NullableTimestamp,
        subjectDate: conduit_utils_1.NullableTimestamp,
        contentClass: conduit_utils_1.NullableString,
        latitude: conduit_utils_1.NullableNumber,
        longitude: conduit_utils_1.NullableNumber,
        altitude: conduit_utils_1.NullableNumber,
        placeName: conduit_utils_1.NullableString,
        reminderTime: conduit_utils_1.NullableTimestamp,
        reminderDoneTime: conduit_utils_1.NullableTimestamp,
        reminderOrder: conduit_utils_1.NullableTimestamp,
        author: conduit_utils_1.NullableString,
        source: conduit_utils_1.NullableString,
        sourceUrl: conduit_utils_1.NullableString,
        sourceApplication: conduit_utils_1.NullableString,
        applicationData: conduit_utils_1.NullableMapOf('string'),
        attachments: conduit_utils_1.NullableListOf(conduit_utils_1.Struct({
            path: 'string',
            takeFileOwnership: conduit_utils_1.NullableBoolean,
            filename: 'string',
            mime: 'string',
            applicationData: conduit_utils_1.MapOf('string'),
            placeholderHash: conduit_utils_1.NullableString,
            sourceURL: conduit_utils_1.NullableString,
        }, 'AttachmentImportInfo')),
        tasksData: conduit_utils_1.Nullable(en_conduit_plugin_task_1.TasksExportDataSchema),
    }),
};
//# sourceMappingURL=NoteImport.js.map