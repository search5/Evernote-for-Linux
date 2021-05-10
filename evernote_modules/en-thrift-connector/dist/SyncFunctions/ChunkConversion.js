"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMessageSyncChunk = exports.convertSyncChunk = exports.processSyncUpdates = exports.fetchAndCacheSnippets = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("../Converters/Converters");
const LinkedNotebookHelpers_1 = require("../Converters/LinkedNotebookHelpers");
const MessageAttachmentConverter_1 = require("../Converters/MessageAttachmentConverter");
const MessageConverter_1 = require("../Converters/MessageConverter");
const NotebookConverter_1 = require("../Converters/NotebookConverter");
const NoteConverter_1 = require("../Converters/NoteConverter");
const ResourceConverter_1 = require("../Converters/ResourceConverter");
const SavedSearchConverter_1 = require("../Converters/SavedSearchConverter");
const ShortcutConverter_1 = require("../Converters/ShortcutConverter");
const TagConverter_1 = require("../Converters/TagConverter");
const ThreadConverter_1 = require("../Converters/ThreadConverter");
const WorkspaceConverter_1 = require("../Converters/WorkspaceConverter");
const LinkedNotebookSync_1 = require("./LinkedNotebookSync");
const SyncHelpers_1 = require("./SyncHelpers");
const MAX_SNIPPET_LENGTH = 160;
const CHUNK_CONVERTERS = [
    { converter: WorkspaceConverter_1.WorkspaceConverter, expunged: 'expungedWorkspaces', updated: 'workspaces' },
    { converter: NotebookConverter_1.NotebookConverter, expunged: 'expungedNotebooks', updated: 'notebooks' },
    { converter: TagConverter_1.TagConverter, expunged: 'expungedTags', updated: 'tags' },
    { converter: SavedSearchConverter_1.SavedSearchConverter, expunged: 'expungedSearches', updated: 'searches' },
    { converter: NoteConverter_1.NoteConverter, expunged: 'expungedNotes', updated: 'notes' },
    { converter: ResourceConverter_1.ResourceConverter, expunged: null, updated: 'resources' },
];
async function fetchAndCacheSnippets(trc, thriftComm, auth, guids, transact, setProgress) {
    if (!guids.length) {
        setProgress && await setProgress(trc, 1);
        return {};
    }
    const snippetsOut = {};
    const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const guidChunks = conduit_utils_1.chunkArray(guids.sort(), en_conduit_sync_types_1.EDAM_SNIPPETS_NOTES_MAX);
    let count = 0;
    for (const chunk of guidChunks) {
        const snippets = await noteStore.getNoteSnippetsV2(trc, auth.token, chunk, MAX_SNIPPET_LENGTH) || {};
        await transact(trc, 'cacheSnippets', async (tx) => {
            for (const guid of chunk) {
                if (!snippets.hasOwnProperty(guid)) {
                    conduit_utils_1.logger.warn('Service did not return a snippet for note', guid);
                }
                const snippet = snippets[guid] || ''; // the service will omit any guid that the user doesn't have access to
                const nodeRef = { id: Converters_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Note), type: en_core_entity_types_1.CoreEntityTypes.Note };
                await conduit_utils_1.withError(tx.setNodeCachedField(trc, nodeRef, 'snippet', snippet, {}));
                if (snippetsOut) {
                    snippetsOut[guid] = snippet;
                }
            }
        });
        count += chunk.length;
        setProgress && await setProgress(trc, count / guids.length);
    }
    return snippetsOut;
}
exports.fetchAndCacheSnippets = fetchAndCacheSnippets;
async function processSyncUpdates(trc, converterParams, syncContext, dataConverter, expunged, expungeVersion, updated, timebox) {
    if (timebox) {
        timebox.expungedCompleted = 0;
        timebox.updatedCompleted = 0;
    }
    if (expunged && expunged.length) {
        for (let i = 0; i < expunged.length; ++i) {
            if (timebox && Date.now() >= timebox.endTime) {
                timebox.isFinished = true;
                timebox.expungedCompleted = i;
                return;
            }
            const guid = expunged[i];
            const nodeID = dataConverter.convertGuidFromService(guid);
            const node = await converterParams.graphTransaction.getNode(trc, null, { id: nodeID, type: dataConverter.nodeType });
            if (node && node.version <= expungeVersion) {
                await converterParams.graphTransaction.deleteNode(trc, syncContext, {
                    id: nodeID,
                    type: dataConverter.nodeType,
                });
            }
        }
    }
    if (timebox) {
        timebox.expungedCompleted = expunged ? expunged.length : 0;
    }
    if (updated && updated.length) {
        for (let i = 0; i < updated.length; ++i) {
            if (timebox && Date.now() >= timebox.endTime) {
                timebox.isFinished = true;
                timebox.updatedCompleted = i;
                return;
            }
            await dataConverter.convertFromService(trc, converterParams, syncContext, updated[i]);
        }
    }
    if (timebox) {
        timebox.updatedCompleted = updated ? updated.length : 0;
    }
}
exports.processSyncUpdates = processSyncUpdates;
async function convertSyncChunk(trc, params, chunk, lastUpdateCount, onChunkProcess) {
    const expungeVersion = chunk.chunkHighUSN || chunk.prevChunkHighUSN || 0;
    let isChunkProcessed = false;
    while (!isChunkProcessed) {
        await params.yieldCheck;
        isChunkProcessed = await params.syncEngine.transact(trc, 'convertSyncChunk', async (graphTransaction) => {
            const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
            const timebox = {
                endTime: Date.now() + params.chunkTimebox,
                isFinished: false,
                expungedCompleted: 0,
                updatedCompleted: 0,
            };
            // Preferences don't get timeboxed
            if (chunk.preferences && chunk.preferences.preferences) {
                const pref = Object.assign({ userId: params.personalUserID }, chunk.preferences);
                await processSyncUpdates(trc, converterParams, params.syncContext, ShortcutConverter_1.ShortcutConverter, null, expungeVersion, [pref]);
                delete chunk.preferences;
            }
            let expungedLinkedNbs = await LinkedNotebookHelpers_1.getExpungedLinkedNotebooks(trc, graphTransaction, chunk.notebooks) || [];
            expungedLinkedNbs = chunk.expungedLinkedNotebooks ? chunk.expungedLinkedNotebooks.concat(expungedLinkedNbs) : expungedLinkedNbs;
            const { partialNbsToAdd, partialNbsToRemove } = await LinkedNotebookHelpers_1.processLinkedNotebooksForPartialNotebooks(trc, graphTransaction, params.syncEngine.businessId, chunk.linkedNotebooks, expungedLinkedNbs);
            if (partialNbsToAdd) {
                chunk.notebooks = chunk.notebooks ? chunk.notebooks.concat(partialNbsToAdd) : partialNbsToAdd;
            }
            if (partialNbsToRemove) {
                chunk.expungedNotebooks = chunk.expungedNotebooks ? chunk.expungedNotebooks.concat(partialNbsToRemove) : partialNbsToRemove;
            }
            if (expungedLinkedNbs) {
                const removeProcess = expungedLinkedNbs.map(async (expungedLinkedNB) => {
                    const syncContext = LinkedNotebookSync_1.linkedNotebookSyncContext(expungedLinkedNB);
                    const metadata = await graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                    if (metadata && metadata.sharedNotebookGlobalID) {
                        const syncStatePath = ['sharing', 'sharedNotebooks', metadata.sharedNotebookGlobalID];
                        await graphTransaction.deleteSyncState(trc, syncStatePath);
                    }
                    await LinkedNotebookSync_1.deleteLinkedNotebookContext(trc, graphTransaction, expungedLinkedNB);
                });
                await conduit_utils_1.allSettled(removeProcess);
            }
            let count = 0;
            for (const cinfo of CHUNK_CONVERTERS) {
                const converter = cinfo.converter;
                const expunged = cinfo.expunged ? chunk[cinfo.expunged] : null;
                const updated = chunk[cinfo.updated];
                await processSyncUpdates(trc, converterParams, params.syncContext, converter, expunged, expungeVersion, updated, timebox);
                if (expunged && cinfo.expunged) {
                    if (timebox.expungedCompleted === expunged.length) {
                        delete chunk[cinfo.expunged];
                    }
                    else if (timebox.expungedCompleted) {
                        chunk[cinfo.expunged] = expunged.slice(timebox.expungedCompleted);
                    }
                }
                if (updated) {
                    if (timebox.updatedCompleted === updated.length) {
                        delete chunk[cinfo.updated];
                    }
                    else if (timebox.updatedCompleted) {
                        chunk[cinfo.updated] = updated.slice(timebox.updatedCompleted);
                    }
                }
                if (timebox.isFinished) {
                    break;
                }
                count++;
            }
            const isComplete = count === CHUNK_CONVERTERS.length;
            if (params.syncStatePath && isComplete && lastUpdateCount !== undefined) {
                const update = {
                    lastUpdateCount,
                };
                await graphTransaction.updateSyncState(trc, params.syncStatePath, update);
            }
            onChunkProcess && await onChunkProcess(graphTransaction);
            return isComplete;
        });
        if (!isChunkProcessed) {
            await conduit_utils_1.sleep(100);
        }
    }
}
exports.convertSyncChunk = convertSyncChunk;
async function convertMessageSyncChunk(trc, params, chunk, syncTime) {
    const localSyncState = await SyncHelpers_1.getLocalSyncState(trc, params, SyncHelpers_1.EmptySyncState);
    let newUpdateCount = localSyncState.lastUpdateCount;
    const shareUpdates = [];
    let idsUpdates = [];
    let threadUpdates = [];
    const messageUpdates = [];
    if (chunk) {
        if (typeof chunk.chunkMaxEventId === 'number') {
            newUpdateCount = chunk.chunkMaxEventId;
        }
        const newMessages = chunk.messages || [];
        for (const message of newMessages) {
            messageUpdates.push(message);
            const attachments = message.attachments || [];
            for (const attachment of attachments) {
                if (!attachment.guid) {
                    continue;
                }
                const { senderId, sentAt } = message;
                shareUpdates.push({ attachment, senderId, sentAt });
            }
        }
        idsUpdates = idsUpdates.concat(chunk.identities || []);
        threadUpdates = threadUpdates.concat(chunk.threads || []);
    }
    const syncStateNeedsUpate = newUpdateCount !== localSyncState.lastUpdateCount;
    if (!(shareUpdates.length || idsUpdates.length || threadUpdates.length || messageUpdates.length || syncStateNeedsUpate)) {
        return;
    }
    await params.syncEngine.transact(trc, 'processShareUpdates', async (graphTransaction) => {
        const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
        for (const update of idsUpdates) {
            await MessageAttachmentConverter_1.addNewIdentity(trc, converterParams, params.syncContext, update);
        }
        for (const update of messageUpdates) {
            await MessageConverter_1.MessageConverter.convertFromService(trc, converterParams, params.syncContext, update);
        }
        for (const update of threadUpdates) {
            await ThreadConverter_1.ThreadConverter.convertFromService(trc, converterParams, params.syncContext, update);
        }
        await ThreadConverter_1.ThreadConverter.updateMessageMaxForThreads(trc, converterParams, params.syncContext, messageUpdates);
        for (const update of shareUpdates) {
            if (update.senderId === params.personalUserID) {
                // shared by the current user, ignore it
                continue;
            }
            await MessageAttachmentConverter_1.addNewShare(trc, converterParams, params.syncContext, update.attachment.guid, update.senderId, update.sentAt, update.attachment);
        }
        if (syncStateNeedsUpate && params.syncStatePath) {
            await graphTransaction.updateSyncState(trc, params.syncStatePath, {
                lastUpdateCount: newUpdateCount,
            });
        }
    });
}
exports.convertMessageSyncChunk = convertMessageSyncChunk;
//# sourceMappingURL=ChunkConversion.js.map