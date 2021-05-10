"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderStatusSchema = exports.ReminderStatus = exports.ReminderDateUIOptionSchema = exports.ReminderDateUIOption = exports.DueDateUIOptionSchema = exports.DueDateUIOption = exports.TaskStatusSchema = exports.TaskStatus = void 0;
const en_ts_utils_1 = require("en-ts-utils");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["open"] = "open";
    TaskStatus["completed"] = "completed";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
exports.TaskStatusSchema = en_ts_utils_1.Enum(TaskStatus, 'TaskStatus');
var DueDateUIOption;
(function (DueDateUIOption) {
    DueDateUIOption["date_time"] = "date_time";
    DueDateUIOption["date_only"] = "date_only";
})(DueDateUIOption = exports.DueDateUIOption || (exports.DueDateUIOption = {}));
exports.DueDateUIOptionSchema = en_ts_utils_1.Enum(DueDateUIOption, 'TaskDueDateUIOption');
var ReminderDateUIOption;
(function (ReminderDateUIOption) {
    ReminderDateUIOption["date_time"] = "date_time";
    ReminderDateUIOption["date_only"] = "date_only";
    ReminderDateUIOption["relative_to_due"] = "relative_to_due";
})(ReminderDateUIOption = exports.ReminderDateUIOption || (exports.ReminderDateUIOption = {}));
exports.ReminderDateUIOptionSchema = en_ts_utils_1.Enum(ReminderDateUIOption, 'ReminderDateUIOption');
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["active"] = "active";
    ReminderStatus["muted"] = "muted";
})(ReminderStatus = exports.ReminderStatus || (exports.ReminderStatus = {}));
exports.ReminderStatusSchema = en_ts_utils_1.Enum(ReminderStatus, 'ReminderStatus');
//# sourceMappingURL=TaskTypes.js.map