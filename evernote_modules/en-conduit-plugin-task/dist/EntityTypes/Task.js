"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskIndexConfig = exports.taskTypeDef = void 0;
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
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.taskTypeDef, ['edges', 'parent']),
        assignee: conduit_storage_1.getIndexByResolverForEdge(exports.taskTypeDef, ['edges', 'assignee']),
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['label']),
        sortWeight: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'sortWeight']),
        status: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'status']),
        taskGroupNoteLevelID: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskTypeDef, ['NodeFields', 'taskGroupNoteLevelID']),
        inTrash: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [!!node.NodeFields.deleted];
            },
            graphqlPath: ['inTrash'],
            isUnSyncedField: true,
        },
    },
    indexes: {
        label: {
            index: [
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
        status: {
            index: [
                { field: 'status', order: 'ASC', isMatchField: true },
            ],
        },
        parentIndex: {
            index: [
                { field: 'parent', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
    },
    queries: {
        TasksInNote: {
            traversalName: 'descendentTasks',
            sort: [{ field: 'sortWeight', order: 'DESC' }],
            params: {
                parent: {
                    match: { field: 'parent' },
                },
                status: {
                    optional: true,
                    match: { field: 'status' },
                },
            },
            includeFields: ['status', 'taskGroupNoteLevelID'],
        },
        TasksByAssignee: {
            sort: [{ field: 'sortWeight', order: 'DESC' }],
            params: {
                assignee: {
                    match: { field: 'assignee' },
                },
                inTrash: {
                    optional: true,
                    match: { field: 'inTrash' },
                },
            },
        },
    },
});
//# sourceMappingURL=Task.js.map