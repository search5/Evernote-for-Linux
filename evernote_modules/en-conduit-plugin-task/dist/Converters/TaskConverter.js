"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_nsync_connector_1 = require("en-nsync-connector");
const TaskConstants_1 = require("../TaskConstants");
const ScheduledNotificationConverter_1 = require("./ScheduledNotificationConverter");
const getTaskNodeAndEdges = async (trc, instance, context) => {
    var _a, _b, _c;
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return null;
    }
    const task = Object.assign(Object.assign({}, initial), { type: TaskConstants_1.TaskEntityTypes.Task, NodeFields: {
            created: instance.created,
            updated: instance.updated,
            dueDate: instance.dueDate || null,
            dueDateUIOption: instance.dueDateUIOption || null,
            timeZone: instance.timeZone || null,
            status: instance.status,
            inNote: instance.inNote,
            flag: instance.flag,
            sortWeight: instance.sortWeight,
            noteLevelID: instance.noteLevelID,
            statusUpdated: instance.statusUpdated || null,
            taskGroupNoteLevelID: instance.taskGroupNoteLevelID,
            sourceOfChange: (_a = instance.sourceOfChange) !== null && _a !== void 0 ? _a : null,
        }, inputs: {
            parent: {},
        }, outputs: {
            creator: {},
            lastEditor: {},
            memberships: {},
            shortcut: {},
            reminders: {},
        } });
    nodesToUpsert.push(task);
    const { creator, lastEditor } = instance;
    if (creator) {
        const creatorProfileId = convertGuidFromService(creator, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
        edgesToCreate.push({
            dstType: en_core_entity_types_1.CoreEntityTypes.Profile,
            dstID: creatorProfileId,
            dstPort: null,
            srcType: task.type, srcID: task.id, srcPort: 'creator',
        });
    }
    if (lastEditor) {
        const lastEditorProfileId = convertGuidFromService(lastEditor, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
        edgesToCreate.push({
            dstType: en_core_entity_types_1.CoreEntityTypes.Profile,
            dstID: lastEditorProfileId,
            dstPort: null,
            srcType: task.type, srcID: task.id, srcPort: 'lastEditor',
        });
    }
    const parentID = (_b = instance.parentEntity) === null || _b === void 0 ? void 0 : _b.id;
    const parentType = en_conduit_sync_types_1.entityTypeAsNodeType(context.eventManager.di, (_c = instance.parentEntity) === null || _c === void 0 ? void 0 : _c.type, en_core_entity_types_1.CoreEntityTypes.Note);
    if (parentID && parentType) {
        const currentTask = await context.tx.getNode(trc, null, { type: TaskConstants_1.TaskEntityTypes.Task, id: task.id });
        const currentParentEdge = conduit_utils_1.firstStashEntry(currentTask === null || currentTask === void 0 ? void 0 : currentTask.inputs.parent);
        if (currentParentEdge) {
            const currentParentID = currentParentEdge.srcID;
            if (parentID !== currentParentID) {
                edgesToDelete.push({
                    dstID: task.id, dstType: TaskConstants_1.TaskEntityTypes.Task, dstPort: 'parent',
                });
            }
        }
        edgesToCreate.push({
            srcType: parentType,
            srcID: parentID,
            srcPort: 'tasks',
            dstType: TaskConstants_1.TaskEntityTypes.Task,
            dstID: task.id,
            dstPort: 'parent',
        });
    }
    const taskNodesAndEdges = { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
    const snNodesAndEdges = await ScheduledNotificationConverter_1.getSnNodeAndEdgesForTask(trc, task, context);
    return en_nsync_connector_1.mergeNodesAndEdges(taskNodesAndEdges, snNodesAndEdges);
};
exports.getTaskNodeAndEdges = getTaskNodeAndEdges;
// based on workspaces/shared/en-thrift-connector/src/Converters/Converters.ts
function convertGuidFromService(guid, type, source) {
    return convertProfileGuidFromService(source, guid);
}
function convertProfileGuidFromService(source, id) {
    return (`Profile:${source}:${id}`);
}
//# sourceMappingURL=TaskConverter.js.map