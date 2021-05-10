"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEntitySchemas = void 0;
const en_data_model_1 = require("en-data-model");
const CalendarAccountEntity_1 = require("./CalendarAccountEntity");
const CalendarEventEntity_1 = require("./CalendarEventEntity");
const CalendarSettingsEntity_1 = require("./CalendarSettingsEntity");
const UserCalendarSettingsEntity_1 = require("./UserCalendarSettingsEntity");
__exportStar(require("./CalendarAccountEntity"), exports);
__exportStar(require("./CalendarEventEntity"), exports);
__exportStar(require("./CalendarSettingsEntity"), exports);
__exportStar(require("./UserCalendarSettingsEntity"), exports);
__exportStar(require("./types/ActionReminders"), exports);
__exportStar(require("./types/CalendarContact"), exports);
__exportStar(require("./types/CalendarEventAttendee"), exports);
__exportStar(require("./types/CalendarEventStatus"), exports);
__exportStar(require("./types/CalendarEventUri"), exports);
__exportStar(require("./types/CalendarProvider"), exports);
__exportStar(require("./types/UserCalendarData"), exports);
exports.CalendarEntitySchemas = {
    [en_data_model_1.EntityTypes.CalendarSettings]: CalendarSettingsEntity_1.CalendarSettingsEntitySchema,
    [en_data_model_1.EntityTypes.CalendarAccount]: CalendarAccountEntity_1.CalendarAccountEntitySchema,
    [en_data_model_1.EntityTypes.UserCalendarSettings]: UserCalendarSettingsEntity_1.UserCalendarSettingsEntitySchema,
    [en_data_model_1.EntityTypes.CalendarEvent]: CalendarEventEntity_1.CalendarEventEntitySchema,
};
//# sourceMappingURL=index.js.map