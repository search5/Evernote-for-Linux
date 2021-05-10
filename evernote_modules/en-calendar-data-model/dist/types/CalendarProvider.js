"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarProviderSchema = exports.CalendarProvider = void 0;
const en_ts_utils_1 = require("en-ts-utils");
/** Possible calendar providers */
var CalendarProvider;
(function (CalendarProvider) {
    CalendarProvider["GOOGLE"] = "GOOGLE";
    CalendarProvider["OUTLOOK"] = "OUTLOOK";
    CalendarProvider["OTHER"] = "OTHER";
})(CalendarProvider = exports.CalendarProvider || (exports.CalendarProvider = {}));
exports.CalendarProviderSchema = en_ts_utils_1.Enum(CalendarProvider, 'CalendarProvider');
//# sourceMappingURL=CalendarProvider.js.map