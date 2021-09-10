"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitNoteDemandFetchActivity = exports.addNoteToDemandFetchActivity = exports.demandFetchNoteActivityHydrator = exports.DemandFetchNoteActivity = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Auth_1 = require("../Auth");
const LinkedNotebookSync_1 = require("../SyncFunctions/LinkedNotebookSync");
const SharedNoteSync_1 = require("../SyncFunctions/SharedNoteSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const ENSyncActivity_1 = require("./ENSyncActivity");
let gChunkTimebox = conduit_utils_1.registerDebugSetting('DemandFetchNoteActivityChunkTimebox', 400, v => gChunkTimebox = v);
const fetchNoteContentRequests = {};
const awaitedRequests = {};
const cachedNotFounds = {};
const NOTE_CACHE_TIMEOUT = conduit_utils_1.MILLIS_IN_ONE_HOUR * 24;
function checkCacheForNotFound(noteID) {
    if (cachedNotFounds[noteID]) {
        if (cachedNotFounds[noteID] > Date.now() - NOTE_CACHE_TIMEOUT) {
            return true;
        }
        delete cachedNotFounds[noteID];
    }
    return false;
}
async function applyServiceDataToGraph(trc, syncParams, note, syncContext, personalUserId, vaultUserId, shareNbSyncContext) {
    const { localSettings, offlineContentStrategy } = syncParams;
    await syncParams.syncEngine.graphStorage.transact(trc, 'getNote', async (tx) => {
        const params = await en_thrift_connector_1.makeConverterParams({
            trc,
            graphTransaction: tx,
            personalUserId,
            vaultUserId,
            localSettings,
            offlineContentStrategy,
        });
        await en_thrift_connector_1.NoteConverter.convertFromService(trc, params, syncContext, note);
        if (shareNbSyncContext) {
            // call converter again to attach shared notebook sync context to note.
            await en_thrift_connector_1.NoteConverter.convertFromService(trc, params, shareNbSyncContext, note);
        }
    });
}
async function fetchNoteFromService(trc, syncParams, noteID, auth, includeContent) {
    const noteStore = syncParams.comm.getNoteStore(auth.urls.noteStoreUrl);
    const serviceGuid = en_thrift_connector_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note);
    const specs = new en_conduit_sync_types_1.TNoteResultSpec({ includeContent, includeSharedNotes: true });
    try {
        const note = await noteStore.getNoteWithResultSpec(trc, auth.token, serviceGuid, specs);
        conduit_utils_1.logger.debug(`Demand fetch: fetched note ${note.guid} from service`);
        return note;
    }
    catch (err) {
        if (err instanceof conduit_utils_1.ServiceError && err.errorKey.toLowerCase() === 'note.guid' && err.errorType === 'EDAMNotFoundException') {
            // note not found on service.
            conduit_utils_1.logger.info(`Demand fetch: Note ${noteID} not found on service. Possibly lost access`);
            return null;
        }
        if (err instanceof conduit_utils_1.AuthError) {
            err = await syncParams.di.handleAuthError(trc, err);
            if (err instanceof conduit_utils_1.RetryError) {
                throw err;
            }
            conduit_utils_1.logger.warn('Demand fetch: fetchNoteFromService AuthError ', err);
            return null;
        }
        if (err instanceof conduit_utils_1.RetryError) {
            // offline
            return null;
        }
        throw err;
    }
}
async function acceptNoteShare(trc, noteID, params) {
    const noteGuid = en_thrift_connector_1.convertGuidToService(noteID, 'Note');
    const invitationID = en_thrift_connector_1.convertGuidFromService(en_thrift_connector_1.convertGuidToService(noteID, 'Note'), 'Invitation');
    const invitation = await params.graphTransaction.getNode(trc, null, { id: invitationID, type: en_core_entity_types_1.CoreEntityTypes.Invitation });
    if (!invitation) {
        conduit_utils_1.logger.debug(`No invitation exists for ${noteID}.`);
        return null;
    }
    try {
        const { shareState } = await en_thrift_connector_1.acceptSharedNote(trc, params, invitation);
        // create sync context metadata
        const syncContext = SharedNoteSync_1.sharedNoteSyncContext(noteGuid);
        const shareAuth = Auth_1.decodeAuthData(shareState.authStr);
        await SharedNoteSync_1.createSharedNoteSyncContextMetadata(trc, params.graphTransaction, noteGuid, syncContext, shareState.ownerId || shareAuth.userID, shareState.authStr, shareState.noteStoreUrl, [syncContext, 'notestore']);
        conduit_utils_1.logger.info(`Demand fetch: Accepted share for note ${noteID}`);
        return { syncContext, auth: shareAuth };
    }
    catch (err) {
        conduit_utils_1.logger.warn('Demand fetch: Failed to accept share for invitation ', invitation.id, err);
        return null;
    }
}
async function acceptNotebookShare(trc, storage, noteID, params, shareMetadata, auth, noteStoreUrl) {
    const nbID = en_thrift_connector_1.convertGuidFromService(shareMetadata.nbGuid, 'Notebook');
    const backingNbToWs = await params.graphTransaction.getSyncState(trc, null, ['workspaces', 'backingNbToWs']);
    if (backingNbToWs && backingNbToWs[nbID]) {
        conduit_utils_1.logger.debug(`Demand fetch: note belongs to ws backing notebook. ${backingNbToWs[nbID]}`);
        return null;
    }
    const notebook = await params.graphTransaction.getNode(trc, null, { id: nbID, type: en_core_entity_types_1.CoreEntityTypes.Notebook });
    if (notebook) {
        conduit_utils_1.logger.debug(`Demand fetch: Shared notebook already present for note ${noteID}`);
        const syncContext = await en_thrift_connector_1.getBestSyncContextForNode(trc, notebook, null, null);
        const metadata = await storage.getSyncContextMetadata(trc, null, syncContext);
        if (!metadata) {
            conduit_utils_1.logger.error(`Demand fetch: note ${noteID} notebook ${nbID} in graph but metadata not found for syncContext ${syncContext}`);
            return null;
        }
        return { syncContext, auth: Auth_1.decodeAuthData(metadata.authToken) };
    }
    try {
        const { shareState } = await en_thrift_connector_1.acceptSharedNotebook(trc, params, auth.vaultAuth ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, {
            shardId: shareMetadata.shardId,
            shareName: shareMetadata.shareName,
            shareKey: shareMetadata.nbGuid,
            noteStoreUrl,
        }, false);
        // create sync context metadata
        const syncContext = LinkedNotebookSync_1.linkedNotebookSyncContext(shareState.linkedNotebook.guid);
        await LinkedNotebookSync_1.createSharedNotebookSyncContextMetadata(trc, params.graphTransaction, syncContext, shareState.ownerId, shareState.authStr, shareState.guid, noteStoreUrl, [syncContext, 'notestore']);
        conduit_utils_1.logger.info(`Demand fetch: Accepted shared notebook ${nbID} for note ${noteID}`);
        return { syncContext, auth: Auth_1.decodeAuthData(shareState.authStr), sharedNbGlobalID: shareState.sharedNotebookId, fetchNbGuid: shareMetadata.nbGuid };
    }
    catch (err) {
        conduit_utils_1.logger.warn('Demand fetch: Failed to accept notebook share for note ', noteID, shareMetadata, err);
        return null;
    }
}
async function updateSharedSyncContextMetadataHelper(trc, storage, nodeRef, syncContext, isValidMembership) {
    const membershipProvider = async () => {
        const ownMemberships = await storage.queryGraph(trc, null, en_core_entity_types_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', { parent: nodeRef });
        return await storage.batchGetNodes(trc, null, en_core_entity_types_1.CoreEntityTypes.Membership, ownMemberships.map(idx => idx.id)) || [];
    };
    const transactionProvider = async (debugName, func) => {
        await storage.transact(trc, debugName, func);
    };
    await SyncHelpers_1.updateSyncContextPrivilegeImpl(trc, nodeRef, syncContext, membershipProvider, transactionProvider, isValidMembership);
}
async function acceptAndFetchSharedNote(trc, syncParams, noteID, shareMetadata, personalUserId, vaultUserId, fetchContent) {
    conduit_utils_1.logger.debug(`Attempting to accept shares for note ${noteID} `, shareMetadata);
    const { personalAuth, localSettings, offlineContentStrategy, comm } = syncParams;
    const storage = syncParams.syncEngine.graphStorage;
    if (!personalAuth) {
        throw new Error('Not logged in');
    }
    const noteStoreUrl = `${personalAuth.thriftHost}/shard/${shareMetadata.shardId}/notestore`;
    // first accept share for note and also shared nb if applicable.
    const { noteShareData, nbShareData } = await storage.transact(trc, 'demandFetchNoteAcceptShares', async (tx) => {
        const converterParams = await en_thrift_connector_1.makeConverterParams({
            trc,
            graphTransaction: tx,
            personalUserId,
            vaultUserId,
            localSettings,
            offlineContentStrategy,
        });
        const mutatorParams = Object.assign(Object.assign({}, converterParams), { personalAuth, thriftComm: comm });
        // Need to accept both note and nb shares as conduit doesn't know how the note is shared
        // and also to derive best sync context and permissions in case its both.
        // FIXME not great to do this inside a transaction but it's no worse than our existing share accept logic via mutations.
        const noteData = await acceptNoteShare(trc, noteID, mutatorParams);
        const nbData = await acceptNotebookShare(trc, storage, noteID, mutatorParams, shareMetadata, personalAuth, noteStoreUrl);
        return { noteShareData: noteData, nbShareData: nbData };
    });
    if (!nbShareData && !noteShareData) {
        return false;
    }
    // fetch note and write it to graph (shared nb was fetched and saved earlier in the acceptNotebookShare)
    const authData = (nbShareData === null || nbShareData === void 0 ? void 0 : nbShareData.auth) || noteShareData.auth;
    const note = await fetchNoteFromService(trc, syncParams, noteID, authData, fetchContent);
    if (!note) {
        return false;
    }
    const syncContext = (noteShareData === null || noteShareData === void 0 ? void 0 : noteShareData.syncContext) || nbShareData.syncContext;
    await applyServiceDataToGraph(trc, syncParams, note, syncContext, personalUserId, vaultUserId, nbShareData === null || nbShareData === void 0 ? void 0 : nbShareData.syncContext);
    // update syncContextMetadata with right privilege so that we can choose correct sync context for this note.
    if (noteShareData) {
        await updateSharedSyncContextMetadataHelper(trc, storage, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, noteShareData.syncContext, SharedNoteSync_1.isValidSharedNoteMembershipProvider(noteID));
    }
    if (nbShareData && nbShareData.sharedNbGlobalID) {
        await updateSharedSyncContextMetadataHelper(trc, storage, { id: en_thrift_connector_1.convertGuidFromService(shareMetadata.nbGuid, en_core_entity_types_1.CoreEntityTypes.Notebook), type: en_core_entity_types_1.CoreEntityTypes.Notebook }, nbShareData.syncContext, LinkedNotebookSync_1.isValidSharedNotebookMembershipProvider(nbShareData.sharedNbGlobalID));
    }
    return Boolean(note);
}
async function fetchPersonalNote(trc, syncParams, noteID, personalMetadata, vaultMetadata, personalUserId, vaultUserId, fetchContent) {
    conduit_utils_1.logger.debug(`Demand fetch: attempting to fetch note ${noteID} from user's account`);
    // for personal fetch, we don't know which syncContext to use. So, prefer vault if present, otherwise personal.
    const syncContext = vaultMetadata ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT;
    const metadata = vaultMetadata || personalMetadata;
    if (!metadata || !metadata.authToken) {
        throw new Error('not authorized');
    }
    const auth = Auth_1.decodeAuthData(metadata.authToken);
    const note = await fetchNoteFromService(trc, syncParams, noteID, auth, fetchContent);
    if (!note) {
        return false;
    }
    // vault user can access to notes after leaving notebook.
    // Check existence of note's parent and throw NotFoundError if the note is orphan.
    if (syncContext === conduit_core_1.VAULT_USER_CONTEXT && note.notebookGuid) {
        const backingNbToWs = (await syncParams.syncEngine.graphStorage.getSyncState(trc, null, ['workspaces', 'backingNbToWs']) || {});
        const parentId = backingNbToWs[note.notebookGuid] || en_thrift_connector_1.convertGuidFromService(note.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook);
        const parentType = backingNbToWs[note.notebookGuid] ? en_core_entity_types_1.CoreEntityTypes.Workspace : en_core_entity_types_1.CoreEntityTypes.Notebook;
        const parent = await syncParams.syncEngine.graphStorage.getNode(trc, null, { id: parentId, type: parentType });
        if (!parent) {
            conduit_utils_1.logger.info(`Trying to fetch note ${noteID} but its parent ${parentId} is not found from the local db`);
            throw new conduit_utils_1.NotFoundError(noteID, 'Fetching note without notebook is forbidden');
        }
    }
    await applyServiceDataToGraph(trc, syncParams, note, syncContext, personalUserId, vaultUserId);
    return Boolean(note);
}
class DemandFetchNoteActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, args, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.DemandFetchNoteActivity,
            priority: args ? en_conduit_sync_types_1.SyncActivityPriority.IMMEDIATE : en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: null,
            lastArgs: args,
        });
        this.di = di;
        this.args = args;
    }
    async demandFetchNoteData(trc, syncParams, noteID, fetchContent, personalMetadata, vaultMetadata) {
        const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
        const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
        let fetchedNote = false;
        let searchShareMetadata = this.di.getSearchShareAcceptMetadata(noteID);
        let fetchError = null;
        if (!checkCacheForNotFound(noteID)) {
            try {
                if (!searchShareMetadata) {
                    const auth = vaultMetadata ? Auth_1.decodeAuthData(vaultMetadata.authToken) : Auth_1.decodeAuthData(personalMetadata.authToken);
                    const noteStore = syncParams.comm.getNoteStore(auth.urls.noteStoreUrl);
                    const serviceNoteID = en_thrift_connector_1.convertGuidToService(noteID, 'Note');
                    const resp = await noteStore.findSearchSuggestionsV2(trc, auth.token, {
                        customAttributes: [{
                                name: 'SearchExQuery',
                                value: `{\"query\":{\"searchStr\":\"noteGuid:\\\"${serviceNoteID}\\\"\"},\"param\":{\"resultSpec\":[{\"type\":\"note_filter\",\"textSearchField\":0}]}}`,
                            }],
                        contextFilter: {
                            includeAllReadableWorkspaces: true,
                            includeAllReadableNotebooks: true,
                        },
                    });
                    if (resp && resp.suggestions) {
                        for (const serverSuggestion of resp.suggestions) {
                            const suggestion = conduit_utils_1.safeParse(serverSuggestion.value);
                            if (suggestion.id === serviceNoteID && suggestion.type === 'note_filter') {
                                if (serverSuggestion.type === 'note_filter' && suggestion.isShared) {
                                    searchShareMetadata = {
                                        shareName: suggestion.containerId,
                                        shardId: `s${suggestion.shardId}`,
                                        nbGuid: suggestion.containerId,
                                    };
                                }
                            }
                        }
                    }
                }
                if (searchShareMetadata) {
                    fetchedNote = await acceptAndFetchSharedNote(trc, syncParams, noteID, searchShareMetadata, personalUserId, vaultUserId, fetchContent);
                }
                else {
                    fetchedNote = await fetchPersonalNote(trc, syncParams, noteID, personalMetadata, vaultMetadata, personalUserId, vaultUserId, fetchContent);
                }
            }
            catch (e) {
                fetchError = e;
            }
            if (!fetchedNote) {
                conduit_utils_1.logger.warn('Unable to fetch note', noteID);
            }
        }
        if (awaitedRequests[noteID]) {
            awaitedRequests[noteID].resolve(fetchedNote);
            delete awaitedRequests[noteID];
        }
        if (!fetchError || !(fetchError instanceof conduit_utils_1.RetryError)) {
            delete fetchNoteContentRequests[noteID];
            if (fetchError) {
                conduit_utils_1.logger.warn('Error fetching note data', fetchError);
                cachedNotFounds[noteID] = Date.now();
            }
        }
    }
    async runSyncImpl(trc) {
        const storage = this.context.syncEngine.graphStorage;
        const syncParams = Object.assign(Object.assign({}, this.initParams('best', null, gChunkTimebox)), { di: this.di });
        const endTime = Date.now() + syncParams.chunkTimebox;
        if (!this.di.getSearchShareAcceptMetadata) {
            conduit_utils_1.logger.error('No getSearchShareAcceptMetadata provided');
            return;
        }
        const nodeIDs = Object.getOwnPropertyNames(fetchNoteContentRequests);
        if (nodeIDs.length) {
            const [vaultMetadata, personalMetadata] = await conduit_utils_1.allSettled([
                storage.getSyncContextMetadata(trc, null, conduit_core_1.VAULT_USER_CONTEXT),
                storage.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT),
            ]);
            if (!personalMetadata) {
                return;
            }
            if (this.args) {
                await this.demandFetchNoteData(trc, syncParams, this.args.noteID, fetchNoteContentRequests[this.args.noteID] || false, personalMetadata, vaultMetadata);
                return;
            }
            for (const noteID of nodeIDs) {
                await syncParams.yieldCheck;
                await this.demandFetchNoteData(trc, syncParams, noteID, fetchNoteContentRequests[noteID], personalMetadata, vaultMetadata);
                if (Date.now() > endTime) {
                    break;
                }
            }
            if (Object.getOwnPropertyNames(fetchNoteContentRequests).length) {
                throw new conduit_utils_1.RetryError('continue with more', 5000);
            }
            else {
                throw new conduit_utils_1.RetryError('continue', 15000);
            }
        }
    }
}
exports.DemandFetchNoteActivity = DemandFetchNoteActivity;
function demandFetchNoteActivityHydrator(di, context, p, timeout) {
    return new DemandFetchNoteActivity(di, context, p.options.lastArgs, p.subpriority, timeout);
}
exports.demandFetchNoteActivityHydrator = demandFetchNoteActivityHydrator;
function addNoteToDemandFetchActivity(noteID, fetchContent) {
    fetchNoteContentRequests[noteID] = Boolean(fetchContent || fetchNoteContentRequests[noteID]);
}
exports.addNoteToDemandFetchActivity = addNoteToDemandFetchActivity;
async function awaitNoteDemandFetchActivity(context, noteID) {
    if (checkCacheForNotFound(noteID)) {
        return false;
    }
    if (fetchNoteContentRequests[noteID] !== undefined) {
        conduit_core_1.validateDB(context);
        if (!awaitedRequests[noteID]) {
            awaitedRequests[noteID] = conduit_utils_1.allocPromise();
            context.db.immediateDemandFetchNote(context.trc, { noteID }).catch(err => {
                if (err instanceof conduit_utils_1.RetryError) {
                    throw err;
                }
                conduit_utils_1.logger.warn('immediateDemandFetchNote failed', err);
                awaitedRequests[noteID].reject(err);
                delete awaitedRequests[noteID];
                return false;
            });
        }
        return awaitedRequests[noteID].promise || false;
    }
    return false;
}
exports.awaitNoteDemandFetchActivity = awaitNoteDemandFetchActivity;
//# sourceMappingURL=DemandFetchNoteActivity.js.map