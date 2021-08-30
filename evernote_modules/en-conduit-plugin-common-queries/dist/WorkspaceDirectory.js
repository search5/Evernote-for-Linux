"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceDirectoryPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
const gWorkspaceListData = {};
const WORKSPACE_DIRECTORY_FETCH_INTERVAL = 15000;
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
async function fetchWorkspaceDirectory(thriftComm, context, userID, params) {
    var _a, _b;
    conduit_core_1.validateDB(context);
    const personalAuth = await getAuthDataForSyncContext(context, conduit_core_1.PERSONAL_USER_CONTEXT);
    const businessAuth = await getAuthDataForSyncContext(context, conduit_core_1.VAULT_USER_CONTEXT);
    const utilityStore = thriftComm.getUtilityStore(businessAuth.urls.utilityUrl);
    const spec = new en_conduit_sync_types_1.TWorkspaceResponseSpec({
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
        includedWorkspaceGuids: (_b = params.includedWorkspaceGuids) === null || _b === void 0 ? void 0 : _b.map(e => en_thrift_connector_1.convertGuidToService(e, en_core_entity_types_1.CoreEntityTypes.Workspace)),
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
                type: en_core_entity_types_1.CoreEntityTypes.Membership,
                port: null,
            });
        }
        if (e.workspace && e.workspace.contactId) {
            conduit_storage_1.addOutputEdgeToNode(workspace, 'manager', {
                id: en_thrift_connector_1.convertGuidFromService(e.workspace.contactId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
                type: en_core_entity_types_1.CoreEntityTypes.Profile,
                port: null,
            });
        }
        return workspace;
    });
    return await conduit_utils_1.allSettled(workspaces.map(e => conduit_core_1.resolveNode(e, context)));
}
function filterWorkspaces(workspaces, filters, limit) {
    if (!filters.length) {
        return workspaces; // without slice because workspaces already limited by including limit in thrift call.
    }
    const labelFilterIdx = filters.findIndex(e => e.field === 'label');
    const descriptionFilterIdx = filters.findIndex(e => e.field === 'description');
    const filteredWorkspaces = workspaces.filter(e => {
        return labelFilterIdx >= 0 && (filters[labelFilterIdx].search === '' || e.label.search(new RegExp(filters[labelFilterIdx].search, 'i')) !== -1) ||
            descriptionFilterIdx >= 0 && (filters[descriptionFilterIdx].search === '' || e.description.search(new RegExp(filters[descriptionFilterIdx].search, 'i')) !== -1);
    });
    return limit ? filteredWorkspaces.slice(0, limit) : filteredWorkspaces;
}
async function getList(thriftComm, context, filters, params) {
    const limit = params.limit;
    const serviceParams = {
        limit: !filters.length ? limit : undefined,
        includedWorkspaceGuids: params.includedWorkspaceGuids,
        sorts: params.sorts,
    };
    conduit_core_1.validateDB(context);
    const userID = await context.db.getCurrentUserID(context);
    if (conduit_utils_1.isNullish(userID)) {
        throw new Error(`Not authorized`);
    }
    try {
        const sameParams = gWorkspaceListData.hasOwnProperty(userID) && conduit_utils_1.isEqual(gWorkspaceListData[userID].serviceParams, params);
        const cacheStale = !gWorkspaceListData.hasOwnProperty(userID) // first request - no cache
            || gWorkspaceListData[userID].expiration < Date.now() // cache expired
            || !sameParams; // params changed
        const fetchInProgress = gWorkspaceListData.hasOwnProperty(userID) && gWorkspaceListData[userID].pendingPromise;
        if (!cacheStale && !fetchInProgress) {
            conduit_utils_1.traceTestCounts(context.trc, { 'WorkspaceDirectory.CacheHit': 1 });
            return filterWorkspaces(gWorkspaceListData[userID].workspaces, filters, limit);
        }
        if (fetchInProgress && sameParams) {
            // correct fetch is in progress
            const workspacesList = await gWorkspaceListData[userID].pendingPromise;
            conduit_utils_1.traceTestCounts(context.trc, { 'WorkspaceDirectory.CacheHit': 1 });
            return filterWorkspaces(workspacesList, filters, limit);
        }
        conduit_utils_1.traceTestCounts(context.trc, { 'WorkspaceDirectory.CacheMiss': 1 });
        const pendingPromise = fetchWorkspaceDirectory(thriftComm, context, userID, serviceParams);
        gWorkspaceListData[userID] = {
            pendingPromise,
            workspaces: [],
            serviceParams,
            expiration: Date.now() + WORKSPACE_DIRECTORY_FETCH_INTERVAL,
        };
        const workspaces = await pendingPromise;
        if (conduit_utils_1.isEqual(gWorkspaceListData[userID].serviceParams, params)) { // no other requests come after we've started await
            gWorkspaceListData[userID].workspaces = workspaces;
            gWorkspaceListData[userID].pendingPromise = null;
            gWorkspaceListData[userID].expiration = Date.now() + WORKSPACE_DIRECTORY_FETCH_INTERVAL;
        }
        return filterWorkspaces(workspaces, filters, limit);
    }
    catch (error) {
        if (gWorkspaceListData.hasOwnProperty(userID)) {
            if (conduit_utils_1.isEqual(gWorkspaceListData[userID].serviceParams, params)) { // no other requests come after we've started
                gWorkspaceListData[userID].pendingPromise = null;
                gWorkspaceListData[userID].expiration = -1; // to indicate that we need to refetch for sure
            }
        }
        throw error;
    }
}
async function resolveWorkspaceDirectory(parent, args, context) {
    conduit_core_1.validateDB(context);
    const filters = args.filters || [];
    let sorts = args.sorts;
    const limit = args.limit;
    const includedWorkspaceGuids = args.includedWorkspaceGuids;
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
    const list = await getList(context.comm, context, filters, params);
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
        return context.indexer.sort(en_core_entity_types_1.CoreEntityTypes.Workspace, list, sorts);
    }
    else {
        return list;
    }
}
const workspaceDirectoryPlugin = (autoResolverData) => {
    return {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(autoResolverData.NodeGraphQLTypes.Workspace)),
        args: conduit_core_1.schemaToGraphQLArgs({
            includedWorkspaceGuids: conduit_utils_1.NullableListOf('string'),
            limit: conduit_utils_1.NullableInt,
            filters: conduit_utils_1.NullableListOf(conduit_utils_1.Struct({
                field: conduit_utils_1.Enum(['label', 'description'], 'WorkspaceDirectoryFilterField'),
                search: 'string',
            }, 'WorkspaceDirectoryFilter')),
            sorts: conduit_utils_1.NullableListOf(conduit_utils_1.Struct({
                field: conduit_utils_1.Enum(['label', 'created', 'updated', 'memberCount', 'accessStatus'], 'WorkspaceDirectorySortField'),
                order: conduit_utils_1.Nullable(conduit_core_1.IndexOrderTypeSchema),
            }, 'WorkspaceDirectorySort')),
        }),
        resolve: resolveWorkspaceDirectory,
    };
};
exports.workspaceDirectoryPlugin = workspaceDirectoryPlugin;
//# sourceMappingURL=WorkspaceDirectory.js.map