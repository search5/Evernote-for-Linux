"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarEventNode = void 0;
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getCalendarEventNode = async (trc, instance, context) => {
    const nodesToUpsert = [];
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return {};
    }
    const calendarEvent = Object.assign(Object.assign({}, initial), { type: en_data_model_1.EntityTypes.CalendarEvent, NodeFields: {
            provider: instance.provider,
            userIdFromExternalProvider: instance.userIdFromExternalProvider,
            userCalendarExternalId: instance.userCalendarExternalId,
            calendarEventExternalId: instance.calendarEventExternalId,
            created: instance.created,
            lastModified: instance.updated,
            externalProviderDeleted: instance.externalProviderDeleted,
            isAccountConnected: instance.isAccountConnected,
            summary: instance.summary,
            displayColor: instance.displayColor,
            description: instance.description,
            location: instance.location,
            isAllDay: instance.isAllDay,
            start: instance.start,
            end: instance.end,
            recurrentEventId: instance.recurrentEventId,
            recurrence: instance.recurrence,
            iCalendarUid: instance.iCalendarUid,
            isBusy: instance.isBusy,
            status: instance.status,
            links: instance.links,
            eventCreator: instance.eventCreator,
            eventOrganizer: instance.eventOrganizer,
            attendees: instance.attendees,
            isRecurrenceInstance: instance.isRecurrenceInstance,
        }, inputs: { notes: {} }, outputs: {} });
    nodesToUpsert.push(calendarEvent);
    return { nodes: { nodesToUpsert, nodesToDelete: [] } };
};
exports.getCalendarEventNode = getCalendarEventNode;
//# sourceMappingURL=CalendarEventConverter.js.map