"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBlobToService = exports.updateBlobToGraph = exports.fillBlobCache = exports.hasBlobChanged = exports.convertBlobFieldsFromService = void 0;
const en_core_entity_types_1 = require("en-core-entity-types");
const Helpers_1 = require("./Helpers");
const NoteConverter_1 = require("./NoteConverter");
function convertBlobFieldsFromService(serviceData) {
    const hash = serviceData ? Helpers_1.convertHashFromService(serviceData.bodyHash) : null;
    if (!serviceData || !hash) {
        return {
            // id: null,
            localChangeTimestamp: 0,
            hash: '',
            size: 0,
            url: null,
        };
    }
    return {
        // id: null,
        localChangeTimestamp: 0,
        hash,
        size: serviceData.size || 0,
        url: serviceData.url || null,
    };
}
exports.convertBlobFieldsFromService = convertBlobFieldsFromService;
function hasBlobChanged(oldBlob, newBlob) {
    return ((oldBlob.hash !== newBlob.hash) || (oldBlob.size !== newBlob.size));
}
exports.hasBlobChanged = hasBlobChanged;
async function fillBlobCache(trc, graphTransaction, node, blobName, blobFields, content) {
    if (!blobFields.hash) {
        return;
    }
    // populate cache with new content, if provided
    const bodyContent = Helpers_1.convertHashFromService(content);
    if (typeof bodyContent !== 'string') {
        return;
    }
    await graphTransaction.setNodeCachedField(trc, node, `${blobName}.content`, bodyContent, {
        [`${blobName}.hash`]: blobFields.hash,
        [`${blobName}.size`]: blobFields.size,
    });
}
exports.fillBlobCache = fillBlobCache;
async function updateBlobToGraph(trc, graphTransaction, serviceData, nodeRef, blobName, syncContext) {
    const blobFields = await convertBlobFieldsFromService(serviceData);
    const updateBlob = {
        NodeFields: {
            [blobName]: blobFields,
        },
    };
    await graphTransaction.updateNode(trc, syncContext, nodeRef, updateBlob);
    if (serviceData === null || serviceData === void 0 ? void 0 : serviceData.body) {
        await fillBlobCache(trc, graphTransaction, nodeRef, blobName, blobFields, serviceData.body);
    }
}
exports.updateBlobToGraph = updateBlobToGraph;
async function updateBlobToService(trc, params, node, syncContext, blobName, remoteFields, blobData) {
    // Assuming we will want to support updating more blobs in the future?
    if (node.type === en_core_entity_types_1.CoreEntityTypes.Note && blobName === 'content') {
        await NoteConverter_1.updateNoteContentToService(trc, params, node.id, syncContext, remoteFields, blobData.content, blobData.hash);
        return true;
    }
    throw new Error(`Blob update for ${node.type}.${blobName} not yet supported`);
}
exports.updateBlobToService = updateBlobToService;
//# sourceMappingURL=BlobConverter.js.map