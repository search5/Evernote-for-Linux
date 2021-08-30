"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEventBootstrapper = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchProcessor_1 = require("../SearchProcessor");
const SearchUtils_1 = require("../SearchUtils");
/**
 * Responsible for the initial batch event export.
 */
class SearchEventBootstrapper {
    constructor(localKeyValueStorageProvider) {
        this.batchSize = 100;
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
        // first export container types
        const nodeTypes = Array.from(source.idsByType.keys());
        const containerTypes = nodeTypes.filter(type => SearchUtils_1.SearchRenamingEventsUtils.RENAMING_EVENT_NODE_TYPES.has(type));
        this.diff(source, containerTypes, timestamp);
        // then non-container ones
        const nonContainerTypes = nodeTypes.filter(type => !SearchUtils_1.SearchRenamingEventsUtils.RENAMING_EVENT_NODE_TYPES.has(type));
        this.diff(source, nonContainerTypes, timestamp);
        this.events.push({ nodeRef: { id: 'NA', type: en_core_entity_types_1.CoreEntityTypes.Note }, localTimestamp: Date.now(), eventType: conduit_storage_1.StorageChangeType.Replace, indexationType: SearchProcessor_1.SearchStorageIndexationType.LAST_INITIAL_INDEXATION_EVENT });
        conduit_utils_1.logger.debug(`SearchEventBootstrapper: total bootstrap events ${this.events.length}`);
    }
    diff(source, nodeTypes, timestamp) {
        // iterate over every supported type in the graphDB
        for (const sourceType of nodeTypes) {
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
        conduit_utils_1.logger.debug(`SearchEventBootstrapper: bootstrap batch length ${batch.length}}`);
        return batch;
    }
    /**
     * Generates SearchStorageChangeEvent event with the specfied parameters.
     * @param sourceID
     * @param sourceType
     * @param timestamp
     */
    generateEvent(sourceID, sourceType, timestamp) {
        return { nodeRef: { id: sourceID, type: sourceType }, localTimestamp: timestamp,
            eventType: conduit_storage_1.StorageChangeType.Replace, indexationType: SearchProcessor_1.SearchStorageIndexationType.INITIAL_INDEXATION_EVENT };
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