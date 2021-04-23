"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderUpdate = exports.reminderDelete = exports.reminderCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const TaskConstants_1 = require("../TaskConstants");
const ScheduledNotificationHelpers_1 = require("./Helpers/ScheduledNotificationHelpers");
async function validateReminderParams(trc, ctx, taskId, reminderDateUIOption, reminderDate, dueDateOffset) {
    const taskRef = { id: taskId, type: TaskConstants_1.TaskEntityTypes.Task };
    const task = await ctx.fetchEntity(trc, taskRef);
    if (!task) {
        throw new conduit_utils_1.NotFoundError(`Not found Reminder source`);
    }
    if (reminderDateUIOption === TaskConstants_1.ReminderDateUIOption.relative_to_due) {
        if (!task.NodeFields.dueDate) {
            throw new conduit_utils_1.InvalidOperationError(`Relative reminder cannot be created for a task without due date.`);
        }
        if (!dueDateOffset && dueDateOffset !== 0) {
            throw new conduit_utils_1.InvalidOperationError(`Relative reminder must have dueDateOffset.`);
        }
        if ((task.NodeFields.dueDate + dueDateOffset) <= 0) {
            throw new conduit_utils_1.InvalidOperationError(`invalid dueDateOffset`);
        }
    }
    return task;
}
/* Create Reminder */
exports.reminderCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        source: 'ID',
        reminderDate: conduit_utils_1.NullableTimestamp,
        timeZone: conduit_utils_1.NullableString,
        reminderDateUIOption: conduit_utils_1.Nullable(TaskConstants_1.ReminderDateUIOptionSchema),
        dueDateOffset: conduit_utils_1.NullableNumber,
        noteLevelID: conduit_utils_1.NullableString,
        sourceOfChange: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a, _b;
        paramsOut.noteLevelID = (_a = paramsIn.noteLevelID) !== null && _a !== void 0 ? _a : conduit_utils_1.uuid();
        paramsOut.sourceOfChange = (_b = paramsIn.sourceOfChange) !== null && _b !== void 0 ? _b : '';
    },
    execute: async (trc, ctx, params) => {
        const taskRef = { id: params.source, type: TaskConstants_1.TaskEntityTypes.Task };
        let task = await ctx.fetchEntity(trc, taskRef);
        if (!task) {
            // it could happen in conflict situations and we should simply ignore it.
            return {
                results: {},
                ops: [],
            };
        }
        task = await validateReminderParams(trc, ctx, task.id, params.reminderDateUIOption, params.reminderDate, params.dueDateOffset);
        const reminderGenID = await ctx.generateID(trc, ctx.userID, TaskConstants_1.TaskEntityTypes.Reminder);
        const reminderID = reminderGenID[1];
        const reminderEntity = ctx.createEntity({ id: reminderID, type: TaskConstants_1.TaskEntityTypes.Reminder }, {
            reminderDate: params.reminderDateUIOption === TaskConstants_1.ReminderDateUIOption.relative_to_due ? task.NodeFields.dueDate + params.dueDateOffset : params.reminderDate,
            timeZone: params.timeZone,
            reminderDateUIOption: params.reminderDateUIOption,
            created: ctx.timestamp,
            updated: ctx.timestamp,
            dueDateOffset: params.dueDateOffset,
            noteLevelID: params.noteLevelID,
            sourceOfChange: params.sourceOfChange,
            status: TaskConstants_1.ReminderStatus.active,
        }, ctx.userID);
        const plan = {
            results: {
                result: reminderID,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: reminderEntity,
                    id: reminderGenID,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: task.id, srcType: task.type, srcPort: 'reminders',
                            dstID: reminderID, dstType: reminderEntity.type, dstPort: 'source',
                        }],
                }],
        };
        const muteSn = reminderEntity.NodeFields.status === TaskConstants_1.ReminderStatus.muted;
        ScheduledNotificationHelpers_1.addScheduledNotificationCreateOps(trc, ctx, reminderEntity, taskRef, plan.ops, muteSn);
        return plan;
    },
};
/* Delete Reminder */
exports.reminderDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        reminder: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.reminder, type: TaskConstants_1.TaskEntityTypes.Reminder };
        const reminder = await ctx.fetchEntity(trc, nodeRef);
        if (!reminder) {
            // it could happen in conflict situations and we should simply ignore it
            return {
                results: {},
                ops: [],
            };
        }
        const plan = {
            results: {},
            ops: [
                {
                    changeType: 'Node:DELETE',
                    nodeRef,
                },
                {
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [
                        { dstID: params.reminder, dstType: TaskConstants_1.TaskEntityTypes.Reminder, dstPort: 'source' },
                    ],
                },
            ],
        };
        return plan;
    },
};
/* Update Reminder */
exports.reminderUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        reminder: 'ID',
        reminderDateUIOption: TaskConstants_1.ReminderDateUIOptionSchema,
        reminderDate: conduit_utils_1.NullableTimestamp,
        timeZone: conduit_utils_1.NullableString,
        dueDateOffset: conduit_utils_1.NullableNumber,
        sourceOfChange: conduit_utils_1.NullableString,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
    },
    execute: async (trc, ctx, params) => {
        const reminderRef = { id: params.reminder, type: TaskConstants_1.TaskEntityTypes.Reminder };
        const reminder = await ctx.fetchEntity(trc, reminderRef);
        if (!reminder) {
            // it could happen in conflict situations and we should simply ignore it.
            return {
                results: {},
                ops: [],
            };
        }
        const taskEdge = conduit_utils_1.firstStashEntry(reminder.inputs.source);
        if (!taskEdge) {
            throw new conduit_utils_1.InvalidOperationError('Reminder must have a parent task!');
        }
        const task = await validateReminderParams(trc, ctx, taskEdge.srcID, params.reminderDateUIOption, params.reminderDate, params.dueDateOffset);
        const fields = {
            reminderDate: params.reminderDateUIOption === TaskConstants_1.ReminderDateUIOption.relative_to_due ? task.NodeFields.dueDate + params.dueDateOffset : params.reminderDate,
            timeZone: params.timeZone,
            reminderDateUIOption: params.reminderDateUIOption,
            updated: ctx.timestamp,
            dueDateOffset: params.dueDateOffset,
            sourceOfChange: params.sourceOfChange,
        };
        const plan = {
            results: {},
            ops: [
                {
                    changeType: 'Node:UPDATE',
                    nodeRef: reminderRef,
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.Reminder, fields),
                },
            ],
        };
        return plan;
    },
};
//# sourceMappingURL=ReminderMutators.js.map