"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarServicePlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_calendar_data_model_1 = require("en-calendar-data-model");
const en_data_model_1 = require("en-data-model");
const CalendarConstants_1 = require("./CalendarConstants");
const CalendarServiceType_1 = require("./CalendarServiceType");
const CalendarAccountConverters_1 = require("./Converters/CalendarAccountConverters");
const CalendarEventConverter_1 = require("./Converters/CalendarEventConverter");
const CalendarSettingsConverter_1 = require("./Converters/CalendarSettingsConverter");
const UserCalendarSettingsConverter_1 = require("./Converters/UserCalendarSettingsConverter");
const CalendarAccount_1 = require("./EntityTypes/CalendarAccount");
const CalendarEvent_1 = require("./EntityTypes/CalendarEvent");
const CalendarSettings_1 = require("./EntityTypes/CalendarSettings");
const UserCalendarSettings_1 = require("./EntityTypes/UserCalendarSettings");
const CalendarEventLinkMutators_1 = require("./Mutators/CalendarEventLinkMutators");
const CalendarSettingsMutators_1 = require("./Mutators/CalendarSettingsMutators");
const UserCalendarSettings_2 = require("./Mutators/UserCalendarSettings");
const QueryConstants_1 = require("./QueryConstants");
const Utilities_1 = require("./Utilities");
var NSyncEntityType;
(function (NSyncEntityType) {
    NSyncEntityType[NSyncEntityType["CALENDAR_SETTINGS"] = 23] = "CALENDAR_SETTINGS";
    NSyncEntityType[NSyncEntityType["CALENDAR_ACCOUNT"] = 24] = "CALENDAR_ACCOUNT";
    NSyncEntityType[NSyncEntityType["USER_CALENDAR_SETTINGS"] = 25] = "USER_CALENDAR_SETTINGS";
    NSyncEntityType[NSyncEntityType["CALENDAR_EVENT"] = 26] = "CALENDAR_EVENT";
})(NSyncEntityType || (NSyncEntityType = {}));
function getCalendarServicePlugin(httpClient) {
    async function calendarSettingsResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const userID = await context.db.getCurrentUserID(context);
        if (conduit_utils_1.isNullish(userID)) {
            throw new conduit_utils_1.NotFoundError('userID not found');
        }
        const settingsId = en_data_model_1.DefaultDeterministicIdGenerator.createId({ userID, entityType: en_data_model_1.EntityTypes.CalendarSettings });
        const settings = await context.db.getNode(context, { id: settingsId, type: en_data_model_1.EntityTypes.CalendarSettings });
        if (!settings) {
            return {
                useTemplateForNewNotes: true,
                desktopReminders: { createNoteMinutes: en_calendar_data_model_1.NotificationOptions.FIVE_BEFORE, openNoteMinutes: en_calendar_data_model_1.NotificationOptions.FIVE_BEFORE },
                mobileReminders: { createNoteMinutes: en_calendar_data_model_1.NotificationOptions.OFF, openNoteMinutes: en_calendar_data_model_1.NotificationOptions.FIVE_BEFORE },
            };
        }
        context.watcher && context.watcher.triggerAfterTime(CalendarConstants_1.POLL_INTERVAL);
        return settings.NodeFields;
    }
    async function calendarAccountsResolver(parent, args, context) {
        var _a, _b, _c;
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        let calendarAccounts;
        const localUserCalendarSettingsMap = new Map();
        const userCalendarSettingsByAccount = new Map();
        const qsCalendarAccounts = await context.makeQueryRequest({
            query: QueryConstants_1.CALENDAR_ACCOUNTS_QUERY,
            args: { activeCalendarOnly: args.activeCalendarOnly ? args.activeCalendarOnly : false },
        }, context);
        if (qsCalendarAccounts.error) {
            conduit_utils_1.logger.debug(`Failed to retrieve from Query service with error: ${qsCalendarAccounts.error}`);
        }
        const calendarAccountNodes = await context.db.getGraphNodesByType(context.trc, null, en_data_model_1.EntityTypes.CalendarAccount);
        for (const calendarAccountNode of calendarAccountNodes) {
            const calendarNodes = await context.db.traverseGraph(context, { id: calendarAccountNode.id, type: en_data_model_1.EntityTypes.CalendarAccount }, [{ edge: ['outputs', 'calendars'], type: en_data_model_1.EntityTypes.UserCalendarSettings }]);
            if (calendarNodes.length > 0) {
                const calNodes = await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.UserCalendarSettings, calendarNodes.map(cal => cal.id));
                const userCalendarSettingsNodes = calNodes.filter(cal => cal !== null);
                userCalendarSettingsByAccount.set(calendarAccountNode.id, userCalendarSettingsNodes);
                userCalendarSettingsNodes.forEach(node => {
                    localUserCalendarSettingsMap.set(node.id, node);
                });
            }
        }
        context.watcher && context.watcher.triggerAfterTime(CalendarConstants_1.POLL_INTERVAL);
        if ((_c = (_b = (_a = qsCalendarAccounts.result) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.calendarAccounts) === null || _c === void 0 ? void 0 : _c.length) {
            calendarAccounts = qsCalendarAccounts.result.data.calendarAccounts;
            const userID = await context.db.getCurrentUserID(context);
            if (conduit_utils_1.isNullish(userID)) {
                throw new conduit_utils_1.NotFoundError('userID not found');
            }
            for (const calendarAccount of calendarAccounts) {
                calendarAccount.calendars = calendarAccount.calendars.map(qsCalendar => {
                    const localSettings = localUserCalendarSettingsMap.get(qsCalendar.id);
                    if (localSettings) {
                        return Object.assign(Object.assign({}, qsCalendar), { isActive: localSettings.NodeFields.isActive });
                    }
                    return qsCalendar;
                });
                await Utilities_1.persistCalendarAccount(context, calendarAccount, userID);
                for (const calendar of calendarAccount.calendars) {
                    await Utilities_1.persistCalendar(context, calendar, calendarAccount.id, userID);
                }
            }
            if (!calendarAccountNodes.length) {
                return calendarAccounts;
            }
            return calendarAccounts.map(account => {
                const localCalendars = userCalendarSettingsByAccount.get(account.id);
                if (localCalendars) {
                    let calendars = Utilities_1.mergeCalendars(account.calendars, localCalendars, localUserCalendarSettingsMap);
                    calendars = args.activeCalendarOnly ? calendars.filter(cal => cal.isActive) : calendars;
                    return {
                        id: account.id,
                        provider: account.provider,
                        userIdFromExternalProvider: account.userIdFromExternalProvider,
                        isConnected: account.isConnected,
                        calendars,
                    };
                }
                return {
                    id: account.id,
                    provider: account.provider,
                    userIdFromExternalProvider: account.userIdFromExternalProvider,
                    isConnected: account.isConnected,
                    calendars: account.calendars,
                };
            });
        }
        else if (!calendarAccountNodes.length) {
            return [];
        }
        else {
            return calendarAccountNodes.map(account => {
                const localCalendars = userCalendarSettingsByAccount.get(account.id);
                if (localCalendars) {
                    const calendars = args.activeCalendarOnly ? localCalendars.filter(cal => cal.NodeFields.isActive) : localCalendars;
                    return {
                        id: account.id,
                        provider: account.NodeFields.provider,
                        userIdFromExternalProvider: account.NodeFields.userIdFromExternalProvider,
                        isConnected: account.NodeFields.isConnected,
                        calendars: calendars.map(cal => (Object.assign({ id: cal.id }, cal.NodeFields))),
                    };
                }
                return {
                    id: account.id,
                    provider: account.NodeFields.provider,
                    userIdFromExternalProvider: account.NodeFields.userIdFromExternalProvider,
                    isConnected: account.NodeFields.isConnected,
                    calendars: [],
                };
            });
        }
    }
    async function calendarAccountResolver(parent, args, context) {
        var _a, _b;
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        let calendarAccount;
        const localUserCalendarSettings = [];
        const localUserCalendarSettingsMap = new Map();
        const qsCalendarAccounts = await context.makeQueryRequest({
            query: QueryConstants_1.CALENDAR_ACCOUNT_QUERY,
            args,
        }, context);
        if (qsCalendarAccounts.error) {
            conduit_utils_1.logger.debug(`Failed to retrieve from Query service with error: ${qsCalendarAccounts.error}`);
        }
        const calendarAccountNode = await context.db.getNode(context, { id: args.id, type: en_data_model_1.EntityTypes.CalendarAccount });
        if (calendarAccountNode) {
            const calendarNodes = await context.db.traverseGraph(context, { id: calendarAccountNode.id, type: en_data_model_1.EntityTypes.CalendarAccount }, [{ edge: ['outputs', 'calendars'], type: en_data_model_1.EntityTypes.UserCalendarSettings }]);
            if (calendarNodes.length > 0) {
                const userCalendarSettingsNodes = await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.UserCalendarSettings, calendarNodes.map(cal => cal.id));
                userCalendarSettingsNodes.forEach(node => {
                    if (node) {
                        localUserCalendarSettingsMap.set(node.id, node);
                        localUserCalendarSettings.push(node);
                    }
                });
            }
        }
        context.watcher && context.watcher.triggerAfterTime(CalendarConstants_1.POLL_INTERVAL);
        if ((_b = (_a = qsCalendarAccounts.result) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.calendarAccount) {
            calendarAccount = qsCalendarAccounts.result.data.calendarAccount;
            const userID = await context.db.getCurrentUserID(context);
            if (conduit_utils_1.isNullish(userID)) {
                throw new conduit_utils_1.NotFoundError('userID not found');
            }
            calendarAccount.calendars = calendarAccount.calendars.map(qsCalendar => {
                const localSettings = localUserCalendarSettingsMap.get(qsCalendar.id);
                if (localSettings) {
                    return Object.assign(Object.assign({}, qsCalendar), { isActive: localSettings.NodeFields.isActive });
                }
                return qsCalendar;
            });
            await Utilities_1.persistCalendarAccount(context, calendarAccount, userID);
            for (const calendar of calendarAccount.calendars) {
                await Utilities_1.persistCalendar(context, calendar, calendarAccount.id, userID);
            }
            if (localUserCalendarSettings.length > 0) {
                const calendars = Utilities_1.mergeCalendars(calendarAccount.calendars, localUserCalendarSettings, localUserCalendarSettingsMap);
                return {
                    id: calendarAccount.id,
                    provider: calendarAccount.provider,
                    userIdFromExternalProvider: calendarAccount.userIdFromExternalProvider,
                    isConnected: calendarAccount.isConnected,
                    calendars,
                };
            }
            return calendarAccount;
        }
        else {
            if (!calendarAccountNode) {
                throw new conduit_utils_1.NotFoundError('Could not fetch the CalendarAccount');
            }
            calendarAccount = {
                id: calendarAccountNode.id,
                provider: calendarAccountNode.NodeFields.provider,
                userIdFromExternalProvider: calendarAccountNode.NodeFields.userIdFromExternalProvider,
                isConnected: calendarAccountNode.NodeFields.isConnected,
                calendars: localUserCalendarSettings.map(cal => (Object.assign(Object.assign({}, cal.NodeFields), { id: cal.id }))),
            };
        }
        return calendarAccount;
    }
    async function eventsResolver(parent, args, context) {
        var _a, _b, _c, _d;
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        // search locally
        const cachedData = await Utilities_1.getEventsByDays(context, args.from, args.to);
        if (context.watcher) {
            // set time to trigger to smallest between poll time and next expiration
            const currentTime = Date.now();
            context.watcher.triggerAfterTime(Math.min(CalendarConstants_1.POLL_INTERVAL, cachedData && cachedData.expiration > currentTime ? cachedData.expiration - currentTime : Number.MAX_SAFE_INTEGER));
            // Watch this row in order to get notified of calendar (de)activations
            await context.db.getMemoryStorage().getValue(context.trc, context.watcher, CalendarConstants_1.CALENDAR_UPDATES_TABLE_NAME, CalendarConstants_1.CALENDAR_UPDATES_ROW_NAME);
        }
        if (cachedData && Date.now() <= cachedData.expiration) {
            const events = await Utilities_1.addLinkedNotesToEvents(context, cachedData.cachedEvents);
            return events;
        }
        else {
            // if not present, go to QS and cache
            const expandedDates = Utilities_1.expandRequestedDates(args);
            const calendars = await context.db.getGraphNodesByType(context.trc, context.watcher, en_data_model_1.EntityTypes.UserCalendarSettings);
            const calendarIds = calendars.filter(cal => cal.NodeFields.isActive).map(cal => cal.id);
            const resultOrError = await context.makeQueryRequest({ query: QueryConstants_1.CALENDAR_EVENTS_QUERY, args: Object.assign(Object.assign({}, expandedDates), { calendarIds }) }, context);
            if ((_b = (_a = resultOrError.result) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.calendarEventsV2) {
                const calendarEvents = (_d = (_c = resultOrError.result) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.calendarEventsV2;
                calendarEvents.data = await Utilities_1.addLinkedNotesToEvents(context, calendarEvents.data);
                await Utilities_1.cacheEventsById(context, calendarEvents.data);
                await Utilities_1.cacheEventsByDay(context, calendarEvents, expandedDates);
                const eventsInOriginalTimeframe = Utilities_1.narrowQsResponseToRequestedTimes(calendarEvents.data, args.from, args.to);
                return eventsInOriginalTimeframe;
            }
            else {
                // if QS was not available use the response from cache even if TTL is expired
                if (cachedData) {
                    return cachedData.cachedEvents;
                }
                throw resultOrError.error || new Error('Could not fetch events. Try again.');
            }
        }
    }
    async function eventResolver(parent, args, context) {
        var _a, _b, _c, _d;
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const resultOrError = await context.makeQueryRequest({ query: QueryConstants_1.CALENDAR_EVENT_QUERY, args }, context);
        if (context.watcher) {
            context.watcher.triggerAfterTime(CalendarConstants_1.POLL_INTERVAL);
            // Watch this row in order to get notified of calendar (de)activations
            await context.db.getMemoryStorage().getValue(context.trc, context.watcher, CalendarConstants_1.CALENDAR_UPDATES_TABLE_NAME, CalendarConstants_1.CALENDAR_UPDATES_ROW_NAME);
        }
        if ((_b = (_a = resultOrError.result) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.calendarEvent) {
            const calendarEvent = (_d = (_c = resultOrError.result) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.calendarEvent;
            await Utilities_1.cacheEventsById(context, [calendarEvent]);
            calendarEvent.linkedNotes = await Utilities_1.getLinkedNotes(context, calendarEvent);
            return calendarEvent;
        }
        else {
            throw resultOrError.error || new Error('No Results from Query Service. Try again.');
        }
    }
    async function calendarEventLinkMutationResolver(parent, args, context) {
        var _a, _b;
        if (!args || !args.noteID || !args.eventID) {
            throw new conduit_utils_1.MissingParameterError('Missing parameters for CalendarEventLink mutation');
        }
        conduit_core_1.validateDB(context);
        let noteOwnerMetadata;
        const graphDBevent = await context.db.getNode(context, { id: args.eventID, type: en_data_model_1.EntityTypes.CalendarEvent });
        const graphDBnote = await context.db.getNode(context, { id: args.noteID, type: en_data_model_1.EntityTypes.Note });
        if (graphDBnote) {
            const syncContext = await context.db.getBestSyncContextForNode(context.trc, graphDBnote);
            noteOwnerMetadata = await context.db.getSyncContextMetadata(context, syncContext);
            if (!noteOwnerMetadata) {
                throw new conduit_utils_1.NotFoundError('Note owner metadata or userID not found');
            }
        }
        else {
            throw new conduit_utils_1.NotFoundError(args.noteID, 'Note not found');
        }
        if (graphDBevent) {
            try {
                await context.db.runMutator(context.trc, 'calendarEventLinkInternal', Object.assign({ noteID: args.noteID, eventID: args.eventID, noteOwnerID: noteOwnerMetadata.userID }, graphDBevent.NodeFields));
                return { success: true, result: graphDBevent.id };
            }
            catch (err) {
                conduit_utils_1.logger.debug('Could not run mutation with GraphDB event.', err);
            }
        }
        const ephemeralEvent = await context.db.getMemoryStorage().getValue(context.trc, null, CalendarConstants_1.EPHEMERAL_EVENTS_BY_ID_TABLE_NAME, args.eventID);
        if (ephemeralEvent) {
            try {
                await context.db.runMutator(context.trc, 'calendarEventLinkInternal', Object.assign({ noteID: args.noteID, eventID: args.eventID, noteOwnerID: noteOwnerMetadata.userID }, ephemeralEvent));
                return { success: true, result: args.eventID };
            }
            catch (err) {
                conduit_utils_1.logger.debug('Could not run mutation with cached event.', err);
            }
        }
        const qsEvent = await context.makeQueryRequest({ query: QueryConstants_1.CALENDAR_EVENT_QUERY, args: { id: args.eventID } }, context);
        if ((_b = (_a = qsEvent.result) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.calendarEvent) {
            try {
                const _c = qsEvent.result.data.calendarEvent, { id } = _c, eventWithoutID = __rest(_c, ["id"]);
                await context.db.runMutator(context.trc, 'calendarEventLinkInternal', Object.assign({ noteID: args.noteID, eventID: args.eventID, noteOwnerID: noteOwnerMetadata.userID }, eventWithoutID));
                return { success: true, result: qsEvent.id };
            }
            catch (err) {
                conduit_utils_1.logger.debug('Could not run mutation with QS event.', err);
            }
        }
        return { success: false, result: 'Could not fetch event from Ephemeral DB nor Query Service' };
    }
    async function userCalendarSettingsUpdateMutationResolver(parent, args, context) {
        if (!args) {
            throw new conduit_utils_1.MissingParameterError('Missing parameters for userCalendarSettingsUpdate mutation');
        }
        conduit_core_1.validateDB(context);
        try {
            await context.db.runMutator(context.trc, 'calendarUserCalendarSettingsUpdate', args);
            await context.db.getMemoryStorage().transact(context.trc, 'SetUpdatedCalendarTime', async (tx) => {
                await tx.setValue(context.trc, CalendarConstants_1.CALENDAR_UPDATES_TABLE_NAME, CalendarConstants_1.CALENDAR_UPDATES_ROW_NAME, Date.now());
            });
            await Utilities_1.expireEventsByDayCache(context);
            return { success: true, result: args.userCalendarSettingsId };
        }
        catch (error) {
            return { success: false, result: error };
        }
    }
    const initCalendarPlugin = async () => {
        conduit_utils_1.logger.info('Calendar plugin initialized');
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
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.ListOf(CalendarServiceType_1.CalendarAccountResponseSchema)),
                    resolve: calendarAccountsResolver,
                    description: `List all calendar accounts with it's calendars`,
                },
                calendarAccountById: {
                    args: CalendarServiceType_1.CalendarAccountSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(CalendarServiceType_1.CalendarAccountResponseSchema),
                    resolve: calendarAccountResolver,
                    description: 'Get calendarAccounts by id',
                },
                calendarEvents: {
                    args: CalendarServiceType_1.CalendarEventsSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.ListOf(CalendarServiceType_1.CalendarEventResponseSchema)),
                    resolve: eventsResolver,
                    description: 'List all events from a specified time window',
                },
                calendarEventById: {
                    args: CalendarServiceType_1.CalendarEventByIdSchemaArgs,
                    type: conduit_core_1.schemaToGraphQLType(CalendarServiceType_1.CalendarEventResponseSchema),
                    resolve: eventResolver,
                    description: 'Get an event by id',
                },
            };
            return queries;
        },
        entityTypes: () => {
            const entityTypes = {
                [en_data_model_1.EntityTypes.CalendarSettings]: {
                    typeDef: CalendarSettings_1.calendarSettingsTypeDef,
                    nsyncConverters: { [NSyncEntityType.CALENDAR_SETTINGS]: CalendarSettingsConverter_1.getCalendarSettingsNode },
                },
                [en_data_model_1.EntityTypes.CalendarEvent]: {
                    typeDef: CalendarEvent_1.calendarEventTypeDef,
                    nsyncConverters: { [NSyncEntityType.CALENDAR_EVENT]: CalendarEventConverter_1.getCalendarEventNode },
                },
                [en_data_model_1.EntityTypes.CalendarAccount]: {
                    typeDef: CalendarAccount_1.calendarAccountTypeDef,
                    nsyncConverters: { [NSyncEntityType.CALENDAR_ACCOUNT]: CalendarAccountConverters_1.getCalendarAccountNodeAndEdges },
                },
                [en_data_model_1.EntityTypes.UserCalendarSettings]: {
                    typeDef: UserCalendarSettings_1.userCalendarSettingsTypeDef,
                    nsyncConverters: { [NSyncEntityType.USER_CALENDAR_SETTINGS]: UserCalendarSettingsConverter_1.getUserCalendarSettingsNodeAndEdges },
                },
            };
            return entityTypes;
        },
        defineMutators: (di) => {
            const mutators = {
                calendarEventLink: {
                    args: CalendarServiceType_1.CalendarEventLinkMutationSchemaArgs,
                    type: conduit_core_1.GenericMutationResultWithData,
                    resolve: calendarEventLinkMutationResolver,
                },
                userCalendarSettingsUpdate: {
                    args: CalendarServiceType_1.UserCalendarSettingsUpdateMutationSchemaArgs,
                    type: conduit_core_1.GenericMutationResultWithData,
                    resolve: userCalendarSettingsUpdateMutationResolver,
                },
            };
            return mutators;
        },
        mutatorDefs: () => {
            return {
                calendarEventLinkInternal: CalendarEventLinkMutators_1.calendarEventLinkInternal,
                calendarEventUnlink: CalendarEventLinkMutators_1.calendarEventUnlink,
                calendarSettingsUpsert: CalendarSettingsMutators_1.calendarSettingsUpsert,
                calendarUserCalendarSettingsUpdate: UserCalendarSettings_2.calendarUserCalendarSettingsUpdate,
            };
        },
        mutationRules: () => ([]),
    };
}
exports.getCalendarServicePlugin = getCalendarServicePlugin;
//# sourceMappingURL=index.js.map