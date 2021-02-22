"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteFieldResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
const NoteConverter_1 = require("../Converters/NoteConverter");
const ChunkConversion_1 = require("../SyncFunctions/ChunkConversion");
const FETCH_DELAY = 1000;
const gTracePool = new conduit_utils_1.AsyncTracePool('SnippetBatchFetch');
function NoteFieldResolver(thriftComm) {
    const pendingSnippetFetchesBySyncContext = {};
    const fetchPromises = {};
    async function fetchAndCacheShareUrl(context, syncContext, note) {
        conduit_core_1.validateDB(context);
        let url = null;
        try {
            const metadata = await context.db.getSyncContextMetadata(context, syncContext);
            if (!metadata || !metadata.authToken) {
                throw new Error('not authorized');
            }
            const auth = Auth_1.decodeAuthData(metadata.authToken);
            const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
            const secret = await noteStore.shareNote(context.trc, auth.token, Converters_1.convertGuidToService(note.id, en_data_model_1.CoreEntityTypes.Note));
            url = NoteConverter_1.getNoteShareUrl(auth.urlHost, auth.shard, note.id, secret);
        }
        catch (err) {
            // TODO handleAuthError
            if (err instanceof conduit_utils_1.AuthError && err.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED) {
                url = null; // User does not have access to this field.
            }
            else if (err instanceof conduit_utils_1.RetryError) {
                // offline, do not populate the cache
                return null;
            }
            else {
                conduit_utils_1.logger.error('Error fetching shareUrl for note', { noteID: note.id, err });
            }
        }
        await context.db.transactSyncedStorage(context.trc, 'cacheShareUrl', async (tx) => {
            await tx.setNodeCachedField(context.trc, { id: note.id, type: en_data_model_1.CoreEntityTypes.Note }, 'shareUrl', url, { 'Attributes.Share.shareDate': note.NodeFields.Attributes.Share.shareDate });
        });
        return url;
    }
    async function fetchAndCacheSnippetsImpl(trc, db, syncContext, guids, handleError) {
        const metadata = await db.getSyncContextMetadataWithoutGraphQLContext(trc, syncContext);
        if (!metadata || !metadata.authToken) {
            throw new Error('not authorized');
        }
        const auth = Auth_1.decodeAuthData(metadata.authToken);
        try {
            return await ChunkConversion_1.fetchAndCacheSnippets(trc, thriftComm, auth, guids, (trc2, name, cb) => {
                return db.transactSyncedStorage(trc2, name, cb);
            });
        }
        catch (err) {
            if (handleError) {
                if (err instanceof conduit_utils_1.AuthError) {
                    err = await db.handleAuthError(trc, err);
                }
                if (err instanceof conduit_utils_1.RetryError) {
                    await conduit_utils_1.sleep(err.timeout);
                    return await fetchAndCacheSnippetsImpl(trc, db, syncContext, guids, false);
                }
            }
            throw err;
        }
    }
    async function batchFetchAndCacheNoteSnippets(trc, db, syncContext, handleError) {
        // buffer incoming requests so we can batch request the snippets
        await conduit_utils_1.sleep(FETCH_DELAY);
        // DO NOT SPLIT UP THIS BLOCK WITH AN AWAIT!
        const guids = Object.keys(pendingSnippetFetchesBySyncContext[syncContext]);
        pendingSnippetFetchesBySyncContext[syncContext] = {};
        delete fetchPromises[syncContext];
        return await fetchAndCacheSnippetsImpl(trc, db, syncContext, guids, handleError);
    }
    function asyncFetchAndCacheNoteSnippet(db, node, syncContext, handleError) {
        const serviceGuid = Converters_1.convertGuidToService(node.id, en_data_model_1.CoreEntityTypes.Note);
        pendingSnippetFetchesBySyncContext[syncContext] = pendingSnippetFetchesBySyncContext[syncContext] || {};
        pendingSnippetFetchesBySyncContext[syncContext][serviceGuid] = true;
        if (!fetchPromises[syncContext]) {
            const trc = gTracePool.alloc();
            const fetch = gTracePool.releaseWhenSettled(trc, batchFetchAndCacheNoteSnippets(trc, db, syncContext, handleError));
            fetch.catch(err => {
                conduit_utils_1.logger.error(`Failed to fetch note snippets for syncContext ${syncContext}`, err);
            });
            fetchPromises[syncContext] = fetch;
        }
        return fetchPromises[syncContext];
    }
    async function resolveNoteCardSnippet(context, noteID) {
        conduit_core_1.validateDB(context);
        const localNote = await context.db.getNode(context, { id: noteID, type: en_data_model_1.CoreEntityTypes.Note }, true);
        if (!localNote) {
            throw new conduit_utils_1.NotFoundError(noteID, 'Note not found in local DB');
        }
        if (!localNote.version) {
            conduit_utils_1.logger.debug(`Note ${noteID} not upsynced yet. Returning empty snippet`);
            return '';
        }
        let fetchPromise;
        let res = await context.db.getNodeCachedField(context, { id: noteID, type: en_data_model_1.CoreEntityTypes.Note }, 'snippet', async (note, syncContext) => {
            // should handle AuthErrors if watcher is present in resolver as we don't await on promise below.
            fetchPromise = asyncFetchAndCacheNoteSnippet(context.db, note, syncContext, Boolean(context.watcher));
            return undefined;
        });
        if (!res && !context.watcher && fetchPromise) {
            // GraphQL query has no subscription, so wait for the data
            const serviceGuid = Converters_1.convertGuidToService(noteID, en_data_model_1.CoreEntityTypes.Note);
            const snippetsBatch = await fetchPromise;
            if (snippetsBatch && snippetsBatch.hasOwnProperty(serviceGuid)) {
                res = snippetsBatch[serviceGuid];
            }
        }
        return res;
    }
    async function resolveNoteShareUrl(context, noteID) {
        conduit_core_1.validateDB(context);
        let fetchPromise;
        let res = await context.db.getNodeCachedField(context, { id: noteID, type: en_data_model_1.CoreEntityTypes.Note }, 'shareUrl', async (note, syncContext) => {
            // Field must have a share date to be shareable,
            // otherwise getting the share secret will accidently turn on sharing for this note
            if (!note.NodeFields.Attributes.Share.shareDate) {
                return null;
            }
            fetchPromise = fetchAndCacheShareUrl(context, syncContext, note);
            return null;
        });
        if (!res && !context.watcher && fetchPromise) {
            // GraphQL query has no subscription, so wait for the data
            res = await fetchPromise;
        }
        return res;
    }
    const resolvers = {
        'Note.snippet': {
            type: conduit_core_1.schemaToGraphQLType('string?'),
            description: 'NOTE: has to fetch from the service on demand if not in cache',
            resolve: async (nodeRef, _, context) => {
                return resolveNoteCardSnippet(context, nodeRef.id);
            },
        },
        'Note.shareUrl': {
            type: conduit_core_1.schemaToGraphQLType('string?'),
            description: 'NOTE: has to fetch from the service on demand if not in cache',
            resolve: async (nodeRef, _, context) => {
                return resolveNoteShareUrl(context, nodeRef.id);
            },
        },
    };
    return resolvers;
}
exports.NoteFieldResolver = NoteFieldResolver;
//# sourceMappingURL=NoteFieldResolver.js.map