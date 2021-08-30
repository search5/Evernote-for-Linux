"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteFieldResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Auth_1 = require("../Auth");
const ChunkConversion_1 = require("../SyncFunctions/ChunkConversion");
const FETCH_DELAY = 1000;
const gTracePool = new conduit_utils_1.AsyncTracePool('SnippetBatchFetch');
function NoteFieldResolver() {
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
            const noteStore = context.comm.getNoteStore(auth.urls.noteStoreUrl);
            const secret = await noteStore.shareNote(context.trc, auth.token, en_thrift_connector_1.convertGuidToService(note.id, en_core_entity_types_1.CoreEntityTypes.Note));
            url = en_thrift_connector_1.getNoteShareUrl(auth.urlHost, auth.shard, note.id, secret);
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
            await tx.setNodeCachedField(context.trc, { id: note.id, type: en_core_entity_types_1.CoreEntityTypes.Note }, 'shareUrl', url, { 'Attributes.Share.shareDate': note.NodeFields.Attributes.Share.shareDate });
        });
        return url;
    }
    async function fetchAndCacheSnippetsImpl(context, syncContext, guids, handleError) {
        conduit_core_1.validateDB(context);
        const metadata = await context.db.getSyncContextMetadataWithoutGraphQLContext(context.trc, syncContext);
        if (!metadata || !metadata.authToken) {
            throw new Error('not authorized');
        }
        const auth = Auth_1.decodeAuthData(metadata.authToken);
        try {
            return await ChunkConversion_1.fetchAndCacheSnippets(context.trc, context.comm, auth, guids, (trc2, name, cb) => {
                return context.db.transactSyncedStorage(trc2, name, cb);
            });
        }
        catch (err) {
            if (handleError) {
                if (err instanceof conduit_utils_1.AuthError) {
                    err = await context.db.handleAuthError(context.trc, err);
                }
                if (err instanceof conduit_utils_1.RetryError) {
                    await conduit_utils_1.sleep(err.timeout);
                    return await fetchAndCacheSnippetsImpl(context, syncContext, guids, false);
                }
            }
            throw err;
        }
    }
    async function batchFetchAndCacheNoteSnippets(context, syncContext, handleError) {
        // buffer incoming requests so we can batch request the snippets
        await conduit_utils_1.sleep(FETCH_DELAY);
        // DO NOT SPLIT UP THIS BLOCK WITH AN AWAIT!
        const guids = Object.keys(pendingSnippetFetchesBySyncContext[syncContext]);
        pendingSnippetFetchesBySyncContext[syncContext] = {};
        delete fetchPromises[syncContext];
        return await fetchAndCacheSnippetsImpl(context, syncContext, guids, handleError);
    }
    function asyncFetchAndCacheNoteSnippet(context, node, syncContext, handleError) {
        const serviceGuid = en_thrift_connector_1.convertGuidToService(node.id, en_core_entity_types_1.CoreEntityTypes.Note);
        pendingSnippetFetchesBySyncContext[syncContext] = pendingSnippetFetchesBySyncContext[syncContext] || {};
        pendingSnippetFetchesBySyncContext[syncContext][serviceGuid] = true;
        if (!fetchPromises[syncContext]) {
            const trc = gTracePool.alloc();
            const fetch = gTracePool.releaseWhenSettled(trc, batchFetchAndCacheNoteSnippets(context, syncContext, handleError));
            fetch.catch(err => {
                conduit_utils_1.logger.error(`Failed to fetch note snippets for syncContext ${syncContext}`, err);
            });
            fetchPromises[syncContext] = fetch;
        }
        return fetchPromises[syncContext];
    }
    async function resolveNoteCardSnippet(context, noteID) {
        conduit_core_1.validateDB(context);
        const localNote = await context.db.getNode(context, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, true);
        if (!localNote) {
            throw new conduit_utils_1.NotFoundError(noteID, 'Note not found in local DB');
        }
        if (!localNote.version) {
            conduit_utils_1.logger.debug(`Note ${noteID} not upsynced yet. Returning empty snippet`);
            return '';
        }
        let fetchPromise;
        let res = await context.db.getNodeCachedField(context, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, 'snippet', async (note, syncContext) => {
            // should handle AuthErrors if watcher is present in resolver as we don't await on promise below.
            fetchPromise = asyncFetchAndCacheNoteSnippet(context, note, syncContext, Boolean(context.watcher));
            return undefined;
        });
        if (!res && !context.watcher && fetchPromise) {
            // GraphQL query has no subscription, so wait for the data
            const serviceGuid = en_thrift_connector_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note);
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
        let res = await context.db.getNodeCachedField(context, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, 'shareUrl', async (note, syncContext) => {
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
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
            description: 'NOTE: has to fetch from the service on demand if not in cache',
            resolve: async (nodeRef, _, context) => {
                return resolveNoteCardSnippet(context, nodeRef.id);
            },
        },
        'Note.shareUrl': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
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