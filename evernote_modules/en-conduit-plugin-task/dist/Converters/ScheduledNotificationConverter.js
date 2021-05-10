"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnNodeAndEdgesForReminder = exports.getSnNodeAndEdgesForTask = exports.createSnEntity = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
const simply_immutable_1 = require("simply-immutable");
const ScheduledNotificationUtils_1 = require("../ScheduledNotifications/ScheduledNotificationUtils");
function createSnEntity(schedulingEntityRef, dataSourceEntityRef, currentUserID, isMute) {
    const timestamp = Date.now();
    const scheduledNotificationType = ScheduledNotificationUtils_1.getScheduledNotificationType(dataSourceEntityRef.type);
    const id = ScheduledNotificationUtils_1.genScheduledNotificationId(scheduledNotificationType, schedulingEntityRef.id);
    const sn = {
        id,
        type: en_data_model_1.EntityTypes.ScheduledNotification,
        localChangeTimestamp: 0,
        label: '',
        syncContexts: [],
        version: 0,
        NodeFields: {
            scheduledNotificationType,
            mute: isMute,
            created: timestamp,
            updated: timestamp,
            payload: null,
        },
        owner: currentUserID,
        inputs: {
            scheduling: {},
        },
        outputs: {
            dataSource: {},
        },
    };
    return sn;
}
exports.createSnEntity = createSnEntity;
async function getSnNodeAndEdgesForTask(trc, task, context) {
    const nodesToUpsert = [];
    await ScheduledNotificationUtils_1.forEachTaskReminderScheduledNotification(trc, ScheduledNotificationUtils_1.commonTraverseGraphAdapter(context.tx), { id: task.id, type: en_data_model_1.EntityTypes.Task }, async (snRef) => {
        const existingSn = snRef && (await context.tx.getNode(trc, null, snRef));
        if (existingSn) {
            const updatedSn = simply_immutable_1.updateImmutable(existingSn, ['NodeFields'], {
                updated: Date.now(),
            });
            await context.tx.setNodeCachedField(trc, existingSn, 'dataSourceUpdatedAt', task.NodeFields.updated, {});
            nodesToUpsert.push(updatedSn);
        }
    });
    return { nodes: { nodesToDelete: [], nodesToUpsert }, edges: { edgesToDelete: [], edgesToCreate: [] } };
}
exports.getSnNodeAndEdgesForTask = getSnNodeAndEdgesForTask;
async function getSnNodeAndEdgesForReminder(trc, reminder, taskRef, deleted, context) {
    const nodesToUpsert = [];
    const nodesToDelete = [];
    let nodesAndEdges = { nodes: { nodesToDelete, nodesToUpsert }, edges: { edgesToDelete: [], edgesToCreate: [] } };
    if (!taskRef) {
        conduit_utils_1.logger.error(`Error processing ScheduledNotification changes for Reminder sync: ${reminder.id} -- parentEntity for synced reminders must not be null`);
        return nodesAndEdges;
    }
    const isMute = reminder.NodeFields.status === en_tasks_data_model_1.ReminderStatus.muted;
    await ScheduledNotificationUtils_1.forEachTaskReminderScheduledNotification(trc, ScheduledNotificationUtils_1.commonTraverseGraphAdapter(context.tx), reminder, async (snRef) => {
        // One SN per reminder ->
        const existingSn = snRef && (await context.tx.getNode(trc, null, snRef));
        if (!deleted) {
            if (!existingSn) {
                // create new scheduled notification
                nodesAndEdges = await getScheduledNotificationCreateNodeAndEdges(trc, reminder, taskRef, context, isMute);
            }
            else {
                // update existing scheduled notification
                const updatedSn = simply_immutable_1.updateImmutable(existingSn, ['NodeFields'], {
                    mute: isMute,
                    updated: Date.now(),
                });
                await context.tx.setNodeCachedField(trc, existingSn, 'schedulingUpdatedAt', reminder.NodeFields.updated, {});
                nodesToUpsert.push(updatedSn);
            }
        }
        else {
            if (existingSn) {
                // delete existing scheduled notification
                nodesToDelete.push(existingSn);
            }
            // nothing to delete
        }
    });
    return nodesAndEdges;
}
exports.getSnNodeAndEdgesForReminder = getSnNodeAndEdgesForReminder;
async function getScheduledNotificationCreateNodeAndEdges(trc, schedulingEntityRef, dataSourceEntityRef, context, isMute) {
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const snType = ScheduledNotificationUtils_1.getScheduledNotificationType(dataSourceEntityRef.type);
    const snID = ScheduledNotificationUtils_1.genScheduledNotificationId(snType, schedulingEntityRef.id);
    const sn = createSnEntity(schedulingEntityRef, dataSourceEntityRef, context.currentUserID, isMute);
    nodesToUpsert.push(sn);
    edgesToCreate.push({
        srcID: schedulingEntityRef.id, srcType: schedulingEntityRef.type, srcPort: 'scheduledNotification',
        dstID: snID, dstType: en_data_model_1.EntityTypes.ScheduledNotification, dstPort: 'scheduling',
    });
    edgesToCreate.push({
        srcID: snID, srcType: en_data_model_1.EntityTypes.ScheduledNotification, srcPort: 'dataSource',
        dstID: dataSourceEntityRef.id, dstType: dataSourceEntityRef.type, dstPort: null,
    });
    return { nodes: { nodesToDelete: [], nodesToUpsert }, edges: { edgesToDelete: [], edgesToCreate } };
}
//# sourceMappingURL=ScheduledNotificationConverter.js.map