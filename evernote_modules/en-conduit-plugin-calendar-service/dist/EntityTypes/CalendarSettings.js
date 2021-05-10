"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarSettingsTypeDef = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_storage_1 = require("conduit-storage");
const en_calendar_data_model_1 = require("en-calendar-data-model");
const en_data_model_1 = require("en-data-model");
exports.calendarSettingsTypeDef = {
    name: en_data_model_1.EntityTypes.CalendarSettings,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Calendar',
    fieldValidation: {},
    schema: en_calendar_data_model_1.CalendarSettingsEntitySchema.fields,
    edges: {},
};
//# sourceMappingURL=CalendarSettings.js.map