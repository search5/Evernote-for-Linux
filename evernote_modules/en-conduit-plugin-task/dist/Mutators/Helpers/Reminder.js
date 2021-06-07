"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReminderStatus = void 0;
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
const ScheduledNotificationUtils_1 = require("../../ScheduledNotifications/ScheduledNotificationUtils");
const ScheduledNotificationHelpers_1 = require("./ScheduledNotificationHelpers");
async function updateReminderStatus(ctx, trc, taskID, ops, status, fetchedReminders) {
    const reminders = fetchedReminders || await ctx.traverseGraph(trc, { type: en_data_model_1.EntityTypes.Task, id: taskID }, [{ edge: ['outputs', 'reminders'], type: en_data_model_1.EntityTypes.Reminder }]);
    for (const reminder of reminders) {
        if (reminder) {
            const node = ctx.assignFields(en_data_model_1.EntityTypes.Reminder, { status });
            ops.push({
                changeType: 'Node:UPDATE',
                nodeRef: { type: en_data_model_1.EntityTypes.Reminder, id: reminder.id },
                node,
            });
            await ScheduledNotificationUtils_1.forEachTaskReminderScheduledNotification(trc, ctx, reminder, async (snRef, reminderRef) => {
                await ScheduledNotificationHelpers_1.addOpsForTaskReminderSNUpsert(trc, ctx, ops, { mute: status === en_tasks_data_model_1.ReminderStatus.muted, schedulingUpdatedAt: Date.now() }, reminderRef, snRef);
            });
        }
    }
}
exports.updateReminderStatus = updateReminderStatus;
//# sourceMappingURL=Reminder.js.map