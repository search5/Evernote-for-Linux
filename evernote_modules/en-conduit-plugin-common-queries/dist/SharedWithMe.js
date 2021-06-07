"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedWithMePlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
const allowedMemberships = {
    [en_core_entity_types_1.CoreEntityTypes.Notebook]: true,
    [en_core_entity_types_1.CoreEntityTypes.Note]: true,
};
async function resolveSharedWithMe(_, args, context, info) {
    const perfStart = Date.now();
    const memberships = [];
    const invitations = [];
    conduit_core_1.validateDB(context);
    const membershipSort = args.membershipSort || { field: 'invitedTime', order: 'DESC' };
    const invitationsSort = args.invitationsSort || { field: 'created', order: 'DESC' };
    const userMemberships = await context.db.queryGraph(context, en_core_entity_types_1.CoreEntityTypes.Membership, 'MembershipsForMe', { orderBy: membershipSort.field, reverseOrder: membershipSort.order === 'ASC' });
    const userInvitations = await context.db.queryGraph(context, en_core_entity_types_1.CoreEntityTypes.Invitation, 'InvitationsForMe', { orderBy: invitationsSort.field, reverseOrder: invitationsSort.order === 'ASC' });
    const membershipIds = userMemberships.map(membership => membership.id);
    const invitationIds = userInvitations.map(invitaion => invitaion.id);
    const membershipNodes = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Membership, membershipIds);
    const invitationNodes = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Invitation, invitationIds);
    const acceptedSharedObjects = new Set();
    const syncContexts = new Set();
    for (const node of membershipNodes) {
        if (!node) {
            continue;
        }
        const parentRef = conduit_utils_1.firstStashEntry(node.inputs.parent);
        if (!parentRef || !allowedMemberships[parentRef.srcType]) {
            continue;
        }
        const recipient = conduit_utils_1.firstStashEntry(node.outputs.recipient);
        const sharer = conduit_utils_1.firstStashEntry(node.outputs.sharer);
        if (!recipient || !sharer) {
            continue;
        }
        const ref = { id: node.id, type: node.type };
        acceptedSharedObjects.add(en_thrift_connector_1.convertGuidToService(parentRef.srcID, parentRef.srcType));
        if (parentRef.srcType === en_core_entity_types_1.CoreEntityTypes.Notebook) {
            acceptedSharedObjects.add(en_thrift_connector_1.convertGuidToService(node.id, node.type));
        }
        if (recipient.dstID !== sharer.dstID) {
            memberships.push(ref);
        }
        for (const syncContext of node.syncContexts) {
            if (syncContext.startsWith('SharedNote:')) {
                syncContexts.add(syncContext);
            }
        }
    }
    // TODO : auto accept dependent invitations, i.e. when a notebook invite is accepted,
    // we check if there are pending invites for any of the notes of this notebook
    // and accept those invitations as well and vice versa when notes are accepted
    for (const node of invitationNodes) {
        if (!node) {
            continue;
        }
        // If invitation type is NOTE, we check if SharedNote sync context exists for this note or not.
        // If SharedNote sync context exist, it means note invitation is accepted separately
        // If SharedNote sync context does not exist, it means note invitation is not yet accepted and hence should be displayed in result
        const sharedEntityID = en_thrift_connector_1.convertGuidToService(node.id, en_core_entity_types_1.CoreEntityTypes.Invitation);
        if (acceptedSharedObjects.has(sharedEntityID) &&
            (node.NodeFields.invitationType !== 'NOTE' || syncContexts.has('SharedNote:' + sharedEntityID))) {
            continue;
        }
        if (node.NodeFields.invitationType === 'NOTE') {
            // If both note and nb are shared, note membership also gets synced via linkedNotebook sync
            // and if the note invitation is not accepted yet, we're displaying both membership and invitation.
            // Need to filter out the membership in this case and also show note invitation so it can be accepted.
            const membershipIndex = memberships.findIndex(m => m.id.includes(sharedEntityID));
            if (membershipIndex >= 0) {
                memberships.splice(membershipIndex, 1);
            }
        }
        const ref = { id: node.id, type: node.type };
        invitations.push(ref);
    }
    const perfElapsed = Date.now() - perfStart;
    if (perfElapsed >= 2000) {
        const message = `Unperformant resolver detected. Query name: ${info === null || info === void 0 ? void 0 : info.fieldName}. Time elapsed: ${perfElapsed}.`;
        conduit_utils_1.logger.debug(`WHOOPS ${message}`);
        conduit_utils_1.recordException({ message }).catch(e => conduit_utils_1.logger.error(e));
    }
    return { memberships, invitations };
}
async function listResolver(parent, args, context, info) {
    if (!info || !info.fieldName) {
        throw new Error('Invalid info block');
    }
    conduit_core_1.validateDB(context);
    const nodeRefs = parent[info.fieldName];
    const out = nodeRefs.map(nodeRef => conduit_core_1.resolveNode(nodeRef, context, info));
    return conduit_utils_1.allSettled(out);
}
const sharedWithMePlugin = (autoResolverData) => {
    return {
        args: conduit_core_1.schemaToGraphQLArgs({
            membershipSort: conduit_utils_1.NullableStruct({
                field: conduit_utils_1.Enum(['invitedTime', 'created', 'label'], 'SharedWithMeMembershipField'),
                order: conduit_core_1.IndexOrderTypeSchema,
            }, 'SharedWithMeMembershipSort'),
            invitationsSort: conduit_utils_1.NullableStruct({
                field: conduit_utils_1.Enum(['created', 'label'], 'SharedWithMeInvitationsField'),
                order: conduit_core_1.IndexOrderTypeSchema,
            }, 'SharedWithMeInvitationsSort'),
        }),
        type: new graphql_1.GraphQLObjectType({
            name: 'SharedWithMeResult',
            fields: () => {
                return {
                    memberships: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(autoResolverData.NodeGraphQLTypes.Membership)), resolve: listResolver },
                    invitations: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(autoResolverData.NodeGraphQLTypes.Invitation)), resolve: listResolver },
                };
            },
        }),
        resolve: resolveSharedWithMe,
    };
};
exports.sharedWithMePlugin = sharedWithMePlugin;
//# sourceMappingURL=SharedWithMe.js.map