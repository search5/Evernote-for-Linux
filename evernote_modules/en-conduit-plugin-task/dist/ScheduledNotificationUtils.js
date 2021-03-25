"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSnBeMute = exports.commonTraverseGraphAdapter = exports.forEachTaskReminderScheduledNotification = exports.genScheduledNotificationId = exports.getScheduledNotifications = exports.getMetaDataForSN = exports.getDependencyRefsForSN = exports.getScheduledNotificationType = exports.ScheduledNotificationType = void 0;
const conduit_utils_1 = require("conduit-utils");
const TaskConstants_1 = require("./TaskConstants");
var ScheduledNotificationType;
(function (ScheduledNotificationType) {
    ScheduledNotificationType["TaskReminder"] = "TaskReminder";
})(ScheduledNotificationType = exports.ScheduledNotificationType || (exports.ScheduledNotificationType = {}));
/* Pretty simple mapping at this point in time */
function getScheduledNotificationType(dataSourceType) {
    switch (dataSourceType) {
        case 'Task':
            return ScheduledNotificationType.TaskReminder;
        default:
            throw new conduit_utils_1.InvalidParameterError(`dataSourceEnity type not accounted for- ${dataSourceType}. No matching for ScheduledNotificationType`);
    }
}
exports.getScheduledNotificationType = getScheduledNotificationType;
function getDependencyRefsForSN(sn) {
    const scheduling = conduit_utils_1.firstStashEntry(sn.inputs.scheduling);
    const dataSource = conduit_utils_1.firstStashEntry(sn.outputs.dataSource);
    if (!scheduling || !dataSource) {
        return null;
    }
    return [
        { type: scheduling.srcType, id: scheduling.srcID },
        { type: dataSource.dstType, id: dataSource.dstID },
    ];
}
exports.getDependencyRefsForSN = getDependencyRefsForSN;
function getMetaDataForSN(sn) {
    return {
        notificationId: sn.id,
        notificationType: sn.NodeFields.scheduledNotificationType,
        updated: Math.max(sn.NodeFields.schedulingUpdatedAt, sn.NodeFields.dataSourceUpdatedAt),
    };
}
exports.getMetaDataForSN = getMetaDataForSN;
async function getScheduledNotifications(trc, graphDB) {
    const ret = {
        muted: [],
        active: [],
    };
    const scheduledNotifications = await graphDB.getGraphNodesByType(trc, null, TaskConstants_1.TaskEntityTypes.ScheduledNotification);
    for (const sn of scheduledNotifications) {
        const deps = getDependencyRefsForSN(sn);
        if (!deps || sn.NodeFields.mute) {
            ret.muted.push(sn.id);
        }
        else {
            ret.active.push({
                id: sn.id,
                rawData: { dependencyRefs: deps },
                metadata: getMetaDataForSN(sn),
            });
        }
    }
    return ret;
}
exports.getScheduledNotifications = getScheduledNotifications;
function genScheduledNotificationId(scheduledNotificationType, schedulingEntityId) {
    return `${scheduledNotificationType}:${schedulingEntityId}`;
}
exports.genScheduledNotificationId = genScheduledNotificationId;
async function forEachTaskReminderSNOnReminder(trc, ctx, reminderRef, cb) {
    const snRefs = await ctx.traverseGraph(trc, reminderRef, [{ edge: ['outputs', 'scheduledNotification'], type: TaskConstants_1.TaskEntityTypes.ScheduledNotification }]);
    await cb(snRefs[0], reminderRef);
}
async function forEachTaskReminderSNOnTask(trc, ctx, taskRef, cb) {
    const reminders = await ctx.traverseGraph(trc, taskRef, [{ edge: ['outputs', 'reminders'], type: TaskConstants_1.TaskEntityTypes.Reminder }]);
    for (const reminder of reminders) {
        await forEachTaskReminderSNOnReminder(trc, ctx, reminder, cb);
    }
}
async function forEachTaskReminderScheduledNotification(trc, ctx, traverseStartRef, cb) {
    if (traverseStartRef.type === 'Note') {
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
async function shouldSnBeMuteForTask(trc, taskRef, tx) {
    const existingTask = await tx.getNode(trc, null, taskRef);
    const noteEdge = conduit_utils_1.firstStashEntry(existingTask === null || existingTask === void 0 ? void 0 : existingTask.inputs.parent);
    const noteRef = noteEdge ? { id: noteEdge === null || noteEdge === void 0 ? void 0 : noteEdge.srcID, type: noteEdge === null || noteEdge === void 0 ? void 0 : noteEdge.srcType } : null;
    return ((existingTask === null || existingTask === void 0 ? void 0 : existingTask.NodeFields.status) === TaskConstants_1.TaskStatus.completed ||
        (noteRef !== null &&
            await shouldSnBeMuteForNote(trc, noteRef, tx)));
}
async function shouldSnBeMuteForNote(trc, noteRef, tx) {
    const existingNote = await tx.getNode(trc, null, noteRef);
    // TODO: For now, we cannot differentiate between an unsynced note and a note the user
    // has lost permissions to access.  This will be solved when we integrate a source of
    // truth backend for ScheduledNotifications.  Until then, a note that is not found
    // will not cause a scheduled notification to be muted
    return Boolean(existingNote && existingNote.NodeFields.deleted);
}
async function shouldSnBeMute(trc, associatedRef, tx) {
    switch (associatedRef.type) {
        case 'Task':
            return await shouldSnBeMuteForTask(trc, associatedRef, tx);
        case 'Note':
            return await shouldSnBeMuteForNote(trc, associatedRef, tx);
        default:
            return false;
    }
}
exports.shouldSnBeMute = shouldSnBeMute;
//# sourceMappingURL=ScheduledNotificationUtils.js.map