"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminderNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const ScheduledNotificationConverter_1 = require("./ScheduledNotificationConverter");
const getReminderNodeAndEdges = async (trc, instance, context) => {
    var _a, _b;
    const reminder = en_nsync_connector_1.convertNsyncEntityToNode(instance, context);
    if (!reminder) {
        return null;
    }
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const reminderNodesAndEdges = { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
    nodesToUpsert.push(reminder);
    const parentID = (_a = instance.parentEntity) === null || _a === void 0 ? void 0 : _a.id;
    const parentType = en_conduit_sync_types_1.entityTypeAsNodeType(context.eventManager.di, (_b = instance.parentEntity) === null || _b === void 0 ? void 0 : _b.type, en_core_entity_types_1.CoreEntityTypes.Note);
    if (parentID && parentType) {
        const currentReminder = await context.tx.getNode(trc, null, { type: en_data_model_1.EntityTypes.Reminder, id: reminder.id });
        const currentParentEdge = conduit_utils_1.firstStashEntry(currentReminder === null || currentReminder === void 0 ? void 0 : currentReminder.inputs.source);
        if (currentParentEdge) {
            const currentParentID = currentParentEdge.srcID;
            if (parentID !== currentParentID) {
                edgesToDelete.push({
                    dstID: reminder.id, dstType: en_data_model_1.EntityTypes.Reminder, dstPort: 'source',
                });
            }
        }
        edgesToCreate.push({
            srcType: parentType,
            srcID: parentID,
            srcPort: 'reminders',
            dstType: en_data_model_1.EntityTypes.Reminder,
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