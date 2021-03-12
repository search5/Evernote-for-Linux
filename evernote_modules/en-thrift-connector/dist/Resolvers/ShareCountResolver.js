"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareCountResolver = void 0;
const conduit_core_1 = require("conduit-core");
const en_core_entity_types_1 = require("en-core-entity-types");
// fetch and dedupe shareCountProfiles(profiles pointing to all memberships recipient and owner edges)
// of node and it's ancestors if present.
async function getProfileIDs(context, node) {
    if (node.NodeFields.internal_shareCountProfiles === null) {
        return [];
    }
    const profiles = new Set(Object.keys(node.NodeFields.internal_shareCountProfiles));
    const permissionsContext = new en_core_entity_types_1.GraphQLPermissionContext(context);
    const ancestors = await en_core_entity_types_1.getAncestors(permissionsContext, node);
    for (const ancestor of ancestors) {
        for (const profileID of Object.keys(ancestor.NodeFields.internal_shareCountProfiles)) {
            profiles.add(profileID);
        }
    }
    return Array.from(profiles.values());
}
function ShareCountResolver() {
    async function getShareCount(context, nodeRef) {
        conduit_core_1.validateDB(context);
        const profileMap = {};
        const node = await context.db.getNode(context, nodeRef);
        if (node) {
            const profileIDs = await getProfileIDs(context, node);
            const profiles = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Profile, profileIDs);
            for (const i in profiles) {
                const profile = profiles[i];
                if (profile) {
                    profileMap[profile.NodeFields.rootID] = true;
                }
                else {
                    // We don't know about this profile, but we should still count it
                    profileMap[profileIDs[i]] = true;
                }
            }
        }
        return Object.getOwnPropertyNames(profileMap).length;
    }
    return {
        'Note.shareCount': {
            type: conduit_core_1.schemaToGraphQLType('number'),
            resolve: async (nodeRef, _, context) => {
                return getShareCount(context, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: nodeRef.id });
            },
        },
        'Notebook.shareCount': {
            type: conduit_core_1.schemaToGraphQLType('number'),
            resolve: async (nodeRef, _, context) => {
                return getShareCount(context, { type: en_core_entity_types_1.CoreEntityTypes.Notebook, id: nodeRef.id });
            },
        },
        'Workspace.shareCount': {
            type: conduit_core_1.schemaToGraphQLType('number'),
            resolve: async (nodeRef, _, context) => {
                return getShareCount(context, { type: en_core_entity_types_1.CoreEntityTypes.Workspace, id: nodeRef.id });
            },
        },
    };
}
exports.ShareCountResolver = ShareCountResolver;
//# sourceMappingURL=ShareCountResolver.js.map