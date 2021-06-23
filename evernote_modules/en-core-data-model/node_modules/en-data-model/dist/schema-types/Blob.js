"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobV2WithContentSchema = exports.BlobV2RefSchema = exports.BlobRefSchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.BlobRefSchema = en_ts_utils_1.Struct({
    hash: 'string',
    size: 'int',
    path: 'string',
}, 'ServiceBlobRef');
exports.BlobV2RefSchema = en_ts_utils_1.ExtendStruct(exports.BlobRefSchema, {
    id: en_ts_utils_1.NullableString,
    format: en_ts_utils_1.NullableString,
    version: en_ts_utils_1.NullableInt,
}, 'ServiceBlobV2');
exports.BlobV2WithContentSchema = en_ts_utils_1.ExtendStruct(exports.BlobV2RefSchema, {
    content: 'string',
}, 'ServiceBlobV2WithContent');
//# sourceMappingURL=Blob.js.map