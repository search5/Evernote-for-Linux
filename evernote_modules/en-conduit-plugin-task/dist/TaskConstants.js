"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderStatusSchema = exports.ReminderStatus = exports.ReminderDateUIOptionSchema = exports.ReminderDateUIOption = exports.DueDateUIOptionSchema = exports.DueDateUIOption = exports.TaskStatusSchema = exports.TaskStatus = exports.TaskDeterministicIdGenerator = exports.TaskEntityTypes = void 0;
const conduit_utils_1 = require("conduit-utils");
exports.TaskEntityTypes = {
    NoteContentInfo: 'NoteContentInfo',
    Reminder: 'Reminder',
    Task: 'Task',
    TaskUserSettings: 'TaskUserSettings',
};
exports.TaskDeterministicIdGenerator = (() => {
    const entityTypeMap = new Map();
    entityTypeMap.set(exports.TaskEntityTypes.TaskUserSettings, 17);
    return new conduit_utils_1.DeterministicIdGenerator(entityTypeMap);
})();
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["open"] = "open";
    TaskStatus["completed"] = "completed";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
exports.TaskStatusSchema = conduit_utils_1.Enum(TaskStatus, 'TaskStatus');
var DueDateUIOption;
(function (DueDateUIOption) {
    DueDateUIOption["date_time"] = "date_time";
    DueDateUIOption["date_only"] = "date_only";
})(DueDateUIOption = exports.DueDateUIOption || (exports.DueDateUIOption = {}));
exports.DueDateUIOptionSchema = conduit_utils_1.Enum(DueDateUIOption, 'TaskDueDateUIOption');
var ReminderDateUIOption;
(function (ReminderDateUIOption) {
    ReminderDateUIOption["date_time"] = "date_time";
    ReminderDateUIOption["date_only"] = "date_only";
    ReminderDateUIOption["relative_to_due"] = "relative_to_due";
})(ReminderDateUIOption = exports.ReminderDateUIOption || (exports.ReminderDateUIOption = {}));
exports.ReminderDateUIOptionSchema = conduit_utils_1.Enum(ReminderDateUIOption, 'ReminderDateUIOption');
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["active"] = "active";
    ReminderStatus["muted"] = "muted";
})(ReminderStatus = exports.ReminderStatus || (exports.ReminderStatus = {}));
exports.ReminderStatusSchema = conduit_utils_1.Enum(ReminderStatus, 'ReminderStatus');
//# sourceMappingURL=TaskConstants.js.map