"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentEntitySchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
exports.AttachmentEntitySchema = {
    fields: {
        mime: 'string',
        width: 'int',
        height: 'int',
        filename: 'string',
        isActive: 'boolean',
        data: en_data_model_1.BlobRefSchema,
        recognition: en_data_model_1.BlobRefSchema,
        alternateData: en_data_model_1.BlobRefSchema,
        applicationDataKeys: en_ts_utils_1.ListOf('string'),
        Attributes: en_ts_utils_1.Struct({
            sourceURL: en_ts_utils_1.NullableUrl,
            timestamp: en_ts_utils_1.NullableTimestamp,
            Location: en_ts_utils_1.Struct({
                latitude: en_ts_utils_1.NullableNumber,
                longitude: en_ts_utils_1.NullableNumber,
                altitude: en_ts_utils_1.NullableNumber,
            }),
            cameraMake: en_ts_utils_1.NullableString,
            cameraModel: en_ts_utils_1.NullableString,
            clientWillIndex: 'boolean',
        }),
    },
};
//# sourceMappingURL=AttachmentEntity.js.map