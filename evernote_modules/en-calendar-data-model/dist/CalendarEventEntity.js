"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const CalendarContact_1 = require("./types/CalendarContact");
const CalendarEventAttendee_1 = require("./types/CalendarEventAttendee");
const CalendarEventStatus_1 = require("./types/CalendarEventStatus");
const CalendarEventUri_1 = require("./types/CalendarEventUri");
const CalendarProvider_1 = require("./types/CalendarProvider");
exports.CalendarEventEntitySchema = {
    fields: {
        provider: CalendarProvider_1.CalendarProviderSchema,
        userIdFromExternalProvider: 'string',
        userCalendarExternalId: 'string',
        calendarEventExternalId: 'string',
        created: 'timestamp',
        lastModified: 'timestamp',
        externalProviderDeleted: en_ts_utils_1.NullableTimestamp,
        isAccountConnected: 'boolean',
        summary: en_ts_utils_1.NullableString,
        displayColor: en_ts_utils_1.NullableString,
        description: en_ts_utils_1.NullableString,
        location: en_ts_utils_1.NullableString,
        isAllDay: 'boolean',
        start: 'timestamp',
        end: 'timestamp',
        recurrentEventId: en_ts_utils_1.NullableString,
        recurrence: en_ts_utils_1.NullableString,
        iCalendarUid: 'string',
        isBusy: 'boolean',
        status: CalendarEventStatus_1.CalendarEventStatusSchema,
        links: en_ts_utils_1.ListOf(CalendarEventUri_1.CalendarEventUriSchema),
        eventCreator: CalendarContact_1.CalendarContactSchema,
        eventOrganizer: CalendarContact_1.CalendarContactSchema,
        attendees: en_ts_utils_1.ListOf(CalendarEventAttendee_1.CalendarEventAttendeeSchema),
        isRecurrenceInstance: en_ts_utils_1.NullableBoolean,
    },
};
//# sourceMappingURL=CalendarEventEntity.js.map