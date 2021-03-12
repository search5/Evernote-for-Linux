"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWorkspaceQueries = void 0;
const conduit_core_1 = require("conduit-core");
const en_core_entity_types_1 = require("en-core-entity-types");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
const workspacePublicList = conduit_core_1.fromSchema('workspacePublicList', graphql_tag_1.default `
  type WorkspaceResult {
    id: String!
    label: String!
    description: String
    type: Int!
    contact: String
    created: Float!
    updated: Float!
  }
  type workspacePublicList {
    workspaces: [WorkspaceResult!]!
  }
`);
function addWorkspaceQueries(out) {
    async function workspacePublicListResolver(parent, args, context) {
        conduit_core_1.validateDB(context);
        const authState = await context.db.getAuthTokenAndState(context.trc, null);
        if (!authState || !authState.token) {
            throw new Error('Not logged in');
        }
        const auth = Auth_1.decodeAuthData(authState.token);
        if (!auth.vaultAuth) {
            throw new Error('No vault user');
        }
        const utilityStore = context.thriftComm.getUtilityStore(auth.vaultAuth.urls.utilityUrl);
        const result = await utilityStore.listWorkspacesWithResultSpec(context.trc, auth.vaultAuth.token, args, {});
        return { workspaces: result.map(info => (info && info.workspace && {
                id: Converters_1.convertGuidFromService(info.workspace.guid, en_core_entity_types_1.CoreEntityTypes.Workspace),
                type: info.workspace.workspaceType,
                label: info.workspace.name,
                description: info.workspace.descriptionText,
                // possible that no one is in charge of this space. Check with service if remove nullness.
                contact: info.workspace.contactId ? Converters_1.convertGuidFromService(info.workspace.contactId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User) : null,
                created: info.workspace.serviceCreated,
                updated: info.workspace.serviceUpdated,
            })) };
    }
    if (workspacePublicList) {
        out.workspacePublicList = {
            args: conduit_core_1.schemaToGraphQLArgs({
                includeDiscoverableWorkspaces: 'boolean?',
                includeOpenWorkspaces: 'boolean?',
            }),
            type: workspacePublicList,
            resolve: workspacePublicListResolver,
        };
    }
}
exports.addWorkspaceQueries = addWorkspaceQueries;
//# sourceMappingURL=Workspace.js.map