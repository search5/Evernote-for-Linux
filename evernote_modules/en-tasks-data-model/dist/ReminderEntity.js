"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const TaskTypes_1 = require("./TaskTypes");
exports.ReminderEntitySchema = {
    fields: {
        reminderDate: en_ts_utils_1.NullableTimestamp,
        reminderDateUIOption: en_ts_utils_1.Nullable(TaskTypes_1.ReminderDateUIOptionSchema),
        timeZone: en_ts_utils_1.NullableString,
        dueDateOffset: en_ts_utils_1.NullableNumber,
        sourceOfChange: en_ts_utils_1.NullableString,
        status: en_ts_utils_1.Nullable(TaskTypes_1.ReminderStatusSchema),
        noteLevelID: en_ts_utils_1.NullableString,
    },
};
//# sourceMappingURL=ReminderEntity.js.map