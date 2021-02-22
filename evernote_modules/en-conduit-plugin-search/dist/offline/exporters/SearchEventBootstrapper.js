"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEventBootstrapper = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchUtils_1 = require("../SearchUtils");
/**
 * Responsible for the initial batch event export.
 */
class SearchEventBootstrapper {
    constructor(localKeyValueStorageProvider) {
        this.batchSize = 1000;
        this.searchIndexIds = new Map();
        this.events = [];
        this.localKeyValueStorageProvider = localKeyValueStorageProvider;
    }
    setUserID(userID) {
        this.setBootstrapTableName(userID);
    }
    setBatchSize(batchSize) {
        this.batchSize = batchSize;
    }
    setBootstrapTableName(userID) {
        this.bootstrapTableName = `${SearchEventBootstrapper.eventBootstrapTableNamePrefix}:${userID}`;
    }
    /**
     * Performs diff between ids in the graphDB and the ids in the bootstrap database
     * @param source graph db ids
     */
    async init(trc, source) {
        const timestamp = Date.now();
        // generate list of ids which were already exported to the bootstrap database
        this.searchIndexIds = new Map();
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchEventBootstrapper.eventBootstrapTableNamePrefix}`, async (db) => {
            const keys = await db.getKeys(trc, null, this.bootstrapTableName);
            const values = await db.batchGetValues(trc, null, this.bootstrapTableName, keys);
            for (const key of keys) {
                const value = SearchUtils_1.SearchTypeConversions.DOCUMENT_TYPE_TO_NODE_TYPE.get(values[key]);
                this.searchIndexIds.set(en_thrift_connector_1.convertGuidFromService(key, value), value);
            }
        });
        // iterate over every supported type in the graphDB
        for (const sourceType of source.idsByType.keys()) {
            // get keys for the corresponding types in graphDB and search index
            const sourceIdsByType = source.idsByType.get(sourceType);
            for (const sourceID of sourceIdsByType) {
                // if search index does not contain id, add it
                if (!this.searchIndexIds.has(sourceID)) {
                    this.events.push(this.generateEvent(sourceID, sourceType, timestamp));
                }
                else {
                    // corner case - avoid guid collisions across node types.
                    const searchIndexIdType = this.searchIndexIds.get(sourceID);
                    if (searchIndexIdType !== sourceType) {
                        this.events.push(this.generateEvent(sourceID, sourceType, timestamp));
                    }
                }
            }
        }
        conduit_utils_1.logger.debug(`SearchEventBootstrapper: bootstrap events ${this.events.length}`);
    }
    /**
     * Provides event batch in order to export it in the event journal
     * @param db transaction object.
     */
    async getEventBatch(trc, db) {
        const batch = new Array();
        while (this.events.length !== 0) {
            if (batch.length === this.batchSize) {
                break;
            }
            const event = this.events.shift();
            if (event) {
                batch.push(event);
                const key = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
                const value = SearchUtils_1.SearchTypeConversions.NODE_TYPE_TO_DOCUMENT_TYPE.get(event.nodeRef.type);
                await db.setValue(trc, this.bootstrapTableName, key, value);
            }
        }
        return batch;
    }
    /**
     * Generates SearchStorageChangeEvent event with the specfied parameters.
     * @param sourceID
     * @param sourceType
     * @param timestamp
     */
    generateEvent(sourceID, sourceType, timestamp) {
        return { nodeRef: { id: sourceID, type: sourceType }, localTimestamp: timestamp, eventType: conduit_storage_1.StorageChangeType.Replace };
    }
    /**
     * Cleans local and persisted states. Performed in the external transaction.
     *
     * @param db transaction object
     */
    async clean(trc, db) {
        this.searchIndexIds = new Map();
        this.events = [];
        await db.clearTable(trc, this.bootstrapTableName);
    }
}
exports.SearchEventBootstrapper = SearchEventBootstrapper;
SearchEventBootstrapper.eventBootstrapTableNamePrefix = 'OfflineSearchEventEventBootstrap';
//# sourceMappingURL=SearchEventBootstrapper.js.map