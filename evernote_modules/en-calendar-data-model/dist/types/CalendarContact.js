"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarContactSchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.CalendarContactSchema = en_ts_utils_1.Struct({
    email: en_ts_utils_1.NullableString,
    displayName: en_ts_utils_1.NullableString,
    avatar: en_ts_utils_1.NullableString,
}, 'CalendarContact');
//# sourceMappingURL=CalendarContact.js.map