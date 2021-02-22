"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEventExporter = void 0;
const en_data_model_1 = require("en-data-model");
/**
 * Perfroms import / export operations from / to external database for events.
 *
 * Deprecated, will be removed. Required only for the legacy table cleanup.
 */
class SearchEventExporter {
    constructor() {
        this.entryTypes = [en_data_model_1.CoreEntityTypes.Note, en_data_model_1.CoreEntityTypes.Message];
    }
    setUserID(userID) {
        this.userID = userID;
    }
    /**
     * Returns event datatabase name for the specified type.
     */
    getExternalStorageEventTableName(type) {
        return `${SearchEventExporter.versionTableName}:${this.userID}:${type}`;
    }
    /**
     * Returns event meta datatabase name for the specified type.
     *
     * Meta database name stores version of the event tables format.
     */
    getExternalStorageEventMetaTableName() {
        return `${SearchEventExporter.versionTableName}:${this.userID}:metainfo`;
    }
    /**
     * Removes all event tables for provided event types for current user.
     *
     * Designed to be performed inside transaction.
     * @param db transaction object
     * @param entryTypes requested node entries types
     */
    async clean(trc, db) {
        for (const entryType of this.entryTypes) {
            await db.clearTable(trc, this.getExternalStorageEventTableName(entryType));
        }
        await db.clearTable(trc, this.getExternalStorageEventMetaTableName());
    }
}
exports.SearchEventExporter = SearchEventExporter;
SearchEventExporter.versionTableName = 'OfflineSearchEventsVersions';
//# sourceMappingURL=SearchEventExporter.js.map