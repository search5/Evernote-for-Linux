"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderStatusContainmentRules = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const ScheduledNotificationHelpers_1 = require("../Mutators/Helpers/ScheduledNotificationHelpers");
const ScheduledNotificationUtils_1 = require("../ScheduledNotifications/ScheduledNotificationUtils");
const TaskConstants_1 = require("../TaskConstants");
exports.ReminderStatusContainmentRules = [{
        on: 'Node:UPDATE',
        where: { type: en_data_model_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await onNoteUpdate(ctx, trc, op, []);
        },
    }];
async function onNoteUpdate(ctx, trc, op, ops) {
    var _a;
    const deleted = (_a = op.node.NodeFields) === null || _a === void 0 ? void 0 : _a.deleted;
    if (deleted === null) {
        await updateAllReminderStatuses(ctx, trc, op.nodeRef, ops, TaskConstants_1.ReminderStatus.active);
        ops.push({
            changeType: 'Custom',
            commandName: 'taskNoteMoveFromTrash',
            params: {
                noteID: op.nodeRef.id,
            },
        });
        await ScheduledNotificationUtils_1.forEachTaskReminderScheduledNotification(trc, ctx, op.nodeRef, async (snRef, reminderRef) => {
            await ScheduledNotificationHelpers_1.addOpsForTaskReminderSNUpsert(trc, ctx, ops, { mute: false }, reminderRef, snRef);
        });
    }
    else if (deleted) {
        await noteMoveToTrashOps(ctx, trc, op.nodeRef, ops);
        await ScheduledNotificationUtils_1.forEachTaskReminderScheduledNotification(trc, ctx, op.nodeRef, async (snRef, reminderRef) => {
            await ScheduledNotificationHelpers_1.addOpsForTaskReminderSNUpsert(trc, ctx, ops, { mute: true }, reminderRef, snRef);
        });
    }
    return ops;
}
async function updateAllReminderStatuses(ctx, trc, nodeRef, ops, status) {
    const tasks = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'tasks'], type: TaskConstants_1.TaskEntityTypes.Task }]);
    const ps = [];
    for (const task of tasks) {
        ps.push(updateReminderStatus(ctx, trc, task.id, ops, status));
    }
    await conduit_utils_1.allSettled(ps);
}
async function updateReminderStatus(ctx, trc, taskID, ops, status) {
    const reminders = await ctx.traverseGraph(trc, { type: TaskConstants_1.TaskEntityTypes.Task, id: taskID }, [{ edge: ['outputs', 'reminders'], type: TaskConstants_1.TaskEntityTypes.Reminder }]);
    for (const reminder of reminders) {
        const node = ctx.assignFields(TaskConstants_1.TaskEntityTypes.Reminder, { status });
        ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: { type: TaskConstants_1.TaskEntityTypes.Reminder, id: reminder.id },
            node,
        });
    }
}
async function noteMoveToTrashOps(ctx, trc, noteRef, ops) {
    await updateAllReminderStatuses(ctx, trc, noteRef, ops, TaskConstants_1.ReminderStatus.muted);
    ops.push({
        changeType: 'Custom',
        commandName: 'taskNoteMoveToTrash',
        params: {
            noteID: noteRef.id,
        },
    });
}
//# sourceMappingURL=ReminderStatusContainmentRules.js.map