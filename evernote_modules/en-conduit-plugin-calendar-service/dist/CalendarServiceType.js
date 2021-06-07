"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCalendarSettingsUpdateMutationSchemaArgs = exports.CalendarEventLinkMutationSchemaArgs = exports.CalendarEventByIdSchemaArgs = exports.CalendarEventsSchemaArgs = exports.CalendarAccountSchemaArgs = exports.CalendarAccountsSchemaArgs = exports.CalendarEventUriInputSchema = exports.CalendarEventAttendeeInputSchema = exports.CalendarEventStatusInputSchema = exports.CalendarContactInputSchema = exports.CalendarEventResponseSchema = exports.CalendarEventLinkedNotesSchema = exports.CalendarAccountResponseSchema = exports.UserCalendarSettingsResponseSchema = exports.CalendarSettingsSchema = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_calendar_data_model_1 = require("en-calendar-data-model");
/** CALENDAR SETTINGS */
exports.CalendarSettingsSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.CalendarSettingsEntitySchema, {}, 'CalendarSettingsResult');
exports.UserCalendarSettingsResponseSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.UserCalendarSettingsEntitySchema, {
    id: 'string',
}, 'UserCalendarSettingsResult');
exports.CalendarAccountResponseSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.CalendarAccountEntitySchema, {
    id: 'string',
    calendars: conduit_utils_1.ListOf(exports.UserCalendarSettingsResponseSchema),
}, 'CalendarAccountResult');
exports.CalendarEventLinkedNotesSchema = conduit_utils_1.Struct({ id: 'ID', label: 'string' }, 'CalendarEventLinkedNotesResult');
exports.CalendarEventResponseSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.CalendarEventEntitySchema, {
    id: 'string',
    linkedNotes: conduit_utils_1.ListOf(exports.CalendarEventLinkedNotesSchema),
}, 'CalendarEventResult');
exports.CalendarContactInputSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.CalendarContactSchema, {}, 'CalendarContactInput');
exports.CalendarEventStatusInputSchema = conduit_utils_1.Enum(en_calendar_data_model_1.CalendarEventStatus, 'CalendarEventStatusInput');
exports.CalendarEventAttendeeInputSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.CalendarEventAttendeeSchema, {}, 'CalendarEventAttendeeInput');
exports.CalendarEventUriInputSchema = conduit_utils_1.ExtendStruct(en_calendar_data_model_1.CalendarEventUriSchema, {}, 'CalendarEventUriInput');
exports.CalendarAccountsSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    activeCalendarOnly: conduit_utils_1.NullableBoolean,
});
exports.CalendarAccountSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    id: 'string',
});
exports.CalendarEventsSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    from: 'timestamp',
    to: 'timestamp',
    provider: conduit_utils_1.Nullable(en_calendar_data_model_1.CalendarProviderSchema),
});
exports.CalendarEventByIdSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    id: 'string',
});
exports.CalendarEventLinkMutationSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    noteID: 'ID',
    eventID: 'ID',
});
exports.UserCalendarSettingsUpdateMutationSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    userCalendarSettingsId: 'ID',
    isActive: 'boolean',
});
//# sourceMappingURL=CalendarServiceType.js.map