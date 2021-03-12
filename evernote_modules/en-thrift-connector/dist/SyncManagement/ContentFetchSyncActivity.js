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
exports.ContentFetchSyncActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const simply_immutable_1 = require("simply-immutable");
const Auth = __importStar(require("../Auth"));
const BlobConverter_1 = require("../Converters/BlobConverter");
const Converters_1 = require("../Converters/Converters");
const NotebookConverter_1 = require("../Converters/NotebookConverter");
const ResourceConverter_1 = require("../Converters/ResourceConverter");
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
// Queue of resources currently being downloaded
const resourcesQueue = [];
function getEmptyResourceSlot(maxResources) {
    for (let i = 0; i < maxResources; i++) {
        if (resourcesQueue[i] === undefined) {
            return i;
        }
    }
    return -1;
}
function setResourceSlot(id, index) {
    resourcesQueue[index] = id;
}
function markResourceSlotEmpty(id) {
    const index = resourcesQueue.findIndex(elem => (elem === id));
    if (index === -1) {
        conduit_utils_1.logger.error('Resource not found in resource queue ', id);
        return;
    }
    resourcesQueue[index] = undefined;
}
var UpdateSyncStateOperation;
(function (UpdateSyncStateOperation) {
    UpdateSyncStateOperation["DELETE_NOTE"] = "DeleteNote";
    UpdateSyncStateOperation["DELETE_RESOURCES"] = "DeleteResources";
    UpdateSyncStateOperation["FECTHED_CONTENT"] = "fetchedContent";
    UpdateSyncStateOperation["RESOURCE_IN_PROGRESS"] = "ResourceInProgress";
    UpdateSyncStateOperation["RESOURCE_NEEDS_DOWNLOAD"] = "ResourceNeedsDownload";
    UpdateSyncStateOperation["RESOURCE_DONE"] = "ResourceDone";
})(UpdateSyncStateOperation || (UpdateSyncStateOperation = {}));
async function updateOfflineSyncState(trc, params, noteID, syncContext, resourceID, op) {
    return await params.syncEngine.transact(trc, 'updateOfflineSyncState', async (tx) => {
        // refetch sync state as it might have changed.
        const origNoteSyncState = await NotebookConverter_1.getPendingOfflineNote(trc, tx, noteID);
        if (!origNoteSyncState) {
            return true;
        }
        let noteSyncState = origNoteSyncState;
        let doDelete = false;
        switch (op) {
            case UpdateSyncStateOperation.DELETE_NOTE:
                doDelete = true;
                break;
            case UpdateSyncStateOperation.DELETE_RESOURCES:
                noteSyncState = simply_immutable_1.deleteImmutable(noteSyncState, ['resources']);
                break;
            case UpdateSyncStateOperation.FECTHED_CONTENT:
                noteSyncState = simply_immutable_1.deleteImmutable(noteSyncState, ['fetchContent']);
                break;
            case UpdateSyncStateOperation.RESOURCE_DONE:
            case UpdateSyncStateOperation.RESOURCE_IN_PROGRESS:
            case UpdateSyncStateOperation.RESOURCE_NEEDS_DOWNLOAD:
                if (resourceID && noteSyncState.resources && noteSyncState.resources[resourceID]) {
                    if (op === UpdateSyncStateOperation.RESOURCE_DONE) {
                        noteSyncState = simply_immutable_1.deleteImmutable(noteSyncState, ['resources', resourceID]);
                    }
                    else {
                        noteSyncState = simply_immutable_1.replaceImmutable(noteSyncState, ['resources', resourceID], (op === UpdateSyncStateOperation.RESOURCE_IN_PROGRESS) ? NotebookConverter_1.OfflineEntityDownloadState.IN_PROGRESS : NotebookConverter_1.OfflineEntityDownloadState.NEEDS_DOWNLOAD);
                    }
                }
                break;
            default:
                throw conduit_utils_1.absurd(op, 'Invalid option for updateOfflineSyncState');
        }
        if (!doDelete && conduit_utils_1.isStashEmpty(noteSyncState.resources)) {
            noteSyncState = simply_immutable_1.deleteImmutable(noteSyncState, ['resources']);
        }
        if (!doDelete && !noteSyncState.fetchContent && !noteSyncState.resources) {
            // done with downsyncing note
            conduit_utils_1.logger.debug('Finished downsyncing all content for note ', noteID);
            await NotebookConverter_1.updateContentDownloadForNote(trc, tx, syncContext, noteID, true);
            doDelete = true;
        }
        if (doDelete) {
            await NotebookConverter_1.deletePendingOfflineNoteSyncState(trc, tx, noteID);
            return true;
        }
        else if (noteSyncState !== origNoteSyncState) {
            await NotebookConverter_1.updatePendingOfflineNoteSyncState(trc, tx, noteID, noteSyncState);
        }
        return false;
    });
}
async function fetchNoteContent(trc, params, note, syncContext) {
    const graphStorage = params.syncEngine.graphStorage;
    const noteID = note.id;
    const metadata = await graphStorage.getSyncContextMetadata(trc, null, syncContext);
    if (!metadata || !metadata.authToken) {
        conduit_utils_1.logger.warn(`ContentFetchSyncActivity: syncContextMetadata not found. Skipping note ${noteID}`);
        return;
    }
    conduit_utils_1.logger.debug(`Fetching note content for note ${note.id} ${note.label}`);
    const authData = Auth.decodeAuthData(metadata.authToken);
    const noteStore = params.syncEngine.thriftComm.getNoteStore(authData.urls.noteStoreUrl);
    const serviceGuid = Converters_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note);
    const specs = new en_conduit_sync_types_1.TNoteResultSpec({
        includeContent: true,
        includeResourcesRecognition: true,
        includeResourcesAlternateData: true,
    });
    const serviceData = await noteStore.getNoteWithResultSpec(trc, authData.token, serviceGuid, specs);
    await graphStorage.transact(trc, 'noteContentToGraph', async (graphTransaction) => {
        const contentBlobData = {
            bodyHash: serviceData.contentHash,
            size: serviceData.contentLength,
            body: serviceData.content,
        };
        await BlobConverter_1.updateBlobToGraph(trc, graphTransaction, contentBlobData, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note }, 'content', syncContext);
        for (const resource of (serviceData.resources || [])) {
            const resourceRef = { id: Converters_1.convertGuidFromService(resource.guid, en_core_entity_types_1.CoreEntityTypes.Attachment), type: en_core_entity_types_1.CoreEntityTypes.Attachment };
            if (resource.data) {
                const resourceUrl = ResourceConverter_1.generateResourceUrl(metadata, 'res', resource.guid);
                const resourceBlobData = Object.assign(Object.assign({}, resource.data), { url: resourceUrl });
                await BlobConverter_1.updateBlobToGraph(trc, graphTransaction, resourceBlobData, resourceRef, 'data', syncContext);
            }
            if (resource.recognition) {
                await BlobConverter_1.updateBlobToGraph(trc, graphTransaction, resource.recognition, resourceRef, 'recognition', syncContext);
            }
            if (resource.alternateData) {
                await BlobConverter_1.updateBlobToGraph(trc, graphTransaction, resource.alternateData, resourceRef, 'alternateData', syncContext);
            }
        }
    });
}
async function fetchNoteResources(trc, params, noteID, syncContext, maxResources) {
    const graphStorage = params.syncEngine.graphStorage;
    const noteSyncState = await NotebookConverter_1.getPendingOfflineNote(trc, graphStorage, noteID);
    if (!noteSyncState) {
        return true;
    }
    const resourceManager = params.syncEngine.resourceManager;
    if (!resourceManager || !noteSyncState.resources) {
        if (!resourceManager) {
            conduit_utils_1.logger.warn('Resource Manager should be provided during conduit init to fetch resources.');
        }
        return await updateOfflineSyncState(trc, params, noteID, syncContext, null, UpdateSyncStateOperation.DELETE_RESOURCES);
    }
    let isDeleted = false;
    for (const iterResourceID in noteSyncState.resources) {
        const resourceID = iterResourceID;
        if (noteSyncState.resources[resourceID] === NotebookConverter_1.OfflineEntityDownloadState.NEEDS_DOWNLOAD) {
            const resIndex = getEmptyResourceSlot(maxResources);
            if (resIndex === -1) {
                break;
            }
            const attachment = await params.syncEngine.graphStorage.getNode(trc, null, { id: resourceID, type: en_core_entity_types_1.CoreEntityTypes.Attachment });
            if (!attachment) {
                conduit_utils_1.logger.warn(`ContentFetchSyncActivity: Attachment ${resourceID} for note ${noteID} not found in graph. Possibly deleted`);
                isDeleted = await updateOfflineSyncState(trc, params, noteID, syncContext, resourceID, UpdateSyncStateOperation.RESOURCE_DONE);
                continue;
            }
            const dataBlob = attachment.NodeFields.data;
            if (dataBlob && dataBlob.url) {
                const resourceRef = {
                    parentID: noteID,
                    hash: dataBlob.hash,
                    remoteUrl: dataBlob.url,
                };
                conduit_utils_1.logger.debug(`Downloading attachment ${attachment.label} for note ${noteID}`);
                isDeleted = await updateOfflineSyncState(trc, params, noteID, syncContext, attachment.id, UpdateSyncStateOperation.RESOURCE_IN_PROGRESS);
                setResourceSlot(attachment.id, resIndex);
                resourceManager.fetchResource(trc, resourceRef, false)
                    .then(async () => {
                    conduit_utils_1.logger.debug(`Finished downloading attachment ${attachment.label} for note ${noteID}`);
                    markResourceSlotEmpty(attachment.id);
                    isDeleted = await updateOfflineSyncState(trc, params, noteID, syncContext, attachment.id, UpdateSyncStateOperation.RESOURCE_DONE);
                })
                    .catch(async (err) => {
                    conduit_utils_1.logger.warn(`Failed to download attachment ${attachment.id} for note ${noteID} `, err);
                    markResourceSlotEmpty(attachment.id);
                    if (err instanceof conduit_utils_1.RetryError) {
                        isDeleted = await updateOfflineSyncState(trc, params, noteID, syncContext, attachment.id, UpdateSyncStateOperation.RESOURCE_NEEDS_DOWNLOAD);
                    }
                    else {
                        isDeleted = await updateOfflineSyncState(trc, params, noteID, syncContext, attachment.id, UpdateSyncStateOperation.RESOURCE_DONE);
                    }
                });
            }
            else {
                conduit_utils_1.logger.debug(`Resource url not present for attachment ${attachment.id}`);
                isDeleted = await updateOfflineSyncState(trc, params, noteID, syncContext, attachment.id, UpdateSyncStateOperation.RESOURCE_DONE);
            }
        }
    }
    return isDeleted;
}
async function downsyncNote(trc, params, noteID, maxResources) {
    var _a, _b;
    const graphStorage = params.syncEngine.graphStorage;
    // fetch sync state from db as it might have changed.
    let noteSyncState = await NotebookConverter_1.getPendingOfflineNote(trc, graphStorage, noteID);
    if (!noteSyncState) {
        return;
    }
    const note = await graphStorage.getNode(trc, null, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
    if (!note) {
        conduit_utils_1.logger.warn(`ContentFetchSyncActivity: Note ${noteID} not found in graph. Possibly deleted`);
        return await updateOfflineSyncState(trc, params, noteID, '', null, UpdateSyncStateOperation.DELETE_NOTE);
    }
    const syncContext = note.syncContexts[0]; // doesn't really matter which one we use here, as long as it has read access
    if (noteSyncState.needsInit) {
        // from prebuilt DB, populate the noteSyncState fields
        noteSyncState = {
            needsInit: false,
            notebookID: (_b = (_a = conduit_utils_1.firstStashEntry(note.inputs.parent)) === null || _a === void 0 ? void 0 : _a.srcID) !== null && _b !== void 0 ? _b : null,
            fetchContent: true,
            resources: {},
        };
        for (const key in note.outputs.attachments) {
            noteSyncState.resources[note.outputs.attachments[key].dstID] = NotebookConverter_1.OfflineEntityDownloadState.NEEDS_DOWNLOAD;
        }
        for (const key in note.outputs.inactiveAttachments) {
            noteSyncState.resources[note.outputs.inactiveAttachments[key].dstID] = NotebookConverter_1.OfflineEntityDownloadState.NEEDS_DOWNLOAD;
        }
        await params.syncEngine.transact(trc, 'updateOfflineSyncState', async (tx) => {
            await NotebookConverter_1.updatePendingOfflineNoteSyncState(trc, tx, noteID, noteSyncState);
        });
    }
    if (noteSyncState.fetchContent) {
        await fetchNoteContent(trc, params, note, syncContext);
        await updateOfflineSyncState(trc, params, noteID, syncContext, null, UpdateSyncStateOperation.FECTHED_CONTENT);
    }
    return await fetchNoteResources(trc, params, note.id, syncContext, maxResources);
}
function calculateSyncProgressPercentage(syncedNotesCount, syncProgress, totalCount) {
    if (totalCount === 0) {
        return 1; // nothing more to sync
    }
    if (isContentFetchSyncProgress(syncProgress)) {
        const calculatedCurrentSyncedItems = Math.round(syncProgress.actualSizeToSync * syncProgress.percentComplete * 10) / 10;
        return syncProgress.actualSizeToSync ? (syncedNotesCount + calculatedCurrentSyncedItems) / syncProgress.actualSizeToSync : 1;
    }
    return totalCount /* Could be 0 */ ? syncedNotesCount / totalCount : 1;
}
async function contentFetch(trc, params, maxTime, maxResources, noteIDs, prevSyncProgress) {
    await params.yieldCheck;
    const start = Date.now();
    if (!noteIDs.length) {
        params.setProgress && params.setProgress(trc, 1);
        return false;
    }
    let totalCount = noteIDs.length;
    let syncedNotesCount = 0;
    for (const noteID of noteIDs) {
        await params.yieldCheck;
        // fetch note content and add to graph.
        const isDone = await downsyncNote(trc, params, noteID, maxResources);
        if (isDone) {
            totalCount--;
        }
        syncedNotesCount++;
        if (Date.now() - start >= maxTime) {
            break;
        }
    }
    const percentage = calculateSyncProgressPercentage(syncedNotesCount, prevSyncProgress, totalCount);
    params.setProgress && params.setProgress(trc, percentage);
    return totalCount > 0;
}
function isContentFetchSyncProgress(obj) {
    if (obj &&
        obj.hasOwnProperty('totalSize') &&
        obj.hasOwnProperty('percentComplete') &&
        obj.hasOwnProperty('actualSizeToSync')) {
        return true;
    }
    return false;
}
class ContentFetchSyncActivity extends SyncActivity_1.SyncActivity {
    constructor(di, context, args, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: SyncActivity_1.SyncActivityType.ContentFetchSyncActivity,
            priority: args ? SyncActivity_1.SyncActivityPriority.IMMEDIATE : SyncActivity_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
            dontPersist: Boolean(args),
        }, {
            syncProgressTableName: SyncActivity_1.CONTENT_SYNC_PROGRESS_TABLE,
            immediateSyncArgs: args,
        });
        this.di = di;
    }
    async initActualSyncSize(trc, noteIDs) {
        const syncEngine = this.context.syncEngine;
        const syncProgress = await syncEngine.ephemeralState.getValue(trc, null, this.options.syncProgressTableName, this.progressBucketName);
        const needReset = syncProgress && syncProgress.percentComplete >= 1 && noteIDs.length > 0;
        const isSyncProgressExtended = isContentFetchSyncProgress(syncProgress);
        if (syncProgress && !needReset && isSyncProgressExtended) {
            return syncProgress;
        }
        conduit_utils_1.logger.debug('Reinitializing SyncProgress information for ContentFetchSyncActivity');
        const newSyncProgress = {
            startTime: 0,
            endTime: 0,
            percentComplete: 0,
            totalSize: this.progressBucketSize,
            actualSizeToSync: noteIDs.length,
        };
        await syncEngine.transactEphemeral(trc, 'SetNewContentFetchSyncProgress', async (tx) => {
            await tx.setValue(trc, this.options.syncProgressTableName, this.progressBucketName, newSyncProgress);
        });
        return newSyncProgress;
    }
    async runSyncImpl(trc) {
        var _a, _b, _c, _d;
        const args = this.options.immediateSyncArgs;
        const maxTime = (_a = (args ? args.maxTime : this.di.backgroundNoteContentSyncConfig.maxTimePerPollMilliseconds)) !== null && _a !== void 0 ? _a : 1000;
        const pollTime = (_b = this.di.backgroundNoteContentSyncConfig.pollingIntervalMilliseconds) !== null && _b !== void 0 ? _b : 10000;
        const maxResources = (_c = (args ? args.maxResources : this.di.backgroundNoteContentSyncConfig.maxAttachmentFetchParallelization)) !== null && _c !== void 0 ? _c : 6;
        const idlePollTime = (_d = this.di.backgroundNoteContentSyncConfig.idlePollingIntervalMilliseconds) !== null && _d !== void 0 ? _d : 30000;
        const syncParams = this.initParams('best', 'offlineNbs', maxTime);
        if (syncParams.offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.NONE) {
            conduit_utils_1.logger.info('ContentFetchSyncActivity finished as offlineContentStrategy is None');
            return;
        }
        const noteIDs = await NotebookConverter_1.getPendingOfflineNoteIDs(trc, this.context.syncEngine.graphStorage);
        const fetchProgressStatus = await this.initActualSyncSize(trc, noteIDs);
        const moreToSync = await contentFetch(trc, syncParams, maxTime, maxResources, noteIDs, fetchProgressStatus);
        if (args) {
            conduit_utils_1.logger.debug(`ContentFetchActivity: ${args ? 'More to downsync' : 'All content downsynced'}. Not retrying immediateContentSync activity`);
            return;
        }
        else if (moreToSync) {
            conduit_utils_1.logger.debug(`ContentFetchActivity: More content to be downsynced. Retrying after ${pollTime}`);
            throw new conduit_utils_1.RetryError('continue', pollTime);
        }
        else {
            conduit_utils_1.logger.debug(`ContentFetchActivity: All content downsynced. Check again after ${idlePollTime}`);
            throw new conduit_utils_1.RetryError('continue', idlePollTime);
        }
    }
}
exports.ContentFetchSyncActivity = ContentFetchSyncActivity;
SyncActivityHydration_1.registerSyncActivityType(SyncActivity_1.SyncActivityType.ContentFetchSyncActivity, (di, context, p, timeout) => {
    return new ContentFetchSyncActivity(di, context, p.options.immediateSyncArgs, p.subpriority, timeout);
});
//# sourceMappingURL=ContentFetchSyncActivity.js.map