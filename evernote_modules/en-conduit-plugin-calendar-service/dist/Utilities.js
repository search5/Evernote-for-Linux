"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkedNotes = exports.mergeCalendars = exports.convertEventGuidFromService = exports.cacheEvent = exports.persistCalendar = exports.persistCalendarAccount = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
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
async function cacheEvent(context, event) {
    conduit_core_1.validateDB(context);
    await context.db.getMemoryStorage().transact(context.trc, 'calendarEventCache', async (tx) => {
        await tx.setValue(context.trc, CalendarConstants_1.EPHEMERAL_EVENTS_TABLE_NAME, event.id, event);
    });
}
exports.cacheEvent = cacheEvent;
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
async function getLinkedNotes(context, remoteEvent) {
    conduit_core_1.validateDB(context);
    const results = [];
    const notesToFetch = [];
    const [localEvent, localRecurrence] = await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.CalendarEvent, remoteEvent.isRecurrenceInstance === true ? [remoteEvent.id, remoteEvent.recurrentEventId] : [remoteEvent.id]);
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
//# sourceMappingURL=Utilities.js.map