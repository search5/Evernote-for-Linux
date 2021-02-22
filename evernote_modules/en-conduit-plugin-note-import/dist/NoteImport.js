"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteImportPlugin = exports.getSyncContextForContainer = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const graphql_1 = require("graphql");
const CONTAINER_TYPES = [en_data_model_1.CoreEntityTypes.Notebook, en_data_model_1.CoreEntityTypes.Workspace];
async function getSyncContextForContainer(context, container) {
    conduit_core_1.validateDB(context);
    if (!container) {
        return (await context.db.isBusinessAccount(context.trc)) ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT;
    }
    const permContext = new en_data_model_1.GraphQLPermissionContext(context);
    for (const type of CONTAINER_TYPES) {
        const { syncContext, node } = await context.db.getNodeWithContext(context, { id: container, type });
        if (node && syncContext) {
            let policy = null;
            if (type === en_data_model_1.CoreEntityTypes.Notebook) {
                policy = await en_data_model_1.commandPolicyOfNotebook(container, permContext);
            }
            else if (type === en_data_model_1.CoreEntityTypes.Workspace) {
                policy = await en_data_model_1.commandPolicyOfSpace(container, permContext);
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
async function noteImportResolver(parent, args, context, info) {
    var _a;
    conduit_core_1.validateDB(context);
    // find syncContext and userID to use
    const syncContext = await getSyncContextForContainer(context, args.container);
    const syncContextMetadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!syncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(syncContext, 'SyncContextMetadata not found');
    }
    const userID = syncContextMetadata.userID;
    // generate noteID and seed
    const noteGenID = conduit_core_1.GuidGenerator.generateID(userID, en_data_model_1.CoreEntityTypes.Note);
    noteGenID.push(userID.toString());
    const noteID = noteGenID[1];
    // stage attachments for upload and build the attachment data for noteImportInternal
    const fileUploader = context.db.getFileUploader();
    const attachmentDatas = [];
    const attachmentsByHash = new Set();
    for (const attachment of args.attachments || []) {
        const stageParams = Object.assign(Object.assign({}, attachment), { parentID: noteID, parentType: en_data_model_1.CoreEntityTypes.Note });
        const hashAndSize = await fileUploader.getHashAndSize(context.trc, stageParams);
        // dedupe attachments by hash, as the service keys them by hash and won't allow duplicates
        if (!attachmentsByHash.has(hashAndSize.hash)) {
            attachmentsByHash.add(hashAndSize.hash);
            // stage it for upload
            const data = await fileUploader.stageFileUpload(context.trc, stageParams, userID, syncContext, hashAndSize.hash, hashAndSize.size);
            const attachmentData = Object.assign(Object.assign(Object.assign({}, attachment), hashAndSize), { attachmentGenID: data.nodeGenID, stagedBlobID: data.stagedBlobID, url: (_a = data.url) !== null && _a !== void 0 ? _a : undefined, sourceURL: attachment.sourceURL });
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
        noteID: mutation.result,
        attachmentHashes: attachmentDatas.map(attachment => attachment.hash),
    };
}
const TaskCreateSchema = conduit_core_1.schemaToGraphQLType({
    label: 'string',
    taskGroupNoteLevelID: 'string',
    dueDate: 'number?',
    timeZone: 'string?',
    dueDateUIOption: 'string?',
    flag: 'boolean?',
    sortWeight: 'string?',
    noteLevelID: 'string?',
    status: 'string?',
    sourceOfChange: 'string',
}, 'TaskCreateSchema', false, true);
const TasksExportDataSchema = new graphql_1.GraphQLInputObjectType({
    name: 'TasksExportData',
    fields: {
        tasks: { type: new graphql_1.GraphQLList(TaskCreateSchema) },
        taskGroupNoteLevelIDs: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
    },
});
exports.noteImportPlugin = {
    type: conduit_core_1.schemaToGraphQLType({
        noteID: 'ID',
        attachmentHashes: 'string[]',
    }, 'noteImportResult', true),
    resolve: noteImportResolver,
    args: Object.assign(Object.assign({}, conduit_core_1.schemaToGraphQLArgs({
        noteContent: 'string',
        untitledNoteLabel: 'string',
        tags: 'ID[]?',
        container: 'ID?',
        label: 'string?',
        created: 'number?',
        updated: 'number?',
        subjectDate: 'number?',
        contentClass: 'string?',
        latitude: 'number?',
        longitude: 'number?',
        altitude: 'number?',
        placeName: 'string?',
        reminderTime: 'number?',
        reminderDoneTime: 'number?',
        reminderOrder: 'number?',
        author: 'string?',
        source: 'string?',
        sourceUrl: 'string?',
        sourceApplication: 'string?',
        applicationData: 'map<string>?',
    })), { attachments: {
            type: new graphql_1.GraphQLList(conduit_core_1.schemaToGraphQLType({
                path: 'string',
                takeFileOwnership: 'boolean?',
                filename: 'string',
                mime: 'string',
                applicationData: 'map<string>',
                placeholderHash: 'string?',
            }, 'AttachmentImportInfo', false, true)),
        }, tasksData: {
            type: TasksExportDataSchema,
        } }),
};
//# sourceMappingURL=NoteImport.js.map