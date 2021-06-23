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
exports.expandRequestedDates = exports.getLinkedNotes = exports.addLinkedNotesToEvents = exports.mergeCalendars = exports.convertEventGuidFromService = exports.daysSinceEpoch = exports.nearestStartOfDay = exports.getEventsByDays = exports.expireEventsByDayCache = exports.cacheEventsByDay = exports.cacheEventsById = exports.persistCalendar = exports.persistCalendarAccount = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const CalendarConstants_1 = require("./CalendarConstants");
async function persistCalendarAccount(context, account, userID) {
    conduit_core_1.validateDB(context);
    const accountNode = {
        id: account.id,
        type: en_data_model_1.EntityTypes.CalendarAccount,
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: '',
        NodeFields: {
            isConnected: account.isConnected,
            userIdFromExternalProvider: account.userIdFromExternalProvider,
            provider: account.provider,
        },
        owner: userID,
        inputs: {},
        outputs: { calendars: {} },
    };
    account.calendars.forEach(cal => {
        conduit_storage_1.addOutputEdgeToNode(accountNode, 'calendars', { port: 'parent', type: en_data_model_1.EntityTypes.UserCalendarSettings, id: cal.id });
    });
    await context.db.transactSyncedStorage(context.trc, 'calendarAccountCreate', tr => (tr.replaceNodeAndEdges(context.trc, conduit_storage_1.NSYNC_CONTEXT, accountNode)));
}
exports.persistCalendarAccount = persistCalendarAccount;
async function persistCalendar(context, calendar, parentCalendarAccountID, userID) {
    conduit_core_1.validateDB(context);
    const calendarNode = {
        id: calendar.id,
        type: en_data_model_1.EntityTypes.UserCalendarSettings,
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: '',
        NodeFields: {
            isActive: calendar.isActive,
            data: calendar.data,
            userCalendarExternalId: calendar.userCalendarExternalId,
        },
        owner: userID,
        inputs: {
            parent: {},
        },
        outputs: {},
    };
    conduit_storage_1.addInputEdgeToNode(calendarNode, 'parent', { id: parentCalendarAccountID, type: en_data_model_1.EntityTypes.CalendarAccount, port: 'calendars' });
    await context.db.transactSyncedStorage(context.trc, 'userCalendarSettingsCreate', tr => (tr.replaceNodeAndEdges(context.trc, conduit_storage_1.NSYNC_CONTEXT, calendarNode)));
}
exports.persistCalendar = persistCalendar;
/**
 * Cache the events fields by id on MemoryStorage
 * @param context - GraphQL context
 * @param events- array of event to save
 */
async function cacheEventsById(context, events) {
    conduit_core_1.validateDB(context);
    await context.db.getMemoryStorage().transact(context.trc, 'CacheCalendarEventsById', async (tx) => {
        for (const event of events) {
            const { id, linkedNotes } = event, eventFields = __rest(event, ["id", "linkedNotes"]);
            await tx.setValue(context.trc, CalendarConstants_1.EPHEMERAL_EVENTS_BY_ID_TABLE_NAME, id, eventFields);
        }
    });
}
exports.cacheEventsById = cacheEventsById;
/**
 * Saves a list of calendarEvents to MemoryStorage. Data is saved on normalized GMT days with the start of the day as the key.
 * @param context - GraphQL context
 * @param events- array of event to save
 * @param requestArgs - object with from and to timestamps
 */
async function cacheEventsByDay(context, events, requestArgs) {
    var _a;
    conduit_core_1.validateDB(context);
    const dayBuckets = new Map();
    const orderedDays = [];
    const startingDay = nearestStartOfDay(requestArgs.from);
    const endDay = nearestStartOfDay(requestArgs.to) + conduit_utils_1.MILLIS_IN_ONE_DAY;
    const daysToCache = daysSinceEpoch(endDay) - daysSinceEpoch(startingDay) + 1;
    // make a bucket for each day
    for (let index = 0; index < daysToCache; index++) {
        const date = startingDay + index * conduit_utils_1.MILLIS_IN_ONE_DAY;
        orderedDays.push(date);
        dayBuckets.set(date, []);
    }
    // loop over events and put them in day where they appear
    for (const event of events.data) {
        let currentDayIndex = orderedDays.findIndex(currentStartOfDay => currentStartOfDay <= event.start && event.start <= currentStartOfDay + conduit_utils_1.MILLIS_IN_ONE_DAY);
        if (currentDayIndex === -1) {
            continue;
        } // should not happen as the list is generated from the same times we issue to QS
        // add the event from its starting day till the last one
        while (event.end <= orderedDays[currentDayIndex] + conduit_utils_1.MILLIS_IN_ONE_DAY) {
            (_a = dayBuckets.get(orderedDays[currentDayIndex])) === null || _a === void 0 ? void 0 : _a.push(event);
            currentDayIndex += 1;
        }
    }
    // now persist the bucket to memorystorage
    const expirationDate = Date.now() + events.refreshAfter * conduit_utils_1.MILLIS_IN_ONE_SECOND;
    await context.db.getMemoryStorage().transact(context.trc, 'CacheCalendarEventsByDay', async (tx) => {
        for (const entry of dayBuckets.entries()) {
            await tx.setValue(context.trc, CalendarConstants_1.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME, entry[0].toString(), { cachedEvents: entry[1], expiration: expirationDate });
        }
    });
}
exports.cacheEventsByDay = cacheEventsByDay;
/**
 * Expire alll events on the Events by day cache
 * @param context - GraphQL context
 */
async function expireEventsByDayCache(context) {
    conduit_core_1.validateDB(context);
    await context.db.getMemoryStorage().transact(context.trc, 'InvalidateAllEventsByDayEntries', async (tx) => {
        const days = await tx.getKeys(context.trc, null, CalendarConstants_1.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME);
        const dayBuckets = await tx.batchGetValues(context.trc, null, CalendarConstants_1.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME, days);
        const now = Date.now();
        for (const entry of Object.entries(dayBuckets)) {
            const data = entry[1];
            if (data !== undefined) {
                await tx.setValue(context.trc, CalendarConstants_1.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME, entry[0].toString(), { cachedEvents: data.cachedEvents, expiration: now - 1 });
            }
        }
    });
}
exports.expireEventsByDayCache = expireEventsByDayCache;
/**
 *
 * @param context - GraphQL context
 * @param from - timestamp
 * @param to - timestamp
 * @returns the events from the days requested
 */
async function getEventsByDays(context, from, to) {
    conduit_core_1.validateDB(context);
    const results = [];
    let currentDay = nearestStartOfDay(from);
    let smallestExpiration = Number.MAX_SAFE_INTEGER;
    while (currentDay + conduit_utils_1.MILLIS_IN_ONE_DAY <= to) {
        const cachedData = await context.db.getMemoryStorage().getValue(context.trc, null, CalendarConstants_1.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME, currentDay.toString());
        if (cachedData) {
            currentDay += conduit_utils_1.MILLIS_IN_ONE_DAY;
            results.push(...cachedData.cachedEvents);
            if (cachedData.expiration < smallestExpiration) {
                smallestExpiration = cachedData.expiration;
            }
        }
        else {
            // if we don't have data for a day we have to go to QS
            return null;
        }
    }
    return { cachedEvents: results, expiration: smallestExpiration };
}
exports.getEventsByDays = getEventsByDays;
/**
 *
 * @param time
 * @returns the nearest day from the input, as a timestamp
 */
function nearestStartOfDay(time) {
    return daysSinceEpoch(time) * conduit_utils_1.MILLIS_IN_ONE_DAY;
}
exports.nearestStartOfDay = nearestStartOfDay;
/**
 *
 * @param time
 * @returns the number of days since the unix epoch
 */
function daysSinceEpoch(time) {
    return Math.floor(time / conduit_utils_1.MILLIS_IN_ONE_DAY);
}
exports.daysSinceEpoch = daysSinceEpoch;
function convertEventGuidFromService(serviceGuid) {
    return serviceGuid;
}
exports.convertEventGuidFromService = convertEventGuidFromService;
function mergeCalendars(QsCalendars, localCalendars, localCalendarsMap) {
    const result = localCalendars.map(cal => (Object.assign(Object.assign({}, cal.NodeFields), { id: cal.id })));
    QsCalendars.forEach(cal => {
        if (!localCalendarsMap.has(cal.id)) {
            result.push(cal);
        }
    });
    return result;
}
exports.mergeCalendars = mergeCalendars;
async function addLinkedNotesToEvents(context, events) {
    const results = [];
    for (const event of events) {
        results.push(Object.assign(Object.assign({}, event), { linkedNotes: await getLinkedNotes(context, event) }));
    }
    return results;
}
exports.addLinkedNotesToEvents = addLinkedNotesToEvents;
async function getLinkedNotes(context, remoteEvent) {
    conduit_core_1.validateDB(context);
    const results = [];
    const notesToFetch = [];
    const [localEvent, localRecurrence] = await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.CalendarEvent, remoteEvent.isRecurrenceInstance === true && remoteEvent.recurrentEventId !== null ?
        [remoteEvent.id, remoteEvent.recurrentEventId] : [remoteEvent.id]);
    if (localEvent) {
        const noteNodesRefs = await context.db.traverseGraph(context, { id: localEvent.id, type: en_data_model_1.EntityTypes.CalendarEvent }, [{ edge: ['inputs', 'notes'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        notesToFetch.push(...noteNodesRefs);
    }
    if (localRecurrence) {
        const noteNodesRefs = await context.db.traverseGraph(context, { id: localRecurrence.id, type: en_data_model_1.EntityTypes.CalendarEvent }, [{ edge: ['inputs', 'notes'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        notesToFetch.push(...noteNodesRefs);
    }
    const uniqueNoteIds = new Set(notesToFetch.map(note => note.id));
    const noteNodes = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Note, Array.from(uniqueNoteIds));
    noteNodes.forEach(note => {
        if (note) {
            results.push({ id: note.id, label: note.label });
        }
    });
    return results;
}
exports.getLinkedNotes = getLinkedNotes;
function expandRequestedDates(args) {
    const startDay = args.from - conduit_utils_1.MILLIS_IN_ONE_DAY * CalendarConstants_1.DAYS_BEFORE_TO_CACHE;
    let endDay = args.from + conduit_utils_1.MILLIS_IN_ONE_DAY * (1 + CalendarConstants_1.DAYS_AFTER_TO_CACHE);
    // if we where asked for a bigger window, use it
    if (args.to > endDay) {
        endDay = args.to;
    }
    return { provider: args.provider, from: startDay, to: endDay };
}
exports.expandRequestedDates = expandRequestedDates;
//# sourceMappingURL=Utilities.js.map