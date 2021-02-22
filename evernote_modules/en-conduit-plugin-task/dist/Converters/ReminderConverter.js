"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminderNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const TaskConstants_1 = require("../TaskConstants");
const ScheduledNotificationConverter_1 = require("./ScheduledNotificationConverter");
const getReminderNodeAndEdges = async (trc, instance, context) => {
    var _a, _b;
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const reminderNodesAndEdges = { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return null;
    }
    const reminder = Object.assign(Object.assign({}, initial), { type: TaskConstants_1.TaskEntityTypes.Reminder, NodeFields: {
            created: en_nsync_connector_1.convertLong(instance.created || 0),
            updated: en_nsync_connector_1.convertLong(instance.updated || 0),
            reminderDate: !conduit_utils_1.isNullish(instance.reminderDate) ? en_nsync_connector_1.convertLong(instance.reminderDate) : null,
            reminderDateUIOption: instance.reminderDateUIOption || null,
            timeZone: instance.timeZone || null,
            dueDateOffset: instance.dueDateOffset || null,
            noteLevelID: instance.noteLevelID || '',
            sourceOfChange: instance.sourceOfChange || null,
            status: instance.status || null,
        }, inputs: {
            source: {},
        }, outputs: {
            scheduledNotification: {},
        } });
    nodesToUpsert.push(reminder);
    const parentID = (_a = instance.parentEntity) === null || _a === void 0 ? void 0 : _a.id;
    const parentType = en_nsync_connector_1.entityTypeAsNodeType(context.eventManager, (_b = instance.parentEntity) === null || _b === void 0 ? void 0 : _b.type, en_data_model_1.CoreEntityTypes.Note);
    if (parentID && parentType) {
        const currentReminder = await context.tx.getNode(trc, null, { type: TaskConstants_1.TaskEntityTypes.Reminder, id: reminder.id });
        const currentParentEdge = conduit_utils_1.firstStashEntry(currentReminder === null || currentReminder === void 0 ? void 0 : currentReminder.inputs.source);
        if (currentParentEdge) {
            const currentParentID = currentParentEdge.srcID;
            if (parentID !== currentParentID) {
                edgesToDelete.push({
                    dstID: reminder.id, dstType: TaskConstants_1.TaskEntityTypes.Reminder, dstPort: 'source',
                });
            }
        }
        edgesToCreate.push({
            srcType: parentType,
            srcID: parentID,
            srcPort: 'reminders',
            dstType: TaskConstants_1.TaskEntityTypes.Reminder,
            dstID: reminder.id,
            dstPort: 'source',
        });
    }
    const parentRef = parentID && parentType ? { id: parentID, type: parentType } : null;
    const snNodesAndEdges = await ScheduledNotificationConverter_1.getSnNodeAndEdgesForReminder(trc, reminder, parentRef, Boolean(instance.deleted), context);
    return en_nsync_connector_1.mergeNodesAndEdges(reminderNodesAndEdges, snNodesAndEdges);
};
exports.getReminderNodeAndEdges = getReminderNodeAndEdges;
//# sourceMappingURL=ReminderConverter.js.map