"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationManagerSNUtilityDI = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_data_model_1 = require("en-data-model");
const en_notifications_data_model_1 = require("en-notifications-data-model");
const Extractors_1 = require("./Extractors");
function getNotificationIsMute(notification) {
    return notification.NodeFields.mute;
}
exports.notificationManagerSNUtilityDI = {
    getNotificationData: async (trc, graphDB, notificationEntity) => {
        if (!notificationEntity.NodeFields || !notificationEntity.NodeFields.scheduledNotificationType) {
            conduit_utils_1.logger.warn(`Cannot get notification type for notification ID ${notificationEntity.id}. Aborting.`);
            const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, graphDB);
            if (notificationLogsEnabled) {
                conduit_utils_1.recordMetric({
                    name: 'LOCAL_NOTIFICATION_LOG',
                    date: Date.now(),
                    duration: 0,
                    error: `Cannot get notification type for notification ID ${notificationEntity.id}. Aborting.`,
                    notificationEntityId: notificationEntity.id,
                });
            }
            return null;
        }
        switch (notificationEntity.NodeFields.scheduledNotificationType) {
            case en_notifications_data_model_1.ScheduledNotificationType.TaskReminder:
                return Extractors_1.extractTaskReminder(trc, graphDB, notificationEntity);
            case en_notifications_data_model_1.ScheduledNotificationType.Calendar:
                return Extractors_1.extractCalendarNotification(trc, graphDB, notificationEntity);
            default:
                conduit_utils_1.logger.warn(`Unsupported notification type ${notificationEntity.NodeFields.scheduledNotificationType}. for notification ID ${notificationEntity.id}. Aborting`);
                const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, graphDB);
                if (notificationLogsEnabled) {
                    conduit_utils_1.recordMetric({
                        name: 'LOCAL_NOTIFICATION_LOG',
                        date: Date.now(),
                        duration: 0,
                        error: `Unsupported notification type ${notificationEntity.NodeFields.scheduledNotificationType}. for notification ID ${notificationEntity.id}. Aborting`,
                        notificationEntityId: notificationEntity.id,
                        scheduledNotificationType: notificationEntity.NodeFields.scheduledNotificationType,
                    });
                }
                return null;
        }
    },
    getScheduledNotifications: async (trc, graphDB) => {
        const ret = {
            muted: [],
            active: [],
        };
        const scheduledNotifications = await graphDB.getGraphNodesByType(trc, null, en_data_model_1.EntityTypes.ScheduledNotification);
        for (const sn of scheduledNotifications) {
            if (getNotificationIsMute(sn)) {
                ret.muted.push(sn.id);
            }
            else {
                ret.active.push(sn);
            }
        }
        return ret;
    },
    getNotificationIsMute,
};
//# sourceMappingURL=notificationManagerSNUtilityDI.js.map