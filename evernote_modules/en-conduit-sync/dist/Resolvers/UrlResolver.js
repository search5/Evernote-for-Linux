"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
async function resolveUrl(context, nodeRef, parentKey, field, urlEncoder) {
    conduit_core_1.validateDB(context);
    const { node } = await context.db.getNodeWithContext(context, nodeRef);
    if (!node) {
        throw new conduit_utils_1.NotFoundError(nodeRef.id, 'not found');
    }
    const url = node.NodeFields[field];
    if (!url) {
        return null;
    }
    const activeUserID = await context.db.getCurrentUserID(context);
    if (conduit_utils_1.isNullish(activeUserID)) {
        throw new conduit_utils_1.NoUserError('Missing current user');
    }
    return await urlEncoder(parentKey, null, url, conduit_utils_1.keyStringForUserID(activeUserID));
}
function UrlResolver(urlEncoder) {
    if (!urlEncoder) {
        return {};
    }
    return {
        'User.photoUrl': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
            resolve: async (nodeRef, _, context) => {
                return resolveUrl(context, { id: nodeRef.id, type: en_core_entity_types_1.CoreEntityTypes.User }, 'UPP', 'photoUrl', urlEncoder);
            },
        },
        'Profile.photoUrl': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
            resolve: async (nodeRef, _, context) => {
                return resolveUrl(context, { id: nodeRef.id, type: en_core_entity_types_1.CoreEntityTypes.Profile }, 'UPP', 'photoUrl', urlEncoder);
            },
        },
        'Note.thumbnailUrl': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableUrl),
            resolve: async (nodeRef, _, context) => {
                return resolveUrl(context, { id: nodeRef.id, type: en_core_entity_types_1.CoreEntityTypes.Note }, nodeRef.id, 'thumbnailUrl', urlEncoder);
            },
        },
    };
}
exports.UrlResolver = UrlResolver;
//# sourceMappingURL=UrlResolver.js.map