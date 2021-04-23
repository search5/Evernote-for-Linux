"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipResolver = exports.processAndCacheAcceptedMemberships = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
const gFetches = {};
async function getShares(trc, noteStore, authToken, nodeRef) {
    switch (nodeRef.type) {
        case en_core_entity_types_1.CoreEntityTypes.Note:
            return noteStore.getNoteShares(trc, authToken, Converters_1.convertGuidToService(nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Note));
        case en_core_entity_types_1.CoreEntityTypes.Notebook:
            return noteStore.getNotebookShares(trc, authToken, Converters_1.convertGuidToService(nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Notebook));
        default:
            throw new Error('Unknown type');
    }
}
async function processAndCacheAcceptedMemberships(trc, tx, response, parentEdge) {
    const out = {};
    if (response.memberships) {
        for (const member of response.memberships) {
            out[Converters_1.convertGuidFromService(member.recipientUserId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User)] = true;
        }
    }
    if (response.invitations) {
        for (const invite of response.invitations) {
            let profileID = '';
            if (invite.recipientUserIdentity) {
                const recipient = invite.recipientUserIdentity;
                profileID = recipient.stringIdentifier || recipient.longIdentifier.toString();
            }
            else {
                profileID = invite.recipientIdentityId.toString();
            }
            out[Converters_1.convertGuidFromService(profileID, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity)] = false;
        }
    }
    await tx.setNodeCachedField(trc, parentEdge, 'internal_membershipsAcceptStatus', out, []);
    return out;
}
exports.processAndCacheAcceptedMemberships = processAndCacheAcceptedMemberships;
async function cacheMissForAcceptedMemberships(context, node, syncContext) {
    conduit_core_1.validateDB(context);
    const metadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!metadata || !metadata.authToken) {
        throw new Error('not authorized');
    }
    const auth = Auth_1.decodeAuthData(metadata.authToken);
    const noteStore = context.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const response = await getShares(context.trc, noteStore, auth.token, node);
    return context.db.transactSyncedStorage(context.trc, 'processAndCacheAcceptedMemberships', async (tx) => {
        return await processAndCacheAcceptedMemberships(context.trc, tx, response, node);
    });
}
async function resolveMembershipAccepted(nodeRef, context) {
    conduit_core_1.validateDB(context);
    const node = await context.db.getNode(context, { id: nodeRef.id, type: en_core_entity_types_1.CoreEntityTypes.Membership });
    if (!node) {
        throw new conduit_utils_1.NotFoundError(nodeRef.id, 'graph node not found');
    }
    const parentEdgeRef = conduit_utils_1.firstStashEntry(node.inputs.parent);
    const recipientEdgeRef = conduit_utils_1.firstStashEntry(node.outputs.recipient);
    if (!parentEdgeRef) {
        throw new Error('no parent edge for membership');
    }
    else if (!recipientEdgeRef) {
        throw new Error('no recipient edge for membership');
    }
    const parentRef = conduit_storage_1.getEdgeConnection(parentEdgeRef, node.id);
    if (parentRef.type === en_core_entity_types_1.CoreEntityTypes.Workspace) {
        // Memberships are always accepted for workspaces, no need to do any caching here
        return true;
    }
    const cacheID = `${parentRef.type}:${parentRef.id}`;
    let fetchPromise;
    let cacheResp = await context.db.getNodeCachedField(context, parentRef, 'internal_membershipsAcceptStatus', async (parentNode, syncContext) => {
        if (gFetches[cacheID] && gFetches[cacheID].inProgress === true) {
            return gFetches[cacheID].promise;
        }
        fetchPromise = cacheMissForAcceptedMemberships(context, parentNode, syncContext);
        gFetches[cacheID] = {
            promise: fetchPromise,
            inProgress: true,
        };
        fetchPromise
            .then(() => gFetches[cacheID].inProgress = false)
            .catch(err => {
            gFetches[cacheID].inProgress = false;
            if (err instanceof conduit_utils_1.RetryError || (err instanceof conduit_utils_1.AuthError && err.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED)) {
                conduit_utils_1.logger.info('Failed to fetch membership shares from service ', err);
            }
            else {
                conduit_utils_1.logger.error('Failed to fetch membership shares from service ', err);
            }
        });
        return null;
    });
    if (!cacheResp && !context.watcher && fetchPromise) {
        cacheResp = await fetchPromise;
    }
    return cacheResp ? cacheResp[recipientEdgeRef.dstID] || false : null;
}
function MembershipResolver() {
    const resolvers = {
        'Membership.hasAccepted': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableBoolean),
            resolve: async (nodeRef, _, context) => {
                try {
                    return await resolveMembershipAccepted(nodeRef, context);
                }
                catch (err) {
                    if (err instanceof conduit_utils_1.AuthError && err.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED) {
                        return null; // User does not have access to this field.
                    }
                    throw err;
                }
            },
        },
    };
    return resolvers;
}
exports.MembershipResolver = MembershipResolver;
//# sourceMappingURL=MembershipResolver.js.map