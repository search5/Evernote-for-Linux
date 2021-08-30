"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkspacePreferences = exports.asyncFetchandCacheWsPreferences = exports.getWsPreferencesLastFetch = void 0;
const conduit_auth_shared_1 = require("conduit-auth-shared");
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters/Converters");
// map of last fetch details for ws. Used to prevent multiple service calls
// when clients query for ws preferences cache fields across ws and notebook.
const wsPrefFetch = {};
const gBatchFetchTrc = conduit_utils_1.createTraceContext('WorkspaceUIFetch');
const logger = conduit_utils_1.createLogger('conduit:workspaceUiPreferencesResolver');
const WS_PREFERENCES_FETCH_INTERVAL = 15000;
function getWsPreferencesLastFetch(wsId) {
    return wsPrefFetch[wsId] ? wsPrefFetch[wsId].lastFetch : null;
}
exports.getWsPreferencesLastFetch = getWsPreferencesLastFetch;
function mergeNotebookPreferences(nbColor, noteOrder) {
    const res = {};
    for (const key in nbColor) {
        const nbId = Converters_1.convertGuidFromService(key, en_core_entity_types_1.CoreEntityTypes.Notebook);
        res[nbId] = { color: nbColor[nbId] };
    }
    for (const key in noteOrder) {
        const nbId = Converters_1.convertGuidFromService(key, en_core_entity_types_1.CoreEntityTypes.Notebook);
        const val = { noteOrder: noteOrder[key].map(guid => Converters_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Note)) };
        res[nbId] = res[nbId] ? Object.assign(Object.assign({}, res[nbId]), val) : val;
    }
    return res;
}
async function cacheNotebookPreferences(trc, graphTransaction, nbPreferences, backingNbToWs) {
    const res = {
        noteOrderMap: {},
    };
    for (const nbId in nbPreferences) {
        const pref = nbPreferences[nbId];
        if (backingNbToWs[nbId]) {
            // backing nb entry. Add to ws cache fields.
            if (pref.noteOrder) {
                res.noteOrderMap[backingNbToWs[nbId]] = pref.noteOrder;
            }
            continue;
        }
        const nbRef = { id: nbId, type: en_core_entity_types_1.CoreEntityTypes.Notebook };
        const nbNode = await graphTransaction.getNode(trc, null, nbRef);
        if (!nbNode) {
            throw new conduit_utils_1.NotFoundError(nbId, 'notebook not found in graph');
        }
        if (pref.color) {
            await graphTransaction.setNodeCachedField(trc, nbRef, 'displayColor', pref.color, {});
        }
        if (pref.noteOrder) {
            res.noteOrderMap[nbId] = pref.noteOrder;
            await graphTransaction.setNodeCachedField(trc, nbRef, 'noteDisplayOrder', pref.noteOrder, {});
        }
    }
    return res;
}
async function asyncFetchandCacheWsPreferences(trc, db, activeTransaction, thriftComm, wsNode, syncContext) {
    const metadata = activeTransaction ?
        await activeTransaction.getSyncContextMetadata(trc, null, syncContext) :
        await (db === null || db === void 0 ? void 0 : db.getSyncContextMetadataWithoutGraphQLContext(trc, syncContext));
    if (!metadata || !metadata.authToken) {
        throw new Error('not authorized');
    }
    const backingNbToWs = await conduit_core_1.getSyncState(db || activeTransaction, trc, null, ['workspaces', 'backingNbToWs']);
    if (!backingNbToWs) {
        throw new conduit_utils_1.NotFoundError(wsNode.id, 'Workspace to backing nb mapping not found in sync state');
    }
    const auth = conduit_auth_shared_1.decodeAuthData(metadata.authToken);
    const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const resp = await noteStore.getWorkspaceUserInterfaceProperties(trc, auth.token, {
        workspaceGuid: Converters_1.convertGuidToService(wsNode.id, en_core_entity_types_1.CoreEntityTypes.Workspace),
        updateVersion: 0,
    });
    const nbPrefs = mergeNotebookPreferences(resp.notebookColor || {}, resp.noteDisplayOrder || {});
    await conduit_core_1.runInTransaction(trc, db, 'cacheWorkspacePreferences', activeTransaction, async (tx) => {
        const layoutStyle = resp.layoutStyle === 1 ? en_core_entity_types_1.WorkspaceLayoutStyle.BOARD : en_core_entity_types_1.WorkspaceLayoutStyle.LIST;
        const { noteOrderMap } = await cacheNotebookPreferences(trc, tx, nbPrefs, backingNbToWs);
        const wsRef = { id: wsNode.id, type: en_core_entity_types_1.CoreEntityTypes.Workspace };
        const notebookDisplayOrder = resp.notebookDisplayOrder ? resp.notebookDisplayOrder.map(guid => {
            // nb display order contains guid of ws backing nb. Converting that to ws ID when returning to clients.
            const nbGuid = Converters_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Notebook);
            return backingNbToWs[nbGuid] ? backingNbToWs[nbGuid] : nbGuid;
        }) : [];
        await tx.setNodeCachedField(trc, wsRef, 'layoutStyle', layoutStyle, {});
        await tx.setNodeCachedField(trc, wsRef, 'notebookDisplayOrder', notebookDisplayOrder, {});
        await tx.setNodeCachedField(trc, wsRef, 'noteDisplayOrder', noteOrderMap[wsNode.id], {});
    });
}
exports.asyncFetchandCacheWsPreferences = asyncFetchandCacheWsPreferences;
async function resolveWorkspacePreferences(context, nodeID, nodeType, field) {
    conduit_core_1.validateDB(context);
    const nodeRef = { id: nodeID, type: nodeType };
    const nodeInContext = await context.db.getNodeWithContext(context, nodeRef);
    if (!nodeInContext || !nodeInContext.node) {
        throw new conduit_utils_1.NotFoundError(nodeID, 'graph node not found');
    }
    // ws preferences needs to be polled from service when it's watched for this data to be up to date.
    context.watcher && context.watcher.triggerAfterTime(WS_PREFERENCES_FETCH_INTERVAL);
    const { node, syncContext } = nodeInContext;
    let wsNode;
    if (nodeType === en_core_entity_types_1.CoreEntityTypes.Notebook) {
        const parentEdge = conduit_utils_1.firstStashEntry(node.inputs.parent);
        if (!parentEdge) {
            logger.debug(`Workspace edge not found for notebook ${node.id}`);
            return null;
        }
        const wsID = conduit_storage_1.getEdgeConnection(parentEdge, node.id).id;
        wsNode = await context.db.getSyncedNode(context.trc, context.watcher, { id: wsID, type: en_core_entity_types_1.CoreEntityTypes.Workspace });
        if (!wsNode) {
            logger.warn(`Workspace node not found for notebook ${node.id}`);
            return null;
        }
    }
    else {
        wsNode = node;
    }
    let cacheResp = await context.db.getNodeCachedField(context, nodeRef, field);
    try {
        if (wsPrefFetch[wsNode.id] && wsPrefFetch[wsNode.id].inProgress && wsPrefFetch[wsNode.id].fetchPromise) {
            // preferences fetch for this ws in progress. Await response.
            await wsPrefFetch[wsNode.id].fetchPromise;
            // refetch from the graph so the overlay is applied
            context.db.clearNodeFetchCache(context, nodeRef);
            cacheResp = await context.db.getNodeCachedField(context, nodeRef, field);
        }
        else if (!cacheResp || !wsPrefFetch[wsNode.id] ||
            (wsPrefFetch[wsNode.id] && wsPrefFetch[wsNode.id].lastFetch + WS_PREFERENCES_FETCH_INTERVAL < Date.now())) {
            // entry not found in cache or fetch interval elapsed from last fetch. Wait for another fetch.
            const fetchPromise = asyncFetchandCacheWsPreferences(gBatchFetchTrc, context.db, null, context.comm, wsNode, syncContext);
            wsPrefFetch[wsNode.id] = {
                fetchPromise,
                inProgress: true,
                lastFetch: wsPrefFetch[wsNode.id] && wsPrefFetch[wsNode.id].lastFetch || 0,
            };
            await fetchPromise;
            wsPrefFetch[wsNode.id] = { fetchPromise: null, inProgress: false, lastFetch: Date.now() };
            // refetch from the graph so the overlay is applied
            context.db.clearNodeFetchCache(context, nodeRef);
            cacheResp = await context.db.getNodeCachedField(context, nodeRef, field);
        }
    }
    catch (err) {
        // return stale response from cache if preferences fetch failed.
        let lastFetchOffset = 0;
        if (err instanceof conduit_utils_1.RetryError) {
            // make sure we retry next time it is requested
            lastFetchOffset = WS_PREFERENCES_FETCH_INTERVAL;
        }
        else if (err instanceof conduit_utils_1.ServiceError && err.errorType === 'EDAMNotFoundException' && err.errorKey === 'Workspace.guid') {
            // workspace not upsynced yet
        }
        else {
            // only log if it is a legit error; being offline should not log
            logger.error(`Failed to fetch ws preferences ${wsNode.id} `, err);
        }
        wsPrefFetch[wsNode.id] = {
            fetchPromise: null,
            inProgress: false,
            lastFetch: wsPrefFetch[wsNode.id].lastFetch - lastFetchOffset,
        };
    }
    if (field === 'layoutStyle' && !cacheResp) {
        return en_core_entity_types_1.WorkspaceLayoutStyle.LIST;
    }
    return cacheResp;
}
exports.resolveWorkspacePreferences = resolveWorkspacePreferences;
//# sourceMappingURL=WorkspaceUIPreferences.js.map