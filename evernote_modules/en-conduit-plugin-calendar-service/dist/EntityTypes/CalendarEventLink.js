"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarEventLinkTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_core_entity_types_1 = require("en-core-entity-types");
const CalendarConstants_1 = require("../CalendarConstants");
exports.calendarEventLinkTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        isLinkedToAllInstances: 'boolean',
        linkedTimestamp: 'timestamp',
    },
    edges: {
        note: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_core_entity_types_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'calendarEventLinks',
            },
        },
    },
};
//# sourceMappingURL=CalendarEventLink.js.map