"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagConverter = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
function tagFromService(serviceData) {
    const tag = {
        id: Converters_1.convertGuidFromService(serviceData.guid, en_core_entity_types_1.CoreEntityTypes.Tag),
        type: en_core_entity_types_1.CoreEntityTypes.Tag,
        version: serviceData.updateSequenceNum || 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: serviceData.name || '',
        NodeFields: {},
        inputs: {
            refs: {},
            parent: {},
        },
        outputs: {
            children: {},
            shortcut: {},
        },
    };
    // addInputEdgeToNode(tag, 'owner', {
    //   // Profile source must be always user since already the notebook invitation is accepted.
    //   id: convertGuidFromService(userID, CoreEntityTypes.Profile, PROFILE_SOURCE.User),
    //   port: 'tags',
    //   type: CoreEntityTypes.Profile,
    // });
    if (serviceData.parentGuid) {
        conduit_storage_1.addInputEdgeToNode(tag, 'parent', {
            id: Converters_1.convertGuidFromService(serviceData.parentGuid, en_core_entity_types_1.CoreEntityTypes.Tag),
            port: 'children',
            type: en_core_entity_types_1.CoreEntityTypes.Tag,
        });
    }
    return tag;
}
class TagConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Tag;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, tag) {
        // const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
        // if (isNullish(syncContextMetadata)) {
        //   logger.error('No SyncContextMetadata found');
        //   throw new InternalError(`Failed to find correct sync context meta data for tag ${tag.guid}`);
        // }
        // const userID = syncContextMetadata.userID;
        // if (isNullish(userID)) {
        //   logger.error('No User found');
        //   throw new InternalError(`Failed to find user information from local db for tag ${tag.guid}`);
        // }
        const tagOut = tagFromService(tag);
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, tagOut);
        return !prevNode;
    }
    async createOnService(trc, params, syncContext, tag, serviceGuidSeed) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            seed: serviceGuidSeed,
            name: tag.label,
        };
        try {
            const resp = await noteStore.createTag(trc, auth.token, serviceData);
            await exports.TagConverter.convertFromService(trc, params, syncContext, resp);
            return true;
        }
        catch (e) {
            if (e instanceof conduit_utils_1.ServiceError && e.errorCode === en_conduit_sync_types_1.EDAMErrorCode.DATA_CONFLICT) {
                throw new conduit_utils_1.RetryError('Tag Name Conflict', 5000);
            }
            throw e;
        }
    }
    async deleteFromService(trc, params, syncContext, ids) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        for (const id of ids) {
            const serviceGuid = Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Tag);
            // TODO(error) handle expunge error
            await noteStore.expungeTag(trc, auth.token, serviceGuid);
        }
        return false;
    }
    async updateToService(trc, params, syncContext, tagID, diff) {
        const tagNode = await params.graphTransaction.getNode(trc, null, { id: tagID, type: en_core_entity_types_1.CoreEntityTypes.Tag });
        if (!tagNode) {
            throw new conduit_utils_1.NotFoundError(tagID, 'Tag graph node not found');
        }
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            guid: Converters_1.convertGuidToService(tagID, en_core_entity_types_1.CoreEntityTypes.Tag),
        };
        if (diff.hasOwnProperty('label')) {
            serviceData.name = diff.label;
        }
        if (Object.keys(serviceData).length > 1) {
            // service requires parentGuid to be specified or it clears it... fucking inconsistent monolith API
            const parent = conduit_utils_1.firstStashEntry(tagNode.inputs.parent);
            serviceData.parentGuid = (parent && parent.srcType === en_core_entity_types_1.CoreEntityTypes.Tag) ? Converters_1.convertGuidToService(parent.srcID, en_core_entity_types_1.CoreEntityTypes.Tag) : null;
            await noteStore.updateTag(trc, auth.token, serviceData);
        }
        return false;
    }
    async applyEdgeChangesToService(trc, params, syncContext, tagID, changes) {
        const tagNode = await params.graphTransaction.getNode(trc, null, { id: tagID, type: en_core_entity_types_1.CoreEntityTypes.Tag });
        if (!tagNode) {
            throw new conduit_utils_1.NotFoundError(tagID, 'Tag graph node not found');
        }
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            guid: Converters_1.convertGuidToService(tagID, en_core_entity_types_1.CoreEntityTypes.Tag),
        };
        const parentChanges = changes['inputs:parent'];
        if (parentChanges) {
            if (parentChanges.deletes.length) {
                serviceData.parentGuid = null;
            }
            for (const edge of parentChanges.creates) {
                const { id, type } = conduit_storage_1.getEdgeConnection(edge, tagID);
                if (type === en_core_entity_types_1.CoreEntityTypes.Tag) {
                    serviceData.parentGuid = Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Tag);
                }
            }
        }
        if (Object.keys(serviceData).length > 1) {
            // TODO(err) updateTag can throw error if we turn tag graph into cyclic graph.
            // thrift throws error if name is not present
            serviceData.name = tagNode.label;
            await noteStore.updateTag(trc, auth.token, serviceData);
        }
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Tag)
], TagConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Tag)
], TagConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Tag)
], TagConverterClass.prototype, "deleteFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Tag)
], TagConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Tag)
], TagConverterClass.prototype, "applyEdgeChangesToService", null);
exports.TagConverter = new TagConverterClass();
//# sourceMappingURL=TagConverter.js.map