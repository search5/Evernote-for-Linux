"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledNotificationIndexConfig = exports.scheduledNotificationTypeDef = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_storage_1 = require("conduit-storage");
const ScheduledNotificationConstants_1 = require("../ScheduledNotificationConstants");
exports.scheduledNotificationTypeDef = {
    name: ScheduledNotificationConstants_1.ScheduledNotificationEntityTypes.ScheduledNotification,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: {
        scheduledNotificationType: Object.values(ScheduledNotificationConstants_1.ScheduledNotificationType),
        created: 'timestamp',
        updated: 'timestamp',
        mute: 'boolean',
    },
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
                type: ScheduledNotificationConstants_1.ScheduledNotificationEntityTypes.Reminder,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'scheduledNotification',
            },
        },
        dataSource: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: ScheduledNotificationConstants_1.ScheduledNotificationEntityTypes.Task,
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