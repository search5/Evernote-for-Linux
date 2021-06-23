"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskIndexConfig = exports.taskTypeDef = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
exports.taskTypeDef = {
    name: en_data_model_1.EntityTypes.Task,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: Object.assign(Object.assign({}, conduit_utils_1.shallowCloneExcluding(en_tasks_data_model_1.TaskEntitySchema.fields, ['assigneeIdentityID', 'assigneeUserID', 'assignedByUserID'])), { created: 'timestamp', updated: 'timestamp', deleted: conduit_utils_1.NullableTimestamp }),
    hasMemberships: {
        constraint: conduit_storage_1.EdgeConstraint.MANY,
        type: conduit_storage_1.EdgeType.MEMBERSHIP,
        to: en_core_entity_types_1.CoreEntityTypes.Membership,
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_core_entity_types_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'tasks',
            },
        },
        creator: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: en_core_entity_types_1.CoreEntityTypes.Profile,
        },
        lastEditor: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: en_core_entity_types_1.CoreEntityTypes.Profile,
        },
        assignee: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: en_core_entity_types_1.CoreEntityTypes.Profile,
        },
        assignedBy: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: en_core_entity_types_1.CoreEntityTypes.Profile,
        },
    },
};
exports.taskIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.taskTypeDef, {
    indexResolvers: {
        creator: conduit_storage_1.getIndexByResolverForEdge(exports.taskTypeDef, ['edges', 'creator']),
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.taskTypeDef, ['edges', 'parent']),
        assignee: conduit_storage_1.getIndexByResolverForEdge(exports.taskTypeDef, ['edges', 'assignee']),
        assignedBy: conduit_storage_1.getIndexByResolverForEdge(exports.taskTypeDef, ['edges', 'assignedBy']),
        dueDate: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'dueDate']),
        flag: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'flag']),
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['label']),
        sortWeight: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'sortWeight']),
        status: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'status']),
        taskGroupNoteLevelID: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'taskGroupNoteLevelID']),
        assignedToMe: {
            schemaType: conduit_utils_1.NullableBoolean,
            resolver: async (trc, node, nodeFieldLookup, dependentFieldValues) => {
                const [assignee] = dependentFieldValues.assignee;
                if (!assignee) {
                    return [null];
                }
                const userProfileID = await nodeFieldLookup(trc, { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User }, 'profile');
                return [userProfileID === assignee];
            },
            dependencies: ['assignee'],
            graphqlPath: ['assignedToMe'],
            isUnSyncedField: true,
        },
        hasReminder: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [Boolean(Object.keys(node.outputs.reminders).length)];
            },
            graphqlPath: ['hasReminder'],
            isUnSyncedField: true,
        },
        inTrash: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [!!node.NodeFields.deleted];
            },
            graphqlPath: ['inTrash'],
            isUnSyncedField: true,
        },
        contentInfo: {
            schemaType: 'ID',
            resolver: async (trc, node, nodeFieldLookup) => {
                const noteEdge = conduit_utils_1.firstStashEntry(node.inputs.parent);
                if (!noteEdge) {
                    return [null];
                }
                const contentInfoID = `${noteEdge.srcID}_${en_data_model_1.EntityTypes.NoteContentInfo}`;
                return [contentInfoID];
            },
            graphqlPath: ['contentInfo'],
            isUnSyncedField: true,
        },
        hasNote: {
            schemaType: 'boolean',
            version: 2,
            resolver: async (trc, node, nodeFieldLookup) => {
                conduit_utils_1.traceEventStart(trc, 'hasNote');
                const noteEdge = conduit_utils_1.firstStashEntry(node.inputs.parent);
                if (!noteEdge) {
                    conduit_utils_1.traceEventEnd(trc, 'hasNote');
                    return [false];
                }
                const parentCreated = await nodeFieldLookup(trc, { id: noteEdge.srcID, type: en_core_entity_types_1.CoreEntityTypes.Note }, 'created');
                const result = [!conduit_utils_1.isNullish(parentCreated)];
                conduit_utils_1.traceEventEnd(trc, 'hasNote');
                return result;
            },
            graphqlPath: ['hasNote'],
            isUnSyncedField: true,
            propagatedFrom: {
                srcType: en_data_model_1.EntityTypes.Note,
                srcField: 'created',
                traversalToDst: [{ edge: ['outputs', 'children'], type: en_data_model_1.EntityTypes.Task }],
            },
        },
    },
    indexes: {},
    queries: {
        Tasks: {
            filter: [{
                    field: 'inTrash',
                    value: false,
                }],
            params: {
                assignee: {
                    optional: true,
                    match: { field: 'assignee' },
                },
                creator: {
                    optional: true,
                    match: { field: 'creator' },
                },
                dueDate: {
                    optional: true,
                    range: { field: 'dueDate' },
                },
                flag: {
                    optional: true,
                    match: { field: 'flag' },
                },
                status: {
                    optional: true,
                    match: { field: 'status' },
                },
                orderBy: {
                    sort: {
                        dueDate: [{ field: 'dueDate', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                        dueDateFlaggedAbove: [{ field: 'dueDate', order: 'DESC' }, { field: 'flag', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                        dueDateCompletedAtBottom: [{ field: 'status', order: 'DESC' }, { field: 'dueDate', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                    },
                },
            },
            includeFields: ['assignedBy', 'assignee', 'dueDate', 'hasNote', 'hasReminder', 'label', 'status', 'taskGroupNoteLevelID'],
        },
        TasksInNote: {
            traversalName: 'descendentTasks',
            params: {
                parent: {
                    match: { field: 'parent' },
                },
                creator: {
                    optional: true,
                    match: { field: 'creator' },
                },
                dueDate: {
                    optional: true,
                    range: { field: 'dueDate' },
                },
                status: {
                    optional: true,
                    match: { field: 'status' },
                },
                orderBy: {
                    sort: {
                        sortWeight: [{ field: 'contentInfo', order: 'DESC' }, { field: 'taskGroupNoteLevelID', order: 'DESC' }, { field: 'sortWeight', order: 'DESC' }],
                        sortWeightCompletedAtBottom: [
                            { field: 'contentInfo', order: 'DESC' },
                            { field: 'status', order: 'DESC' },
                            { field: 'taskGroupNoteLevelID', order: 'DESC' },
                            { field: 'sortWeight', order: 'DESC' },
                        ],
                    },
                },
            },
            includeFields: ['assignedBy', 'assignee', 'dueDate', 'hasReminder', 'label', 'status', 'taskGroupNoteLevelID'],
        },
        TasksWithoutNote: {
            filter: [{
                    field: 'hasNote',
                    value: false,
                }, {
                    field: 'inTrash',
                    value: false,
                }, {
                    field: 'assignedToMe',
                    value: true,
                }],
            params: {
                creator: {
                    optional: true,
                    match: { field: 'creator' },
                },
                dueDate: {
                    optional: true,
                    range: { field: 'dueDate' },
                },
                status: {
                    optional: true,
                    match: { field: 'status' },
                },
                orderBy: {
                    sort: {
                        dueDate: [{ field: 'dueDate', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                        dueDateCompletedAtBottom: [{ field: 'status', order: 'DESC' }, { field: 'dueDate', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                        sortWeight: [{ field: 'contentInfo', order: 'DESC' }, { field: 'taskGroupNoteLevelID', order: 'DESC' }, { field: 'sortWeight', order: 'DESC' }],
                        sortWeightCompletedAtBottom: [
                            { field: 'contentInfo', order: 'DESC' },
                            { field: 'status', order: 'DESC' },
                            { field: 'taskGroupNoteLevelID', order: 'DESC' },
                            { field: 'sortWeight', order: 'DESC' },
                        ],
                    },
                },
            },
            includeFields: ['assignedBy', 'dueDate', 'hasReminder', 'label', 'status', 'taskGroupNoteLevelID'],
        },
    },
    lookups: ['status'],
});
//# sourceMappingURL=Task.js.map