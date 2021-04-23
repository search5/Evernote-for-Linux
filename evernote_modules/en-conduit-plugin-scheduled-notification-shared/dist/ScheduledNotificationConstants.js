"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledNotificationEntityTypes = exports.ScheduledNotificationTypeSchema = exports.ScheduledNotificationType = void 0;
const conduit_utils_1 = require("conduit-utils");
var ScheduledNotificationType;
(function (ScheduledNotificationType) {
    ScheduledNotificationType["TaskReminder"] = "TaskReminder";
    ScheduledNotificationType["Calendar"] = "Calendar";
})(ScheduledNotificationType = exports.ScheduledNotificationType || (exports.ScheduledNotificationType = {}));
exports.ScheduledNotificationTypeSchema = conduit_utils_1.Enum(ScheduledNotificationType, 'ScheduledNotificationType');
exports.ScheduledNotificationEntityTypes = {
    ScheduledNotification: 'ScheduledNotification',
    NoteContentInfo: 'NoteContentInfo',
    Reminder: 'Reminder',
    Task: 'Task',
    TaskUserSettings: 'TaskUserSettings',
    Calendar: 'Calendar',
};
//# sourceMappingURL=ScheduledNotificationConstants.js.map