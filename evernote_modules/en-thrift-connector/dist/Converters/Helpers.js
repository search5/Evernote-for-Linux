"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserConnection = exports.ensureIsExternal = exports.makeConverterParams = exports.getAuthAndSyncContextForNode = exports.getAuthForSyncContext = exports.processEdgeModifications = exports.convertHashFromService = exports.stripUndefined = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("../Auth");
const Helpers_1 = require("../Helpers");
const Converters_1 = require("./Converters");
const NotebookConverter_1 = require("./NotebookConverter");
function stripUndefined(val) {
    return val === undefined ? null : val;
}
exports.stripUndefined = stripUndefined;
function convertHashFromService(hash) {
    if (typeof hash === 'string') {
        return hash;
    }
    if (hash instanceof Uint8Array || Array.isArray(hash)) {
        const str = [];
        for (const v of hash) {
            let tmp = v.toString(16);
            if (tmp.length === 1) {
                tmp = `0${tmp}`;
            }
            str.push(tmp);
        }
        return str.join('');
    }
    if (hash && typeof hash === 'object') {
        const str = [];
        for (const key in hash) {
            const idx = Number(key);
            let tmp = hash[key].toString(16);
            if (tmp.length === 1) {
                tmp = `0${tmp}`;
            }
            str[idx] = tmp;
        }
        return str.join('');
    }
    return null;
}
exports.convertHashFromService = convertHashFromService;
function getEdgeOwner(edge, nodeTypes) {
    const srcType = edge.srcType && nodeTypes[edge.srcType];
    if (srcType && edge.srcPort && srcType.edges && srcType.edges[edge.srcPort]) {
        return edge.srcID;
    }
    const dstType = edge.dstType && nodeTypes[edge.dstType];
    if (dstType && edge.dstPort && dstType.edges && dstType.edges[edge.dstPort]) {
        return edge.dstID;
    }
    if (!srcType) {
        return edge.srcID;
    }
    if (!dstType) {
        return edge.dstID;
    }
    return null;
}
function processEdgeModifications(edgesToDelete, edgesToCreate, nodeTypes) {
    const nodesModified = {};
    function addEdgeCreate(nodeID, nodeType, edge) {
        nodesModified[nodeID] = nodesModified[nodeID] || { type: nodeType, changes: {}, edgesToCreate: [], edgesToDelete: [] };
        const { fullPort } = conduit_storage_1.getEdgeConnection(edge, nodeID);
        if (!fullPort) {
            return;
        }
        nodesModified[nodeID].changes[fullPort] = nodesModified[nodeID].changes[fullPort] || { deletes: [], creates: [] };
        nodesModified[nodeID].changes[fullPort].creates.push(edge);
        nodesModified[nodeID].edgesToCreate.push(edge);
    }
    function addEdgeDelete(nodeID, nodeType, port, dstID, isOutput, edgeFilter) {
        if (!port) {
            return;
        }
        const fullPort = (isOutput ? 'outputs:' : 'inputs:') + port;
        nodesModified[nodeID] = nodesModified[nodeID] || { type: nodeType, changes: {}, edgesToCreate: [], edgesToDelete: [] };
        nodesModified[nodeID].changes[fullPort] = nodesModified[nodeID].changes[fullPort] || { deletes: [], creates: [] };
        nodesModified[nodeID].changes[fullPort].deletes.push(dstID);
        nodesModified[nodeID].edgesToDelete.push(edgeFilter);
    }
    for (const edge of edgesToDelete) {
        const edgeOwner = getEdgeOwner(edge, nodeTypes);
        if (edge.hasOwnProperty('srcID') && edge.hasOwnProperty('dstID')) {
            const fEdge = edge;
            if (edgeOwner === fEdge.srcID) {
                addEdgeDelete(fEdge.srcID, fEdge.srcType, fEdge.srcPort, fEdge.dstID, true, edge);
            }
            if (edgeOwner === fEdge.dstID) {
                addEdgeDelete(fEdge.dstID, fEdge.dstType, fEdge.dstPort, fEdge.srcID, false, edge);
            }
        }
        else if (edge.hasOwnProperty('srcID')) {
            const pEdge = edge;
            if (edgeOwner === pEdge.srcID) {
                addEdgeDelete(pEdge.srcID, pEdge.srcType, pEdge.srcPort, null, true, edge);
            }
        }
        else {
            const pEdge = edge;
            if (edgeOwner === pEdge.dstID) {
                addEdgeDelete(pEdge.dstID, pEdge.dstType, pEdge.dstPort, null, false, edge);
            }
        }
    }
    for (const edge of edgesToCreate) {
        const edgeOwner = getEdgeOwner(edge, nodeTypes);
        if (edgeOwner === edge.srcID) {
            addEdgeCreate(edge.srcID, edge.srcType, edge);
        }
        if (edgeOwner === edge.dstID) {
            addEdgeCreate(edge.dstID, edge.dstType, edge);
        }
    }
    return nodesModified;
}
exports.processEdgeModifications = processEdgeModifications;
async function getAuthForSyncContext(trc, graphStorage, authCache, syncContext) {
    if (!authCache[syncContext]) {
        authCache[syncContext] = await Auth_1.getAuthFromSyncContext(trc, graphStorage, syncContext);
    }
    return authCache[syncContext];
}
exports.getAuthForSyncContext = getAuthForSyncContext;
async function getAuthAndSyncContextForNode(trc, graphStorage, authCache, node) {
    const syncContext = await Helpers_1.getBestSyncContextForNode(trc, node, null, graphStorage);
    const auth = await getAuthForSyncContext(trc, graphStorage, authCache, syncContext);
    return { auth, syncContext };
}
exports.getAuthAndSyncContextForNode = getAuthAndSyncContextForNode;
async function makeConverterParams(args) {
    const { graphTransaction, trc, personalUserId } = args;
    const profileID = Converters_1.convertGuidFromService(personalUserId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
    const personalProfile = await graphTransaction.getNode(trc, null, { id: profileID, type: en_core_entity_types_1.CoreEntityTypes.Profile });
    let offlineNbs;
    if (args.offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.SELECTIVE) {
        // offlineNbs is stored in local settings if content strategy is SELECTIVE
        offlineNbs = await NotebookConverter_1.getOfflineNbsFromLocalSettings(trc, args.localSettings, personalUserId);
    }
    return {
        graphTransaction,
        authCache: args.authCache || {},
        personalUserId,
        vaultUserId: args.vaultUserId,
        personalProfile,
        backingNbToWs: (await graphTransaction.getSyncState(trc, null, ['workspaces', 'backingNbToWs']) || {}),
        nbsMarkedOffline: offlineNbs,
        localSettings: args.localSettings,
        offlineContentStrategy: args.offlineContentStrategy,
    };
}
exports.makeConverterParams = makeConverterParams;
async function ensureIsExternal(trc, params, syncContext, item) {
    // handle case where the notebook is shared and in a workspace (multi-sync context).
    // Make sure if isExternal is set, it stays true.
    if (!item.NodeFields.isExternal) {
        const prev = await params.graphTransaction.getNode(trc, null, item);
        // if we have a previous node and it's in the process of being updated (node does not have the current sync context)
        if (prev && !prev.syncContexts.includes(syncContext)) {
            if (en_core_entity_types_1.isExternalSyncContext(prev.syncContexts[0])) {
                item.NodeFields.isExternal = true;
            }
        }
    }
}
exports.ensureIsExternal = ensureIsExternal;
async function checkUserConnection(trc, params, contact) {
    if (contact.type !== en_conduit_sync_types_1.TContactType.EVERNOTE) {
        throw Error(`${contact.id}: Contact must be an Evernote User`);
    }
    if (contact.id === null || contact.id === undefined) {
        throw Error('Contact must have User ID');
    }
    const profile = await params.graphTransaction.getNode(trc, null, { id: Converters_1.convertGuidFromService(contact.id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User), type: en_core_entity_types_1.CoreEntityTypes.Profile });
    if (!profile) {
        throw new Error(`Profile does not exist for user id ${contact.id}`);
    }
    if (profile.NodeFields.isSameBusiness) {
        return true; // accounts in a same business are always connected.
    }
    const idns = Object.keys(profile.outputs.relatedIdentities).map(idn => Number(Converters_1.convertGuidToService(profile.outputs.relatedIdentities[idn].dstID, en_core_entity_types_1.CoreEntityTypes.Profile)));
    if (idns.length === 0) {
        return false; // no way to check connections without identity ids.
    }
    const utilityStore = params.thriftComm.getUtilityStore(params.personalAuth.urls.utilityUrl);
    let connected = false;
    const chunkedArray = conduit_utils_1.chunkArray(idns, en_conduit_sync_types_1.EDAM_CONNECTED_IDENTITY_REQUEST_MAX);
    for (const chunk of chunkedArray) {
        if (chunk.length === 0) {
            continue;
        }
        const validIdns = await utilityStore.getConnectedIdentities(trc, params.personalAuth.token, chunk);
        connected = Object.keys(validIdns).length > 0;
        if (connected) {
            break;
        }
    }
    return connected;
}
exports.checkUserConnection = checkUserConnection;
//# sourceMappingURL=Helpers.js.map