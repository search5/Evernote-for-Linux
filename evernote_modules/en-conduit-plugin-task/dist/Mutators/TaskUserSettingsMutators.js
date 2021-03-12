"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskUserSettingsUpsert = exports.taskUserSettingsSetDefaultTaskNote = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const TaskConstants_1 = require("../TaskConstants");
const TaskUtils_1 = require("../TaskUtils");
const Task_1 = require("./Helpers/Task");
async function getNewTaskUserSettingsOps(trc, ctx, id, ref, defaultRemindersOffsets) {
    const settingsGenID = await ensureTaskUserSettingsID(trc, ctx);
    if (settingsGenID[1] !== id) {
        throw new Error(`Inconsistent taskUserSettingsID: expected<${id}>, but actual<${settingsGenID[1]}>`);
    }
    const taskUserSettingsEntity = ctx.createEntity(ref, {
        label: 'USER_TASK_SETTINGS_LABEL',
        created: ctx.timestamp,
        updated: ctx.timestamp,
        defaultRemindersOffsets,
    }, ctx.userID);
    return {
        changeType: 'Node:CREATE',
        node: taskUserSettingsEntity,
        id: settingsGenID,
    };
}
// make sure that the deterministic taskUserSettingsID is included in the guids field
// as part of the request sending to the backend service.
//
async function ensureTaskUserSettingsID(trc, ctx) {
    return ctx.generateDeterministicID(trc, ctx.userID, TaskConstants_1.TaskEntityTypes.TaskUserSettings, TaskConstants_1.TaskDeterministicIdGenerator);
}
exports.taskUserSettingsSetDefaultTaskNote = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    requiredParams: {
        noteID: 'ID',
    },
    optionalParams: {
        pinDefaultTaskNote: 'boolean',
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const ops = [];
        const nodeRef = { id: params.noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        const taskUserSettingsID = TaskUtils_1.getTaskUserSettingsByMutationContext(ctx);
        const note = await ctx.fetchEntity(trc, nodeRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing note in set as default');
        }
        await Task_1.checkNoteEditPermissionByNoteId(trc, ctx, note.id);
        const taskUserSettingsRef = { id: taskUserSettingsID, type: TaskConstants_1.TaskEntityTypes.TaskUserSettings };
        // get existing default-task-note
        const taskUserSettings = await ctx.fetchEntity(trc, taskUserSettingsRef);
        if (!taskUserSettings) {
            ops.push(await getNewTaskUserSettingsOps(trc, ctx, taskUserSettingsID, taskUserSettingsRef));
        }
        else {
            await ensureTaskUserSettingsID(trc, ctx);
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
                            srcID: taskUserSettingsID, srcType: TaskConstants_1.TaskEntityTypes.TaskUserSettings, srcPort: 'defaultTaskNote',
                            dstID: note.id, dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstPort: 'taskUserSettingsForDefaultNote',
                        }],
                }, {
                    changeType: 'Node:UPDATE',
                    nodeRef: taskUserSettingsRef,
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.TaskUserSettings, {
                        pinDefaultTaskNote: params.pinDefaultTaskNote,
                    }),
                }],
        };
        return plan;
    },
};
exports.taskUserSettingsUpsert = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    requiredParams: {},
    optionalParams: {
        defaultReminder: 'boolean',
        defaultRemindersOffsets: 'number[]',
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const ops = [];
        const taskUserSettingsID = TaskUtils_1.getTaskUserSettingsByMutationContext(ctx);
        const taskUserSettingsRef = { id: taskUserSettingsID, type: TaskConstants_1.TaskEntityTypes.TaskUserSettings };
        const taskUserSettings = await ctx.fetchEntity(trc, taskUserSettingsRef);
        if (!taskUserSettings) {
            ops.push(await getNewTaskUserSettingsOps(trc, ctx, taskUserSettingsID, taskUserSettingsRef));
        }
        else {
            await ensureTaskUserSettingsID(trc, ctx);
        }
        return {
            results: {
                result: taskUserSettingsID,
            },
            ops: [...ops,
                {
                    changeType: 'Node:UPDATE',
                    nodeRef: taskUserSettingsRef,
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.TaskUserSettings, {
                        defaultReminder: params.defaultReminder,
                        defaultRemindersOffsets: params.defaultRemindersOffsets,
                    }),
                }],
        };
    },
};
//# sourceMappingURL=TaskUserSettingsMutators.js.map