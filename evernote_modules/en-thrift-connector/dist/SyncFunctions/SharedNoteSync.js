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
exports.syncSharedNote = exports.isValidSharedNoteMembershipProvider = exports.createSharedNoteSyncContextMetadata = exports.fetchNote = exports.deleteSharedNoteContext = exports.sharedNoteSyncContext = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth = __importStar(require("../Auth"));
const Converters_1 = require("../Converters/Converters");
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
const SYNC_PERIOD = 5 * conduit_utils_1.MILLIS_IN_ONE_MINUTE;
function convertError(err, authenticationToken) {
    if (!(err instanceof conduit_utils_1.ServiceError)) {
        return err;
    }
    if (err.errorType === 'EDAMNotFoundException' && err.errorKey === 'Note.guid') {
        // convert loss of access to a shared note to an AuthError to trigger the revalidation path
        return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.PERMISSION_DENIED, authenticationToken);
    }
    return err;
}
function sharedNoteSyncContext(sharedNoteGuid) {
    return `SharedNote:${sharedNoteGuid}`;
}
exports.sharedNoteSyncContext = sharedNoteSyncContext;
async function deleteSharedNoteContext(trc, graphTransaction, sharedNoteGuid) {
    const syncContext = sharedNoteSyncContext(sharedNoteGuid);
    await graphTransaction.deleteSyncContext(trc, syncContext);
    await graphTransaction.deleteSyncState(trc, [syncContext]);
}
exports.deleteSharedNoteContext = deleteSharedNoteContext;
async function fetchNote(trc, thriftComm, auth, noteGuid, noteStoreUrl) {
    const noteStore = thriftComm.getNoteStore(noteStoreUrl);
    try {
        return await noteStore.getNoteWithResultSpec(trc, auth.token, noteGuid, { includeSharedNotes: true });
    }
    catch (err) {
        throw convertError(err, auth.token);
    }
}
exports.fetchNote = fetchNote;
async function createSharedNoteSyncContextMetadata(trc, graphTransaction, noteGuid, syncContext, ownerId, encodedAuth, noteStoreUrl, syncStatePath) {
    await graphTransaction.createSyncContext(trc, syncContext, {
        userID: ownerId,
        authToken: encodedAuth,
        isUser: false,
        isVaultUser: false,
        sharedNotebookNoteStoreUrl: noteStoreUrl,
        sharedNotebookGlobalID: null,
        turboSyncNoteEditUpdateBuffer: SyncHelpers_1.TURBO_SYNC_DEFAULTS.NOTE_EDIT_BUFFER,
        turboSyncNoteIdleUpdateBuffer: SyncHelpers_1.TURBO_SYNC_DEFAULTS.NOTE_IDLE_BUFFER,
        sharedNoteID: noteGuid,
    });
    if (syncStatePath) {
        await graphTransaction.replaceSyncState(trc, syncStatePath, SyncHelpers_1.EmptySyncState);
    }
}
exports.createSharedNoteSyncContextMetadata = createSharedNoteSyncContextMetadata;
function isValidSharedNoteMembershipProvider(noteID) {
    return (node) => node.id.includes(noteID);
}
exports.isValidSharedNoteMembershipProvider = isValidSharedNoteMembershipProvider;
async function syncSharedNote(trc, params, noteStoreUrl, sharedNoteGuid, sharedObjectOwnerId) {
    const metadata = await params.syncEngine.graphStorage.getSyncContextMetadata(trc, null, params.syncContext);
    const encodedAuth = Auth.encodeAuthData(params.auth);
    if (!metadata) {
        await params.syncEngine.transact(trc, 'initSyncContext', async (graphTransaction) => {
            await createSharedNoteSyncContextMetadata(trc, graphTransaction, sharedNoteGuid, params.syncContext, sharedObjectOwnerId, encodedAuth, noteStoreUrl, params.syncStatePath);
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
    const updateCount = Math.floor(Date.now() / SYNC_PERIOD);
    const syncAvailable = await SyncHelpers_1.checkIfSyncAvailable(trc, params, SyncHelpers_1.EmptySyncState, updateCount);
    if (!syncAvailable) {
        return;
    }
    const note = await SyncHelpers_1.interruptible(params, fetchNote(trc, params.thriftComm, params.auth, sharedNoteGuid, noteStoreUrl));
    if (note) {
        await ChunkConversion_1.convertSyncChunk(trc, params, {
            currentTime: Date.now(),
            updateCount,
            notes: [note],
        }, updateCount);
        const noteID = Converters_1.convertGuidFromService(sharedNoteGuid, en_core_entity_types_1.CoreEntityTypes.Note);
        await SyncHelpers_1.updateSyncContextPrivilege(trc, params, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, isValidSharedNoteMembershipProvider(noteID));
    }
}
exports.syncSharedNote = syncSharedNote;
//# sourceMappingURL=SharedNoteSync.js.map