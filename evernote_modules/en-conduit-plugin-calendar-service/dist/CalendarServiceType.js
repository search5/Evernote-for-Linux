"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventByIdSchemaArgs = exports.CalendarEventsSchemaArgs = exports.CalendarAccountSchemaArgs = exports.CalendarAccountsSchemaArgs = exports.CalendarEventUriType = exports.CalendarEventAttendeeSchema = exports.CalendarEventAttendeeStatus = exports.CalendarEventSchema = exports.CalendarEventStatusSchema = exports.CalendarEventStatus = exports.CalendarContactSchema = exports.CalendarAccountSchema = exports.UserCalendarSchema = exports.CalendarProviderSchema = exports.CalendarProvider = exports.CalendarSettingsSchema = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const CalendarSettings_1 = require("./EntityTypes/CalendarSettings");
/** schema for the user's feature wide Settings */
exports.CalendarSettingsSchema = conduit_utils_1.Struct({
    useTemplateForNewNotes: 'boolean',
    desktopReminders: conduit_utils_1.Struct({
        createNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
        openNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
    }),
    mobileReminders: conduit_utils_1.Struct({
        createNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
        openNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
    }),
}, 'CalendarSettingsResult');
/** Enum of possible providers */
var CalendarProvider;
(function (CalendarProvider) {
    CalendarProvider["GOOGLE"] = "GOOGLE";
    CalendarProvider["OUTLOOK"] = "OUTLOOK";
    CalendarProvider["OTHER"] = "OTHER";
})(CalendarProvider = exports.CalendarProvider || (exports.CalendarProvider = {}));
exports.CalendarProviderSchema = conduit_utils_1.Enum(CalendarProvider, 'CalendarProvider');
exports.UserCalendarSchema = conduit_utils_1.Struct({
    displayName: 'string',
    displayColor: conduit_utils_1.NullableString,
    description: conduit_utils_1.NullableString,
    timezone: conduit_utils_1.NullableString,
    isPrimary: 'boolean',
    isOwned: 'boolean',
}, 'UserCalendarResult');
const UserCalendarSettingsSchema = conduit_utils_1.Struct({
    id: 'string',
    provider: exports.CalendarProviderSchema,
    calendarUserId: 'string',
    userCalendarExternalId: 'string',
    isActive: 'boolean',
    data: exports.UserCalendarSchema,
}, 'UserCalendarSettingsResult');
exports.CalendarAccountSchema = conduit_utils_1.Struct({
    id: 'string',
    provider: exports.CalendarProviderSchema,
    calendarUserId: 'string',
    isConnected: 'boolean',
    calendars: conduit_utils_1.ListOf(UserCalendarSettingsSchema),
}, 'CalendarAccountResult');
exports.CalendarContactSchema = conduit_utils_1.Struct({
    email: 'string',
    displayName: conduit_utils_1.NullableString,
    avatar: conduit_utils_1.NullableString,
}, 'CalendarContact');
var CalendarEventStatus;
(function (CalendarEventStatus) {
    CalendarEventStatus["CONFIRMED"] = "CONFIRMED";
    CalendarEventStatus["CANCELED"] = "CANCELED";
    CalendarEventStatus["TENTATIVE"] = "TENTATIVE";
})(CalendarEventStatus = exports.CalendarEventStatus || (exports.CalendarEventStatus = {}));
exports.CalendarEventStatusSchema = conduit_utils_1.Enum(CalendarEventStatus, 'CalendarEventStatus');
exports.CalendarEventSchema = conduit_utils_1.Struct({
    id: 'string',
    provider: exports.CalendarProviderSchema,
    calendarUserId: 'string',
    userCalendarExternalId: 'string',
    calendarEventExternalId: 'string',
    created: 'timestamp',
    lastModified: 'timestamp',
    deletionTime: conduit_utils_1.NullableTimestamp,
    isAccountConnected: 'boolean',
    summary: conduit_utils_1.NullableString,
    description: conduit_utils_1.NullableString,
    displayColor: conduit_utils_1.NullableString,
    location: conduit_utils_1.NullableString,
    isAllDay: 'boolean',
    start: 'timestamp',
    end: 'timestamp',
    recurrentEventId: conduit_utils_1.NullableString,
    recurrence: conduit_utils_1.NullableString,
    iCalendarUid: 'string',
    isBusy: 'boolean',
    status: exports.CalendarEventStatusSchema,
    links: 'string',
    eventCreator: exports.CalendarContactSchema,
    eventOrganizer: exports.CalendarContactSchema,
    attendees: 'string',
}, 'CalendarEventExternal');
var CalendarEventAttendeeStatus;
(function (CalendarEventAttendeeStatus) {
    CalendarEventAttendeeStatus["ACCEPTED"] = "ACCEPTED";
    CalendarEventAttendeeStatus["DECLINED"] = "DECLINED";
    CalendarEventAttendeeStatus["NEEDSACTION"] = "NEEDSACTION";
    CalendarEventAttendeeStatus["TENTATIVE"] = "TENTATIVE";
})(CalendarEventAttendeeStatus = exports.CalendarEventAttendeeStatus || (exports.CalendarEventAttendeeStatus = {}));
exports.CalendarEventAttendeeSchema = conduit_utils_1.Struct({
    contact: exports.CalendarContactSchema,
    isOptional: 'boolean',
    responseStatus: conduit_utils_1.Enum(CalendarEventAttendeeStatus, 'CalendarEventAttendeeStatus'),
    isResource: conduit_utils_1.NullableBoolean,
    isSelf: conduit_utils_1.NullableBoolean,
}, 'CalendarEventAttendeeResult');
var CalendarEventUriType;
(function (CalendarEventUriType) {
    CalendarEventUriType["GENERIC"] = "GENERIC";
    /** Link to the conference solution */
    CalendarEventUriType["CONFERENCE"] = "CONFERENCE";
    /** link to the event in the provider's web UI */
    CalendarEventUriType["WEB"] = "WEB";
})(CalendarEventUriType = exports.CalendarEventUriType || (exports.CalendarEventUriType = {}));
exports.CalendarAccountsSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    activeCalendarOnly: conduit_utils_1.NullableBoolean,
});
exports.CalendarAccountSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    id: 'string',
});
exports.CalendarEventsSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    from: 'timestamp',
    to: 'timestamp',
    provider: conduit_utils_1.Nullable(exports.CalendarProviderSchema),
});
exports.CalendarEventByIdSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    id: 'string',
});
//# sourceMappingURL=CalendarServiceType.js.map