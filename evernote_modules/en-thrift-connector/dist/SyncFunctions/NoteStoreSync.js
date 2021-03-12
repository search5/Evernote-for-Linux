"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.getTotalNotesInAccount = exports.syncNoteCount = exports.syncAllNotesMetadata = exports.syncCurrentNoteSnippets = exports.syncBootstrap = exports.syncNotesReverse = exports.syncBackgroundNotes = exports.currentBackgroundNoteSyncProgress = exports.checkNotesSyncAvailable = exports.syncCatchup = exports.syncForward = exports.NotesSyncProgressType = exports.EmptyNoteStoreSyncState = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const AccountLimitsConverter_1 = require("../Converters/AccountLimitsConverter");
const Converters_1 = require("../Converters/Converters");
const ProfileConverter_1 = require("../Converters/ProfileConverter");
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
let gBootstrapTags = conduit_utils_1.registerDebugSetting('BootstrapTags', true, v => gBootstrapTags = Boolean(v));
const MAX_ENTRIES = 255;
const MAX_NOTES_PER_METADATA_FETCH = 250; // service won't give us more than this
const gVaultFullSyncFilter = {
    includeSharedNotes: true,
    includePreferences: true,
    includeExpunged: true,
    includeNotes: true,
    includeNoteResources: true,
    includeNoteAttributes: true,
    includeNotebooks: true,
    includeWorkspaces: true,
    includeWorkspacesContent: true,
    includeLinkedNotebooks: true,
    includeTags: true,
};
const gPersonalFullSyncFilter = {
    includeSharedNotes: true,
    includePreferences: true,
    includeExpunged: true,
    includeNotes: true,
    includeNoteResources: true,
    includeNoteAttributes: true,
    includeNotebooks: true,
    includeLinkedNotebooks: true,
    includeSearches: true,
    includeTags: true,
};
const gVaultBootstrapSyncFilter = {
    includePreferences: true,
    includeExpunged: true,
    includeNotebooks: true,
    includeWorkspaces: true,
    includeWorkspacesContent: true,
    includeLinkedNotebooks: true,
    includeTags: true,
};
const gPersonalBootstrapSyncFilter = {
    includePreferences: true,
    includeExpunged: true,
    includeNotebooks: true,
    includeLinkedNotebooks: true,
    includeSearches: true,
    includeTags: true,
};
const gNotesSyncFilter = {
    includeNotes: true,
    includeNoteResources: true,
    includeNoteAttributes: true,
    // make sure shares are listed in the notes, so we can make Memberships
    includeSharedNotes: true,
    // include notes in workspaces
    includeWorkspacesContent: true,
};
const gCatchupSyncFilter = {
    includeNotes: true,
    includeNoteResources: true,
    includeNoteAttributes: true,
    includeNotebooks: true,
    // make sure shares are listed in the notes, so we can make Memberships
    includeSharedNotes: true,
    // include notes in workspaces
    includeWorkspacesContent: true,
};
exports.EmptyNoteStoreSyncState = SimplyImmutable.deepFreeze(Object.assign(Object.assign({}, SyncHelpers_1.EmptySyncStateWithTurbo), { userLastUpdated: null, businessUsersUpdateCount: null, showChoiceScreen: null, currentDevicesUsed: null, uploaded: null }));
var NotesSyncProgressType;
(function (NotesSyncProgressType) {
    NotesSyncProgressType["NOTES_COUNT"] = "NotesCount";
    NotesSyncProgressType["TIME_ELAPSED"] = "TimeElapsed";
    NotesSyncProgressType["USN"] = "USN";
})(NotesSyncProgressType = exports.NotesSyncProgressType || (exports.NotesSyncProgressType = {}));
function canUpdateAccountCounts(params) {
    const isPersonalAccount = !params.personalAuth.vaultAuth;
    const isVaultUserOnBusinessAccount = !isPersonalAccount && params.isVault;
    return isPersonalAccount || isVaultUserOnBusinessAccount;
}
async function updateUploadedBytes(trc, params, userUploadedAmount) {
    const syncStateUpdates = { uploaded: userUploadedAmount };
    const accountCountUpdates = { userUploadedAmount };
    return await updateLocalStateAndAccountCounts(trc, params, 'updateUploadedBytes', syncStateUpdates, accountCountUpdates);
}
async function updateCurrentDevicesUsed(trc, params, userDeviceCount) {
    const syncStateUpdates = { currentDevicesUsed: userDeviceCount };
    const accountCountUpdates = { userDeviceCount };
    return await updateLocalStateAndAccountCounts(trc, params, 'updateCurrentDevicesUsed', syncStateUpdates, accountCountUpdates);
}
async function getAndUpdateUser(trc, params, userLastUpdated) {
    const syncStatePath = params.syncStatePath;
    if (!syncStatePath) {
        return;
    }
    const userStore = params.syncEngine.thriftComm.getUserStore(params.auth.urls.userStoreUrl);
    const user = await SyncHelpers_1.interruptible(params, userStore.getUser(trc, params.auth.token));
    if (user.id !== params.auth.userID) {
        throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.USER_CHANGED, params.auth.token);
    }
    await params.syncEngine.transact(trc, 'updateUser', async (graphTransaction) => {
        await params.syncEngine.updateUser(trc, graphTransaction, user, params.isVault, params.auth);
        await graphTransaction.updateSyncState(trc, syncStatePath, { userLastUpdated });
    });
}
async function getAndUpdateBusinessUsers(trc, params, businessUsersUpdateCount) {
    const syncStatePath = params.syncStatePath;
    if (!syncStatePath) {
        return;
    }
    const userStore = params.syncEngine.thriftComm.getUserStore(params.auth.urls.userStoreUrl);
    const businessUserFilter = { statuses: [en_conduit_sync_types_1.TBusinessUserStatus.ACTIVE, en_conduit_sync_types_1.TBusinessUserStatus.DEACTIVATED] };
    const currentUsers = await SyncHelpers_1.interruptible(params, userStore.listBusinessUsers(trc, params.auth.token, businessUserFilter));
    const businessProfiles = currentUsers.map(user => ProfileConverter_1.profileFromUserProfile(user, true));
    await params.syncEngine.transact(trc, 'updateBusinessUsers', async (graphTransaction) => {
        // process current users returned from query
        const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
        await ChunkConversion_1.processSyncUpdates(trc, converterParams, params.syncContext, ProfileConverter_1.ProfileConverter, undefined, 0, businessProfiles);
        await graphTransaction.updateSyncState(trc, syncStatePath, { businessUsersUpdateCount });
    });
}
async function updateShowChoiceScreen(trc, params, showChoiceScreen) {
    const syncStatePath = params.syncStatePath;
    if (!syncStatePath) {
        return;
    }
    await params.syncEngine.transact(trc, 'showChoiceScreen', async (graphTransaction) => {
        const userRef = { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User };
        // source of truth in our DB is in SyncState, but cache it on the user so it gets exposed out to clients
        await graphTransaction.updateSyncState(trc, syncStatePath, { showChoiceScreen });
        await graphTransaction.setNodeCachedField(trc, userRef, 'showChoiceScreen', showChoiceScreen, {});
    });
}
async function getAndProcessRemoteSyncState(trc, params, isCatchup) {
    const noteStore = params.thriftComm.getNoteStore(params.auth.urls.noteStoreUrl);
    const remoteSyncState = await SyncHelpers_1.interruptible(params, noteStore.getSyncState(trc, params.auth.token));
    if (isCatchup) {
        return remoteSyncState.updateCount;
    }
    const localSyncState = await SyncHelpers_1.getLocalSyncState(trc, params, exports.EmptyNoteStoreSyncState);
    if (remoteSyncState.clientSyncRateConfig) {
        await SyncHelpers_1.updateSyncRate(trc, params, remoteSyncState.clientSyncRateConfig, localSyncState);
    }
    if (SyncHelpers_1.hasRemoteValueChanged(remoteSyncState.userLastUpdated, localSyncState.userLastUpdated, 'GT')) {
        await getAndUpdateUser(trc, params, remoteSyncState.userLastUpdated);
    }
    if (SyncHelpers_1.hasRemoteValueChanged(remoteSyncState.businessUsersUpdateCount, localSyncState.businessUsersUpdateCount, 'GT')) {
        await getAndUpdateBusinessUsers(trc, params, remoteSyncState.businessUsersUpdateCount);
    }
    if (SyncHelpers_1.hasRemoteValueChanged(remoteSyncState.showChoiceScreen, localSyncState.showChoiceScreen)) {
        await updateShowChoiceScreen(trc, params, remoteSyncState.showChoiceScreen);
    }
    if (canUpdateAccountCounts(params)) {
        if (SyncHelpers_1.hasRemoteValueChanged(remoteSyncState.uploaded, localSyncState.uploaded)) {
            await updateUploadedBytes(trc, params, remoteSyncState.uploaded);
        }
        if (SyncHelpers_1.hasRemoteValueChanged(remoteSyncState.currentDevicesUsed, localSyncState.currentDevicesUsed)) {
            await updateCurrentDevicesUsed(trc, params, remoteSyncState.currentDevicesUsed);
        }
    }
    return remoteSyncState.updateCount;
}
async function syncForwardInternal(trc, params, filter, isCatchup) {
    await params.yieldCheck;
    const noteStore = params.thriftComm.getNoteStore(params.auth.urls.noteStoreUrl);
    const authToken = params.auth.token;
    let lastUpdateCount = (await SyncHelpers_1.getLocalSyncState(trc, params, exports.EmptyNoteStoreSyncState)).lastUpdateCount;
    let updateCount = await getAndProcessRemoteSyncState(trc, params, isCatchup);
    const isIncremental = lastUpdateCount > 0;
    const catchUpWorkspaces = [];
    const catchUpNotebooks = [];
    while (true) {
        await params.yieldCheck;
        const syncAvailable = params.syncStatePath ? await SyncHelpers_1.checkIfSyncAvailable(trc, params, exports.EmptyNoteStoreSyncState, updateCount) : updateCount > lastUpdateCount;
        if (!syncAvailable) {
            break;
        }
        // fetch and process a sync chunk
        const chunk = await SyncHelpers_1.interruptible(params, noteStore.getFilteredSyncChunk(trc, authToken, lastUpdateCount, MAX_ENTRIES, filter));
        if (typeof chunk.updateCount === 'number') {
            updateCount = chunk.updateCount;
        }
        if (typeof chunk.chunkHighUSN === 'number') {
            lastUpdateCount = chunk.chunkHighUSN;
        }
        else {
            lastUpdateCount = updateCount;
        }
        if (isIncremental && params.isVault && !isCatchup && chunk.workspaces && chunk.workspaces.length) {
            for (const ws of chunk.workspaces) {
                if (ws.workspace && ws.workspace.guid) {
                    // TODO filter out workspaces that we already have
                    catchUpWorkspaces.push(ws.workspace.guid);
                }
            }
        }
        if (isIncremental && params.isVault && !isCatchup && chunk.notebooks && chunk.notebooks.length) {
            for (const nb of chunk.notebooks) {
                const creatorID = nb.contact && nb.contact.id;
                if (nb.guid && creatorID !== params.personalUserID) {
                    // TODO filter out notebooks that belong to a workspace we already have
                    catchUpNotebooks.push(nb.guid);
                }
            }
        }
        await ChunkConversion_1.convertSyncChunk(trc, params, chunk, lastUpdateCount);
        params.setProgress && await params.setProgress(trc, lastUpdateCount / updateCount);
    }
    const wsRefs = catchUpWorkspaces.map(guid => {
        return { id: Converters_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Workspace), type: en_core_entity_types_1.CoreEntityTypes.Workspace };
    });
    const nbRefs = catchUpNotebooks.map(guid => {
        return { id: Converters_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Notebook), type: en_core_entity_types_1.CoreEntityTypes.Notebook };
    });
    return wsRefs.concat(nbRefs);
}
/**
 * Helper method called whenever an account "count" changes.
 * It updates local sync state, as well as the model object.
 */
async function updateLocalStateAndAccountCounts(trc, params, transactionName, syncStateUpdates, accountCountUpdates) {
    const syncStatePath = params.syncStatePath;
    if (!syncStatePath) {
        return;
    }
    await params.syncEngine.transact(trc, transactionName, async (graphTransaction) => {
        await graphTransaction.updateSyncState(trc, syncStatePath, syncStateUpdates);
        const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
        const serviceParams = Object.assign(Object.assign({}, converterParams), { thriftComm: params.thriftComm });
        await AccountLimitsConverter_1.updateAccountLimitsNode(trc, serviceParams, params.isVault ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, accountCountUpdates);
    });
}
async function syncForward(trc, params) {
    return await syncForwardInternal(trc, params, params.isVault ? gVaultFullSyncFilter : gPersonalFullSyncFilter, false);
}
exports.syncForward = syncForward;
async function syncCatchup(trc, params, catchupRefs) {
    const wsGuids = [];
    const nbGuids = [];
    for (const ref of catchupRefs) {
        const guid = Converters_1.convertGuidToService(ref.id, ref.type);
        if (ref.type === en_core_entity_types_1.CoreEntityTypes.Workspace) {
            wsGuids.push(guid);
        }
        else if (ref.type === en_core_entity_types_1.CoreEntityTypes.Notebook) {
            nbGuids.push(guid);
        }
    }
    if (wsGuids.length) {
        await syncForwardInternal(trc, params, Object.assign(Object.assign({ workspaceGuids: wsGuids }, gCatchupSyncFilter), { includeWorkspaces: true }), true);
    }
    if (nbGuids.length) {
        await syncForwardInternal(trc, params, Object.assign({ notebookGuids: nbGuids }, gCatchupSyncFilter), true);
    }
}
exports.syncCatchup = syncCatchup;
// returns true if there are still more chunks to fetch (ie if maxNotes or maxTime is reached)
async function syncReverse(trc, params, filter, maxNotes, maxNotesPerFetch, maxTime, reportProgressType) {
    await params.yieldCheck;
    if (!filter) {
        filter = params.isVault ? gVaultFullSyncFilter : gPersonalFullSyncFilter;
    }
    filter = Object.assign(Object.assign({}, filter), { reverseOrder: true });
    const noteStore = params.thriftComm.getNoteStore(params.auth.urls.noteStoreUrl);
    let lastUpdateCount = (await SyncHelpers_1.getLocalSyncState(trc, params, exports.EmptyNoteStoreSyncState)).lastUpdateCount;
    const start = Date.now();
    let noteGuids = [];
    while (true) {
        await params.yieldCheck;
        const maxNotesReached = noteGuids.length >= maxNotes;
        const maxTimeReached = maxTime && (Date.now() - start) >= maxTime;
        const syncAvailable = await checkNotesSyncAvailable(trc, params);
        if (!syncAvailable || maxNotesReached || maxTimeReached) {
            break;
        }
        const notesToFetch = Math.min(maxNotes - noteGuids.length, maxNotesPerFetch);
        const chunk = await SyncHelpers_1.interruptible(params, noteStore.getFilteredSyncChunk(trc, params.auth.token, lastUpdateCount, notesToFetch, filter));
        if (chunk.prevChunkHighUSN === null || chunk.prevChunkHighUSN === undefined) {
            throw new Error('reverse syncing not supported');
        }
        lastUpdateCount = chunk.prevChunkHighUSN;
        if (chunk.notes && chunk.notes.length) {
            noteGuids = noteGuids.concat(chunk.notes.map(note => note.guid));
        }
        await ChunkConversion_1.convertSyncChunk(trc, params, chunk, lastUpdateCount);
        let percentage = 0;
        if (lastUpdateCount <= 0) {
            // sync finished.
            percentage = 1;
        }
        else if (reportProgressType === NotesSyncProgressType.NOTES_COUNT) {
            percentage = (noteGuids.length / maxNotes);
        }
        else if (reportProgressType === NotesSyncProgressType.USN) {
            percentage = syncReverseProgressPercent(chunk.updateCount, lastUpdateCount);
        }
        else if (reportProgressType === NotesSyncProgressType.TIME_ELAPSED && maxTime) {
            percentage = ((Date.now() - start) / maxTime);
        }
        params.setProgress && await params.setProgress(trc, percentage);
    }
    return {
        noteGuids,
        hasMore: lastUpdateCount > 0,
    };
}
async function checkNotesSyncAvailable(trc, params) {
    // remoteUpdateCount is 0 since we sync notes in reverse
    return await SyncHelpers_1.checkIfSyncAvailable(trc, params, exports.EmptyNoteStoreSyncState, 0);
}
exports.checkNotesSyncAvailable = checkNotesSyncAvailable;
function syncReverseProgressPercent(highUsn, lastUpdateCount) {
    return (lastUpdateCount > 0 ? ((highUsn - lastUpdateCount) / highUsn) : 1);
}
async function currentBackgroundNoteSyncProgress(trc, params) {
    // get high USN for account
    const noteSyncParams = Object.assign(Object.assign({}, params), { syncStatePath: [params.syncContext, 'notestore'] });
    const highUsn = (await SyncHelpers_1.getLocalSyncState(trc, noteSyncParams, exports.EmptyNoteStoreSyncState)).lastUpdateCount;
    if (!highUsn) {
        return 0;
    }
    const lastUpdateCount = (await SyncHelpers_1.getLocalSyncState(trc, params, exports.EmptyNoteStoreSyncState)).lastUpdateCount;
    return syncReverseProgressPercent(highUsn, lastUpdateCount);
}
exports.currentBackgroundNoteSyncProgress = currentBackgroundNoteSyncProgress;
async function syncBackgroundNotes(trc, params, maxNotesPerFetch, maxTime) {
    return await syncReverse(trc, params, gNotesSyncFilter, maxNotesPerFetch, maxNotesPerFetch, maxTime, NotesSyncProgressType.USN);
}
exports.syncBackgroundNotes = syncBackgroundNotes;
async function syncNotesReverse(trc, params, maxNotes, maxNotesPerFetch, reportProgressType, maxTime) {
    return await syncReverse(trc, params, gNotesSyncFilter, maxNotes, maxNotesPerFetch, maxTime, reportProgressType);
}
exports.syncNotesReverse = syncNotesReverse;
async function syncDefaultNotebook(trc, params) {
    const noteStore = params.thriftComm.getNoteStore(params.auth.urls.noteStoreUrl);
    const authToken = params.auth.token;
    const fakeChunk = {
        currentTime: Date.now(),
        updateCount: 0,
        notebooks: [],
    };
    if (!params.auth.vaultAuth) {
        const defaultNotebook = await noteStore.getDefaultNotebook(trc, authToken);
        defaultNotebook.defaultNotebook = true; // service-assigned default notebooks are not marked as default
        fakeChunk.notebooks.push(defaultNotebook);
    }
    if (params.isVault) {
        const userNotebook = await noteStore.getUserNotebook(trc, authToken);
        if (fakeChunk.notebooks.length && fakeChunk.notebooks[0].guid === userNotebook.guid) {
            fakeChunk.notebooks[0].userNotebook = true;
        }
        else {
            userNotebook.userNotebook = true;
            fakeChunk.notebooks.push(userNotebook);
        }
    }
    await ChunkConversion_1.convertSyncChunk(trc, params, fakeChunk);
}
async function syncBootstrap(trc, params, syncNotes, backgroundNoteSyncStatePath) {
    await syncDefaultNotebook(trc, params);
    if (syncNotes) {
        await syncForward(trc, params);
    }
    else {
        // sync just non-notes
        let filter = params.isVault ? gVaultBootstrapSyncFilter : gPersonalBootstrapSyncFilter;
        if (!gBootstrapTags) {
            filter = Object.assign(Object.assign({}, filter), { includeTags: false });
        }
        await syncForwardInternal(trc, params, filter, false);
    }
    // for the background note syncing, set the lastUpdateCount to the remote update count and the target to 0
    const noteSyncParams = Object.assign(Object.assign({}, params), { syncStatePath: backgroundNoteSyncStatePath });
    const syncStatePath = params.syncStatePath;
    if (syncStatePath) {
        await params.syncEngine.transact(trc, 'setStartCount', async (tx) => {
            const syncState = await tx.getSyncState(trc, null, syncStatePath);
            if (syncState) {
                // this getLocalSyncState will initialize the data if not found
                await SyncHelpers_1.getLocalSyncState(trc, noteSyncParams, exports.EmptyNoteStoreSyncState, tx);
                await tx.updateSyncState(trc, backgroundNoteSyncStatePath, { lastUpdateCount: syncNotes ? 0 : syncState.lastUpdateCount });
            }
        });
    }
    await SyncHelpers_1.checkIfSyncAvailable(trc, noteSyncParams, exports.EmptyNoteStoreSyncState, 0);
}
exports.syncBootstrap = syncBootstrap;
async function syncCurrentNoteSnippets(trc, params) {
    const noteGuids = (await SyncHelpers_1.getInitialSnippetsToFetch(trc, params)).noteGuids;
    await ChunkConversion_1.fetchAndCacheSnippets(trc, params.thriftComm, params.auth, noteGuids, (innerTrc, name, cb) => {
        return params.syncEngine.transact(innerTrc, name, cb);
    }, params.setProgress);
}
exports.syncCurrentNoteSnippets = syncCurrentNoteSnippets;
function convertNoteMetadata(n, inTrash) {
    return Object.assign(Object.assign({}, n), { active: !inTrash, isMetadata: true });
}
async function syncAllNotesMetadata(trc, params, inTrash) {
    const utilityStore = params.thriftComm.getUtilityStore(params.auth.urls.utilityUrl);
    const authToken = params.auth.token;
    const filter = {
        order: en_conduit_sync_types_1.TNoteSortOrder.CREATED,
        inactive: inTrash,
    };
    const resultSpec = {
        includeTitle: true,
        includeCreated: true,
        includeUpdated: true,
        includeDeleted: true,
        includeUpdateSequenceNum: true,
        includeNotebookGuid: true,
        includeTagGuids: true,
        includeAttributes: true,
    };
    let offset = (await SyncHelpers_1.getLocalSyncState(trc, params, SyncHelpers_1.EmptySyncState)).lastUpdateCount;
    while (true) {
        const d0 = Date.now();
        const res = await utilityStore.findNotesMetadataForIon(trc, authToken, filter, offset, MAX_NOTES_PER_METADATA_FETCH, resultSpec);
        const d1 = Date.now();
        if (!inTrash && offset < SyncHelpers_1.MAX_INITIAL_SNIPPETS_TO_FETCH) {
            // update snippets to fetch if notes not in trash and max snippets to fetch is not reached yet.
            await SyncHelpers_1.updateInitialSnippetsToFetch(trc, params, res.notes.map(n => n.guid));
        }
        offset += res.notes.length;
        await ChunkConversion_1.convertSyncChunk(trc, params, {
            currentTime: Date.now(),
            updateCount: res.updateCount || 0,
            notes: res.notes.map(n => convertNoteMetadata(n, inTrash)),
        }, offset);
        const d2 = Date.now();
        filter.searchContextBytes = res.searchContextBytes;
        conduit_utils_1.logger.debug(`findNotesMetadata ${offset}/${res.totalNotes}`, d1 - d0, d2 - d1);
        params.setProgress && await params.setProgress(trc, res.totalNotes === 0 ? 1 : offset / res.totalNotes);
        if (offset >= res.totalNotes) {
            break;
        }
    }
}
exports.syncAllNotesMetadata = syncAllNotesMetadata;
function getNoteCountSyncStatePath(syncContext) {
    return [syncContext, 'noteCount'];
}
async function syncNoteCount(trc, params) {
    const utilityStore = params.thriftComm.getUtilityStore(params.auth.urls.utilityUrl);
    const authToken = params.auth.token;
    // active notes
    const activeResp = await utilityStore.findNotesMetadataForIon(trc, authToken, { inactive: false }, 0, 0, {});
    // notes in trash
    const trashResp = await utilityStore.findNotesMetadataForIon(trc, authToken, { inactive: true }, 0, 0, {});
    const totalNotes = (activeResp.totalNotes || 0) + (trashResp.totalNotes || 0);
    conduit_utils_1.logger.info('Total notes in account ', totalNotes);
    // write to DB.
    await params.syncEngine.transact(trc, 'updateNoteCounts', async (tx) => {
        await tx.replaceSyncState(trc, getNoteCountSyncStatePath(params.syncContext), { totalNotes });
    });
    return totalNotes;
}
exports.syncNoteCount = syncNoteCount;
async function getTotalNotesInAccount(trc, params) {
    const syncState = await params.syncEngine.graphStorage.getSyncState(trc, null, getNoteCountSyncStatePath(params.syncContext));
    return (syncState === null || syncState === void 0 ? void 0 : syncState.totalNotes) || 0;
}
exports.getTotalNotesInAccount = getTotalNotesInAccount;
//# sourceMappingURL=NoteStoreSync.js.map