"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceDirectoryPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
const gWorkspaceListFetch = {};
const gWorkspaceListResult = {};
const WORKSPACE_DIRECTORY_FETCH_INTERVAL = 15000;
function buildArgs() {
    return {
        includedWorkspaceGuids: {
            type: conduit_core_1.schemaToGraphQLType('string[]?'),
        },
        limit: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
        },
        filters: {
            type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
                name: 'WorkspaceDirectoryFilter',
                fields: {
                    field: { type: conduit_core_1.schemaToGraphQLType(['label', 'description'], 'WorkspaceDirectoryFilterField', false) },
                    search: { type: conduit_core_1.schemaToGraphQLType('string') },
                },
            })),
        },
        sorts: {
            type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
                name: `WorkspaceDirectorySort`,
                fields: {
                    field: { type: conduit_core_1.schemaToGraphQLType(['label', 'created', 'updated', 'memberCount', 'accessStatus'], 'WorkspaceDirectorySortField', false) },
                    order: { type: conduit_core_1.IndexOrderType },
                },
            })),
        },
    };
}
function convertSortToService(sort) {
    if (!sort) {
        return {
            sortField: 1,
            descending: false,
        };
    }
    const descending = sort.order === 'DESC';
    switch (sort.field) {
        case 'label':
            return {
                sortField: 1,
                descending,
            };
        case 'created':
            return {
                sortField: 2,
                descending,
            };
        case 'updated':
            return {
                sortField: 3,
                descending,
            };
        case 'memberCount':
            return {
                sortField: 4,
                descending,
            };
        default:
            throw new Error(`Unhandled sort field: ${sort.field}`);
    }
}
async function getAuthDataForSyncContext(context, syncContext) {
    const metadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!metadata || !metadata.authToken) {
        throw new Error('not authorized');
    }
    return en_thrift_connector_1.decodeAuthData(metadata.authToken);
}
async function fetchAndCacheWorkspaceDirectory(thriftComm, context, userID, params) {
    var _a, _b;
    conduit_core_1.validateDB(context);
    const personalAuth = await getAuthDataForSyncContext(context, conduit_core_1.PERSONAL_USER_CONTEXT);
    const businessAuth = await getAuthDataForSyncContext(context, conduit_core_1.VAULT_USER_CONTEXT);
    const utilityStore = thriftComm.getUtilityStore(businessAuth.urls.utilityUrl);
    const spec = new en_thrift_connector_1.TWorkspaceResponseSpec({
        includeMemberships: true,
        includeWorkspaceRestrictions: true,
        includeAccessInfo: true,
        includeDiscoverableWorkspaces: true,
        includeAggregations: true,
        includeOpenWorkspaces: true,
    });
    const filter = {
        includeWorkspacesWithoutMembership: true,
        sorting: convertSortToService(((_a = params.sorts) === null || _a === void 0 ? void 0 : _a.length) ? params.sorts[0] : undefined),
        limit: params.limit,
        includedWorkspaceGuids: (_b = params.includedWorkspaceGuids) === null || _b === void 0 ? void 0 : _b.map(e => en_thrift_connector_1.convertGuidToService(e, en_data_model_1.CoreEntityTypes.Workspace)),
    };
    const result = await utilityStore.listWorkspacesWithResultSpec(context.trc, businessAuth.token, spec, filter);
    const workspaces = result.map(e => {
        const workspace = en_thrift_connector_1.workspaceFromService(e);
        const memberships = (e.memberships || []).map(membership => {
            return en_thrift_connector_1.membershipFromWorkspace(membership, workspace, personalAuth.userID, businessAuth.userID);
        });
        for (const membership of memberships) {
            context.db.prefillNodeFetch(context, membership);
            conduit_storage_1.addOutputEdgeToNode(workspace, 'memberships', {
                id: membership.id,
                type: en_data_model_1.CoreEntityTypes.Membership,
                port: null,
            });
        }
        if (e.workspace && e.workspace.contactId) {
            conduit_storage_1.addOutputEdgeToNode(workspace, 'manager', {
                id: en_thrift_connector_1.convertGuidFromService(e.workspace.contactId, en_data_model_1.CoreEntityTypes.Profile, en_data_model_1.PROFILE_SOURCE.User),
                type: en_data_model_1.CoreEntityTypes.Profile,
                port: null,
            });
        }
        return workspace;
    });
    const resolvedWorkspaces = await conduit_utils_1.allSettled(workspaces.map(e => conduit_core_1.resolveNode(e, context)));
    gWorkspaceListResult[userID] = {
        serviceParams: params,
        workspaces: resolvedWorkspaces,
    };
}
function filterWorkspaces(workspaces, filters) {
    if (!filters.length) {
        return workspaces;
    }
    const labelFilterIdx = filters.findIndex(e => e.field === 'label');
    const descriptionFilterIdx = filters.findIndex(e => e.field === 'description');
    return workspaces.filter(e => {
        return labelFilterIdx >= 0 && (filters[labelFilterIdx].search === '' || e.label.search(new RegExp(filters[labelFilterIdx].search, 'i')) !== -1) ||
            descriptionFilterIdx >= 0 && (filters[descriptionFilterIdx].search === '' || e.description.search(new RegExp(filters[descriptionFilterIdx].search, 'i')) !== -1);
    });
}
function checkIfParamsChanged(userID, params) {
    return !gWorkspaceListResult[userID] || !conduit_utils_1.isEqual(gWorkspaceListResult[userID].serviceParams, params);
}
async function getList(thriftComm, context, filters, params) {
    const limit = params.limit;
    const serviceParams = {
        limit: !filters.length ? limit : undefined,
        includedWorkspaceGuids: params.includedWorkspaceGuids,
        sorts: params.sorts,
    };
    const userID = await context.multiUserProvider.getCurrentUserID(context.trc, context.watcher);
    if (!userID) {
        throw new Error(`Not authorized`);
    }
    if (gWorkspaceListFetch.hasOwnProperty(userID) &&
        (gWorkspaceListFetch[userID].promise || gWorkspaceListFetch[userID].lastFetch < Date.now() - WORKSPACE_DIRECTORY_FETCH_INTERVAL)) {
        if (!gWorkspaceListFetch[userID].promise || checkIfParamsChanged(userID, serviceParams)) {
            gWorkspaceListFetch[userID].promise = fetchAndCacheWorkspaceDirectory(thriftComm, context, userID, serviceParams);
        }
        await gWorkspaceListFetch[userID].promise;
        gWorkspaceListFetch[userID].lastFetch = Date.now();
        gWorkspaceListFetch[userID].promise = null;
    }
    else {
        const fetch = {
            lastFetch: -1,
            promise: fetchAndCacheWorkspaceDirectory(thriftComm, context, userID, serviceParams),
        };
        gWorkspaceListFetch[userID] = fetch;
        await gWorkspaceListFetch[userID].promise;
        gWorkspaceListFetch[userID].lastFetch = Date.now();
        gWorkspaceListFetch[userID].promise = null;
    }
    if (!gWorkspaceListResult.hasOwnProperty(userID)) {
        throw new Error(`Unable to fetch workspace list`);
    }
    const filteredWorkspaces = filterWorkspaces(gWorkspaceListResult[userID].workspaces, filters);
    return limit && filters.length ? filteredWorkspaces.slice(0, limit) : filteredWorkspaces;
}
function workspaceDirectoryPlugin(thriftComm) {
    async function resolveWorkspaceDirectory(parent, args, context) {
        conduit_core_1.validateDB(context);
        const filters = (args === null || args === void 0 ? void 0 : args.filters) || [];
        let sorts = args === null || args === void 0 ? void 0 : args.sorts;
        const limit = args === null || args === void 0 ? void 0 : args.limit;
        const includedWorkspaceGuids = args === null || args === void 0 ? void 0 : args.includedWorkspaceGuids;
        const accessSortIdx = (sorts || []).findIndex(e => e.field === 'accessStatus');
        let accessSort;
        if (accessSortIdx >= 0) {
            // Remove the non-service sort
            accessSort = sorts.splice(accessSortIdx, 1)[0];
        }
        const params = {
            limit,
            includedWorkspaceGuids,
            sorts,
        };
        const list = await getList(thriftComm, context, filters, params);
        if (!sorts) {
            sorts = [];
        }
        if (accessSort || (sorts && sorts.length > 1)) {
            // If multiple sorts were passed we need to sort the server returned results
            // because the server can only handle one sort at a time
            if (accessSort) {
                // Add the non-service sort back to the sorts
                sorts.splice(accessSortIdx, 0, accessSort);
            }
            return context.indexer.sort(en_data_model_1.CoreEntityTypes.Workspace, list, sorts);
        }
        else {
            return list;
        }
    }
    return (autoResolverData) => {
        return {
            type: new graphql_1.GraphQLList(autoResolverData.NodeGraphQLTypes.Workspace),
            args: buildArgs(),
            resolve: resolveWorkspaceDirectory,
        };
    };
}
exports.workspaceDirectoryPlugin = workspaceDirectoryPlugin;
//# sourceMappingURL=WorkspaceDirectory.js.map