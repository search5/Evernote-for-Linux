"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteEntitySchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
exports.NoteEntitySchema = {
    fields: {
        attributes: en_ts_utils_1.Struct({
            subjectDate: en_ts_utils_1.NullableTimestamp,
            latitude: en_ts_utils_1.NullableNumber,
            longitude: en_ts_utils_1.NullableNumber,
            altitude: en_ts_utils_1.NullableNumber,
            author: en_ts_utils_1.NullableString,
            source: en_ts_utils_1.NullableString,
            sourceURL: en_ts_utils_1.NullableString,
            sourceApplication: en_ts_utils_1.NullableString,
            shareDate: en_ts_utils_1.NullableTimestamp,
            reminderOrder: en_ts_utils_1.NullableTimestamp,
            reminderDoneTime: en_ts_utils_1.NullableTimestamp,
            reminderTime: en_ts_utils_1.NullableTimestamp,
            placeName: en_ts_utils_1.NullableString,
            contentClass: en_ts_utils_1.NullableString,
            lastEditedBy: en_ts_utils_1.NullableString,
            creatorId: en_ts_utils_1.NullableNumber,
            lastEditorId: en_ts_utils_1.NullableNumber,
        }),
        blobRef: en_data_model_1.BlobRefSchema,
        isUntitled: 'boolean',
        snippet: 'string',
    },
};
//# sourceMappingURL=NoteEntity.js.map