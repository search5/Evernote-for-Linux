"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminderNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_nsync_connector_1 = require("en-nsync-connector");
const TaskConstants_1 = require("../TaskConstants");
const ScheduledNotificationConverter_1 = require("./ScheduledNotificationConverter");
const getReminderNodeAndEdges = async (trc, instance, context) => {
    var _a, _b, _c;
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const reminderNodesAndEdges = { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return null;
    }
    const reminder = Object.assign(Object.assign({}, initial), { type: TaskConstants_1.TaskEntityTypes.Reminder, NodeFields: {
            created: instance.created,
            updated: instance.updated,
            reminderDate: instance.reminderDate || null,
            reminderDateUIOption: instance.reminderDateUIOption || null,
            timeZone: instance.timeZone || null,
            dueDateOffset: instance.dueDateOffset || null,
            noteLevelID: instance.noteLevelID || '',
            sourceOfChange: (_a = instance.sourceOfChange) !== null && _a !== void 0 ? _a : null,
            status: instance.status || null,
        }, inputs: {
            source: {},
        }, outputs: {
            scheduledNotification: {},
        } });
    nodesToUpsert.push(reminder);
    const parentID = (_b = instance.parentEntity) === null || _b === void 0 ? void 0 : _b.id;
    const parentType = en_conduit_sync_types_1.entityTypeAsNodeType(context.eventManager.di, (_c = instance.parentEntity) === null || _c === void 0 ? void 0 : _c.type, en_core_entity_types_1.CoreEntityTypes.Note);
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