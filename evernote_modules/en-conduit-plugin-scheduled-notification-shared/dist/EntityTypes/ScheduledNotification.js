"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledNotificationIndexConfig = exports.scheduledNotificationTypeDef = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_notifications_data_model_1 = require("en-notifications-data-model");
exports.scheduledNotificationTypeDef = {
    name: en_data_model_1.EntityTypes.ScheduledNotification,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Calendar',
    fieldValidation: {},
    schema: Object.assign(Object.assign({}, conduit_utils_1.shallowCloneExcluding(en_notifications_data_model_1.ScheduledNotificationEntitySchema.fields, ['scheduling', 'dataSource'])), { created: 'timestamp', updated: 'timestamp' }),
    cache: {
        dataSourceUpdatedAt: {
            allowStale: true,
            type: 'timestamp',
            defaultValue: 0,
        },
        schedulingUpdatedAt: {
            allowStale: true,
            type: 'timestamp',
            defaultValue: 0,
        },
    },
    edges: {
        scheduling: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_data_model_1.EntityTypes.Reminder,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'scheduledNotification',
            },
        },
        dataSource: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: en_data_model_1.EntityTypes.Task,
        },
    },
};
exports.scheduledNotificationIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.scheduledNotificationTypeDef, {
    indexResolvers: {},
    queries: {
        ScheduledNotifications: {
            params: {},
        },
    },
});
//# sourceMappingURL=ScheduledNotification.js.map