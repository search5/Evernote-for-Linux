"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchExporter = exports.InitialEventsProcessingState = exports.ReindexationState = void 0;
const conduit_utils_1 = require("conduit-utils");
const SearchEventBootstrapper_1 = require("./SearchEventBootstrapper");
const SearchEventExporter_1 = require("./SearchEventExporter");
const SearchEventJournal_1 = require("./SearchEventJournal");
const SearchIndexExporter_1 = require("./SearchIndexExporter");
var ReindexationState;
(function (ReindexationState) {
    ReindexationState["REQUIRED"] = "Required";
    ReindexationState["IN_PROGRESS"] = "In_Progress";
    ReindexationState["FINISHED"] = "Finished";
})(ReindexationState = exports.ReindexationState || (exports.ReindexationState = {}));
var InitialEventsProcessingState;
(function (InitialEventsProcessingState) {
    InitialEventsProcessingState["REQUIRED"] = "Required";
    InitialEventsProcessingState["FINISHED"] = "Finished";
})(InitialEventsProcessingState = exports.InitialEventsProcessingState || (exports.InitialEventsProcessingState = {}));
/**
 * Orchestates import / export of the internal search engine structures from/to the external database.
 */
class SearchExporter {
    constructor(searchEngine, localStorageProvider) {
        this.reindexationState = ReindexationState.REQUIRED;
        this.initialEventProcessingState = InitialEventsProcessingState.REQUIRED;
        this.localStorageProvider = localStorageProvider;
        this.searchIndexExporter = new SearchIndexExporter_1.SearchIndexExporter(searchEngine, this.localStorageProvider);
        this.searchEventJournal = new SearchEventJournal_1.SearchEventJournal(this.localStorageProvider);
        this.searchEventBootstrapper = new SearchEventBootstrapper_1.SearchEventBootstrapper(this.localStorageProvider);
        this.searchEventExporter = new SearchEventExporter_1.SearchEventExporter();
    }
    getMetaTableName() {
        return `${SearchExporter.metaTablePrefix}:${this.userID}:metainfo`;
    }
    getReindexationStateKey() {
        return 'reindexation_state';
    }
    getInitialEventsProcessingStateKey() {
        return 'initial_events_processing_state';
    }
    setUserID(userID) {
        this.userID = userID;
        this.searchIndexExporter.setUserID(userID);
        this.searchEventJournal.setUserID(userID);
        this.searchEventBootstrapper.setUserID(userID);
        this.searchEventExporter.setUserID(userID);
    }
    async cleanInternal(trc, db) {
        await this.searchIndexExporter.clean(trc, db);
        await this.searchEventJournal.clean(trc, db);
        await this.searchEventExporter.clean(trc, db);
    }
    /**
     * Cleans all persisted information about current user (index and event versions tables).
     * @param entryTypes
     */
    async clean(trc) {
        await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            await this.cleanInternal(trc, db);
            await this.searchEventBootstrapper.clean(trc, db);
            await db.clearTable(trc, this.getMetaTableName());
        });
    }
    async init(trc) {
        await this.searchEventJournal.init(trc);
        this.initialEventProcessingState = await this.getInitialEventsProcessingState(trc);
    }
    async setupReindexation(trc, source) {
        await this.searchEventBootstrapper.init(trc, source);
        return await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            await this.searchIndexExporter.setMetaParameters(trc, db);
            await this.searchEventJournal.setMetaParameters(trc, db);
            await this.setReindexationState(trc, db, ReindexationState.IN_PROGRESS);
            return this.reindexationState;
        });
    }
    async exportReindexationBatch(trc) {
        if (this.reindexationState === ReindexationState.FINISHED) {
            return;
        }
        await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            const events = await this.searchEventBootstrapper.getEventBatch(trc, db);
            if (events.length === 0) {
                await this.setReindexationState(trc, db, ReindexationState.FINISHED);
                await this.searchEventBootstrapper.clean(trc, db);
                conduit_utils_1.logger.debug('SearchExporter reindexation finished.');
            }
            else {
                await this.searchEventJournal.exportInTransaction(trc, events, db);
            }
        });
    }
    async getBatch(trc) {
        await this.exportReindexationBatch(trc);
        return await this.searchEventJournal.getBatch(trc);
    }
    async setReindexationState(trc, db, state) {
        this.reindexationState = state;
        await db.setValue(trc, this.getMetaTableName(), this.getReindexationStateKey(), this.reindexationState);
    }
    async setInitialEventsProcessingStateLocal(initialEventsProcessingState) {
        this.initialEventProcessingState = initialEventsProcessingState;
    }
    async saveInitialEventsProcessingStatePersistent(trc) {
        await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            await db.setValue(trc, this.getMetaTableName(), this.getInitialEventsProcessingStateKey(), this.initialEventProcessingState);
        });
    }
    async setInitialIndexationStateLocalAndPersistent(trc, db, initialEventsProcessingState) {
        this.initialEventProcessingState = initialEventsProcessingState;
        await db.setValue(trc, this.getMetaTableName(), this.getInitialEventsProcessingStateKey(), this.initialEventProcessingState);
    }
    async getInitialEventsProcessingState(trc) {
        return await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            var _a;
            return (_a = await db.getValue(trc, null, this.getMetaTableName(), this.getInitialEventsProcessingStateKey())) !== null && _a !== void 0 ? _a : InitialEventsProcessingState.REQUIRED;
        });
    }
    isInitialIndexationFinished() {
        return this.initialEventProcessingState === InitialEventsProcessingState.FINISHED;
    }
    /**
     * Checks if reindexation is required
     * @param entryTypes
     */
    async getReindexationState(trc) {
        await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            var _a;
            let indexationRequired = await this.searchEventJournal.isReindexationRequired(trc, db);
            if (!indexationRequired) {
                indexationRequired = await this.searchIndexExporter.isReindexationRequired(trc, db);
            }
            this.reindexationState = (_a = await db.getValue(trc, null, this.getMetaTableName(), this.getReindexationStateKey())) !== null && _a !== void 0 ? _a : ReindexationState.REQUIRED;
            conduit_utils_1.logger.debug('SearchExporter reindexation state: ' + this.reindexationState);
            if (this.reindexationState === ReindexationState.REQUIRED) {
                indexationRequired = true;
            }
            if (indexationRequired) {
                await this.setReindexationState(trc, db, ReindexationState.REQUIRED);
                await this.setInitialIndexationStateLocalAndPersistent(trc, db, InitialEventsProcessingState.REQUIRED);
                await this.cleanInternal(trc, db);
            }
        });
        return this.reindexationState;
    }
    /**
     * Imports persisted state for the current user.
     */
    async import(trc) {
        const indices = await this.localStorageProvider().transact(trc, `GraphDB.${SearchExporter.name}`, async (db) => {
            return await this.searchIndexExporter.import(trc, db);
        });
        if (indices.size !== 0) {
            for (const index of indices) {
                conduit_utils_1.logger.info(`SearchExporter: import index; name: ${index[0]}; size: ${index[1].index.length};`);
            }
            await this.searchIndexExporter.setIndex(indices);
        }
        else {
            conduit_utils_1.logger.info(`SearchExporter: no index to import;`);
        }
    }
    /**
     * Exports events to the external database
     * @param events events to export
     */
    async exportEvents(trc, events) {
        await this.searchEventJournal.export(trc, events);
    }
    /**
     * Exports index to the external database.
     */
    async exportIndex(trc) {
        await this.searchIndexExporter.export(trc);
    }
    /**
     * Acknowledges the processed events by moving consumer offset forward.
     */
    async acknowledge(trc, processedEvents) {
        await this.saveInitialEventsProcessingStatePersistent(trc);
        await this.searchEventJournal.acknowledge(trc, processedEvents);
    }
    async truncate(trc) {
        await this.searchEventJournal.truncate(trc);
    }
    getHead() {
        return this.searchEventJournal.getHead();
    }
    getTail() {
        return this.searchEventJournal.getTail();
    }
    getConsumerAcknowledgedOffset() {
        return this.searchEventJournal.getConsumerAcknowledgedOffset();
    }
    getConsumerLocalOffset() {
        return this.searchEventJournal.getConsumerLocalOffset();
    }
}
exports.SearchExporter = SearchExporter;
SearchExporter.metaTablePrefix = 'OfflineSearch';
//# sourceMappingURL=SearchExporter.js.map