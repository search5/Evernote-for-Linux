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
exports.syncLinkedNotebook = exports.isValidSharedNotebookMembershipProvider = exports.createSharedNotebookSyncContextMetadata = exports.deleteLinkedNotebookContext = exports.linkedNotebookSyncContext = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Auth = __importStar(require("../Auth"));
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
const MAX_ENTRIES = 255;
function convertError(err, authenticationToken) {
    if (!(err instanceof conduit_utils_1.ServiceError)) {
        return err;
    }
    if (err.errorType === 'EDAMNotFoundException' && err.errorKey === 'SharedNotebook.id') {
        // convert loss of access to a shared notebook to an AuthError to trigger the revalidation path
        return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.PERMISSION_DENIED, authenticationToken);
    }
    return err;
}
function linkedNotebookSyncContext(linkedNotebookGuid) {
    return `LinkedNotebook:${linkedNotebookGuid}`;
}
exports.linkedNotebookSyncContext = linkedNotebookSyncContext;
async function deleteLinkedNotebookContext(trc, graphTransaction, linkedNotebookGuid) {
    const syncContext = linkedNotebookSyncContext(linkedNotebookGuid);
    await graphTransaction.deleteSyncContext(trc, syncContext);
    await graphTransaction.deleteSyncState(trc, [syncContext]);
}
exports.deleteLinkedNotebookContext = deleteLinkedNotebookContext;
async function getRemoteSyncState(trc, params, noteStoreUrl, linkedNotebook) {
    const noteStore = params.comm.getNoteStore(noteStoreUrl);
    try {
        return await SyncHelpers_1.interruptible(params, noteStore.getLinkedNotebookSyncState(trc, params.personalAuth.token, linkedNotebook));
    }
    catch (err) {
        // NOTE: the thrift call uses the personal auth token but we convert to an AuthError with the shared notebook auth token so
        // revalidation looks up the correct sync context
        throw convertError(err, params.auth.token);
    }
}
async function getSyncChunk(trc, params, noteStoreUrl, linkedNotebook, afterUSN, maxEntries) {
    const noteStore = params.comm.getNoteStore(noteStoreUrl);
    try {
        return await SyncHelpers_1.interruptible(params, noteStore.getLinkedNotebookSyncChunk(trc, params.personalAuth.token, linkedNotebook, afterUSN, maxEntries, false));
    }
    catch (err) {
        // NOTE: the thrift call uses the personal auth token but we convert to an AuthError with the shared notebook auth token so
        // revalidation looks up the correct sync context
        throw convertError(err, params.auth.token);
    }
}
async function createSharedNotebookSyncContextMetadata(trc, graphTransaction, syncContext, ownerID, encodedAuth, sharedNotebookGlobalID, noteStoreUrl, syncStatePath) {
    await graphTransaction.createSyncContext(trc, syncContext, {
        userID: ownerID,
        authToken: encodedAuth,
        isUser: false,
        isVaultUser: false,
        sharedNotebookGlobalID,
        sharedNotebookNoteStoreUrl: noteStoreUrl,
        turboSyncNoteEditUpdateBuffer: en_thrift_connector_1.TURBO_SYNC_DEFAULTS.NOTE_EDIT_BUFFER,
        turboSyncNoteIdleUpdateBuffer: en_thrift_connector_1.TURBO_SYNC_DEFAULTS.NOTE_IDLE_BUFFER,
        sharedNoteID: null,
    });
    if (syncStatePath) {
        await graphTransaction.replaceSyncState(trc, syncStatePath, en_thrift_connector_1.EmptySyncStateWithTurbo);
    }
}
exports.createSharedNotebookSyncContextMetadata = createSharedNotebookSyncContextMetadata;
function isValidSharedNotebookMembershipProvider(sharedNotebookId) {
    return (node) => (node.NodeFields.internal_sharedNotebookID === sharedNotebookId);
}
exports.isValidSharedNotebookMembershipProvider = isValidSharedNotebookMembershipProvider;
async function syncLinkedNotebook(trc, params, shareState, sharedNotebookGlobalID) {
    const { noteStoreUrl, linkedNotebook, sharedNotebookId, ownerId: sharedObjectOwnerId, notebookGuid } = shareState;
    const metadata = await params.syncEngine.graphStorage.getSyncContextMetadata(trc, null, params.syncContext);
    const encodedAuth = Auth.encodeAuthData(params.auth);
    if (!metadata) {
        await params.syncEngine.transact(trc, 'initSyncContext', async (graphTransaction) => {
            await createSharedNotebookSyncContextMetadata(trc, graphTransaction, params.syncContext, sharedObjectOwnerId, encodedAuth, sharedNotebookGlobalID, noteStoreUrl, params.syncStatePath);
        });
    }
    else if (metadata.authToken !== encodedAuth || metadata.sharedNotebookNoteStoreUrl !== noteStoreUrl) {
        await params.syncEngine.transact(trc, 'updateSyncContext', async (graphTransaction) => {
            await graphTransaction.updateSyncContextMetadata(trc, params.syncContext, {
                authToken: encodedAuth,
                sharedNotebookNoteStoreUrl: noteStoreUrl,
            });
        });
    }
    await params.yieldCheck;
    const localSyncState = await SyncHelpers_1.getLocalSyncState(trc, params, en_thrift_connector_1.EmptySyncStateWithTurbo);
    const remoteSyncState = await getRemoteSyncState(trc, params, noteStoreUrl, linkedNotebook);
    if (remoteSyncState.clientSyncRateConfig) {
        await SyncHelpers_1.updateSyncRate(trc, params, remoteSyncState.clientSyncRateConfig, localSyncState);
    }
    let lastUpdateCount = localSyncState.lastUpdateCount;
    let updateCount = remoteSyncState.updateCount;
    while (true) {
        await params.yieldCheck;
        const syncAvailable = await SyncHelpers_1.checkIfSyncAvailable(trc, params, en_thrift_connector_1.EmptySyncStateWithTurbo, updateCount);
        if (!syncAvailable) {
            return;
        }
        const chunk = await getSyncChunk(trc, params, noteStoreUrl, linkedNotebook, lastUpdateCount, MAX_ENTRIES);
        if (typeof chunk.chunkHighUSN === 'number') {
            lastUpdateCount = chunk.chunkHighUSN;
        }
        if (typeof chunk.updateCount === 'number') {
            updateCount = chunk.updateCount;
        }
        await ChunkConversion_1.convertSyncChunk(trc, params, chunk, lastUpdateCount);
        if (sharedNotebookId) {
            await SyncHelpers_1.updateSyncContextPrivilege(trc, params, { id: notebookGuid, type: en_core_entity_types_1.CoreEntityTypes.Notebook }, isValidSharedNotebookMembershipProvider(sharedNotebookId));
        }
    }
}
exports.syncLinkedNotebook = syncLinkedNotebook;
//# sourceMappingURL=LinkedNotebookSync.js.map