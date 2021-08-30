"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_TITLE_MAX_LENGTH = exports.TaskEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const TaskTypes_1 = require("./TaskTypes");
exports.TaskEntitySchema = {
    fields: {
        dueDate: en_ts_utils_1.NullableTimestamp,
        dueDateUIOption: en_ts_utils_1.Nullable(TaskTypes_1.DueDateUIOptionSchema),
        timeZone: en_ts_utils_1.NullableString,
        status: TaskTypes_1.TaskStatusSchema,
        inNote: 'boolean',
        flag: 'boolean',
        sortWeight: 'string',
        noteLevelID: 'string',
        statusUpdated: en_ts_utils_1.NullableTimestamp,
        taskGroupNoteLevelID: 'string',
        sourceOfChange: en_ts_utils_1.NullableString,
        assigneeEmail: en_ts_utils_1.NullableString,
        assigneeIdentityID: en_ts_utils_1.NullableInt,
        assigneeUserID: en_ts_utils_1.NullableInt,
        assignedByUserID: en_ts_utils_1.NullableInt,
    },
    embeddedAssociations: {
        assigneeIdentityID: {
            targetIsSrc: false,
            targetType: 'Identity',
            isNsyncParent: false,
        },
        assigneeUserID: {
            targetIsSrc: false,
            targetType: 'User',
            isNsyncParent: false,
        },
        assignedByUserID: {
            targetIsSrc: false,
            targetType: 'User',
            isNsyncParent: false,
        },
    },
};
exports.TASK_TITLE_MAX_LENGTH = 300;
//# sourceMappingURL=TaskEntity.js.map