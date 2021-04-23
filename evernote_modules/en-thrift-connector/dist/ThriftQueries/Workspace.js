"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWorkspaceQueries = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
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
        return { workspaces: result.map(info => {
                var _a;
                return (info && info.workspace && {
                    id: Converters_1.convertGuidFromService(info.workspace.guid, en_core_entity_types_1.CoreEntityTypes.Workspace),
                    type: info.workspace.workspaceType,
                    label: (_a = info.workspace.name) !== null && _a !== void 0 ? _a : '',
                    description: info.workspace.descriptionText,
                    // possible that no one is in charge of this space. Check with service if remove nullness.
                    contact: info.workspace.contactId ? Converters_1.convertGuidFromService(info.workspace.contactId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User) : null,
                    created: info.workspace.serviceCreated,
                    updated: info.workspace.serviceUpdated,
                });
            }) };
    }
    out.workspacePublicList = {
        args: conduit_core_1.schemaToGraphQLArgs({
            includeDiscoverableWorkspaces: conduit_utils_1.NullableBoolean,
            includeOpenWorkspaces: conduit_utils_1.NullableBoolean,
        }),
        type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
            workspaces: conduit_utils_1.ListOfStructs({
                id: 'string',
                label: 'string',
                description: conduit_utils_1.NullableString,
                type: conduit_utils_1.NullableInt,
                contact: conduit_utils_1.NullableID,
                created: conduit_utils_1.NullableTimestamp,
                updated: conduit_utils_1.NullableTimestamp,
            }),
        }, 'WorkspacePublicList')),
        resolve: workspacePublicListResolver,
    };
}
exports.addWorkspaceQueries = addWorkspaceQueries;
//# sourceMappingURL=Workspace.js.map