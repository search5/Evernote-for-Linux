"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobCache = exports.BlobV2WithContentSchema = exports.BlobV2Schema = exports.NoteContentBlobSchema = exports.BlobWithContentSchema = exports.BlobSchema = exports.BlobBaseSchema = void 0;
const conduit_utils_1 = require("conduit-utils");
exports.BlobBaseSchema = conduit_utils_1.Struct({
    localChangeTimestamp: 'timestamp',
    hash: 'string',
    size: 'number',
}, 'Blob');
exports.BlobSchema = conduit_utils_1.ExtendStruct(exports.BlobBaseSchema, {
    url: conduit_utils_1.NullableUrl,
}, 'BlobWithUrl');
exports.BlobWithContentSchema = conduit_utils_1.ExtendStruct(exports.BlobBaseSchema, {
    content: conduit_utils_1.NullableString,
}, 'BlobWithContent');
exports.NoteContentBlobSchema = conduit_utils_1.ExtendStruct(exports.BlobWithContentSchema, {
    editSequenceNumber: 'int',
}, 'NoteContentBlob');
// TODO: Possibly make these not optional, but they are today for the purposes of Conduit framework compatibility without disruption.
exports.BlobV2Schema = conduit_utils_1.ExtendStruct(exports.BlobSchema, {
    id: conduit_utils_1.NullableID,
    format: conduit_utils_1.NullableString,
    version: conduit_utils_1.NullableInt,
    path: conduit_utils_1.NullableString,
}, 'BlobV2');
// Simulating BlobV2Schema with metadata backing for the puposes of compatibilty in the case of migration.
exports.BlobV2WithContentSchema = conduit_utils_1.ExtendStruct(exports.BlobV2Schema, {
    content: 'string',
}, 'BlobV2WithContent');
function BlobCache(blobName, lookasideThreshold) {
    return {
        [`${blobName}.content`]: {
            type: 'string',
            allowStale: false,
            dependentFields: [`${blobName}.hash`, `${blobName}.size`],
            lookasideThreshold,
        },
    };
}
exports.BlobCache = BlobCache;
//# sourceMappingURL=Blob.js.map