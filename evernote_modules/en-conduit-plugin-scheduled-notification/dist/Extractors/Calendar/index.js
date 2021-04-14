"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarNotification = void 0;
const conduit_utils_1 = require("conduit-utils");
const ScheduledNotificationConstants_1 = require("../../ScheduledNotificationConstants");
const extractCalendarNotification = (notificationEntity) => {
    if (!notificationEntity) {
        conduit_utils_1.logger.warn(`notificationEntity is not defined. Aborting`);
        return null;
    }
    if (!notificationEntity.NodeFields || !notificationEntity.NodeFields.data) {
        conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Data field is missing. Aborting`);
        return null;
    }
    let target;
    let actionName;
    if (notificationEntity.NodeFields.data.noteId) {
        target = notificationEntity.NodeFields.data.noteId;
        actionName = ScheduledNotificationConstants_1.NotificationActionNames.CalendarNavigateToNote;
    }
    else {
        target = notificationEntity.NodeFields.data.calendarEventId;
        actionName = ScheduledNotificationConstants_1.NotificationActionNames.CalendarCreateNote;
    }
    return {
        notification: {
            id: notificationEntity.id,
            body: notificationEntity.NodeFields.data.title,
            clickNotificationActionTarget: target,
            clickNotificationActionName: actionName,
        },
        sendAt: Number(notificationEntity.NodeFields.data.notificationTime),
        updated: notificationEntity.NodeFields.updated,
        targetClientType: notificationEntity.NodeFields.data.clientType,
    };
};
exports.extractCalendarNotification = extractCalendarNotification;
//# sourceMappingURL=index.js.map