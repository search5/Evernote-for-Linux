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
const en_data_model_1 = require("en-data-model");
const Auth = __importStar(require("../Auth"));
const NoteConverter_1 = require("../Converters/NoteConverter");
const ResourceConverter_1 = require("../Converters/ResourceConverter");
const Helpers_1 = require("../Helpers");
const BlobWithContent = conduit_core_1.schemaToGraphQLType(Object.assign(Object.assign({}, en_data_model_1.BlobSchema), { content: 'string?' }), 'Blob', false);
const BlobWithoutContent = conduit_core_1.schemaToGraphQLType(Object.assign({}, en_data_model_1.BlobSchema), 'BlobWithoutContent', false);
async function fetchAndCacheBlobContent(context, thriftComm, node, syncContext, blobName) {
    var _a;
    conduit_core_1.validateDB(context);
    const syncContextMetadata = (await context.db.getSyncContextMetadata(context, syncContext));
    if (!syncContextMetadata || !syncContextMetadata.authToken) {
        throw new Error('not authorized');
    }
    const authData = Auth.decodeAuthData(syncContextMetadata.authToken);
    if (node.type === en_data_model_1.CoreEntityTypes.Note && blobName === 'content') {
        return await NoteConverter_1.fetchAndCacheNoteContentData(context.trc, thriftComm, authData, node.id, syncContext, context.db, context.localSettings, context.offlineContentStrategy);
    }
    if (node.type === en_data_model_1.CoreEntityTypes.Attachment && (blobName === 'recognition' ||
        blobName === 'alternateData')) {
        if (node.localChangeTimestamp) {
            // upload is pending, subscription will trigger after upload completes
            return null;
        }
        if (!((_a = node.NodeFields[blobName]) === null || _a === void 0 ? void 0 : _a.size)) {
            return null;
        }
        return await ResourceConverter_1.fetchAndCacheAttachmentData(context.trc, thriftComm, authData, node.id, syncContext, blobName, context.db, context.localSettings, context.offlineContentStrategy);
    }
    throw new Error(`No fetcher defined for Blob ${node.type}.${blobName}`);
}
async function resolveContent(thriftComm, context, info, nodeRef, blobName) {
    var _a;
    const unboundedQuery = conduit_core_1.getUnboundedQuery(context, info);
    if (unboundedQuery) {
        throw new Error(`Content fetch for ${blobName} not allowed in a ${unboundedQuery} query without paging`);
    }
    conduit_core_1.validateDB(context);
    try {
        return (_a = await context.db.getNodeCachedField(context, nodeRef, `${blobName}.content`, async (node) => {
            const syncContext = await Helpers_1.getBestSyncContextForNode(context.trc, node, context.db.syncContextMetadataProvider, null);
            return await fetchAndCacheBlobContent(context, thriftComm, node, syncContext, blobName);
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
        { edge: ['inputs', 'parent'], type: en_data_model_1.CoreEntityTypes.Note },
    ]);
    if (!notes.length) {
        return node.NodeFields[blobName].url;
    }
    const note = notes[0];
    const userID = await context.multiUserProvider.getCurrentUserID(context.trc, context.watcher);
    if (userID === null) {
        throw new conduit_utils_1.NoUserError('Missing current userID');
    }
    return await urlEncoder(note.id, node.NodeFields[blobName].hash, node.NodeFields[blobName].url, conduit_utils_1.keyStringForUserID(userID));
}
function blobResolvers(thriftComm, urlEncoder, type, blobName, hasContent) {
    return {
        type: (hasContent ? BlobWithContent : BlobWithoutContent),
        resolve: async (nodeRef, _, context, info) => {
            conduit_core_1.validateDB(context);
            const node = await context.db.getNode(context, { id: nodeRef.id, type });
            if (!node) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Blob not found');
            }
            const fieldSelection = info ? conduit_core_1.getFieldsForResolver(context.querySelectionFields, info.path) : {};
            const fields = Object.assign({}, node.NodeFields[blobName]);
            if (hasContent && fieldSelection.content) {
                fields.content = await resolveContent(thriftComm, context, info, node, blobName);
            }
            if (fieldSelection.url && urlEncoder && fields.url) {
                fields.url = await resolveUrl(urlEncoder, context, node, blobName);
            }
            return fields;
        },
    };
}
function BlobResolver(thriftComm, urlEncoder) {
    return {
        'Note.content': blobResolvers(thriftComm, null, en_data_model_1.CoreEntityTypes.Note, 'content', true),
        'Attachment.data': blobResolvers(thriftComm, urlEncoder, en_data_model_1.CoreEntityTypes.Attachment, 'data', false),
        'Attachment.recognition': blobResolvers(thriftComm, urlEncoder, en_data_model_1.CoreEntityTypes.Attachment, 'recognition', true),
        'Attachment.alternateData': blobResolvers(thriftComm, urlEncoder, en_data_model_1.CoreEntityTypes.Attachment, 'alternateData', true),
    };
}
exports.BlobResolver = BlobResolver;
//# sourceMappingURL=BlobResolver.js.map