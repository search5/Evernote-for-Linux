"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCalendarDataSchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.UserCalendarDataSchema = en_ts_utils_1.Struct({
    displayName: en_ts_utils_1.NullableString,
    displayColor: en_ts_utils_1.NullableString,
    description: en_ts_utils_1.NullableString,
    timezone: en_ts_utils_1.NullableString,
    isPrimary: 'boolean',
    isOwned: 'boolean',
}, 'UserCalendarResult');
//# sourceMappingURL=UserCalendarData.js.map