"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarEventTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const CalendarConstants_1 = require("../CalendarConstants");
const CalendarServiceType_1 = require("../CalendarServiceType");
exports.calendarEventTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarEvent,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        provider: CalendarServiceType_1.CalendarProviderSchema,
        calendarUserId: 'string',
        userCalendarExternalId: 'string',
        calendarEventExternalId: 'string',
        created: 'timestamp',
        lastModified: 'timestamp',
        deletionTime: conduit_utils_1.NullableTimestamp,
        isAccountConnected: 'boolean',
        summary: conduit_utils_1.NullableString,
        displayColor: conduit_utils_1.NullableString,
        description: conduit_utils_1.NullableString,
        location: conduit_utils_1.NullableString,
        isAllDay: 'boolean',
        start: 'timestamp',
        end: 'timestamp',
        recurrentEventId: conduit_utils_1.NullableString,
        recurrence: conduit_utils_1.NullableString,
        iCalendarUid: 'string',
        isBusy: 'boolean',
        status: CalendarServiceType_1.CalendarEventStatusSchema,
        links: 'string',
        eventCreator: CalendarServiceType_1.CalendarContactSchema,
        eventOrganizer: CalendarServiceType_1.CalendarContactSchema,
        attendees: 'string',
    },
    edges: {
        calendarEventLinks: {
            constraint: conduit_storage_1.EdgeConstraint.MANY,
            type: conduit_storage_1.EdgeType.VIEW,
            from: {
                type: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink,
                constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
                denormalize: 'calendarEvent',
            },
        },
    },
};
//# sourceMappingURL=CalendarEvent.js.map