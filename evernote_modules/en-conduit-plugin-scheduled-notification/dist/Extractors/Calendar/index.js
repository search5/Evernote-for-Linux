"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarNotification = exports.extractCalendarNotificationData = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_notifications_data_model_1 = require("en-notifications-data-model");
const en_notifications_templates_1 = require("en-notifications-templates");
const const_1 = require("../shared/const");
const locale_1 = require("../shared/locale");
const notificationTemplateUtils_1 = require("../shared/notificationTemplateUtils");
async function extractCalendarNotificationData(trc, notificationEntity, locale = const_1.DEFAULT_LOCALE, graphDB) {
    if (!notificationEntity) {
        conduit_utils_1.logger.warn(`notificationEntity is not defined. Aborting`);
        return null;
    }
    if (!notificationEntity.NodeFields || !notificationEntity.NodeFields.payload) {
        conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Data field is missing. Aborting`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, graphDB);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `Cannot get notification data for notification ID ${notificationEntity.id}. Data field is missing. Aborting`,
                notificationEntityId: notificationEntity.id,
            });
        }
        return null;
    }
    const { notificationTime, clientType } = notificationEntity.NodeFields.payload;
    const systemNotificationData = en_notifications_templates_1.createSystemNotificationData({
        notificationId: notificationEntity.id,
        notificationType: en_notifications_templates_1.SystemNotificationType.Calendar,
        srcData: notificationEntity.NodeFields.payload,
        locale,
        logger: conduit_utils_1.logger,
    });
    const metadata = {
        notificationType: en_notifications_data_model_1.ScheduledNotificationType.Calendar,
        schedulingEntityID: null,
        dataSourceEntityID: null,
        target: systemNotificationData.clickNotificationActionTarget,
        expectedNotificationTime: Number(notificationTime),
        notificationEntityId: notificationEntity.id,
    };
    return {
        notification: notificationTemplateUtils_1.transformToConduitNotificationData(systemNotificationData, metadata),
        sendAt: Number(notificationTime),
        updated: notificationEntity.NodeFields.updated,
        targetClientType: clientType,
    };
}
exports.extractCalendarNotificationData = extractCalendarNotificationData;
async function extractCalendarNotification(trc, graphDB, notificationEntity) {
    const user = await graphDB.getNodeWithoutGraphQLContext(trc, const_1.UserRef);
    if (!user) {
        conduit_utils_1.logger.warn(`Unable to fetch user info. Aborting`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, graphDB);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `Unable to fetch user info. Aborting`,
                notificationEntityId: notificationEntity && notificationEntity.id,
            });
        }
        return null;
    }
    return await extractCalendarNotificationData(trc, notificationEntity, locale_1.getUserLocale(user), graphDB);
}
exports.extractCalendarNotification = extractCalendarNotification;
//# sourceMappingURL=index.js.map