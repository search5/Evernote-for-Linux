"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRemindersSchema = exports.NotificationOptionsSchema = exports.NotificationOptions = void 0;
const en_ts_utils_1 = require("en-ts-utils");
/**
 * Options for the notifications the user wants to set. All in minutes
 */
var NotificationOptions;
(function (NotificationOptions) {
    NotificationOptions["THIRTY_BEFORE"] = "THIRTY_BEFORE";
    NotificationOptions["TEN_BEFORE"] = "TEN_BEFORE";
    NotificationOptions["FIVE_BEFORE"] = "FIVE_BEFORE";
    NotificationOptions["AT_START"] = "AT_START";
    NotificationOptions["AT_END"] = "AT_END";
    NotificationOptions["FIVE_AFTER"] = "FIVE_AFTER";
    NotificationOptions["OFF"] = "OFF";
})(NotificationOptions = exports.NotificationOptions || (exports.NotificationOptions = {}));
exports.NotificationOptionsSchema = en_ts_utils_1.Enum(NotificationOptions, 'CalendarNotificationOptions');
exports.ActionRemindersSchema = en_ts_utils_1.Struct({
    /** Minutes before the event that the user wants to receive a notification for an event without a linked note */
    createNoteMinutes: exports.NotificationOptionsSchema,
    /** Minutes before the event that the user wants to receive a notification for an event with a linked note */
    openNoteMinutes: exports.NotificationOptionsSchema,
});
//# sourceMappingURL=ActionReminders.js.map