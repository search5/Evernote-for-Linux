"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonTraverseGraphAdapter = exports.forEachTaskReminderScheduledNotification = exports.genScheduledNotificationId = exports.getScheduledNotificationType = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_core_entity_types_1 = require("en-core-entity-types");
const TaskConstants_1 = require("../TaskConstants");
function getScheduledNotificationType(dataSourceType) {
    switch (dataSourceType) {
        case TaskConstants_1.TaskEntityTypes.Task:
            return en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationType.TaskReminder;
        default:
            throw new conduit_utils_1.InvalidParameterError(`dataSourceEnity type not accounted for- ${dataSourceType}. No matching for ScheduledNotificationType`);
    }
}
exports.getScheduledNotificationType = getScheduledNotificationType;
function genScheduledNotificationId(scheduledNotificationType, schedulingEntityId) {
    return `${scheduledNotificationType}:${schedulingEntityId}`;
}
exports.genScheduledNotificationId = genScheduledNotificationId;
async function forEachTaskReminderSNOnReminder(trc, ctx, reminderRef, cb) {
    const snRefs = await ctx.traverseGraph(trc, reminderRef, [
        { edge: ['outputs', 'scheduledNotification'], type: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification }
    ]);
    await cb(snRefs[0], reminderRef);
}
async function forEachTaskReminderSNOnTask(trc, ctx, taskRef, cb) {
    const reminders = await ctx.traverseGraph(trc, taskRef, [{ edge: ['outputs', 'reminders'], type: TaskConstants_1.TaskEntityTypes.Reminder }]);
    for (const reminder of reminders) {
        await forEachTaskReminderSNOnReminder(trc, ctx, reminder, cb);
    }
}
async function forEachTaskReminderScheduledNotification(trc, ctx, traverseStartRef, cb) {
    if (traverseStartRef.type === 'Notebook') {
        const notes = await ctx.traverseGraph(trc, traverseStartRef, [{ edge: ['outputs', 'children'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        for (const note of notes) {
            const tasks = await ctx.traverseGraph(trc, { type: note.type, id: note.id }, [{ edge: ['outputs', 'tasks'], type: TaskConstants_1.TaskEntityTypes.Task }]);
            for (const task of tasks) {
                await forEachTaskReminderSNOnTask(trc, ctx, task, cb);
            }
        }
    }
    else if (traverseStartRef.type === 'Note') {
        const tasks = await ctx.traverseGraph(trc, traverseStartRef, [{ edge: ['outputs', 'tasks'], type: TaskConstants_1.TaskEntityTypes.Task }]);
        for (const task of tasks) {
            await forEachTaskReminderSNOnTask(trc, ctx, task, cb);
        }
    }
    else if (traverseStartRef.type === 'Task') {
        await forEachTaskReminderSNOnTask(trc, ctx, traverseStartRef, cb);
    }
    else if (traverseStartRef.type === 'Reminder') {
        await forEachTaskReminderSNOnReminder(trc, ctx, traverseStartRef, cb);
    }
    else {
        throw new Error(`Invalid traversal start type: ${traverseStartRef.type}`);
    }
}
exports.forEachTaskReminderScheduledNotification = forEachTaskReminderScheduledNotification;
function commonTraverseGraphAdapter(tx) {
    return {
        traverseGraph: (trc, nodeRef, traverse) => tx.traverseGraph(trc, null, nodeRef, traverse),
    };
}
exports.commonTraverseGraphAdapter = commonTraverseGraphAdapter;
//# sourceMappingURL=ScheduledNotificationUtils.js.map