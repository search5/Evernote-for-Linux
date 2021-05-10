"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertProfileGuidFromService = exports.getTaskNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
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
    const task = Object.assign(Object.assign({}, initial), { type: en_data_model_1.EntityTypes.Task, NodeFields: {
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
            assigneeEmail: instance.assigneeEmail || null,
        }, inputs: {
            parent: {},
        }, outputs: {
            creator: {},
            lastEditor: {},
            memberships: {},
            shortcut: {},
            reminders: {},
            assignee: {},
            assignedBy: {},
        } });
    nodesToUpsert.push(task);
    const { creator, lastEditor, assigneeIdentityID, assigneeUserID, assignedByUserID } = instance;
    if (creator) {
        const creatorProfileId = convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.User, creator);
        edgesToCreate.push({
            dstType: en_core_entity_types_1.CoreEntityTypes.Profile,
            dstID: creatorProfileId,
            dstPort: null,
            srcType: task.type, srcID: task.id, srcPort: 'creator',
        });
    }
    if (assignedByUserID) {
        const assignedByProfileId = convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.User, assignedByUserID);
        edgesToCreate.push({
            dstType: en_core_entity_types_1.CoreEntityTypes.Profile,
            dstID: assignedByProfileId,
            dstPort: null,
            srcType: task.type, srcID: task.id, srcPort: 'assignedBy',
        });
    }
    else {
        edgesToDelete.push({
            srcType: task.type, srcID: task.id, srcPort: 'assignedBy',
        });
    }
    if (lastEditor) {
        const lastEditorProfileId = convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.User, lastEditor);
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
        const currentTask = await context.tx.getNode(trc, null, { type: en_data_model_1.EntityTypes.Task, id: task.id });
        const currentParentEdge = conduit_utils_1.firstStashEntry(currentTask === null || currentTask === void 0 ? void 0 : currentTask.inputs.parent);
        if (currentParentEdge) {
            const currentParentID = currentParentEdge.srcID;
            if (parentID !== currentParentID) {
                edgesToDelete.push({
                    dstID: task.id, dstType: en_data_model_1.EntityTypes.Task, dstPort: 'parent',
                });
            }
        }
        edgesToCreate.push({
            srcType: parentType,
            srcID: parentID,
            srcPort: 'tasks',
            dstType: en_data_model_1.EntityTypes.Task,
            dstID: task.id,
            dstPort: 'parent',
        });
    }
    if (assigneeIdentityID || assigneeUserID) {
        const assigneeID = assigneeIdentityID ?
            convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.Identity, assigneeIdentityID) :
            convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.User, assigneeUserID);
        let reassigned = true;
        const currentTask = await context.tx.getNode(trc, null, { type: en_data_model_1.EntityTypes.Task, id: task.id });
        const currentAssigneeEdge = conduit_utils_1.firstStashEntry(currentTask === null || currentTask === void 0 ? void 0 : currentTask.outputs.assignee);
        if (currentAssigneeEdge) {
            const currentAssigneeID = currentAssigneeEdge.dstID;
            if (assigneeID === currentAssigneeID) {
                reassigned = false;
            }
            else {
                edgesToDelete.push({
                    srcType: task.type, srcID: task.id, srcPort: 'assignee',
                });
            }
        }
        if (reassigned) {
            edgesToCreate.push({
                dstType: en_core_entity_types_1.CoreEntityTypes.Profile,
                dstID: assigneeID,
                dstPort: null,
                srcType: task.type, srcID: task.id, srcPort: 'assignee',
            });
        }
    }
    else {
        edgesToDelete.push({
            srcType: task.type, srcID: task.id, srcPort: 'assignee',
        });
    }
    const taskNodesAndEdges = { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
    const snNodesAndEdges = await ScheduledNotificationConverter_1.getSnNodeAndEdgesForTask(trc, task, context);
    return en_nsync_connector_1.mergeNodesAndEdges(taskNodesAndEdges, snNodesAndEdges);
};
exports.getTaskNodeAndEdges = getTaskNodeAndEdges;
// based on workspaces/shared/en-thrift-connector/src/Converters/Converters.ts
function convertProfileGuidFromService(source, id) {
    return (`Profile:${source}:${id}`);
}
exports.convertProfileGuidFromService = convertProfileGuidFromService;
//# sourceMappingURL=TaskConverter.js.map