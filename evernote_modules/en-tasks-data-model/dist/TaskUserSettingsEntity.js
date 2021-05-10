"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskUserSettingsEntitySchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
exports.TaskUserSettingsEntitySchema = {
    fields: {
        defaultReminder: en_ts_utils_1.NullableBoolean,
        defaultRemindersOffsets: en_ts_utils_1.NullableListOf('number'),
        pinDefaultTaskNote: en_ts_utils_1.NullableBoolean,
        defaultTaskNoteID: en_ts_utils_1.NullableID,
        taskAssignDate: en_ts_utils_1.NullableTimestamp,
        taskAssignCount: en_ts_utils_1.NullableNumber,
    },
    embeddedAssociations: {
        defaultTaskNoteID: {
            targetIsSrc: false,
            targetType: en_data_model_1.EntityTypes.Note,
            isNsyncParent: false,
        },
    },
};
//# sourceMappingURL=TaskUserSettingsEntity.js.map