"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemNotificationActionName = exports.SystemNotificationType = void 0;
/**
 * Type of notification, ex. Calendar, Task Reminder
 */
var SystemNotificationType;
(function (SystemNotificationType) {
    SystemNotificationType["Calendar"] = "Calendar";
    SystemNotificationType["TaskReminder"] = "TaskReminder";
})(SystemNotificationType = exports.SystemNotificationType || (exports.SystemNotificationType = {}));
var SystemNotificationActionName;
(function (SystemNotificationActionName) {
    SystemNotificationActionName["NavigateToNote"] = "NAVIGATE_TO_NOTE";
    SystemNotificationActionName["CalendarNavigateToNote"] = "CALENDAR_NAVIGATE_TO_NOTE";
    SystemNotificationActionName["CalendarCreateNote"] = "CALENDAR_CREATE_NOTE";
    SystemNotificationActionName["NavigateToTask"] = "NAVIGATE_TO_TASK";
})(SystemNotificationActionName = exports.SystemNotificationActionName || (exports.SystemNotificationActionName = {}));
//# sourceMappingURL=notifications.js.map