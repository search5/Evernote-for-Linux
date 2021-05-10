"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderIndexConfig = exports.reminderTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
exports.reminderTypeDef = {
    name: en_data_model_1.EntityTypes.Reminder,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: Object.assign(Object.assign({}, en_tasks_data_model_1.ReminderEntitySchema.fields), { created: 'timestamp', updated: 'timestamp' }),
    edges: {
        source: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_data_model_1.EntityTypes.Task,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'reminders',
            },
        },
    },
};
exports.reminderIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.reminderTypeDef, {
    indexResolvers: {
        source: conduit_storage_1.getIndexByResolverForEdge(exports.reminderTypeDef, ['edges', 'source']),
        reminderDate: conduit_storage_1.getIndexByResolverForPrimitives(exports.reminderTypeDef, ['NodeFields', 'reminderDate']),
        updated: conduit_storage_1.getIndexByResolverForPrimitives(exports.reminderTypeDef, ['NodeFields', 'updated']),
    },
    queries: {
        Reminders: {
            sort: [{ field: 'reminderDate', order: 'ASC' }],
            params: {
                reminderTimeRange: {
                    optional: true,
                    range: { field: 'reminderDate' },
                },
            },
            includeFields: ['source', 'updated'],
        },
    },
});
//# sourceMappingURL=Reminder.js.map