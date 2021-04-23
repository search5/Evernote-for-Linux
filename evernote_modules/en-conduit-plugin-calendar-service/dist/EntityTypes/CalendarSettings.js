"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarSettingsTypeDef = exports.ActionRemindersSchema = exports.NotificationOptionsSchema = exports.NotificationOptions = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const CalendarConstants_1 = require("../CalendarConstants");
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
exports.NotificationOptionsSchema = conduit_utils_1.Enum(NotificationOptions, 'CalendarNotificationOptions');
exports.ActionRemindersSchema = conduit_utils_1.Struct({
    /** Minutes before the event that the user wants to receive a notification for an event without a linked note */
    createNoteMinutes: exports.NotificationOptionsSchema,
    /** Minutes before the event that the user wants to receive a notification for an event with a linked note */
    openNoteMinutes: exports.NotificationOptionsSchema,
});
exports.calendarSettingsTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarSettings,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        useTemplateForNewNotes: 'boolean',
        desktopReminders: exports.ActionRemindersSchema,
        mobileReminders: exports.ActionRemindersSchema,
    },
    edges: {},
};
//# sourceMappingURL=CalendarSettings.js.map