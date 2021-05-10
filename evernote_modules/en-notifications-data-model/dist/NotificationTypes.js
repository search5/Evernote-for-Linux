"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledNotificationTypeSchema = exports.ScheduledNotificationType = void 0;
const en_ts_utils_1 = require("en-ts-utils");
var ScheduledNotificationType;
(function (ScheduledNotificationType) {
    ScheduledNotificationType["TaskReminder"] = "TaskReminder";
    ScheduledNotificationType["Calendar"] = "Calendar";
})(ScheduledNotificationType = exports.ScheduledNotificationType || (exports.ScheduledNotificationType = {}));
exports.ScheduledNotificationTypeSchema = en_ts_utils_1.Enum(ScheduledNotificationType, 'ScheduledNotificationType');
//# sourceMappingURL=NotificationTypes.js.map