"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderIndexConfig = exports.reminderTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const TaskConstants_1 = require("../TaskConstants");
exports.reminderTypeDef = {
    name: TaskConstants_1.TaskEntityTypes.Reminder,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: {
        reminderDate: 'timestamp?',
        reminderDateUIOption: Object.values(TaskConstants_1.ReminderDateUIOption),
        timeZone: 'string?',
        created: 'timestamp',
        updated: 'timestamp',
        dueDateOffset: 'number?',
        noteLevelID: 'string',
        sourceOfChange: 'string?',
        status: [...Object.values(TaskConstants_1.ReminderStatus), '?'],
    },
    edges: {
        source: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: TaskConstants_1.TaskEntityTypes.Task,
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