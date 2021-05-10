"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarEventTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_calendar_data_model_1 = require("en-calendar-data-model");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
exports.calendarEventTypeDef = {
    name: en_data_model_1.EntityTypes.CalendarEvent,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Calendar',
    fieldValidation: {},
    schema: en_calendar_data_model_1.CalendarEventEntitySchema.fields,
    edges: {
        notes: {
            constraint: conduit_storage_1.EdgeConstraint.MANY,
            type: conduit_storage_1.EdgeType.VIEW,
            from: {
                type: en_core_entity_types_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'calendarEvents',
            },
        },
    },
};
//# sourceMappingURL=CalendarEvent.js.map