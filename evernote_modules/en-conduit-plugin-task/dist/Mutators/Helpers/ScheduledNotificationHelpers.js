"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOpsForTaskReminderSNCreate = exports.addOpsForTaskReminderSNUpsert = exports.addScheduledNotificationCreateOps = exports.createNewScheduledNotification = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const ScheduledNotificationUtils_1 = require("../../ScheduledNotifications/ScheduledNotificationUtils");
const TaskConstants_1 = require("../../TaskConstants");
function createNewScheduledNotification(trc, ctx, schedulingEntityRef, dataSourceEntityRef, mute) {
    const scheduledNotificationType = ScheduledNotificationUtils_1.getScheduledNotificationType(dataSourceEntityRef.type);
    const id = `${scheduledNotificationType}:${schedulingEntityRef.id}`;
    const sn = ctx.createEntity({ id, type: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification }, {
        dataSourceUpdatedAt: ctx.timestamp,
        schedulingUpdatedAt: ctx.timestamp,
        scheduledNotificationType,
        created: ctx.timestamp,
        updated: ctx.timestamp,
        mute,
    }, ctx.userID);
    return [sn, id];
}
exports.createNewScheduledNotification = createNewScheduledNotification;
/* Adds ScheduledNotification entity CREATE operations to a mutator plan */
function addScheduledNotificationCreateOps(trc, ctx, schedulingEntityRef, dataSourceEntityRef, ops, mute = false) {
    const [snEntity, snID] = createNewScheduledNotification(trc, ctx, schedulingEntityRef, dataSourceEntityRef, mute);
    /* Create ScheduledNotification ops */
    ops.push({
        changeType: 'Node:CREATE',
        node: snEntity,
        id: ['', snID, ctx.userID, ctx.userID],
    });
    /* Create scheduling and dataSrouce edges ops */
    ops.push({
        changeType: 'Edge:MODIFY',
        edgesToCreate: [{
                srcID: schedulingEntityRef.id, srcType: schedulingEntityRef.type, srcPort: 'scheduledNotification',
                dstID: snID, dstType: snEntity.type, dstPort: 'scheduling',
            }, {
                srcID: snID, srcType: snEntity.type, srcPort: 'dataSource',
                dstID: dataSourceEntityRef.id, dstType: dataSourceEntityRef.type, dstPort: null,
            }],
    });
    return snID;
}
exports.addScheduledNotificationCreateOps = addScheduledNotificationCreateOps;
async function addOpsForTaskReminderSNUpsert(trc, ctx, ops, fields, reminderRef, snRef) {
    if (!snRef) {
        /* No ScheduledNotification associated with reminder yet. Create one */
        await addOpsForTaskReminderSNCreate(trc, ctx, ops, reminderRef);
    }
    else {
        ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: snRef,
            node: ctx.assignFields(en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification, Object.assign(Object.assign({}, fields), { updated: ctx.timestamp })),
        });
    }
}
exports.addOpsForTaskReminderSNUpsert = addOpsForTaskReminderSNUpsert;
async function addOpsForTaskReminderSNCreate(trc, ctx, ops, reminderRef) {
    const taskRef = (await ctx.traverseGraph(trc, reminderRef, [{ edge: ['inputs', 'source'], type: TaskConstants_1.TaskEntityTypes.Task }]))[0];
    if (!taskRef) {
        throw new conduit_utils_1.InvalidOperationError('Cannot create a ScheduledNotification for a reminder that has no Task source edge');
    }
    const task = await ctx.fetchEntity(trc, taskRef);
    addScheduledNotificationCreateOps(trc, ctx, reminderRef, taskRef, ops, (task === null || task === void 0 ? void 0 : task.NodeFields.status) === TaskConstants_1.TaskStatus.completed);
}
exports.addOpsForTaskReminderSNCreate = addOpsForTaskReminderSNCreate;
//# sourceMappingURL=ScheduledNotificationHelpers.js.map