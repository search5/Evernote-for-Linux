"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventStatusSchema = exports.CalendarEventStatus = void 0;
const en_ts_utils_1 = require("en-ts-utils");
var CalendarEventStatus;
(function (CalendarEventStatus) {
    CalendarEventStatus["CONFIRMED"] = "CONFIRMED";
    CalendarEventStatus["CANCELED"] = "CANCELED";
    CalendarEventStatus["TENTATIVE"] = "TENTATIVE";
})(CalendarEventStatus = exports.CalendarEventStatus || (exports.CalendarEventStatus = {}));
exports.CalendarEventStatusSchema = en_ts_utils_1.Enum(CalendarEventStatus, 'CalendarEventStatus');
//# sourceMappingURL=CalendarEventStatus.js.map