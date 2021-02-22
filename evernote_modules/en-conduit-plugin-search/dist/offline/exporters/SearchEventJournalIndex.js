"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEventJournalIndex = void 0;
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchUtils_1 = require("../SearchUtils");
/**
 * Event journal index. Responsible for the fast event deduplication.
 */
class SearchEventJournalIndex {
    constructor() {
        // maps guid to multiple event type / position entries
        // forbids duplicates with the same event types
        this.guidToStorageChangeTypes = new Map();
        this.cacheSize = 0;
    }
    /**
     * Checks if the duplicate event is already in the index
     * @param event storage event
     */
    has(event) {
        const guid = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
        if (!this.guidToStorageChangeTypes.has(guid)) {
            return false;
        }
        const searchStorageChangeTypeToPosition = this.guidToStorageChangeTypes.get(guid);
        const searchStorageChangeType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
        if (!searchStorageChangeTypeToPosition.has(searchStorageChangeType)) {
            return false;
        }
        return true;
    }
    /**
     * Adds event to the index.
     * @param event search storage event
     * @param position expected position in the event journal
     */
    add(event) {
        if (this.has(event)) {
            return;
        }
        const guid = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
        const searchStorageChangeType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
        let storageChangeTypeToPosition;
        if (!this.guidToStorageChangeTypes.has(guid)) {
            storageChangeTypeToPosition = new Set();
            storageChangeTypeToPosition.add(searchStorageChangeType);
            this.guidToStorageChangeTypes.set(guid, storageChangeTypeToPosition);
        }
        else {
            storageChangeTypeToPosition = this.guidToStorageChangeTypes.get(guid);
            storageChangeTypeToPosition.add(searchStorageChangeType);
        }
        this.cacheSize += 1;
    }
    /**
     * Removes event from the event journal index
     * @param event event in the event journal
     */
    remove(event) {
        const guid = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
        if (!this.guidToStorageChangeTypes.has(guid)) {
            return;
        }
        const storageChangeTypes = this.guidToStorageChangeTypes.get(guid);
        const searchStorageChangeType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
        storageChangeTypes.delete(searchStorageChangeType);
        if (storageChangeTypes.size === 0) {
            this.guidToStorageChangeTypes.delete(guid);
        }
        this.cacheSize -= 1;
    }
    size() {
        return this.cacheSize;
    }
    getNumberOfEventTypesForKey(nodeID, nodeType) {
        const tguid = en_thrift_connector_1.convertGuidToService(nodeID, nodeType);
        if (!this.guidToStorageChangeTypes.has(tguid)) {
            return 0;
        }
        return this.guidToStorageChangeTypes.get(tguid).size;
    }
    clean() {
        this.guidToStorageChangeTypes.clear();
        this.cacheSize = 0;
    }
}
exports.SearchEventJournalIndex = SearchEventJournalIndex;
//# sourceMappingURL=SearchEventJournalIndex.js.map