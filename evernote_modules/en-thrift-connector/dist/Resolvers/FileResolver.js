"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileResolverDI = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("../Auth");
const BlobWithContent = conduit_core_1.schemaToGraphQLType(en_core_entity_types_1.BlobV2WithContentSchema);
const BlobWithoutContent = conduit_core_1.schemaToGraphQLType(en_core_entity_types_1.BlobV2Schema);
async function resolveUrl(hostResolver, urlEncoder, context, node, blobName, overrideUrlHost) {
    if (!node.NodeFields[blobName].path) {
        return null;
    }
    conduit_core_1.validateDB(context);
    const metadata = await context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT);
    const fileHost = overrideUrlHost !== null && overrideUrlHost !== void 0 ? overrideUrlHost : hostResolver.getServiceHostSkipCache(Auth_1.decodeAuthData((metadata === null || metadata === void 0 ? void 0 : metadata.authToken) || null).urlHost, 'File');
    const urlWithHost = `${fileHost}${node.NodeFields[blobName].path}`;
    if (!urlEncoder) {
        return urlWithHost;
    }
    const userID = await context.db.getCurrentUserID(context);
    if (conduit_utils_1.isNullish(userID)) {
        throw new conduit_utils_1.NoUserError('Missing current userID');
    }
    return await urlEncoder(node.id, node.NodeFields[blobName].hash, urlWithHost, conduit_utils_1.keyStringForUserID(userID), fileHost);
}
function fileResolvers(hostResolver, urlEncoder, type, blobName, hasContent, overrideUrlHost) {
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
                // TODO resolve content
                throw new Error('Unable to resolve content at this time');
            }
            if (fieldSelection.url && fields.path) {
                fields.url = await resolveUrl(hostResolver, urlEncoder, context, node, blobName, overrideUrlHost);
            }
            return fields;
        },
    };
}
function FileResolverDI(hostResolver, urlEncoder, overrideUrlHost) {
    return (type, blobName, hasContent) => {
        return fileResolvers(hostResolver, urlEncoder, type, blobName, hasContent, overrideUrlHost);
    };
}
exports.FileResolverDI = FileResolverDI;
//# sourceMappingURL=FileResolver.js.map