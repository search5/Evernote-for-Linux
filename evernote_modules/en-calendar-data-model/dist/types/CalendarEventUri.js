"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventUriSchema = exports.CalendarEventUriTypeSchema = exports.CalendarEventUriType = void 0;
const en_ts_utils_1 = require("en-ts-utils");
var CalendarEventUriType;
(function (CalendarEventUriType) {
    /** Generic link */
    CalendarEventUriType["GENERIC"] = "GENERIC";
    /** Link to the conference solution */
    CalendarEventUriType["CONFERENCE"] = "CONFERENCE";
    /** Link to the event in the provider's web UI */
    CalendarEventUriType["WEB"] = "WEB";
})(CalendarEventUriType = exports.CalendarEventUriType || (exports.CalendarEventUriType = {}));
exports.CalendarEventUriTypeSchema = en_ts_utils_1.Enum(CalendarEventUriType, 'CalendarEventUriType');
exports.CalendarEventUriSchema = en_ts_utils_1.Struct({
    type: exports.CalendarEventUriTypeSchema,
    description: 'string',
    uri: 'string',
}, 'CalendarEventUriResult');
//# sourceMappingURL=CalendarEventUri.js.map