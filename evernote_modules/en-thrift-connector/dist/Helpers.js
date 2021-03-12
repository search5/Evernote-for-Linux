"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldBufferMutation = exports.getBestSyncContextForNode = exports.EXTERNAL_CONTEXT_REGEX = exports.SHARED_NOTE_CONTEXT_REGEX = exports.LINKED_CONTEXT_REGEX = void 0;
const conduit_core_1 = require("conduit-core");
const en_core_entity_types_1 = require("en-core-entity-types");
exports.LINKED_CONTEXT_REGEX = /^LinkedNotebook:/;
exports.SHARED_NOTE_CONTEXT_REGEX = /^SharedNote:/;
exports.EXTERNAL_CONTEXT_REGEX = /(^LinkedNotebook:|^SharedNote:)/;
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
    const hasSharedNoteContext = node.syncContexts.some(context => context.match(exports.SHARED_NOTE_CONTEXT_REGEX));
    if (hasVaultContext && !hasSharedNoteContext) {
        // vault auth can be used for all entities except directly shared Notes.
        return conduit_core_1.VAULT_USER_CONTEXT;
    }
    // loop through sync context metadata and return sync context with best privilege
    // prefer VAULT_USER_CONTEXT if present over shared context with READ privilege.
    let bestSyncContext = hasVaultContext ? conduit_core_1.VAULT_USER_CONTEXT : node.syncContexts[0];
    let privilege = en_core_entity_types_1.MembershipPrivilege.READ;
    for (const syncContext of node.syncContexts) {
        if (syncContext === conduit_core_1.PERSONAL_USER_CONTEXT || syncContext === conduit_core_1.VAULT_USER_CONTEXT) {
            continue;
        }
        const metadata = await getSyncContextMetadata(trc, syncContextMetadataProvider, storageDB, syncContext);
        if (!metadata || !metadata.privilege) {
            continue;
        }
        const newPrivilege = en_core_entity_types_1.highestPrivilege(metadata.privilege, privilege);
        if (newPrivilege === en_core_entity_types_1.MembershipPrivilege.MANAGE) {
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