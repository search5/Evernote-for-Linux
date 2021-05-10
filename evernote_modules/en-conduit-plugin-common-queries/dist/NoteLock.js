"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteLockPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const NotelockArgument = conduit_core_1.schemaToGraphQLArgs({ noteID: 'ID' });
const NotelockSchema = conduit_utils_1.Struct({
    lockHolderId: conduit_utils_1.NullableID,
    lockRenewBy: conduit_utils_1.NullableTimestamp,
    viewerIds: conduit_utils_1.ListOf('ID'),
    viewIdleExpiration: conduit_utils_1.NullableTimestamp,
    currentTime: conduit_utils_1.NullableTimestamp,
    isNoteStale: 'boolean',
}, 'Notelock');
const Notelock = conduit_core_1.schemaToGraphQLType(NotelockSchema);
const NullableNotelock = conduit_core_1.schemaToGraphQLType(conduit_utils_1.Nullable(NotelockSchema));
async function checkNoteUpsyncStatus(context, noteID) {
    conduit_core_1.validateDB(context);
    const noteNode = await context.db.getNode(context, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
    if (conduit_utils_1.isNullish(noteNode)) {
        throw new conduit_utils_1.NotFoundError(noteID);
    }
    if (noteNode.version === 0) {
        const res = await conduit_utils_1.withError(context.db.flushRemoteMutations());
        if (res.err || res.data.pending) {
            throw new conduit_utils_1.RetryError('Note is not upsynced yet', 5000 /* random number */);
        }
    }
}
function toNotelockResolver(f) {
    return async (parent, args, context) => {
        if (!args || !args.noteID) {
            throw new Error('Missing note ID');
        }
        conduit_core_1.validateDB(context);
        await conduit_core_1.retrieveAuthorizedToken(context);
        const serviceNoteGuid = en_thrift_connector_1.convertGuidToService(args.noteID, en_core_entity_types_1.CoreEntityTypes.Note);
        const { node, syncContext } = await context.db.getNodeWithContext(context, { id: args.noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
        if (!node) {
            throw new conduit_utils_1.NotFoundError(args.noteID, 'Note not found');
        }
        const metadata = await context.db.getSyncContextMetadata(context, syncContext);
        if (!metadata) {
            throw new conduit_utils_1.NotFoundError(args.noteID, 'Bad syncContext for note');
        }
        return await f(en_thrift_connector_1.decodeAuthData(metadata.authToken), serviceNoteGuid, syncContext, context);
    };
}
async function toNotelock(lock, syncContext, context, noteGuid, offlineContentStrategy) {
    conduit_core_1.validateDB(context);
    if (lock.unknownUsers) {
        await context.db.transactSyncedStorage(context.trc, 'convertNoteLockUsers', async (graphTransaction) => {
            const personalMetadata = await graphTransaction.getSyncContextMetadata(context.trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
            const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
            const vaultMetadata = await graphTransaction.getSyncContextMetadata(context.trc, null, conduit_core_1.VAULT_USER_CONTEXT);
            const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
            const params = await en_thrift_connector_1.makeConverterParams({
                trc: context.trc,
                graphTransaction: graphTransaction,
                personalUserId,
                vaultUserId,
                localSettings: context.localSettings,
                offlineContentStrategy,
            });
            for (const key in lock.unknownUsers) {
                const contact = lock.unknownUsers[key];
                await en_thrift_connector_1.ProfileConverter.convertFromService(context.trc, params, syncContext, en_thrift_connector_1.profileFromContact(contact));
            }
        });
    }
    const note = await context.db.getNode(context, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: en_thrift_connector_1.convertGuidFromService(noteGuid, en_core_entity_types_1.CoreEntityTypes.Note) });
    return {
        isNoteStale: (note === null || note === void 0 ? void 0 : note.version) !== lock.noteUpdateSequenceNumber,
        lockHolderId: lock.lockHolderUserId ? en_thrift_connector_1.convertGuidFromService(lock.lockHolderUserId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User) : null,
        lockRenewBy: lock.lockRenewBy || null,
        viewerIds: (lock.viewingUserIds || []).map(id => en_thrift_connector_1.convertGuidFromService(id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User)),
        viewIdleExpiration: lock.viewIdleExpiration || null,
        currentTime: lock.currentTime || null,
    };
}
function getNoteLockPlugin() {
    const notelockAcquireResolver = toNotelockResolver(async (authData, noteGuid, syncContext, context) => {
        await checkNoteUpsyncStatus(context, en_thrift_connector_1.convertGuidFromService(noteGuid, en_core_entity_types_1.CoreEntityTypes.Note));
        // TODO need to check canEditContent permission on the note before passing this through to the service
        const noteStore = context.thriftComm.getNoteStore(authData.urls.noteStoreUrl);
        const lockStatusRes = await conduit_utils_1.withError(noteStore.acquireNoteLock(context.trc, authData.token, noteGuid));
        if (lockStatusRes.err) {
            if (lockStatusRes.err instanceof conduit_utils_1.AuthError && lockStatusRes.err.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED && lockStatusRes.err.parameter === 'lock') {
                return null;
            }
            throw lockStatusRes.err;
        }
        return toNotelock(lockStatusRes.data, syncContext, context, noteGuid, context.offlineContentStrategy);
    });
    const notelockReleaseResolver = toNotelockResolver(async (authData, noteGuid, syncContext, context) => {
        if (context.db) {
            await conduit_utils_1.withError(context.db.flushRemoteMutations());
        }
        const noteStore = context.thriftComm.getNoteStore(authData.urls.noteStoreUrl);
        return toNotelock(await noteStore.releaseNoteLock(context.trc, authData.token, noteGuid), syncContext, context, noteGuid, context.offlineContentStrategy);
    });
    const notelockStatusResolver = toNotelockResolver(async (authData, noteGuid, syncContext, context) => {
        await checkNoteUpsyncStatus(context, en_thrift_connector_1.convertGuidFromService(noteGuid, en_core_entity_types_1.CoreEntityTypes.Note));
        const noteStore = context.thriftComm.getNoteStore(authData.urls.noteStoreUrl);
        return toNotelock(await noteStore.getNoteLockStatus(context.trc, authData.token, noteGuid), syncContext, context, noteGuid, context.offlineContentStrategy);
    });
    return {
        mutators: {
            notelockAcquire: {
                args: NotelockArgument,
                type: NullableNotelock,
                resolve: notelockAcquireResolver,
            },
            notelockRelease: {
                args: NotelockArgument,
                type: Notelock,
                resolve: notelockReleaseResolver,
            },
        },
        queries: {
            notelockStatus: {
                args: NotelockArgument,
                type: Notelock,
                resolve: notelockStatusResolver,
            },
        },
    };
}
exports.getNoteLockPlugin = getNoteLockPlugin;
//# sourceMappingURL=NoteLock.js.map