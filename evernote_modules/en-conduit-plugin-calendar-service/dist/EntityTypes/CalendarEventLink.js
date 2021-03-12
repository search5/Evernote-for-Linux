"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarEventTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const CalendarConstants_1 = require("../CalendarConstants");
exports.calendarEventTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarEvent,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        calendarEventId: 'string',
        isLinkedToAllInstances: 'boolean',
        linkedTimestamp: 'timestamp',
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_conduit_plugin_task_1.TaskEntityTypes.NoteContentInfo,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'calendarEventLinks',
            },
        },
    },
};
//# sourceMappingURL=CalendarEventLink.js.map