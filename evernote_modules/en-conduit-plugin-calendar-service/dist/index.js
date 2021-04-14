"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarServicePlugin = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const CalendarConstants_1 = require("./CalendarConstants");
const CalendarServiceType_1 = require("./CalendarServiceType");
const CalendarAccount_1 = require("./EntityTypes/CalendarAccount");
const CalendarEvent_1 = require("./EntityTypes/CalendarEvent");
const CalendarEventLink_1 = require("./EntityTypes/CalendarEventLink");
const CalendarSettings_1 = require("./EntityTypes/CalendarSettings");
const UserCalendarSettings_1 = require("./EntityTypes/UserCalendarSettings");
const CalendarEventLinkMutators_1 = require("./Mutators/CalendarEventLinkMutators");
const FakeBackend_1 = require("./Services/FakeBackend");
function getCalendarServicePlugin(httpClient) {
    let fakeBackend;
    async function settingsResolver(parent, args, context) {
        const result = {
            useTemplateForNewNotes: false,
            desktopReminders: {
                createNoteMinutes: CalendarSettings_1.NotificationOptions.FIVE_AFTER,
                openNoteMinutes: CalendarSettings_1.NotificationOptions.AT_START,
            },
            mobileReminders: {
                createNoteMinutes: CalendarSettings_1.NotificationOptions.AT_END,
                openNoteMinutes: CalendarSettings_1.NotificationOptions.FIVE_BEFORE,
            },
        };
        return result;
    }
    async function calendarAccountsResolver(parent, args, context) {
        const calendarAccounts = await fakeBackend.getCalendarAccounts(context);
        return calendarAccounts;
    }
    async function calendarAccountResolver(parent, args, context) {
        const calendarAccount = await fakeBackend.getCalendarAccount(args.id, context);
        return calendarAccount;
    }
    async function eventsResolver(parent, args, context) {
        const events = await fakeBackend.getEvents(args.from, args.to, args.provider, context);
        return events;
    }
    async function eventResolver(parent, args, context) {
        const event = await fakeBackend.getEvent(args.id, context);
        return event;
    }
    const initCalendarPlugin = async () => {
        conduit_utils_1.logger.info('Calendar plugin initialized');
        fakeBackend = new FakeBackend_1.FakeBackend(httpClient);
    };
    return {
        name: 'ENCalendarService',
        init: initCalendarPlugin,
        defineQueries: () => {
            const queries = {
                calendarSettings: {
                    type: CalendarServiceType_1.CalendarSettingsGQLType,
                    resolve: settingsResolver,
                    description: 'Get the event reminder settings for the current user',
                },
                calendarAccounts: {
                    args: CalendarServiceType_1.CalendarAccountsSchemaArgs,
                    type: new graphql_1.GraphQLList(CalendarServiceType_1.CalendarAccountGQLType),
                    resolve: calendarAccountsResolver,
                    description: `List all calendar accounts with it's calendars`,
                },
                calendarAccountById: {
                    args: CalendarServiceType_1.CalendarAccountSchemaArgs,
                    type: CalendarServiceType_1.CalendarAccountGQLType,
                    resolve: calendarAccountResolver,
                    description: 'Get calendarAccounts by id',
                },
                calendarEvents: {
                    args: CalendarServiceType_1.CalendarEventsSchemaArgs,
                    type: CalendarServiceType_1.CalendarEventGQLType,
                    resolve: eventsResolver,
                    description: 'List all events from a specified time window',
                },
                calendarEventById: {
                    args: CalendarServiceType_1.CalendarEventByIdSchemaArgs,
                    type: CalendarServiceType_1.CalendarEventByIdGQLType,
                    resolve: eventResolver,
                    description: 'Get an event by id',
                },
            };
            return queries;
        },
        entityTypes: () => {
            const entityTypes = {
                [CalendarConstants_1.CalendarEntityTypes.CalendarSettings]: {
                    typeDef: CalendarSettings_1.calendarSettingsTypeDef,
                },
                [CalendarConstants_1.CalendarEntityTypes.CalendarEvent]: {
                    typeDef: CalendarEvent_1.calendarEventTypeDef,
                },
                [CalendarConstants_1.CalendarEntityTypes.CalendarEventLink]: {
                    typeDef: CalendarEventLink_1.calendarEventLinkTypeDef,
                },
                [CalendarConstants_1.CalendarEntityTypes.CalendarAccount]: {
                    typeDef: CalendarAccount_1.calendarAccountTypeDef,
                },
                [CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings]: {
                    typeDef: UserCalendarSettings_1.userCalendarSettingsTypeDef,
                },
            };
            return entityTypes;
        },
        defineMutators: () => ({}),
        mutatorDefs: () => {
            return {
                calendarEventLinkCreate: CalendarEventLinkMutators_1.calendarEventLinkCreate,
                calendarEventLinkDelete: CalendarEventLinkMutators_1.calendarEventLinkDelete,
            };
        },
        mutationRules: () => ([]),
    };
}
exports.getCalendarServicePlugin = getCalendarServicePlugin;
//# sourceMappingURL=index.js.map