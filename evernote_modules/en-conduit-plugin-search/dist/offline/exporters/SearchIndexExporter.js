"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndexExporter = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_search_engine_shared_1 = require("en-search-engine-shared");
/**
 * Perfroms import / export operations from / to external database for search index.
 */
class SearchIndexExporter {
    constructor(searchEngine, localKeyValueStorageProvider) {
        this.searchEngine = searchEngine;
        this.localKeyValueStorageProvider = localKeyValueStorageProvider;
    }
    setUserID(userID) {
        this.userID = userID;
    }
    /**
     * Returns event datatabase name for the specified type.
     */
    getExternalStorageIndexTableName() {
        return `${SearchIndexExporter.indexTableName}:${this.userID}`;
    }
    /**
     * Returns index key for the external storage.
     *
     * Database entry with this key stores search index. Consists from user id and search engine version. TODO(vglazkov):: follow the semantic versioning.
     */
    getExternalStorageIndexKey(name) {
        if (name === en_search_engine_shared_1.ENIndexName.Note) {
            return 'index';
        }
        else {
            return `index_${name}`;
        }
    }
    /**
     * Returns version key for the external storage.
     *
     * If index version is updated, index entry in the external database should be invalidated.
     */
    getExternalStorageVersionKey(name) {
        if (name === en_search_engine_shared_1.ENIndexName.Note) {
            return 'version';
        }
        else {
            return `version_${name}`;
        }
    }
    /**
     * Returns engine type key for the external storage.
     *
     * If engine type is updated, index entry in the external database should be invalidated.
     */
    getExternalStorageEngineTypeKey(name) {
        if (name === en_search_engine_shared_1.ENIndexName.Note) {
            return 'engine_type';
        }
        else {
            return `engine_type_${name}`;
        }
    }
    /**
     * Exports index to the external storage.
     */
    async export(trc) {
        const exportIndicesInfo = await this.searchEngine.export();
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchIndexExporter.indexTableName}`, async (db) => {
            for (const exportIndexInfo of exportIndicesInfo) {
                conduit_utils_1.logger.debug(`SearchExporter: export index: name: ${exportIndexInfo[0]}, size: ${exportIndexInfo[1].index.length}, version: ${exportIndexInfo[1].version}}`);
                await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey(exportIndexInfo[0]), this.searchEngine.getVersion(exportIndexInfo[0]));
                await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageEngineTypeKey(exportIndexInfo[0]), this.searchEngine.getEngineType());
                await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageIndexKey(exportIndexInfo[0]), exportIndexInfo[1].index);
            }
        });
    }
    async setMetaParameters(trc, db) {
        for (const indexName of this.searchEngine.getIndexNames()) {
            await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey(indexName), this.searchEngine.getVersion(indexName));
            await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageEngineTypeKey(indexName), this.searchEngine.getEngineType());
        }
    }
    /**
     * Checks that index parameters in the db matches with current search engine one
     * @param db kv overlay instance, required for the transaction semantics
     */
    async isReindexationRequired(trc, db) {
        for (const indexName of this.searchEngine.getIndexNames()) {
            // checks version match
            const version = await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey(indexName));
            if (version !== this.searchEngine.getVersion(indexName)) {
                conduit_utils_1.logger.info(`SearchIndexExporter: version mismatch: index: ${indexName}; db version: ${version}; target version: ${this.searchEngine.getVersion(indexName)}`);
                return true;
            }
        }
        return false;
    }
    /**
     * Imports index from the external storage.
     */
    async import(trc, db) {
        const out = new Map();
        for (const indexName of this.searchEngine.getIndexNames()) {
            const indexData = await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageIndexKey(indexName));
            const version = await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey(indexName));
            const type = await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageEngineTypeKey(indexName));
            if (indexData && version && type) {
                out.set(indexName, { index: indexData, version, type });
            }
        }
        return out;
    }
    async setIndex(indices) {
        await this.searchEngine.import(indices);
    }
    /**
     * Removes index from the external storage. Designed to be performed inside transaction.
     */
    async clean(trc, db) {
        // first try to clean old format
        await db.clearTable(trc, SearchIndexExporter.indexTableName);
        await db.clearTable(trc, this.getExternalStorageIndexTableName());
    }
}
exports.SearchIndexExporter = SearchIndexExporter;
SearchIndexExporter.indexTableName = 'OfflineSearchIndexes';
//# sourceMappingURL=SearchIndexExporter.js.map