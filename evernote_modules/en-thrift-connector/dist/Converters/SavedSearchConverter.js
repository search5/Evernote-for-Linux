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
exports.SavedSearchConverter = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Converters_1 = require("./Converters");
class SavedSearchConverterClass {
    constructor() {
        this.nodeType = en_data_model_1.CoreEntityTypes.SavedSearch;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, serviceData) {
        const search = {
            id: Converters_1.convertGuidFromService(serviceData.guid, en_data_model_1.CoreEntityTypes.SavedSearch),
            type: en_data_model_1.CoreEntityTypes.SavedSearch,
            version: serviceData.updateSequenceNum || 0,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: serviceData.name || '',
            NodeFields: {
                query: serviceData.query,
            },
            inputs: {},
            outputs: {
                shortcut: {},
            },
        };
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, search);
        return !prevNode;
    }
    async createOnService(trc, params, syncContext, node, serviceGuidSeed) {
        const auth = params.personalAuth;
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            name: node.label,
            query: node.NodeFields.query,
            seed: serviceGuidSeed,
        };
        const resp = await noteStore.createSearch(trc, auth.token, serviceData);
        await exports.SavedSearchConverter.convertFromService(trc, params, conduit_core_1.PERSONAL_USER_CONTEXT, resp);
        return true;
    }
    async updateToService(trc, params, syncContext, searchID, diff) {
        const auth = params.personalAuth;
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const currSearch = await params.graphTransaction.getNode(trc, null, { id: searchID, type: en_data_model_1.CoreEntityTypes.SavedSearch });
        if (!currSearch) {
            throw new conduit_utils_1.NotFoundError(searchID, `Missing saved search ${searchID} from local graph storage`);
        }
        const serviceData = {
            guid: Converters_1.convertGuidToService(searchID, en_data_model_1.CoreEntityTypes.SavedSearch),
            query: currSearch.NodeFields.query,
            name: currSearch.label,
        };
        const NodeFields = diff.NodeFields;
        let hasChange = false;
        if (diff.hasOwnProperty('label') && diff.label !== serviceData.name) {
            serviceData.name = diff.label;
            hasChange = true;
        }
        if (NodeFields && NodeFields.query && currSearch.NodeFields.query !== NodeFields.query) {
            serviceData.query = NodeFields.query;
            hasChange = true;
        }
        if (hasChange) {
            await noteStore.updateSearch(trc, auth.token, serviceData);
        }
        await params.graphTransaction.updateNode(trc, conduit_core_1.PERSONAL_USER_CONTEXT, currSearch, diff);
        return true;
    }
    async deleteFromService(trc, params, syncContext, ids) {
        const auth = params.personalAuth;
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        for (const id of ids) {
            const serviceGuid = Converters_1.convertGuidToService(id, en_data_model_1.CoreEntityTypes.SavedSearch);
            await noteStore.expungeSearch(trc, auth.token, serviceGuid);
            await params.graphTransaction.deleteNode(trc, conduit_core_1.PERSONAL_USER_CONTEXT, { id, type: en_data_model_1.CoreEntityTypes.SavedSearch });
        }
        return true;
    }
    async applyEdgeChangesToService() {
        // TODO(log) saved search has no connections to other nodes.
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.SavedSearch)
], SavedSearchConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.SavedSearch)
], SavedSearchConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.SavedSearch)
], SavedSearchConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.SavedSearch)
], SavedSearchConverterClass.prototype, "deleteFromService", null);
exports.SavedSearchConverter = new SavedSearchConverterClass();
//# sourceMappingURL=SavedSearchConverter.js.map