"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSystemNotificationData = void 0;
const notifications_1 = require("../types/notifications");
const createCalendarNotificationData_1 = require("./createCalendarNotificationData");
const createTaskReminderNotificationData_1 = require("./createTaskReminderNotificationData");
/**
 * Transforms input into SystemNotificationData, which includes the required fields to
 * schedule system notifications for both client-side & server-side scenarios.
 * Encapsulates all localization needs and mapping of notification type to notification
 * template design (ex. copy, interaction behavior).
 *
 * @param {CreateSystemNotificationDataConfig} config configuration parameters for
 * building the notification
 * @returns {SystemNotificationData} The data required to schedule the concrete system
 * notification
 */
function createSystemNotificationData({ notificationId, srcData, notificationType, locale, logger, }) {
    switch (notificationType) {
        case notifications_1.SystemNotificationType.Calendar:
            return createCalendarNotificationData_1.createCalendarNotificationData(notificationId, srcData, locale, logger);
        case notifications_1.SystemNotificationType.TaskReminder:
            return createTaskReminderNotificationData_1.createTaskReminderNotificationData(notificationId, srcData, locale, logger);
        default:
            throw new Error(`SystemNotificationType: ${notificationType} not supported`);
    }
}
exports.createSystemNotificationData = createSystemNotificationData;
//# sourceMappingURL=index.js.map