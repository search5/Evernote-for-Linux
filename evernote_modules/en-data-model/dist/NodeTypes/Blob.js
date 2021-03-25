"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobCache = exports.BlobV2SchemaWithContent = exports.BlobV2Schema = exports.BlobSchema = void 0;
exports.BlobSchema = {
    localChangeTimestamp: 'timestamp',
    hash: 'string',
    size: 'number',
    url: 'url?',
};
// TODO: Possibly make these not optional, but they are today for the purposes of Conduit framework compatibility without disruption.
exports.BlobV2Schema = Object.assign(Object.assign({}, exports.BlobSchema), { id: 'ID?', format: 'string?', version: 'number?', path: 'string?' });
// Simulating BlobV2Schema with metadata backing for the puposes of compatibilty in the case of migration.
exports.BlobV2SchemaWithContent = Object.assign(Object.assign({}, exports.BlobV2Schema), { content: 'string' });
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