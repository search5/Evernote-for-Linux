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
exports.shouldBufferMutation = exports.getBestSyncContextForNode = exports.linkedNotebookSyncContext = exports.createSharedNotebookSyncContextMetadata = exports.EmptySyncStateWithTurbo = exports.EmptySyncState = exports.TURBO_SYNC_DEFAULTS = exports.DEFAULT_POLL_INTERVAL = void 0;
const conduit_core_1 = require("conduit-core");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
exports.DEFAULT_POLL_INTERVAL = 30000;
exports.TURBO_SYNC_DEFAULTS = {
    NOTE_EDIT_BUFFER: 6 * 1000,
    NOTE_IDLE_BUFFER: 3 * 1000,
};
exports.EmptySyncState = SimplyImmutable.deepFreeze({
    lastUpdateCount: 0,
    syncInterval: exports.DEFAULT_POLL_INTERVAL,
});
exports.EmptySyncStateWithTurbo = SimplyImmutable.deepFreeze(Object.assign(Object.assign({}, exports.EmptySyncState), { turboSyncNoteIdleUpdateBuffer: exports.TURBO_SYNC_DEFAULTS.NOTE_IDLE_BUFFER, turboSyncNoteEditUpdateBuffer: exports.TURBO_SYNC_DEFAULTS.NOTE_EDIT_BUFFER }));
async function createSharedNotebookSyncContextMetadata(trc, graphTransaction, syncContext, ownerID, encodedAuth, sharedNotebookGlobalID, noteStoreUrl, syncStatePath) {
    await graphTransaction.createSyncContext(trc, syncContext, {
        userID: ownerID,
        authToken: encodedAuth,
        isUser: false,
        isVaultUser: false,
        sharedNotebookGlobalID,
        sharedNotebookNoteStoreUrl: noteStoreUrl,
        turboSyncNoteEditUpdateBuffer: exports.TURBO_SYNC_DEFAULTS.NOTE_EDIT_BUFFER,
        turboSyncNoteIdleUpdateBuffer: exports.TURBO_SYNC_DEFAULTS.NOTE_IDLE_BUFFER,
        sharedNoteID: null,
    });
    if (syncStatePath) {
        await graphTransaction.replaceSyncState(trc, syncStatePath, exports.EmptySyncStateWithTurbo);
    }
}
exports.createSharedNotebookSyncContextMetadata = createSharedNotebookSyncContextMetadata;
function linkedNotebookSyncContext(linkedNotebookGuid) {
    return `LinkedNotebook:${linkedNotebookGuid}`;
}
exports.linkedNotebookSyncContext = linkedNotebookSyncContext;
async function getSyncContextMetadata(trc, syncContextMetadataProvider, storageDB, syncContext) {
    if (syncContextMetadataProvider) {
        return await syncContextMetadataProvider.getSyncContextMetadata(trc, syncContext);
    }
    if (storageDB) {
        return await storageDB.getSyncContextMetadata(trc, null, syncContext);
    }
    return undefined;
}
async function getBestSyncContextForNode(trc, node, syncContextMetadataProvider, storageDB) {
    if (node.syncContexts.length === 1) {
        return node.syncContexts[0];
    }
    const hasVaultContext = node.syncContexts.includes(conduit_core_1.VAULT_USER_CONTEXT);
    const hasSharedNoteContext = node.syncContexts.some(context => en_core_entity_types_1.isSharedNoteSyncContext(context));
    if (hasVaultContext && !hasSharedNoteContext) {
        // vault auth can be used for all entities except directly shared Notes.
        return conduit_core_1.VAULT_USER_CONTEXT;
    }
    // loop through sync context metadata and return sync context with best privilege
    // prefer VAULT_USER_CONTEXT if present over shared context with READ privilege.
    let bestSyncContext = hasVaultContext ? conduit_core_1.VAULT_USER_CONTEXT : node.syncContexts[0];
    let privilege = en_conduit_sync_types_1.MembershipPrivilege.READ;
    for (const syncContext of node.syncContexts) {
        if (syncContext === conduit_core_1.PERSONAL_USER_CONTEXT || syncContext === conduit_core_1.VAULT_USER_CONTEXT) {
            continue;
        }
        const metadata = await getSyncContextMetadata(trc, syncContextMetadataProvider, storageDB, syncContext);
        if (!metadata || !metadata.privilege) {
            continue;
        }
        const newPrivilege = en_conduit_sync_types_1.highestPrivilege(metadata.privilege, privilege);
        if (newPrivilege === en_conduit_sync_types_1.MembershipPrivilege.MANAGE) {
            return syncContext;
        }
        if (newPrivilege !== privilege) {
            privilege = newPrivilege;
            bestSyncContext = syncContext;
        }
    }
    return bestSyncContext;
}
exports.getBestSyncContextForNode = getBestSyncContextForNode;
function shouldBufferMutation(mutation, isFlush) {
    if (isFlush) {
        // don't buffer if flushing mutations
        return false;
    }
    if (!mutation.bufferUntil) {
        // mutation doesn't want buffering
        return false;
    }
    if (mutation.rollupFlushInterval && mutation.rollupInterval && mutation.rollupInterval >= mutation.rollupFlushInterval) {
        // mutation has been rolled up for long enough, flush it to remote (ie stop buffering)
        return false;
    }
    if (mutation.bufferUntil > Date.now()) {
        // still within mutation's buffering window
        return true;
    }
    return false;
}
exports.shouldBufferMutation = shouldBufferMutation;
//# sourceMappingURL=Helpers.js.map