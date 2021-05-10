"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCalendarSettingsTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_calendar_data_model_1 = require("en-calendar-data-model");
const en_data_model_1 = require("en-data-model");
exports.userCalendarSettingsTypeDef = {
    name: en_data_model_1.EntityTypes.UserCalendarSettings,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Calendar',
    fieldValidation: {},
    schema: en_calendar_data_model_1.UserCalendarSettingsEntitySchema.fields,
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY_LINK,
            from: {
                type: en_data_model_1.EntityTypes.CalendarAccount,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'calendars',
            },
        },
    },
};
//# sourceMappingURL=UserCalendarSettings.js.map