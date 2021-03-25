"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledNotificationIndexConfig = exports.scheduledNotificationTypeDef = exports.NOTIFICATION_DEFAULT_TITLE = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_storage_1 = require("conduit-storage");
const ScheduledNotificationConstants_1 = require("../ScheduledNotifications/ScheduledNotificationConstants");
const TaskConstants_1 = require("../TaskConstants");
exports.NOTIFICATION_DEFAULT_TITLE = 'Evernote';
exports.scheduledNotificationTypeDef = {
    name: TaskConstants_1.TaskEntityTypes.ScheduledNotification,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: {
        dataSourceUpdatedAt: 'timestamp',
        schedulingUpdatedAt: 'timestamp',
        scheduledNotificationType: Object.values(ScheduledNotificationConstants_1.ScheduledNotificationType),
        created: 'timestamp',
        updated: 'timestamp',
        mute: 'boolean',
    },
    edges: {
        scheduling: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: TaskConstants_1.TaskEntityTypes.Reminder,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'scheduledNotification',
            },
        },
        dataSource: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: TaskConstants_1.TaskEntityTypes.Task,
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