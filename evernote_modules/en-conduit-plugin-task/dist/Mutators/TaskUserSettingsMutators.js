"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskUserSettingsUpsert = exports.taskUserSettingsSetDefaultTaskNote = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const TaskUtils_1 = require("../TaskUtils");
const Permission_1 = require("./Helpers/Permission");
const TaskUserSettings_1 = require("./Helpers/TaskUserSettings");
exports.taskUserSettingsSetDefaultTaskNote = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        noteID: 'ID',
        pinDefaultTaskNote: conduit_utils_1.NullableBoolean,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const ops = [];
        const nodeRef = { id: params.noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        const taskUserSettingsID = TaskUtils_1.getTaskUserSettingsIdByMutationContext(ctx);
        const note = await ctx.fetchEntity(trc, nodeRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing note in set as default');
        }
        await Permission_1.checkNoteEditPermissionByNoteId(trc, ctx, note.id);
        const taskUserSettingsRef = { id: taskUserSettingsID, type: en_data_model_1.EntityTypes.TaskUserSettings };
        // get existing default-task-note
        const taskUserSettings = await ctx.fetchEntity(trc, taskUserSettingsRef);
        if (!taskUserSettings) {
            ops.push(await TaskUserSettings_1.getNewTaskUserSettingsOps(trc, ctx, taskUserSettingsID, taskUserSettingsRef));
        }
        else {
            await TaskUserSettings_1.ensureTaskUserSettingsID(trc, ctx);
            ops.push({
                changeType: 'Edge:MODIFY',
                edgesToDelete: [{
                        srcID: taskUserSettingsID, srcType: taskUserSettings.type, srcPort: 'defaultTaskNote',
                    }],
            });
        }
        const plan = {
            results: {
                result: taskUserSettingsID,
            },
            ops: [...ops,
                {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: taskUserSettingsID, srcType: en_data_model_1.EntityTypes.TaskUserSettings, srcPort: 'defaultTaskNote',
                            dstID: note.id, dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstPort: 'taskUserSettingsForDefaultNote',
                        }],
                }, {
                    changeType: 'Node:UPDATE',
                    nodeRef: taskUserSettingsRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.TaskUserSettings, {
                        pinDefaultTaskNote: params.pinDefaultTaskNote,
                    }),
                }],
        };
        return plan;
    },
};
exports.taskUserSettingsUpsert = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        defaultReminder: conduit_utils_1.NullableBoolean,
        defaultRemindersOffsets: conduit_utils_1.NullableListOf('number'),
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const ops = [];
        const taskUserSettingsID = TaskUtils_1.getTaskUserSettingsIdByMutationContext(ctx);
        const taskUserSettingsRef = { id: taskUserSettingsID, type: en_data_model_1.EntityTypes.TaskUserSettings };
        const taskUserSettings = await ctx.fetchEntity(trc, taskUserSettingsRef);
        if (!taskUserSettings) {
            ops.push(await TaskUserSettings_1.getNewTaskUserSettingsOps(trc, ctx, taskUserSettingsID, taskUserSettingsRef));
        }
        else {
            await TaskUserSettings_1.ensureTaskUserSettingsID(trc, ctx);
        }
        return {
            results: {
                result: taskUserSettingsID,
            },
            ops: [...ops,
                {
                    changeType: 'Node:UPDATE',
                    nodeRef: taskUserSettingsRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.TaskUserSettings, {
                        defaultReminder: params.defaultReminder,
                        defaultRemindersOffsets: params.defaultRemindersOffsets,
                    }),
                }],
        };
    },
};
//# sourceMappingURL=TaskUserSettingsMutators.js.map