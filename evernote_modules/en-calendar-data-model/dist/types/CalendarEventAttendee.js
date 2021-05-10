"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventAttendeeSchema = exports.CalendarEventAttendeeStatusSchema = exports.CalendarEventAttendeeStatus = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const CalendarContact_1 = require("./CalendarContact");
var CalendarEventAttendeeStatus;
(function (CalendarEventAttendeeStatus) {
    CalendarEventAttendeeStatus["ACCEPTED"] = "ACCEPTED";
    CalendarEventAttendeeStatus["DECLINED"] = "DECLINED";
    CalendarEventAttendeeStatus["NEEDSACTION"] = "NEEDSACTION";
    CalendarEventAttendeeStatus["TENTATIVE"] = "TENTATIVE";
})(CalendarEventAttendeeStatus = exports.CalendarEventAttendeeStatus || (exports.CalendarEventAttendeeStatus = {}));
exports.CalendarEventAttendeeStatusSchema = en_ts_utils_1.Enum(CalendarEventAttendeeStatus, 'CalendarEventAttendeeStatus');
exports.CalendarEventAttendeeSchema = en_ts_utils_1.Struct({
    contact: CalendarContact_1.CalendarContactSchema,
    isOptional: 'boolean',
    responseStatus: exports.CalendarEventAttendeeStatusSchema,
    isResource: en_ts_utils_1.NullableBoolean,
    isSelf: en_ts_utils_1.NullableBoolean
}, 'CalendarEventAttendeeResult');
//# sourceMappingURL=CalendarEventAttendee.js.map