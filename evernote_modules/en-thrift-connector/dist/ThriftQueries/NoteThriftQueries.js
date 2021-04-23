"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNoteMutators = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
const Helpers_1 = require("../Converters/Helpers");
const NoteConverter_1 = require("../Converters/NoteConverter");
const BlobResolver_1 = require("../Resolvers/BlobResolver");
const SharedNoteSync_1 = require("../SyncFunctions/SharedNoteSync");
function addNoteMutators(out, offlineContentStrategy) {
    async function noteCheckForUpdatesResolver(parent, args, context, info) {
        conduit_core_1.validateDB(context);
        if (!args || !args.id) {
            throw new Error('missing args');
        }
        let didUpdate = false;
        const noteRef = { id: args.id, type: en_core_entity_types_1.CoreEntityTypes.Note };
        // grab SyncContextMetadata
        const { node: localNote, syncContext } = await context.db.getNodeWithContext(context, noteRef);
        if (!localNote) {
            throw new conduit_utils_1.NotFoundError(args.id, 'Note not found in local DB');
        }
        if (!localNote.version) {
            conduit_utils_1.logger.debug(`noteCheckForUpdates: Note ${localNote.id} not upsynced to service yet`);
            return { didUpdate, isOffline: false };
        }
        const syncContextMetadata = await context.db.getSyncContextMetadata(context, syncContext);
        if (!syncContextMetadata) {
            throw new conduit_utils_1.NotFoundError(syncContext, 'Sync context not found');
        }
        // fetch note from service
        const auth = Auth_1.decodeAuthData(syncContextMetadata.authToken);
        const noteStoreUrl = syncContextMetadata.sharedNotebookNoteStoreUrl || auth.urls.noteStoreUrl;
        const resp = await conduit_utils_1.withError(SharedNoteSync_1.fetchNote(context.trc, context.thriftComm, auth, Converters_1.convertGuidToService(args.id, en_core_entity_types_1.CoreEntityTypes.Note), noteStoreUrl));
        if (resp.err instanceof conduit_utils_1.RetryError) {
            return {
                didUpdate,
                isOffline: true,
            };
        }
        if (resp.err) {
            throw resp.err;
        }
        const serviceNote = resp.data;
        if (localNote.version < serviceNote.updateSequenceNum) {
            didUpdate = true;
            // TODO this block is all copy-paste except for the convertFromService call, pull this into a helper function and replace all other instances too
            await context.db.transactSyncedStorage(context.trc, 'updateNoteOnDemand', async (graphTransaction) => {
                const personalMetadata = await graphTransaction.getSyncContextMetadata(context.trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
                const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
                const vaultMetadata = await graphTransaction.getSyncContextMetadata(context.trc, null, conduit_core_1.VAULT_USER_CONTEXT);
                const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
                const params = await Helpers_1.makeConverterParams({
                    trc: context.trc,
                    graphTransaction: graphTransaction,
                    personalUserId,
                    vaultUserId,
                    localSettings: context.localSettings,
                    offlineContentStrategy,
                });
                await NoteConverter_1.NoteConverter.convertFromService(context.trc, params, syncContext, serviceNote);
            });
            context.db.clearNodeFetchCache(context, noteRef);
        }
        // fetch and cache content if needed and out of date
        if (args.fetchContent) {
            await BlobResolver_1.resolveContent(context, info, noteRef, 'content');
        }
        return {
            didUpdate,
            isOffline: false,
        };
    }
    out.noteCheckForUpdates = {
        args: conduit_core_1.schemaToGraphQLArgs({ id: 'ID', fetchContent: conduit_utils_1.NullableBoolean }),
        type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({ didUpdate: 'boolean', isOffline: 'boolean' }, 'NoteCheckForUpdatesResult')),
        resolve: noteCheckForUpdatesResolver,
    };
}
exports.addNoteMutators = addNoteMutators;
//# sourceMappingURL=NoteThriftQueries.js.map