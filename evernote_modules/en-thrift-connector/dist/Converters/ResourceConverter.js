"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceConverter = exports.generateResourceUrl = exports.fetchAndCacheAttachmentData = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Auth = __importStar(require("../Auth"));
const BlobConverter_1 = require("./BlobConverter");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
const NotebookConverter_1 = require("./NotebookConverter");
const gPendingAttachments = new Map();
async function fetchAndCacheAttachmentData(trc, thriftComm, auth, attachmentID, syncContext, type, db, localSettings, offlineContentStrategy) {
    var _a, _b;
    let p = gPendingAttachments.get(attachmentID);
    if (p) {
        const res = await p;
        return Helpers_1.convertHashFromService((_a = res[type]) === null || _a === void 0 ? void 0 : _a.body);
    }
    p = fetchAttachmentDataInternal(trc, thriftComm, auth, attachmentID, syncContext, db, localSettings, offlineContentStrategy);
    gPendingAttachments.set(attachmentID, p);
    try {
        const res = await p;
        return Helpers_1.convertHashFromService((_b = res[type]) === null || _b === void 0 ? void 0 : _b.body);
    }
    finally {
        gPendingAttachments.delete(attachmentID);
    }
}
exports.fetchAndCacheAttachmentData = fetchAndCacheAttachmentData;
async function getResourceWithRetry(trc, thriftComm, auth, attachmentID) {
    const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const serviceGuid = Converters_1.convertGuidToService(attachmentID, en_core_entity_types_1.CoreEntityTypes.Attachment);
    // try to refetch attachment if the first attempt fails. Calling Utility.getResource too soon after
    // Utility.addResource can fail due to a race condition on the backend.
    let nAttempts = 0;
    while (true) {
        ++nAttempts;
        try {
            // NOTE: withData must always be false for getResource call as resource is fetched out of band using resourceProxy.
            return await noteStore.getResource(trc, auth.token, serviceGuid, false, true, true, true);
        }
        catch (e) {
            // the race condition consistently results in PERMISSION_DENIED with "authenticationToken" parameter. Retry NOT SHORTLY after err.
            if (nAttempts < 3 && e instanceof conduit_utils_1.AuthError && e.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED && e.parameter === 'authenticationToken') {
                await conduit_utils_1.sleep(10);
                conduit_utils_1.logger.debug('Failed to fetch attachment. Retry...');
                continue;
            }
            // throw other kinds of errors or AuthError if all retries fail.
            throw e;
        }
    }
}
async function fetchAttachmentDataInternal(trc, thriftComm, auth, attachmentID, syncContext, db, localSettings, offlineContentStrategy) {
    conduit_utils_1.traceEventStart(trc, 'fetchAttachmentDataInternal');
    try {
        const serviceData = await getResourceWithRetry(trc, thriftComm, auth, attachmentID);
        // convert resource from service
        await db.transactSyncedStorage(trc, 'fetchAttachmentDataInternal', async (graphTransaction) => {
            const personalMetadata = await graphTransaction.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
            const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
            const vaultMetadata = await graphTransaction.getSyncContextMetadata(trc, null, conduit_core_1.VAULT_USER_CONTEXT);
            const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
            const converterParams = await Helpers_1.makeConverterParams({
                trc,
                graphTransaction,
                personalUserId,
                vaultUserId,
                localSettings,
                offlineContentStrategy,
            });
            await exports.ResourceConverter.convertFromService(trc, converterParams, syncContext, serviceData);
        });
        return serviceData;
    }
    finally {
        conduit_utils_1.traceEventEnd(trc, 'fetchAttachmentDataInternal');
    }
}
function generateResourceUrl(syncContextMetadata, subpath, guid) {
    const auth = Auth.decodeAuthData(syncContextMetadata.authToken);
    const userSlotSegment = auth.userSlot === null ? '' : `u/${auth.userSlot}/`;
    const shardSegment = `shard/${auth.shard}/`;
    const bizSegment = syncContextMetadata.isVaultUser ? 'business/dispatch/' : '';
    const shareSegment = syncContextMetadata.sharedNotebookGlobalID ? `share/${syncContextMetadata.sharedNotebookGlobalID}/` : '';
    const guidSegment = `${subpath}/${guid}`;
    return auth.urlHost + '/' + userSlotSegment + shardSegment + bizSegment + shareSegment + guidSegment;
}
exports.generateResourceUrl = generateResourceUrl;
function resourceFromService(serviceData) {
    var _a, _b;
    const resourceOut = {
        id: Converters_1.convertGuidFromService(serviceData.guid, en_core_entity_types_1.CoreEntityTypes.Attachment),
        type: en_core_entity_types_1.CoreEntityTypes.Attachment,
        version: serviceData.updateSequenceNum || 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: (serviceData.attributes && serviceData.attributes.fileName) || en_core_entity_types_1.CoreEntityTypes.Attachment,
        NodeFields: {
            mime: serviceData.mime || '',
            width: serviceData.width || 0,
            height: serviceData.height || 0,
            isActive: serviceData.active || false,
            filename: (serviceData.attributes && serviceData.attributes.fileName) || '',
            data: BlobConverter_1.convertBlobFieldsFromService(serviceData.data),
            recognition: BlobConverter_1.convertBlobFieldsFromService(serviceData.recognition),
            alternateData: BlobConverter_1.convertBlobFieldsFromService(serviceData.alternateData),
            applicationDataKeys: ((_b = (_a = serviceData.attributes) === null || _a === void 0 ? void 0 : _a.applicationData) === null || _b === void 0 ? void 0 : _b.keysOnly) || [],
            Attributes: {
                Location: {
                    latitude: serviceData.attributes && serviceData.attributes.latitude || null,
                    longitude: serviceData.attributes && serviceData.attributes.longitude || null,
                    altitude: serviceData.attributes && serviceData.attributes.altitude || null,
                },
                sourceURL: serviceData.attributes && serviceData.attributes.sourceURL || null,
                timestamp: serviceData.attributes && serviceData.attributes.timestamp || null,
                cameraMake: serviceData.attributes && serviceData.attributes.cameraMake || null,
                cameraModel: serviceData.attributes && serviceData.attributes.cameraModel || null,
                clientWillIndex: serviceData.attributes && serviceData.attributes.clientWillIndex || false,
            },
        },
        inputs: {
            parent: {},
        },
        outputs: {},
    };
    if (serviceData.noteGuid) {
        conduit_storage_1.addInputEdgeToNode(resourceOut, 'parent', {
            id: Converters_1.convertGuidFromService(serviceData.noteGuid, en_core_entity_types_1.CoreEntityTypes.Note),
            port: serviceData.active ? 'attachments' : 'inactiveAttachments',
            type: en_core_entity_types_1.CoreEntityTypes.Note,
        });
    }
    return resourceOut;
}
class ResourceConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Attachment;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, resource, nbID, noteOfflineSyncState) {
        if (resource.data) {
            const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
            if (!syncContextMetadata) {
                throw new conduit_utils_1.NotFoundError(syncContext, 'Missing syncContextMetadata');
            }
            const resourceUrl = generateResourceUrl(syncContextMetadata, 'res', resource.guid);
            resource = SimplyImmutable.updateImmutable(resource, ['data', 'url'], resourceUrl);
        }
        const resourceOut = resourceFromService(resource);
        if (resource.recognition) {
            await BlobConverter_1.fillBlobCache(trc, params.graphTransaction, resourceOut, 'recognition', resourceOut.NodeFields.recognition, resource.recognition.body);
        }
        if (resource.alternateData) {
            await BlobConverter_1.fillBlobCache(trc, params.graphTransaction, resourceOut, 'alternateData', resourceOut.NodeFields.alternateData, resource.alternateData.body);
        }
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, resourceOut);
        // check if resource needs to be downsynced for offline
        if (noteOfflineSyncState && nbID &&
            (params.offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.EVERYTHING || params.nbsMarkedOffline && params.nbsMarkedOffline[nbID])) {
            if (!prevNode ||
                BlobConverter_1.hasBlobChanged(prevNode.NodeFields.recognition, resourceOut.NodeFields.recognition) ||
                BlobConverter_1.hasBlobChanged(prevNode.NodeFields.alternateData, resourceOut.NodeFields.alternateData)) {
                // resources recognition and alternateData are fetched along with note content.
                noteOfflineSyncState.fetchContent = true;
            }
            if (!prevNode || BlobConverter_1.hasBlobChanged(prevNode.NodeFields.data, resourceOut.NodeFields.data)) {
                noteOfflineSyncState.resources = noteOfflineSyncState.resources || {};
                noteOfflineSyncState.resources[resourceOut.id] = NotebookConverter_1.OfflineEntityDownloadState.NEEDS_DOWNLOAD;
            }
        }
        return !prevNode;
    }
    async createOnService() {
        // by this point the resource is already created through the StagedBlobManager
        return true;
    }
    async deleteFromService(trc, params) {
        // TODO(log) resources cannot be removed via API.
        // service backend will remove resources via note content change.
        return false;
    }
    async customToService(trc, params, commandRun, syncContext) {
        switch (commandRun.command) {
            case 'attachmentSetAppData': {
                const commandParams = commandRun.params;
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                const guid = Converters_1.convertGuidToService(commandParams.id, en_core_entity_types_1.CoreEntityTypes.Attachment);
                if (commandParams.value !== null) {
                    await noteStore.setResourceApplicationDataEntry(trc, auth.token, guid, commandParams.key, commandParams.value);
                }
                else {
                    await noteStore.unsetResourceApplicationDataEntry(trc, auth.token, guid, commandParams.key);
                }
                return null;
            }
            default:
                throw new Error(`Unknown customToService command for Attachment ${commandRun.command}`);
        }
    }
    async updateToService(trc, params, syncContext, attachmentID, diff) {
        let hasChanges = false;
        const serviceData = {
            guid: Converters_1.convertGuidToService(attachmentID, en_core_entity_types_1.CoreEntityTypes.Attachment),
        };
        const resourceRef = { id: attachmentID, type: en_core_entity_types_1.CoreEntityTypes.Attachment };
        const curResource = await params.graphTransaction.getNode(trc, null, resourceRef);
        if (!curResource) {
            throw new conduit_utils_1.NotFoundError(resourceRef.id, `Missing note ${resourceRef.id} from local graph storage`);
        }
        const NodeFields = diff.NodeFields;
        if (NodeFields && (NodeFields.Attributes || NodeFields.hasOwnProperty('filename'))) {
            hasChanges = true;
            const attributesChanges = NodeFields.Attributes || {};
            this.fillResourceAttributes(serviceData, attributesChanges, NodeFields.filename || curResource.NodeFields.filename, curResource);
        }
        if (hasChanges) {
            const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
            const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
            await noteStore.updateResource(trc, auth.token, serviceData);
        }
        return false;
    }
    fillResourceAttributes(serviceData, attributesChanges, filename, curResource) {
        const attributes = SimplyImmutable.deepUpdateImmutable(curResource.NodeFields.Attributes, attributesChanges);
        const serviceAttributes = {};
        serviceAttributes.fileName = filename;
        if (attributes.Location) {
            serviceAttributes.latitude = attributes.Location.latitude;
            serviceAttributes.longitude = attributes.Location.longitude;
            serviceAttributes.altitude = attributes.Location.altitude;
        }
        serviceAttributes.cameraMake = attributes.cameraMake;
        serviceAttributes.cameraModel = attributes.cameraModel;
        serviceAttributes.clientWillIndex = attributes.clientWillIndex;
        serviceAttributes.timestamp = attributes.timestamp;
        serviceData.attributes = serviceAttributes;
    }
    async applyEdgeChangesToService() {
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Attachment)
], ResourceConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Attachment)
], ResourceConverterClass.prototype, "customToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Attachment)
], ResourceConverterClass.prototype, "updateToService", null);
exports.ResourceConverter = new ResourceConverterClass();
//# sourceMappingURL=ResourceConverter.js.map