"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskGroupDelete = exports.taskGroupUpsertInNoteContentInfo = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const TaskConstants_1 = require("../TaskConstants");
const TaskUtils_1 = require("../TaskUtils");
const NoteContentInfo_1 = require("./Helpers/NoteContentInfo");
/* Insert/Update TaskGroups in NoteContentInfo */
exports.taskGroupUpsertInNoteContentInfo = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    requiredParams: {
        taskGroupNoteLevelIDs: 'string[]',
    },
    optionalParams: {
        noteID: 'ID',
        sourceOfChange: 'string',
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
        if (!conduit_utils_1.isNullish(paramsOut.noteID)) {
            return;
        }
        const taskUserSettings = await ctx.fetchEntity(trc, { id: TaskUtils_1.getTaskUserSettingsByMutationContext(ctx), type: TaskConstants_1.TaskEntityTypes.TaskUserSettings });
        if (!taskUserSettings) {
            throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_ID, 'TaskUserSettings does not exist');
        }
        const defaultTaskNotes = await ctx.traverseGraph(trc, taskUserSettings, [{ edge: ['outputs', 'defaultTaskNote'], type: en_data_model_1.CoreEntityTypes.Note }]);
        if (!defaultTaskNotes || !defaultTaskNotes.length) {
            throw new conduit_utils_1.NotFoundError('Missing default task note');
        }
        paramsOut.noteID = defaultTaskNotes[0].id;
    },
    execute: async (trc, ctx, params) => {
        const upsertParams = Object.assign(Object.assign({}, params), { noteID: params.noteID, sourceOfChange: params.sourceOfChange });
        return await NoteContentInfo_1.taskGroupUpsertPlan(trc, ctx, upsertParams);
    },
};
/* Delete TaskGroup */
exports.taskGroupDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    requiredParams: {
        noteID: 'ID',
        taskGroupNoteLevelID: 'string',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const note = await ctx.fetchEntity(trc, { type: en_data_model_1.CoreEntityTypes.Note, id: params.noteID });
        if (!note) {
            throw new conduit_utils_1.NotFoundError('note not found in taskGroupDelete');
        }
        const { noteContentInfoID } = await NoteContentInfo_1.getNoteContentInfoID(trc, ctx, note);
        const noteContentInfoRef = { id: noteContentInfoID, type: TaskConstants_1.TaskEntityTypes.NoteContentInfo };
        const noteContentInfo = await ctx.fetchEntity(trc, noteContentInfoRef);
        if (!noteContentInfo) {
            throw new conduit_utils_1.NotFoundError(noteContentInfoRef.id, 'noteContentInfo not found in taskGroupDelete');
        }
        const existingTaskGroups = noteContentInfo.NodeFields.taskGroups;
        if (!existingTaskGroups || !existingTaskGroups.includes(params.taskGroupNoteLevelID)) {
            return {
                result: null,
                ops: [],
            };
        }
        return {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: noteContentInfoRef,
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.NoteContentInfo, {
                        taskGroups: existingTaskGroups.filter(tg => tg !== params.taskGroupNoteLevelID),
                        updated: ctx.timestamp,
                    }),
                }],
        };
    },
};
//# sourceMappingURL=NoteContentInfoMutators.js.map