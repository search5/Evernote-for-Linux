"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarEventTypeDef = exports.CalendarEventContactField = void 0;
const conduit_storage_1 = require("conduit-storage");
const CalendarConstants_1 = require("../CalendarConstants");
const CalendarServiceType_1 = require("../CalendarServiceType");
exports.CalendarEventContactField = {
    email: 'string?',
    displayName: 'string?',
    avatar: 'string?',
};
exports.calendarEventTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarEvent,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        provider: 'string',
        calendarUserId: 'string',
        userCalendarExternalId: 'string',
        calendarEventExternalId: 'string',
        created: 'timestamp',
        lastModified: 'timestamp',
        deleted: 'timestamp?',
        isAccountConnected: 'boolean',
        summary: 'string',
        displayColor: 'string?',
        description: 'string?',
        location: 'string?',
        isAllDay: 'boolean',
        start: 'timestamp',
        end: 'timestamp',
        recurrentEventId: 'string?',
        recurrence: 'string?',
        iCalendarUid: 'string',
        isBusy: 'boolean',
        status: Object.values(CalendarServiceType_1.CalendarEventStatus),
        links: 'string',
        creator: exports.CalendarEventContactField,
        organizer: exports.CalendarEventContactField,
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