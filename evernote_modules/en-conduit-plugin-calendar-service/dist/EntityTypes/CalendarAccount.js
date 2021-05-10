"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarAccountTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_calendar_data_model_1 = require("en-calendar-data-model");
const en_data_model_1 = require("en-data-model");
exports.calendarAccountTypeDef = {
    name: en_data_model_1.EntityTypes.CalendarAccount,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Calendar',
    fieldValidation: {},
    schema: en_calendar_data_model_1.CalendarAccountEntitySchema.fields,
    edges: {},
};
//# sourceMappingURL=CalendarAccount.js.map