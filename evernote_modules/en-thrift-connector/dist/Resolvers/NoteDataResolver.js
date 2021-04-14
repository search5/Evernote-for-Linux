"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteDataResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
const Helpers_1 = require("../Converters/Helpers");
const InvitationConverter_1 = require("../Converters/InvitationConverter");
const NotebookConverter_1 = require("../Converters/NotebookConverter");
const NoteConverter_1 = require("../Converters/NoteConverter");
const Helpers_2 = require("../Helpers");
const LinkedNotebookSync_1 = require("../SyncFunctions/LinkedNotebookSync");
const SharedNoteSync_1 = require("../SyncFunctions/SharedNoteSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
// these are the fields not available with just metadata
const NOTE_NON_META_FIELDS = {
    // fields:
    shareCount: true,
    noteResourceCountMax: true,
    uploadLimit: true,
    resourceSizeMax: true,
    noteSizeMax: true,
    uploaded: true,
    // edges:
    attachments: true,
    inactiveAttachments: true,
    memberships: true,
};
function needsFullData(fieldSelection) {
    // technically all of the content blob fields are missing, but only require a demand fetch if the actual content is requested
    if (needsContent(fieldSelection)) {
        return 'content.content';
    }
    for (const key in fieldSelection) {
        if (conduit_core_1.shouldIgnoreFieldSelection(fieldSelection, key)) {
            continue;
        }
        if (NOTE_NON_META_FIELDS.hasOwnProperty(key)) {
            return key;
        }
    }
    return null;
}
function needsContent(fieldSelection) {
    return Boolean(fieldSelection.content && fieldSelection.content.content);
}
function getNoteDataResolver(getSearchShareAcceptMetadata) {
    async function NoteDataResolver(context, nodeOrRef, fieldSelection) {
        if (!nodeOrRef || !fieldSelection) {
            return conduit_storage_1.isGraphNode(nodeOrRef) ? nodeOrRef : null;
        }
        let keyRequiringFetch = null;
        if (conduit_storage_1.isGraphNode(nodeOrRef)) {
            if (!nodeOrRef.NodeFields.isMetadata) {
                return nodeOrRef;
            }
            keyRequiringFetch = needsFullData(fieldSelection);
            if (!keyRequiringFetch) {
                return nodeOrRef;
            }
        }
        else {
            // attempting to fetch note on demand from service.
            keyRequiringFetch = 'FullNode';
        }
        // TODO move all this to a SyncActivity and dedupe/sequence requests there
        conduit_utils_1.logger.debug('Fetching note for field', keyRequiringFetch, nodeOrRef.id);
        conduit_utils_1.traceEventStart(context.trc, 'demandFetchNoteData', { keyRequiringFetch });
        return await conduit_utils_1.traceEventEndWhenSettled(context.trc, 'demandFetchNoteData', demandFetchNoteData(context, nodeOrRef, fieldSelection));
    }
    async function demandFetchNoteData(context, nodeOrRef, fieldSelection) {
        conduit_core_1.validateDB(context);
        const [vaultMetadata, personalMetadata] = await conduit_utils_1.allSettled([
            context.db.getSyncContextMetadata(context, conduit_core_1.VAULT_USER_CONTEXT),
            context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT),
        ]);
        const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
        const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
        const fetchContent = needsContent(fieldSelection);
        let fetchedNote = false;
        const searchShareMetadata = getSearchShareAcceptMetadata(nodeOrRef.id);
        if (searchShareMetadata) {
            fetchedNote = await acceptAndFetchSharedNote(context, nodeOrRef.id, searchShareMetadata, personalUserId, vaultUserId, fetchContent);
        }
        else {
            fetchedNote = await fetchPersonalNote(context, nodeOrRef, personalMetadata, vaultMetadata, personalUserId, vaultUserId, fetchContent);
        }
        return fetchedNote ? await context.db.getNode(context, nodeOrRef, true) : null;
    }
    async function fetchPersonalNote(context, nodeOrRef, personalMetadata, vaultMetadata, personalUserId, vaultUserId, fetchContent) {
        conduit_core_1.validateDB(context);
        conduit_utils_1.logger.debug(`Demand fetch: attempting to fetch note ${nodeOrRef.id} from user's account`);
        const { db, trc } = context;
        let syncContext;
        let metadata;
        if (conduit_storage_1.isGraphNode(nodeOrRef)) {
            syncContext = await Helpers_2.getBestSyncContextForNode(trc, nodeOrRef, context.db.syncContextMetadataProvider, null);
            metadata = await db.getSyncContextMetadata(context, syncContext);
        }
        else {
            // for on demand fetch, we don't know which syncContext to use. So, prefer vault if present, otherwise personal.
            syncContext = vaultMetadata ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT;
            metadata = vaultMetadata || personalMetadata;
        }
        if (!metadata || !metadata.authToken) {
            throw new Error('not authorized');
        }
        const auth = Auth_1.decodeAuthData(metadata.authToken);
        const serviceData = await fetchNoteAndNotebook(context, nodeOrRef.id, auth, fetchContent);
        if (serviceData === null || serviceData === void 0 ? void 0 : serviceData.note) {
            // vault user can access to notes after leaving notebook.
            // Check existence of note's parent and throw NotFoundError if the note is orphan.
            if (syncContext === conduit_core_1.VAULT_USER_CONTEXT && serviceData.note.notebookGuid) {
                const backingNbToWs = (await context.db.getSyncState(trc, null, ['workspaces', 'backingNbToWs']) || {});
                const parentId = backingNbToWs[serviceData.note.notebookGuid] || Converters_1.convertGuidFromService(serviceData.note.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook);
                const parentType = backingNbToWs[serviceData.note.notebookGuid] ? en_core_entity_types_1.CoreEntityTypes.Workspace : en_core_entity_types_1.CoreEntityTypes.Notebook;
                const parent = await context.db.getNode(context, { id: parentId, type: parentType });
                if (!parent) {
                    conduit_utils_1.logger.info(`Trying to fetch note ${nodeOrRef.id} but its parent ${parentId} is not found from the local db`);
                    throw new conduit_utils_1.NotFoundError(nodeOrRef.id, 'Fetching note without notebook is forbidden');
                }
            }
            await applyServiceDataToGraph(context, serviceData, syncContext, personalUserId, vaultUserId);
        }
        return Boolean(serviceData === null || serviceData === void 0 ? void 0 : serviceData.note);
    }
    async function applyServiceDataToGraph(context, serviceData, syncContext, personalUserId, vaultUserId, shareNbSyncContext) {
        conduit_core_1.validateDB(context);
        const { db, trc, localSettings } = context;
        await db.transactSyncedStorage(trc, 'getNote', async (tx) => {
            const params = await Helpers_1.makeConverterParams({
                trc,
                graphTransaction: tx,
                personalUserId,
                vaultUserId,
                localSettings,
                offlineContentStrategy: context.offlineContentStrategy,
            });
            await NoteConverter_1.NoteConverter.convertFromService(trc, params, syncContext, serviceData.note);
            if (serviceData.notebook && shareNbSyncContext) {
                // call converter again to attach shared notebook sync context to note.
                await NoteConverter_1.NoteConverter.convertFromService(trc, params, shareNbSyncContext, serviceData.note);
                await NotebookConverter_1.NotebookConverter.convertFromService(trc, params, shareNbSyncContext, serviceData.notebook);
            }
        });
    }
    async function fetchNoteAndNotebook(context, noteID, auth, includeContent, nbGuid) {
        conduit_core_1.validateDB(context);
        const noteStore = context.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceGuid = Converters_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note);
        const specs = new en_conduit_sync_types_1.TNoteResultSpec({ includeContent, includeSharedNotes: true });
        try {
            let notebook = null;
            if (nbGuid) {
                notebook = await noteStore.getNotebook(context.trc, auth.token, nbGuid);
            }
            const note = await noteStore.getNoteWithResultSpec(context.trc, auth.token, serviceGuid, specs);
            conduit_utils_1.logger.debug(`Demand fetch: fetched note ${note.guid} ${nbGuid ? `and notebook ${notebook === null || notebook === void 0 ? void 0 : notebook.guid}` : ''} from service`);
            return { note, notebook };
        }
        catch (err) {
            if (err instanceof conduit_utils_1.ServiceError && err.errorKey.toLowerCase() === 'note.guid' && err.errorType === 'EDAMNotFoundException') {
                // note not found on service.
                conduit_utils_1.logger.info(`Demand fetch: Note ${noteID} not found on service. Possibly lost access`);
                return null;
            }
            if (err instanceof conduit_utils_1.AuthError) {
                err = context.db.handleAuthError(context.trc, err);
                if (err instanceof conduit_utils_1.RetryError) {
                    throw err;
                }
                conduit_utils_1.logger.warn('Demand fetch: fetchNoteAndNotebook AuthError ', err);
                return null;
            }
            if (err instanceof conduit_utils_1.RetryError) {
                // offline
                return null;
            }
            throw err;
        }
    }
    async function acceptNoteShare(context, noteID, params) {
        const noteGuid = Converters_1.convertGuidToService(noteID, 'Note');
        const invitationID = Converters_1.convertGuidFromService(Converters_1.convertGuidToService(noteID, 'Note'), 'Invitation');
        const invitation = await params.graphTransaction.getNode(context.trc, null, { id: invitationID, type: en_core_entity_types_1.CoreEntityTypes.Invitation });
        if (!invitation) {
            conduit_utils_1.logger.debug(`No invitation exists for ${noteID}.`);
            return null;
        }
        try {
            const { shareState } = await InvitationConverter_1.acceptSharedNote(context.trc, params, invitation);
            // create sync context metadata
            const syncContext = SharedNoteSync_1.sharedNoteSyncContext(noteGuid);
            const shareAuth = Auth_1.decodeAuthData(shareState.authStr);
            await SharedNoteSync_1.createSharedNoteSyncContextMetadata(context.trc, params.graphTransaction, noteGuid, syncContext, shareState.ownerId || shareAuth.userID, shareState.authStr, shareState.noteStoreUrl, [syncContext, 'notestore']);
            conduit_utils_1.logger.info(`Demand fetch: Accepted share for note ${noteID}`);
            return { syncContext, auth: shareAuth };
        }
        catch (err) {
            conduit_utils_1.logger.warn('Demand fetch: Failed to accept share for invitation ', invitation.id, err);
            return null;
        }
    }
    async function acceptNotebookShare(context, noteID, params, shareMetadata, auth, noteStoreUrl) {
        conduit_core_1.validateDB(context);
        const nbID = Converters_1.convertGuidFromService(shareMetadata.nbGuid, 'Notebook');
        const backingNbToWs = await params.graphTransaction.getSyncState(context.trc, null, ['workspaces', 'backingNbToWs']);
        if (backingNbToWs && backingNbToWs[nbID]) {
            conduit_utils_1.logger.debug(`Demand fetch: note belongs to ws backing notebook. ${backingNbToWs[nbID]}`);
            return null;
        }
        const notebook = await params.graphTransaction.getNode(context.trc, null, { id: nbID, type: en_core_entity_types_1.CoreEntityTypes.Notebook });
        if (notebook) {
            conduit_utils_1.logger.debug(`Demand fetch: Shared notebook already present for note ${noteID}`);
            const syncContext = await Helpers_2.getBestSyncContextForNode(context.trc, notebook, context.db.syncContextMetadataProvider, null);
            const metadata = await context.db.getSyncContextMetadata(context, syncContext);
            if (!metadata) {
                conduit_utils_1.logger.error(`Demand fetch: note ${noteID} notebook ${nbID} in graph but metadata not found for syncContext ${syncContext}`);
                return null;
            }
            return { syncContext, auth: Auth_1.decodeAuthData(metadata.authToken) };
        }
        try {
            const { shareState } = await InvitationConverter_1.acceptSharedNotebook(context.trc, params, auth.vaultAuth ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, {
                shardId: shareMetadata.shardId,
                shareName: shareMetadata.shareName,
                shareKey: shareMetadata.nbGuid,
                noteStoreUrl,
            });
            // create sync context metadata
            const syncContext = LinkedNotebookSync_1.linkedNotebookSyncContext(shareState.linkedNotebook.guid);
            await LinkedNotebookSync_1.createSharedNotebookSyncContextMetadata(context.trc, params.graphTransaction, syncContext, shareState.ownerId, shareState.authStr, shareState.guid, noteStoreUrl, [syncContext, 'notestore']);
            conduit_utils_1.logger.info(`Demand fetch: Accepted shared notebook ${nbID} for note ${noteID}`);
            return { syncContext, auth: Auth_1.decodeAuthData(shareState.authStr), sharedNbGlobalID: shareState.sharedNotebookId, fetchNbGuid: shareMetadata.nbGuid };
        }
        catch (err) {
            conduit_utils_1.logger.warn('Demand fetch: Failed to accept notebook share for note ', noteID, shareMetadata, err);
            return null;
        }
    }
    async function updateSharedSyncContextMetadataHelper(context, nodeRef, syncContext, isValidMembership) {
        conduit_core_1.validateDB(context);
        const { db, trc } = context;
        const membershipProvider = async () => {
            const ownMemberships = await db.queryGraph(context, en_core_entity_types_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', { parent: nodeRef });
            return await db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Membership, ownMemberships.map(idx => idx.id)) || [];
        };
        const transactionProvider = async (debugName, func) => {
            await db.transactSyncedStorage(trc, debugName, func);
        };
        await SyncHelpers_1.updateSyncContextPrivilegeImpl(trc, nodeRef, syncContext, membershipProvider, transactionProvider, isValidMembership);
    }
    async function acceptAndFetchSharedNote(context, noteID, shareMetadata, personalUserId, vaultUserId, fetchContent) {
        conduit_core_1.validateDB(context);
        conduit_utils_1.logger.debug(`Attempting to accept shares for note ${noteID} `, shareMetadata);
        const { db, trc, localSettings } = context;
        const authState = await db.getAuthTokenAndState(trc, null);
        if (!authState || !authState.token) {
            throw new Error('Not logged in');
        }
        const personalAuth = Auth_1.decodeAuthData(authState.token);
        const noteStoreUrl = `${personalAuth.thriftHost}/shard/${shareMetadata.shardId}/notestore`;
        // first accept share for note and also shared nb if applicable.
        const { noteShareData, nbShareData } = await db.transactSyncedStorage(trc, 'demandFetchNoteAcceptShares', async (tx) => {
            const converterParams = await Helpers_1.makeConverterParams({
                trc,
                graphTransaction: tx,
                personalUserId,
                vaultUserId,
                localSettings,
                offlineContentStrategy: context.offlineContentStrategy,
            });
            const mutatorParams = Object.assign(Object.assign({}, converterParams), { personalAuth, thriftComm: context.thriftComm });
            // Need to accept both note and nb shares as conduit doesn't know how the note is shared
            // and also to derive best sync context and permissions in case its both.
            // FIXME not great to do this inside a transaction but it's no worse than our existing share accept logic via mutations.
            const noteData = await acceptNoteShare(context, noteID, mutatorParams);
            const nbData = await acceptNotebookShare(context, noteID, mutatorParams, shareMetadata, personalAuth, noteStoreUrl);
            return { noteShareData: noteData, nbShareData: nbData };
        });
        if (!nbShareData && !noteShareData) {
            return false;
        }
        // fetch note and shared nb from service and write it to graph.
        const serviceData = await fetchNoteAndNotebook(context, noteID, (nbShareData === null || nbShareData === void 0 ? void 0 : nbShareData.auth) || noteShareData.auth, fetchContent, nbShareData === null || nbShareData === void 0 ? void 0 : nbShareData.fetchNbGuid);
        if (serviceData) {
            await applyServiceDataToGraph(context, serviceData, (noteShareData === null || noteShareData === void 0 ? void 0 : noteShareData.syncContext) || nbShareData.syncContext, personalUserId, vaultUserId, nbShareData === null || nbShareData === void 0 ? void 0 : nbShareData.syncContext);
            // update syncContextMetadata with right privilege so that we can choose correct sync context for this note.
            if (noteShareData) {
                await updateSharedSyncContextMetadataHelper(context, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, noteShareData.syncContext, SharedNoteSync_1.isValidSharedNoteMembershipProvider(noteID));
            }
            if (nbShareData && nbShareData.sharedNbGlobalID) {
                await updateSharedSyncContextMetadataHelper(context, { id: Converters_1.convertGuidFromService(shareMetadata.nbGuid, en_core_entity_types_1.CoreEntityTypes.Notebook), type: en_core_entity_types_1.CoreEntityTypes.Notebook }, nbShareData.syncContext, LinkedNotebookSync_1.isValidSharedNotebookMembershipProvider(nbShareData.sharedNbGlobalID));
            }
        }
        return Boolean(serviceData === null || serviceData === void 0 ? void 0 : serviceData.note);
    }
    return NoteDataResolver;
}
exports.getNoteDataResolver = getNoteDataResolver;
//# sourceMappingURL=NoteDataResolver.js.map