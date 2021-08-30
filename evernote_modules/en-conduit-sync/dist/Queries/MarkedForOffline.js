"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMarkedForOfflineMutators = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
function addMarkedForOfflineMutators(out, resourceManager, offlineContentStrategy) {
    async function markedForOfflineResolver(parent, args, context) {
        if (offlineContentStrategy !== conduit_view_types_1.OfflineContentStrategy.SELECTIVE) {
            throw new Error(`Offline Content strategy must be set to ${conduit_view_types_1.OfflineContentStrategy.SELECTIVE} to mark notebooks for offline`);
        }
        if (!resourceManager) {
            throw new Error('Resource Manager needs to be provided on conduit init to downsync attachments');
        }
        if (!args || !args.id || args.setOffline === undefined) {
            throw new Error('Missing args');
        }
        conduit_core_1.validateDB(context);
        const { setOffline, clearData } = args;
        const userID = await context.db.getCurrentUserID(context);
        if (conduit_utils_1.isNullish(userID)) {
            throw new Error('No current user for setting local settings');
        }
        const nbRef = { id: args.id, type: en_core_entity_types_1.CoreEntityTypes.Notebook };
        const nodeWithContext = await context.db.getNodeWithContext(context, nbRef);
        if (!nodeWithContext.node) {
            throw new conduit_utils_1.NotFoundError(args.id, `Notebook not found in graph`);
        }
        const { node: nbNode, syncContext } = nodeWithContext;
        if (nbNode.NodeFields.markedForOffline === setOffline) {
            conduit_utils_1.logger.warn(`Notebook is already ${setOffline ? 'marked' : 'unmarked'} for offline`);
            return ({ success: true });
        }
        // update local settings.
        await en_thrift_connector_1.updateOfflineNbsInLocalSettings(context.trc, context.localSettings, userID, undefined, nbRef.id, setOffline);
        // update sync state and node
        let graphTransactionFn;
        const noteEdges = Object.assign(Object.assign({}, nbNode.outputs.children), nbNode.outputs.childrenInTrash);
        const noteIDs = [];
        const noteAttachmentMap = {};
        const attachmentNoteMap = {};
        for (const edge in noteEdges) {
            noteIDs.push(noteEdges[edge].dstID);
        }
        const notes = noteIDs.length ? await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Note, noteIDs) : [];
        for (const note of notes) {
            if (!note) {
                continue;
            }
            const noteID = note.id;
            noteAttachmentMap[noteID] = [];
            const attachmentEdges = Object.assign(Object.assign({}, note.outputs.attachments), note.outputs.inactiveAttachments);
            for (const attachment in attachmentEdges) {
                const attachmentID = attachmentEdges[attachment].dstID;
                noteAttachmentMap[noteID].push(attachmentID);
                attachmentNoteMap[attachmentID] = noteID;
            }
        }
        if (setOffline) {
            graphTransactionFn = async (tx) => {
                for (const noteID in noteAttachmentMap) {
                    const syncStateEntry = {
                        needsInit: false,
                        notebookID: nbRef.id,
                        fetchContent: true,
                    };
                    const resources = {};
                    for (const attachmentID of noteAttachmentMap[noteID]) {
                        resources[attachmentID] = en_thrift_connector_1.OfflineEntityDownloadState.NEEDS_DOWNLOAD;
                    }
                    if (!conduit_utils_1.isStashEmpty(resources)) {
                        syncStateEntry.resources = resources;
                    }
                    await en_thrift_connector_1.updatePendingOfflineNoteSyncState(context.trc, tx, noteID, syncStateEntry);
                }
            };
        }
        else {
            // walk through notes and delete content.
            graphTransactionFn = async (tx) => {
                await en_thrift_connector_1.deletePendingOfflineNotebookSyncState(context.trc, tx, nbRef.id, syncContext);
                for (const noteID of noteIDs) {
                    clearData && await tx.removeNodeCachedFields(context.trc, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, ['content.content']);
                    await en_thrift_connector_1.updateContentDownloadForNote(context.trc, tx, syncContext, noteID, false);
                }
                if (clearData) {
                    const attachmentIDs = Object.keys(attachmentNoteMap);
                    const attachments = attachmentIDs.length ? await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Attachment, attachmentIDs) : [];
                    for (const attachment of attachments) {
                        if (!attachment) {
                            continue;
                        }
                        const cachedFieldsToRemove = ['data.content', 'recognition.content', 'alternateData.content', 'internal_searchText'];
                        await tx.removeNodeCachedFields(context.trc, { id: attachment.id, type: en_core_entity_types_1.CoreEntityTypes.Attachment }, cachedFieldsToRemove);
                        const dataBlob = attachment.NodeFields.data;
                        if (dataBlob.url && resourceManager && attachmentNoteMap[attachment.id]) {
                            const resourceRef = {
                                parentID: attachmentNoteMap[attachment.id],
                                hash: dataBlob.hash,
                                remoteUrl: dataBlob.url,
                                userID,
                            };
                            resourceManager.deleteResource(context.trc, resourceRef)
                                .catch(e => conduit_utils_1.logger.error(`Resource Manager failed to delete attachment ${attachment.id}`));
                        }
                    }
                }
            };
        }
        await context.db.transactSyncedStorage(context.trc, 'notebookUpdateOffline', async (tx) => {
            await tx.updateNode(context.trc, syncContext, nbRef, { NodeFields: { markedForOffline: setOffline } });
            await graphTransactionFn(tx);
        });
        return ({ success: true });
    }
    out.notebookToggleAvailableOffline = {
        args: conduit_core_1.schemaToGraphQLArgs({ id: 'ID', setOffline: 'boolean', clearData: conduit_utils_1.NullableBoolean }),
        type: conduit_core_1.GenericMutationResult,
        resolve: markedForOfflineResolver,
    };
}
exports.addMarkedForOfflineMutators = addMarkedForOfflineMutators;
//# sourceMappingURL=MarkedForOffline.js.map