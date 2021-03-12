"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarSettingsTypeDef = exports.NotificationOptionsSchema = exports.NotificationOptions = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_storage_1 = require("conduit-storage");
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
})(NotificationOptions = exports.NotificationOptions || (exports.NotificationOptions = {}));
exports.NotificationOptionsSchema = [NotificationOptions.THIRTY_BEFORE, NotificationOptions.TEN_BEFORE,
    NotificationOptions.FIVE_BEFORE, NotificationOptions.AT_START, NotificationOptions.AT_END, NotificationOptions.FIVE_AFTER];
const ActionReminders = {
    /** Minutes before the event that the user wants to receive a notification for an event without a linked note */
    createNoteMinutes: exports.NotificationOptionsSchema,
    /** Minutes before the event that the user wants to receive a notification for an event with a linked note */
    openNoteMinutes: exports.NotificationOptionsSchema,
};
exports.calendarSettingsTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarSettings,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        useTemplateForNewNote: 'boolean',
        desktopReminders: ActionReminders,
        mobileReminders: ActionReminders,
    },
    edges: {},
};
//# sourceMappingURL=CalendarSettings.js.map