"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobResolver = exports.resolveContent = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Auth = __importStar(require("../Auth"));
const BlobWithContent = conduit_core_1.schemaToGraphQLType(en_core_entity_types_1.BlobWithContentSchema);
const NoteContentBlob = conduit_core_1.schemaToGraphQLType(en_core_entity_types_1.NoteContentBlobSchema);
const BlobWithoutContent = conduit_core_1.schemaToGraphQLType(en_core_entity_types_1.BlobSchema);
async function fetchAndCacheBlobContent(context, node, syncContext, blobName) {
    var _a;
    conduit_core_1.validateDB(context);
    const syncContextMetadata = (await context.db.getSyncContextMetadata(context, syncContext));
    if (!syncContextMetadata || !syncContextMetadata.authToken) {
        throw new Error('not authorized');
    }
    const authData = Auth.decodeAuthData(syncContextMetadata.authToken);
    if (node.type === en_core_entity_types_1.CoreEntityTypes.Note && blobName === 'content') {
        return await en_thrift_connector_1.fetchAndCacheNoteContentData(context.trc, context.comm, authData, node.id, syncContext, context.db, context.localSettings, context.offlineContentStrategy);
    }
    if (node.type === en_core_entity_types_1.CoreEntityTypes.Attachment && (blobName === 'recognition' ||
        blobName === 'alternateData')) {
        if (node.localChangeTimestamp) {
            // upload is pending, subscription will trigger after upload completes
            return null;
        }
        if (!((_a = node.NodeFields[blobName]) === null || _a === void 0 ? void 0 : _a.size)) {
            return null;
        }
        return await en_thrift_connector_1.fetchAndCacheAttachmentData(context.trc, context.comm, authData, node.id, syncContext, blobName, context.db, context.localSettings, context.offlineContentStrategy);
    }
    throw new Error(`No fetcher defined for Blob ${node.type}.${blobName}`);
}
async function resolveContent(context, info, nodeRef, blobName) {
    var _a;
    const unboundedQuery = conduit_core_1.getUnboundedQuery(context, info);
    if (unboundedQuery) {
        throw new Error(`Content fetch for ${blobName} not allowed in a ${unboundedQuery} query without paging`);
    }
    conduit_core_1.validateDB(context);
    try {
        return (_a = await context.db.getNodeCachedField(context, nodeRef, `${blobName}.content`, async (node) => {
            const syncContext = await en_thrift_connector_1.getBestSyncContextForNode(context.trc, node, context.db.syncContextMetadataProvider, null);
            return await fetchAndCacheBlobContent(context, node, syncContext, blobName);
        })) !== null && _a !== void 0 ? _a : null;
    }
    catch (err) {
        if (err instanceof conduit_utils_1.AuthError) {
            // let auth errors bubble up for handling at the getData level
            throw err;
        }
        // otherwise we don't want to error the entire query, so just log and return null
        // TODO probably want to report this error out another way
        conduit_utils_1.logger.warn('Failed to fetch content into cache', { blobName, id: nodeRef.id, err });
        return null;
    }
}
exports.resolveContent = resolveContent;
async function resolveUrl(urlEncoder, context, node, blobName) {
    if (!node.NodeFields[blobName].url) {
        return null;
    }
    conduit_core_1.validateDB(context);
    // walk up to blob's attachment's note
    const notes = await context.db.traverseGraph(context, node, [
        { edge: ['inputs', 'parent'], type: en_core_entity_types_1.CoreEntityTypes.Note },
    ]);
    if (!notes.length) {
        return node.NodeFields[blobName].url;
    }
    const note = notes[0];
    const userID = await context.db.getCurrentUserID(context);
    if (conduit_utils_1.isNullish(userID)) {
        throw new conduit_utils_1.NoUserError('Missing current userID');
    }
    return await urlEncoder(note.id, node.NodeFields[blobName].hash, node.NodeFields[blobName].url, conduit_utils_1.keyStringForUserID(userID));
}
function blobResolvers(urlEncoder, type, blobName, schema) {
    const hasContent = schema !== BlobWithoutContent;
    const hasSeqNumber = schema === NoteContentBlob;
    return {
        type: schema,
        resolve: async (nodeRef, _, context, info) => {
            var _a, _b;
            conduit_core_1.validateDB(context);
            const node = await context.db.getNode(context, { id: nodeRef.id, type });
            if (!node) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Blob not found');
            }
            const fieldSelection = info ? conduit_core_1.getFieldsForResolver(context.querySelectionFields, info.path) : {};
            const fields = Object.assign({}, node.NodeFields[blobName]);
            if (hasContent && fieldSelection.content) {
                fields.content = await resolveContent(context, info, node, blobName);
            }
            if (!hasContent && fieldSelection.url && urlEncoder && fields.url) {
                fields.url = await resolveUrl(urlEncoder, context, node, blobName);
            }
            if (hasSeqNumber && fieldSelection.editSequenceNumber) {
                fields.editSequenceNumber = (_b = (_a = node.CacheFields) === null || _a === void 0 ? void 0 : _a[`${blobName}.editSequenceNumber`]) !== null && _b !== void 0 ? _b : 0;
            }
            return fields;
        },
    };
}
function BlobResolver(urlEncoder) {
    return {
        'Note.content': blobResolvers(null, en_core_entity_types_1.CoreEntityTypes.Note, 'content', NoteContentBlob),
        'Attachment.data': blobResolvers(urlEncoder, en_core_entity_types_1.CoreEntityTypes.Attachment, 'data', BlobWithoutContent),
        'Attachment.recognition': blobResolvers(urlEncoder, en_core_entity_types_1.CoreEntityTypes.Attachment, 'recognition', BlobWithContent),
        'Attachment.alternateData': blobResolvers(urlEncoder, en_core_entity_types_1.CoreEntityTypes.Attachment, 'alternateData', BlobWithContent),
    };
}
exports.BlobResolver = BlobResolver;
//# sourceMappingURL=BlobResolver.js.map