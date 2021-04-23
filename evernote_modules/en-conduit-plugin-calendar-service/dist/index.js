"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarServicePlugin = exports.fakeBackend = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const CalendarConstants_1 = require("./CalendarConstants");
const CalendarServiceType_1 = require("./CalendarServiceType");
const CalendarAccount_1 = require("./EntityTypes/CalendarAccount");
const CalendarEvent_1 = require("./EntityTypes/CalendarEvent");
const CalendarEventLink_1 = require("./EntityTypes/CalendarEventLink");
const CalendarSettings_1 = require("./EntityTypes/CalendarSettings");
const UserCalendarSettings_1 = require("./EntityTypes/UserCalendarSettings");
const CalendarAccountMutators_1 = require("./Mutators/CalendarAccountMutators");
const CalendarEventLinkMutators_1 = require("./Mutators/CalendarEventLinkMutators");
const CalendarSettingsMutators_1 = require("./Mutators/CalendarSettingsMutators");
const UserCalendarSettings_2 = require("./Mutators/UserCalendarSettings");
const FakeBackend_1 = require("./Services/FakeBackend");
function getCalendarServicePlugin(httpClient) {
    async function calendarSettingsResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const userID = await context.db.getCurrentUserID(context);
        if (conduit_utils_1.isNullish(userID)) {
            throw new conduit_utils_1.NotFoundError('userID not found');
        }
        const settingsId = CalendarConstants_1.CalendarSettingsDeterministicIdGenerator.createId({ userID, entityType: CalendarConstants_1.CalendarEntityTypes.CalendarSettings });
        const settings = await context.db.getNode(context, { id: settingsId, type: CalendarConstants_1.CalendarEntityTypes.CalendarSettings });
        if (!settings) {
            const settingsDefault = {
                useTemplateForNewNotes: false,
                desktopReminders: {
                    createNoteMinutes: CalendarSettings_1.NotificationOptions.FIVE_BEFORE,
                    openNoteMinutes: CalendarSettings_1.NotificationOptions.FIVE_BEFORE,
                },
                mobileReminders: {
                    createNoteMinutes: CalendarSettings_1.NotificationOptions.FIVE_BEFORE,
                    openNoteMinutes: CalendarSettings_1.NotificationOptions.FIVE_BEFORE,
                },
            };
            const mutationArgs = {
                useTemplateForNewNotes: settingsDefault.useTemplateForNewNotes,
                mobileOpenNoteMinutes: settingsDefault.mobileReminders.openNoteMinutes,
                mobileCreateNoteMinutes: settingsDefault.mobileReminders.createNoteMinutes,
                desktopOpenNoteMinutes: settingsDefault.desktopReminders.openNoteMinutes,
                desktopCreateNoteMinutes: settingsDefault.desktopReminders.createNoteMinutes,
            };
            await context.db.runMutator(context.trc, 'calendarSettingsUpsert', mutationArgs);
            return settingsDefault;
        }
        return settings.NodeFields;
    }
    async function calendarAccountsResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const accessToken = await exports.fakeBackend.getAccessToken(context);
        const calendarAccounts = await exports.fakeBackend.getCalendarAccounts(context, accessToken);
        return calendarAccounts;
    }
    async function calendarAccountResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const accessToken = await exports.fakeBackend.getAccessToken(context);
        const calendarAccount = await exports.fakeBackend.getCalendarAccount(context, accessToken, args.id);
        return calendarAccount;
    }
    async function eventsResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const accessToken = await exports.fakeBackend.getAccessToken(context);
        const events = await exports.fakeBackend.getEvents(context, accessToken, args.from, args.to, args.provider);
        return events;
    }
    async function eventResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const accessToken = await exports.fakeBackend.getAccessToken(context);
        const event = await exports.fakeBackend.getEvent(context, accessToken, args.id);
        return event;
    }
    const initCalendarPlugin = async () => {
        conduit_utils_1.logger.info('Calendar plugin initialized');
        exports.fakeBackend = new FakeBackend_1.FakeBackend(httpClient);
    };
    return {
        name: 'ENCalendarService',
        init: initCalendarPlugin,
        defineQueries: () => {
            const queries = {
                calendarSettings: {
                    type: conduit_core_1.schemaToGraphQLType(CalendarServiceType_1.CalendarSettingsSchema),
                    resolve: calendarSettingsResolver,
                    description: `Get the user's calendar settings`,
                },
                calendarAccounts: {
                    args: CalendarServiceType_1.CalendarAccountsSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.ListOf(CalendarServiceType_1.CalendarAccountSchema)),
                    resolve: calendarAccountsResolver,
                    description: `List all calendar accounts with it's calendars`,
                },
                calendarAccountById: {
                    args: CalendarServiceType_1.CalendarAccountSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(CalendarServiceType_1.CalendarAccountSchema),
                    resolve: calendarAccountResolver,
                    description: 'Get calendarAccounts by id',
                },
                calendarEvents: {
                    args: CalendarServiceType_1.CalendarEventsSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.ListOf(CalendarServiceType_1.CalendarEventSchema)),
                    resolve: eventsResolver,
                    description: 'List all events from a specified time window',
                },
                calendarEventById: {
                    args: CalendarServiceType_1.CalendarEventByIdSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(CalendarServiceType_1.CalendarEventSchema),
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
                calendarSettingsUpsert: CalendarSettingsMutators_1.calendarSettingsUpsert,
                calendarAccountUpdate: CalendarAccountMutators_1.calendarAccountUpdate,
                calendarAccountCreate: CalendarAccountMutators_1.calendarAccountCreate,
                userCalendarSettingsUpdate: // only to be used internally. To be deleted once Nsync connection done
                UserCalendarSettings_2.userCalendarSettingsUpdate,
                userCalendarSettingsCreate: UserCalendarSettings_2.userCalendarSettingsCreate,
            };
        },
        mutationRules: () => ([]),
    };
}
exports.getCalendarServicePlugin = getCalendarServicePlugin;
//# sourceMappingURL=index.js.map