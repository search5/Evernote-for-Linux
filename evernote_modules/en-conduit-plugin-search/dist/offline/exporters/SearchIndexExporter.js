"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndexExporter = void 0;
const conduit_utils_1 = require("conduit-utils");
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
    getExternalStorageIndexKey() {
        return 'index';
    }
    /**
     * Returns version key for the external storage.
     *
     * If index version is updated, index entry in the external database should be invalidated.
     */
    getExternalStorageVersionKey() {
        return 'version';
    }
    /**
     * Returns engine type key for the external storage.
     *
     * If engine type is updated, index entry in the external database should be invalidated.
     */
    getExternalStorageEngineTypeKey() {
        return 'engine_type';
    }
    /**
     * Exports index to the external storage.
     */
    async export(trc) {
        if (this.searchEngine.getEngineType() === 'shared'
            && (await this.searchEngine.getAllIds()).results.length > SearchIndexExporter.maxSharedEngineIndexSize) {
            return;
        }
        const index = await this.searchEngine.exportIndex();
        conduit_utils_1.logger.debug(`SearchExporter: export index: size: ${index.length}, version: ${this.searchEngine.getVersion()}`);
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchIndexExporter.indexTableName}`, async (db) => {
            await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey(), this.searchEngine.getVersion());
            await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageEngineTypeKey(), this.searchEngine.getEngineType());
            await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageIndexKey(), index);
        });
    }
    async setMetaParameters(trc, db) {
        await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey(), this.searchEngine.getVersion());
        await db.setValue(trc, this.getExternalStorageIndexTableName(), this.getExternalStorageEngineTypeKey(), this.searchEngine.getEngineType());
    }
    /**
     * Checks that index parameters in the db matches with current search engine one
     * @param db kv overlay instance, required for the transaction semantics
     */
    async isReindexationRequired(trc, db) {
        // checks version match
        const version = await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageVersionKey());
        if (version !== this.searchEngine.getVersion()) {
            conduit_utils_1.logger.info(`SearchIndexExporter: version mismatch: db version: ${version}; target version: ${this.searchEngine.getVersion()}`);
            return true;
        }
        // checks engine match
        const engineType = await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageEngineTypeKey());
        if (engineType !== this.searchEngine.getEngineType()) {
            conduit_utils_1.logger.info(`SearchIndexExporter: engine type mismatch: db engine type: ${engineType}; target type: ${this.searchEngine.getEngineType()}`);
            return true;
        }
        return false;
    }
    /**
     * Imports index from the external storage.
     */
    async import(trc, db) {
        return await db.getValue(trc, null, this.getExternalStorageIndexTableName(), this.getExternalStorageIndexKey());
    }
    async setIndex(index) {
        await this.searchEngine.importIndex(index);
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
// maximum number of documents for the shared search engine, that we want to save
SearchIndexExporter.maxSharedEngineIndexSize = 100;
SearchIndexExporter.indexTableName = 'OfflineSearchIndexes';
//# sourceMappingURL=SearchIndexExporter.js.map