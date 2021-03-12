"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteCopyMutations = void 0;
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Helpers_1 = require("./Helpers");
async function sharedSetup(noteID, containerID, context) {
    conduit_core_1.validateDB(context);
    const { node: sourceNote, syncContext: sourceSyncContext } = await context.db.getNodeWithContext(context, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: noteID });
    if (!sourceNote) {
        throw new conduit_utils_1.NotFoundError(noteID, 'Source note not found');
    }
    const sourceSyncContextMetadata = await context.db.getSyncContextMetadata(context, sourceSyncContext);
    if (!sourceSyncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(sourceSyncContext, 'SyncContextMetadata not found');
    }
    // find syncContext and userID to use
    const destSyncContext = await Helpers_1.getSyncContextForContainer(context, containerID);
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
async function noteCopyResolver(parent, args, context, info) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    conduit_core_1.validateDB(context);
    const { sourceNote, sourceSyncContext, sourceSyncContextMetadata, destSyncContext, destSyncContextMetadata, } = await sharedSetup(args.note, args.container, context);
    const sourceAuth = en_thrift_connector_1.decodeAuthData(sourceSyncContextMetadata.authToken);
    const userID = destSyncContextMetadata.userID;
    // generate noteID and seed
    const noteGenID = conduit_core_1.GuidGenerator.generateID(userID, en_core_entity_types_1.CoreEntityTypes.Note);
    noteGenID.push(userID.toString());
    const noteID = noteGenID[1];
    const { noteContent, tags, tasksData, attachmentDatas, noteApplicationData, tagLabelsToCreate, } = await Helpers_1.getInfoFromNote(context, sourceAuth, sourceNote, sourceSyncContextMetadata, sourceSyncContext, userID, noteID, destSyncContext, true, info);
    // dispatch noteImportInternal mutator
    const label = (_a = args.label) !== null && _a !== void 0 ? _a : (sourceNote.NodeFields.isUntitled ? undefined : sourceNote.label);
    const mutatorParams = {
        noteGenID,
        noteContent,
        untitledNoteLabel: sourceNote.label,
        attachments: conduit_utils_1.safeStringify(attachmentDatas),
        tasksData: tasksData ? conduit_utils_1.safeStringify(tasksData) : undefined,
        tags,
        newTagLabels: tagLabelsToCreate,
        container: args.container,
        label,
        created: sourceNote.NodeFields.created,
        subjectDate: (_b = sourceNote.NodeFields.Attributes.subjectDate) !== null && _b !== void 0 ? _b : undefined,
        contentClass: (_c = sourceNote.NodeFields.Attributes.contentClass) !== null && _c !== void 0 ? _c : undefined,
        latitude: (_d = sourceNote.NodeFields.Attributes.Location.latitude) !== null && _d !== void 0 ? _d : undefined,
        longitude: (_e = sourceNote.NodeFields.Attributes.Location.longitude) !== null && _e !== void 0 ? _e : undefined,
        altitude: (_f = sourceNote.NodeFields.Attributes.Location.altitude) !== null && _f !== void 0 ? _f : undefined,
        placeName: (_g = sourceNote.NodeFields.Attributes.Location.placeName) !== null && _g !== void 0 ? _g : undefined,
        reminderTime: (_h = sourceNote.NodeFields.Attributes.Reminder.reminderTime) !== null && _h !== void 0 ? _h : undefined,
        reminderDoneTime: (_j = sourceNote.NodeFields.Attributes.Reminder.reminderDoneTime) !== null && _j !== void 0 ? _j : undefined,
        reminderOrder: (_k = sourceNote.NodeFields.Attributes.Reminder.reminderOrder) !== null && _k !== void 0 ? _k : undefined,
        author: (_l = sourceNote.NodeFields.Attributes.Editor.author) !== null && _l !== void 0 ? _l : undefined,
        source: (_m = sourceNote.NodeFields.Attributes.Source.source) !== null && _m !== void 0 ? _m : undefined,
        sourceUrl: (_o = sourceNote.NodeFields.Attributes.Source.sourceURL) !== null && _o !== void 0 ? _o : undefined,
        sourceApplication: (_p = sourceNote.NodeFields.Attributes.Source.sourceApplication) !== null && _p !== void 0 ? _p : undefined,
        applicationData: noteApplicationData,
        sourceNoteID: sourceNote.id,
        deleteSourceNote: Boolean(args.deleteSourceNote),
    };
    const mutation = await context.db.runMutator(context.trc, 'noteImportInternal', mutatorParams);
    return {
        result: mutation.results.result,
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
exports.noteCopyMutations = {
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
//# sourceMappingURL=NoteCopy.js.map