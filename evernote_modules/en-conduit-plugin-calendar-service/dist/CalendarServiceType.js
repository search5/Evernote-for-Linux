"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventByIdSchemaArgs = exports.CalendarEventsSchemaArgs = exports.CalendarAccountSchemaArgs = exports.CalendarAccountsSchemaArgs = exports.CalendarEventUriType = exports.CalendarEventAttendeeStatus = exports.CalendarEventAttendeeGQLType = exports.CalendarEventStatus = exports.CalendarEventByIdGQLType = exports.CalendarEventGQLType = exports.UserCalendarGQLType = exports.CalendarAccountGQLType = exports.CalendarProviderSchema = exports.CalendarProvider = exports.CalendarSettingsGQLType = exports.CalendarSettingsSchema = void 0;
const conduit_core_1 = require("conduit-core");
const graphql_1 = require("graphql");
const CalendarSettings_1 = require("./EntityTypes/CalendarSettings");
const NotificationOptionsField = Object.keys(CalendarSettings_1.NotificationOptions);
/** schema for the user's feature wide Settings */
exports.CalendarSettingsSchema = {
    useTemplateForNewNotes: 'boolean',
    desktopReminders: {
        createNoteMinutes: NotificationOptionsField,
        openNoteMinutes: NotificationOptionsField,
    },
    mobileReminders: {
        createNoteMinutes: NotificationOptionsField,
        openNoteMinutes: NotificationOptionsField,
    },
};
exports.CalendarSettingsGQLType = conduit_core_1.schemaToGraphQLType(exports.CalendarSettingsSchema, 'CalendarSettingsResult', false);
/** Enum of possible providers */
var CalendarProvider;
(function (CalendarProvider) {
    CalendarProvider["GOOGLE"] = "GOOGLE";
    CalendarProvider["OUTLOOK"] = "OUTLOOK";
    CalendarProvider["OTHER"] = "OTHER";
})(CalendarProvider = exports.CalendarProvider || (exports.CalendarProvider = {}));
exports.CalendarProviderSchema = [CalendarProvider.GOOGLE, CalendarProvider.OUTLOOK, CalendarProvider.OTHER];
const CalendarProviderField = new graphql_1.GraphQLEnumType({
    name: 'CalendarProviderField',
    values: {
        GOOGLE: { value: CalendarProvider.GOOGLE },
        OUTLOOK: { value: CalendarProvider.OUTLOOK },
        OTHER: { value: CalendarProvider.OTHER },
    },
});
exports.CalendarAccountGQLType = new graphql_1.GraphQLObjectType({
    name: 'CalendarAccountResult',
    fields: () => ({
        id: { type: conduit_core_1.schemaToGraphQLType('string') },
        provider: { type: CalendarProviderField },
        calendarUserId: { type: conduit_core_1.schemaToGraphQLType('string') },
        isConnected: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        calendars: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(UserCalendarSettingsGQLType)) },
    }),
});
const UserCalendarSettingsGQLType = new graphql_1.GraphQLObjectType({
    name: 'UserCalendarSettingsResult',
    fields: () => ({
        id: { type: conduit_core_1.schemaToGraphQLType('string') },
        provider: { type: CalendarProviderField },
        calendarUserId: { type: conduit_core_1.schemaToGraphQLType('string') },
        userCalendarExternalId: { type: conduit_core_1.schemaToGraphQLType('string') },
        isActive: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        data: { type: new graphql_1.GraphQLNonNull(exports.UserCalendarGQLType) },
    }),
});
exports.UserCalendarGQLType = new graphql_1.GraphQLObjectType({
    name: 'UserCalendarResult',
    fields: () => ({
        displayName: { type: conduit_core_1.schemaToGraphQLType('string') },
        displayColor: { type: conduit_core_1.schemaToGraphQLType('string?') },
        description: { type: conduit_core_1.schemaToGraphQLType('string?') },
        timezone: { type: conduit_core_1.schemaToGraphQLType('string?') },
        isPrimary: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        isOwned: { type: conduit_core_1.schemaToGraphQLType('boolean') },
    }),
});
exports.CalendarEventGQLType = new graphql_1.GraphQLList(new graphql_1.GraphQLObjectType({
    name: 'CalendarEvents',
    fields: () => ({
        id: { type: conduit_core_1.schemaToGraphQLType('string') },
        provider: { type: CalendarProviderField },
        calendarUserId: { type: conduit_core_1.schemaToGraphQLType('string') },
        userCalendarExternalId: { type: conduit_core_1.schemaToGraphQLType('string') },
        calendarEventExternalId: { type: conduit_core_1.schemaToGraphQLType('string') },
        created: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        lastModified: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        deleted: { type: conduit_core_1.schemaToGraphQLType('timestamp?') },
        isAccountConnected: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        summary: { type: conduit_core_1.schemaToGraphQLType('string') },
        description: { type: conduit_core_1.schemaToGraphQLType('string?') },
        displayColor: { type: conduit_core_1.schemaToGraphQLType('string?') },
        location: { type: conduit_core_1.schemaToGraphQLType('string?') },
        isAllDay: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        start: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        end: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        recurrentEventId: { type: conduit_core_1.schemaToGraphQLType('string?') },
        recurrence: { type: conduit_core_1.schemaToGraphQLType('string?') },
        iCalendarUid: { type: conduit_core_1.schemaToGraphQLType('string') },
        isBusy: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        status: {
            type: conduit_core_1.schemaToGraphQLType([CalendarEventStatus.CONFIRMED, CalendarEventStatus.CANCELED, CalendarEventStatus.TENTATIVE], 'CalendarEventResultStatus'),
        },
        links: { type: conduit_core_1.schemaToGraphQLType('string') },
        creator: { type: conduit_core_1.schemaToGraphQLType(CalendarContactSchema, 'CalendarEventResultCreator', false) },
        organizer: { type: conduit_core_1.schemaToGraphQLType(CalendarContactSchema, 'CalendarEventResultOrganizer', false) },
        attendees: { type: conduit_core_1.schemaToGraphQLType('string') },
    }),
}));
exports.CalendarEventByIdGQLType = new graphql_1.GraphQLList(new graphql_1.GraphQLObjectType({
    name: 'CalendarEventByIdResult',
    fields: () => ({
        id: { type: conduit_core_1.schemaToGraphQLType('string') },
        provider: { type: CalendarProviderField },
        calendarUserId: { type: conduit_core_1.schemaToGraphQLType('string') },
        userCalendarExternalId: { type: conduit_core_1.schemaToGraphQLType('string') },
        calendarEventExternalId: { type: conduit_core_1.schemaToGraphQLType('string') },
        created: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        lastModified: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        deleted: { type: conduit_core_1.schemaToGraphQLType('timestamp?') },
        isAccountConnected: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        summary: { type: conduit_core_1.schemaToGraphQLType('string') },
        description: { type: conduit_core_1.schemaToGraphQLType('string?') },
        displayColor: { type: conduit_core_1.schemaToGraphQLType('string?') },
        location: { type: conduit_core_1.schemaToGraphQLType('string?') },
        isAllDay: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        start: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        end: { type: conduit_core_1.schemaToGraphQLType('timestamp') },
        recurrentEventId: { type: conduit_core_1.schemaToGraphQLType('string?') },
        recurrence: { type: conduit_core_1.schemaToGraphQLType('string?') },
        iCalendarUid: { type: conduit_core_1.schemaToGraphQLType('string') },
        isBusy: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        status: {
            type: conduit_core_1.schemaToGraphQLType([CalendarEventStatus.CONFIRMED, CalendarEventStatus.CANCELED, CalendarEventStatus.TENTATIVE], 'CalendarEventByIdResultStatus'),
        },
        links: { type: conduit_core_1.schemaToGraphQLType('string') },
        creator: { type: conduit_core_1.schemaToGraphQLType(CalendarContactSchema, 'CalendarEventByIdResultCreator', false) },
        organizer: { type: conduit_core_1.schemaToGraphQLType(CalendarContactSchema, 'CalendarEventByIdResultOrganizer', false) },
        attendees: { type: conduit_core_1.schemaToGraphQLType('string') },
    }),
}));
var CalendarEventStatus;
(function (CalendarEventStatus) {
    CalendarEventStatus["CONFIRMED"] = "CONFIRMED";
    CalendarEventStatus["CANCELED"] = "CANCELED";
    CalendarEventStatus["TENTATIVE"] = "TENTATIVE";
})(CalendarEventStatus = exports.CalendarEventStatus || (exports.CalendarEventStatus = {}));
exports.CalendarEventAttendeeGQLType = new graphql_1.GraphQLObjectType({
    name: 'CalendarEventAttendeeResult',
    fields: () => ({
        contact: { type: conduit_core_1.schemaToGraphQLType(CalendarContactSchema, 'CalendarEventAttendeeContact', false) },
        isOptional: { type: conduit_core_1.schemaToGraphQLType('boolean') },
        responseStatus: {
            type: conduit_core_1.schemaToGraphQLType([
                CalendarEventAttendeeStatus.ACCEPTED,
                CalendarEventAttendeeStatus.DECLINED,
                CalendarEventAttendeeStatus.NEEDSACTION,
                CalendarEventAttendeeStatus.TENTATIVE,
            ], 'CalendarEventAttendeeResponseStatus', false),
        },
    }),
    description: '',
});
const CalendarContactSchema = {
    email: 'string',
    displayName: 'string?',
    avatar: 'string?',
};
var CalendarEventAttendeeStatus;
(function (CalendarEventAttendeeStatus) {
    CalendarEventAttendeeStatus["ACCEPTED"] = "ACCEPTED";
    CalendarEventAttendeeStatus["DECLINED"] = "DECLINED";
    CalendarEventAttendeeStatus["NEEDSACTION"] = "NEEDSACTION";
    CalendarEventAttendeeStatus["TENTATIVE"] = "TENTATIVE";
})(CalendarEventAttendeeStatus = exports.CalendarEventAttendeeStatus || (exports.CalendarEventAttendeeStatus = {}));
var CalendarEventUriType;
(function (CalendarEventUriType) {
    CalendarEventUriType["GENERIC"] = "GENERIC";
    /** Link to the conference solution */
    CalendarEventUriType["CONFERENCE"] = "CONFERENCE";
    /** link to the event in the provider's web UI */
    CalendarEventUriType["WEB"] = "WEB";
})(CalendarEventUriType = exports.CalendarEventUriType || (exports.CalendarEventUriType = {}));
// Arguments for queries
exports.CalendarAccountsSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    activeCalendarOnly: 'boolean?',
});
exports.CalendarAccountSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    id: 'string',
});
exports.CalendarEventsSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    from: 'timestamp',
    to: 'timestamp',
    provider: [...exports.CalendarProviderSchema, '?'],
});
exports.CalendarEventByIdSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    id: 'string',
});
//# sourceMappingURL=CalendarServiceType.js.map