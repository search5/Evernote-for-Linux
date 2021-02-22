"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interruptible = exports.updateSyncType = exports.updateSyncProgressType = exports.clearSyncProgress = exports.updateSyncRate = exports.checkIfSyncAvailable = exports.getLocalSyncState = exports.hasRemoteValueChanged = exports.getConverterParamsFromSyncParams = exports.updateSyncContextPrivilegeImpl = exports.updateSyncContextPrivilege = exports.getInitialSnippetsToFetch = exports.updateInitialSnippetsToFetch = exports.MAX_INITIAL_SNIPPETS_TO_FETCH = exports.EmptySyncStateWithTurbo = exports.EmptySyncState = exports.TURBO_SYNC_DEFAULTS = exports.SYNC_TYPE_SYNC_STATE_PATH = exports.NOTES_SYNC_STATE_PATH = exports.POLL_JITTER = exports.RETRY_TIMEOUT = exports.MIN_POLL_INTERVAL = exports.DEFAULT_POLL_INTERVAL = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_data_model_1 = require("en-data-model");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Helpers_1 = require("../Converters/Helpers");
const SyncActivity_1 = require("../SyncManagement/SyncActivity");
const ThriftTypes_1 = require("../ThriftTypes");
exports.DEFAULT_POLL_INTERVAL = 30000;
exports.MIN_POLL_INTERVAL = 5000;
exports.RETRY_TIMEOUT = 10000;
exports.POLL_JITTER = 0.25;
exports.NOTES_SYNC_STATE_PATH = 'backgroundNotes';
exports.SYNC_TYPE_SYNC_STATE_PATH = ['SyncType'];
exports.TURBO_SYNC_DEFAULTS = {
    NOTE_EDIT_BUFFER: 6 * 1000,
    NOTE_IDLE_BUFFER: 3 * 1000,
};
exports.EmptySyncState = SimplyImmutable.deepFreeze({
    lastUpdateCount: 0,
    syncInterval: exports.DEFAULT_POLL_INTERVAL,
});
exports.EmptySyncStateWithTurbo = SimplyImmutable.deepFreeze(Object.assign(Object.assign({}, exports.EmptySyncState), { turboSyncNoteIdleUpdateBuffer: exports.TURBO_SYNC_DEFAULTS.NOTE_IDLE_BUFFER, turboSyncNoteEditUpdateBuffer: exports.TURBO_SYNC_DEFAULTS.NOTE_EDIT_BUFFER }));
exports.MAX_INITIAL_SNIPPETS_TO_FETCH = 2 * ThriftTypes_1.EDAM_SNIPPETS_NOTES_MAX;
function getSnippetsFetchSyncStatePath(syncContext) {
    return [syncContext, 'snippetsFetch'];
}
async function updateInitialSnippetsToFetch(trc, params, guids) {
    const syncState = await getInitialSnippetsToFetch(trc, params);
    const initialSnippetsToFetch = new Set(syncState.noteGuids);
    let shouldUpdateState = false;
    for (const guid of guids) {
        if (initialSnippetsToFetch.size >= exports.MAX_INITIAL_SNIPPETS_TO_FETCH) {
            break;
        }
        shouldUpdateState = true;
        initialSnippetsToFetch.add(guid);
    }
    if (shouldUpdateState) {
        await params.syncEngine.transact(trc, 'updateSnippetsSyncState', async (tx) => {
            await tx.replaceSyncState(trc, getSnippetsFetchSyncStatePath(params.syncContext), { noteGuids: [...initialSnippetsToFetch] });
        });
    }
}
exports.updateInitialSnippetsToFetch = updateInitialSnippetsToFetch;
async function getInitialSnippetsToFetch(trc, params) {
    const syncState = await params.syncEngine.graphStorage.getSyncState(trc, null, getSnippetsFetchSyncStatePath(params.syncContext));
    return syncState ? SimplyImmutable.cloneMutable(syncState) : { noteGuids: [] };
}
exports.getInitialSnippetsToFetch = getInitialSnippetsToFetch;
// loop through own memberships of shared notebook/note and find best privilege for sync context
// which will be used in getBestSyncContextForNode to determine best sync context for node.
async function updateSyncContextPrivilege(trc, params, nodeRef, isValidMembership) {
    const graphStorage = params.syncEngine.graphStorage;
    const membershipProvider = async () => {
        const ownMemberships = await graphStorage.queryGraph(trc, null, en_data_model_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', { parent: nodeRef });
        return await graphStorage.batchGetNodes(trc, null, en_data_model_1.CoreEntityTypes.Membership, ownMemberships.map(idx => idx.id)) || [];
    };
    const transactionProvider = async (debugName, func) => {
        await params.syncEngine.transact(trc, debugName, func);
    };
    await updateSyncContextPrivilegeImpl(trc, nodeRef, params.syncContext, membershipProvider, transactionProvider, isValidMembership);
}
exports.updateSyncContextPrivilege = updateSyncContextPrivilege;
async function updateSyncContextPrivilegeImpl(trc, nodeRef, syncContext, membershipsProvider, transactionProvider, isValidMembership) {
    const memberships = await membershipsProvider();
    let privilege = en_data_model_1.MembershipPrivilege.READ;
    for (const membership of memberships) {
        if (!membership) {
            continue;
        }
        if (isValidMembership(membership)) {
            privilege = en_data_model_1.highestPrivilege(privilege, membership.NodeFields.privilege);
            if (privilege === en_data_model_1.MembershipPrivilege.MANAGE) {
                break;
            }
        }
    }
    await transactionProvider('updateSyncContext', async (graphTransaction) => {
        await graphTransaction.updateSyncContextMetadata(trc, syncContext, {
            privilege,
        });
    });
}
exports.updateSyncContextPrivilegeImpl = updateSyncContextPrivilegeImpl;
async function getConverterParamsFromSyncParams(trc, graphTransaction, params) {
    return await Helpers_1.makeConverterParams({
        trc,
        graphTransaction,
        personalUserId: params.personalUserID,
        vaultUserId: params.vaultUserID,
        localSettings: params.localSettings,
        offlineContentStrategy: params.offlineContentStrategy,
    });
}
exports.getConverterParamsFromSyncParams = getConverterParamsFromSyncParams;
function hasRemoteValueChanged(remoteVal, localVal, cmp = 'NEQ') {
    if (remoteVal === null || remoteVal === undefined) {
        // no new value to use
        return false;
    }
    else if (localVal === null || localVal === undefined) {
        // no old value to compare against
        return true;
    }
    switch (cmp) {
        case 'NEQ':
            return remoteVal !== localVal;
        case 'GT':
            return remoteVal > localVal;
    }
}
exports.hasRemoteValueChanged = hasRemoteValueChanged;
async function getLocalSyncState(trc, params, emptySyncState, graphTransaction) {
    const syncStatePath = params.syncStatePath;
    if (!syncStatePath) {
        return emptySyncState;
    }
    let syncState = await (graphTransaction || params.syncEngine.graphStorage).getSyncState(trc, null, syncStatePath);
    if (!syncState) {
        syncState = emptySyncState;
        await params.syncEngine.transact(trc, 'initSyncState', async (tx) => {
            await tx.replaceSyncState(trc, syncStatePath, emptySyncState);
        }, graphTransaction);
    }
    return syncState;
}
exports.getLocalSyncState = getLocalSyncState;
async function checkIfSyncAvailable(trc, params, emptySyncState, remoteUpdateCount) {
    const localSyncState = await getLocalSyncState(trc, params, emptySyncState);
    const localUpdateCount = localSyncState.lastUpdateCount;
    return Boolean(typeof remoteUpdateCount === 'number' && localUpdateCount !== remoteUpdateCount);
}
exports.checkIfSyncAvailable = checkIfSyncAvailable;
async function updateSyncRate(trc, params, syncRate, localSyncState) {
    const localSyncStateDiff = {};
    const metadataDiff = {};
    let hasChanges = false;
    if (hasRemoteValueChanged(syncRate.syncStateIntervalMillis, localSyncState.syncInterval)) {
        localSyncStateDiff.syncInterval = syncRate.syncStateIntervalMillis;
        hasChanges = true;
    }
    if (hasRemoteValueChanged(syncRate.updateNoteWhenIdleForMillis, localSyncState.turboSyncNoteIdleUpdateBuffer)) {
        localSyncStateDiff.turboSyncNoteIdleUpdateBuffer = syncRate.updateNoteWhenIdleForMillis;
        metadataDiff.turboSyncNoteIdleUpdateBuffer = syncRate.updateNoteWhenIdleForMillis;
        hasChanges = true;
    }
    if (hasRemoteValueChanged(syncRate.updateNoteDuringEditIntervalMillis, localSyncState.turboSyncNoteEditUpdateBuffer)) {
        localSyncStateDiff.turboSyncNoteEditUpdateBuffer = syncRate.updateNoteDuringEditIntervalMillis;
        metadataDiff.turboSyncNoteEditUpdateBuffer = syncRate.updateNoteDuringEditIntervalMillis;
        hasChanges = true;
    }
    const syncStatePath = params.syncStatePath;
    if (!hasChanges || !syncStatePath) {
        return;
    }
    await params.syncEngine.transact(trc, 'updateTurboSyncValues', async (tx) => {
        await tx.updateSyncState(trc, syncStatePath, localSyncStateDiff);
        await tx.updateSyncContextMetadata(trc, params.syncContext, metadataDiff);
    });
}
exports.updateSyncRate = updateSyncRate;
async function clearSyncProgress(trc, syncEngine) {
    // clear initial downsync progress keys for correct progressPercent calculation after initial downsync
    await syncEngine.transactEphemeral(trc, 'clearInitialSyncProgressTable', async (tx) => {
        await tx.clearTable(trc, SyncActivity_1.INITIAL_DOWNSYNC_PROGRESS_TABLE);
    });
    // set syncProgressType to none
    await updateSyncProgressType(trc, syncEngine, conduit_view_types_1.SyncProgressType.NONE);
}
exports.clearSyncProgress = clearSyncProgress;
async function updateSyncProgressType(trc, syncEngine, syncProgressType, tx) {
    await updateSyncType(trc, syncEngine, { syncProgressType }, tx);
}
exports.updateSyncProgressType = updateSyncProgressType;
async function updateSyncType(trc, syncEngine, syncType, tx) {
    await syncEngine.transact(trc, 'updateSyncType', async (graphTransaction) => {
        await graphTransaction.updateSyncState(trc, exports.SYNC_TYPE_SYNC_STATE_PATH, syncType);
    }, tx);
}
exports.updateSyncType = updateSyncType;
async function pollYieldCheck(params, doneCheck) {
    while (!doneCheck.hasOwnProperty('res')) {
        await (params.yieldCheck || conduit_utils_1.sleep(500));
    }
    return doneCheck.res;
}
async function interruptible(params, p) {
    // has to be in a wrapper object so it can be updated and checked in pollYieldCheck
    const doneCheck = {};
    const res = await conduit_utils_1.withError(Promise.race([p, pollYieldCheck(params, doneCheck)]));
    doneCheck.res = res.data;
    await params.yieldCheck;
    return conduit_utils_1.unwrapErrOrData(res);
}
exports.interruptible = interruptible;
//# sourceMappingURL=SyncHelpers.js.map