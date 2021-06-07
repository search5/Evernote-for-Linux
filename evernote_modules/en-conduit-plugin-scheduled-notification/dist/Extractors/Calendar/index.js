"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarNotification = exports.extractCalendarNotificationData = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_notifications_templates_1 = require("en-notifications-templates");
const const_1 = require("../shared/const");
const locale_1 = require("../shared/locale");
const notificationTemplateUtils_1 = require("../shared/notificationTemplateUtils");
function extractCalendarNotificationData(notificationEntity, locale = const_1.DEFAULT_LOCALE) {
    if (!notificationEntity) {
        conduit_utils_1.logger.warn(`notificationEntity is not defined. Aborting`);
        return null;
    }
    if (!notificationEntity.NodeFields || !notificationEntity.NodeFields.payload) {
        conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Data field is missing. Aborting`);
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
    return {
        notification: notificationTemplateUtils_1.transformToConduitNotificationData(systemNotificationData),
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
        return null;
    }
    return extractCalendarNotificationData(notificationEntity, locale_1.getUserLocale(user));
}
exports.extractCalendarNotification = extractCalendarNotification;
//# sourceMappingURL=index.js.map