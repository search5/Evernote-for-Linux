"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEventJournal = exports.getSearchStorageChangeEvent = exports.getSearchEventJournalEntry = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchProcessor_1 = require("../SearchProcessor");
const SearchUtils_1 = require("../SearchUtils");
const SearchEventJournalIndex_1 = require("./SearchEventJournalIndex");
function getSearchEventJournalEntry(event) {
    const searchStorageChangeEventType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
    if (searchStorageChangeEventType === undefined) {
        conduit_utils_1.logger.error(`SearchEventJournal: unable to serialize event; reason: conduit storage event format has changed; unrecognized event type: ${event.eventType}`);
        return undefined;
    }
    const tguid = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
    const documentType = SearchUtils_1.SearchTypeConversions.NODE_TYPE_TO_DOCUMENT_TYPE.get(event.nodeRef.type);
    return { guid: tguid, dt: documentType, et: searchStorageChangeEventType, it: event.indexationType };
}
exports.getSearchEventJournalEntry = getSearchEventJournalEntry;
function getSearchStorageChangeEvent(event) {
    const nodeType = SearchUtils_1.SearchTypeConversions.DOCUMENT_TYPE_TO_NODE_TYPE.get(event.dt);
    const guid = en_thrift_connector_1.convertGuidFromService(event.guid, nodeType);
    const eventType = SearchUtils_1.SearchTypeConversions.SEARCH_STORAGE_EVENT_TYPE_TO_STORAGE_CHANGE_TYPE.get(event.et);
    const indexationType = event.it;
    return { nodeRef: { id: guid, type: nodeType }, localTimestamp: Date.now(), eventType, indexationType };
}
exports.getSearchStorageChangeEvent = getSearchStorageChangeEvent;
/**
 * Simple event journal implementation (persisted queue in the external database)
 */
class SearchEventJournal {
    constructor(localKeyValueStorageProvider) {
        this.index = new SearchEventJournalIndex_1.SearchEventJournalIndex();
        this.tail = 0;
        this.head = 0;
        this.consumerAcknowledgedOffset = 0;
        this.consumerLocalOffset = 0;
        // maximum number of records that could be truncated per one truncate call
        this.truncateBatchSize = 1000;
        this.batchSize = 100;
        // maximum number of records in the journal
        this.maxJournalSize = 128000;
        this.localKeyValueStorageProvider = localKeyValueStorageProvider;
    }
    async init(trc) {
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchEventJournal.eventJournalTableName}`, async (db) => {
            this.tail = await db.getValue(trc, null, this.getMetaTableName(), this.getMetaTableTailKey()) || 0;
            this.head = await db.getValue(trc, null, this.getMetaTableName(), this.getMetaTableHeadKey()) || 0;
            this.consumerAcknowledgedOffset = await db.getValue(trc, null, this.getMetaTableName(), this.getMetaTableConsumerAcknowledgedOffsetKey()) || 0;
            this.consumerLocalOffset = this.consumerAcknowledgedOffset;
            await this.buildIndex(trc, db);
        });
    }
    async buildIndex(trc, db) {
        const keys = (await db.getKeys(trc, null, this.getEventJournalTableName())).map(key => parseInt(key, 10)).sort().map(key => key.toString());
        const values = await db.batchGetValues(trc, null, this.getEventJournalTableName(), keys);
        for (const key of keys) {
            const value = values[key];
            if (value) {
                const event = getSearchStorageChangeEvent(value);
                this.index.add(event);
            }
        }
    }
    setUserID(userID) {
        this.userID = userID;
    }
    setTruncateBatchSize(truncateBatchSize) {
        this.truncateBatchSize = truncateBatchSize;
    }
    setBatchSize(batchSize) {
        this.batchSize = batchSize;
    }
    setMaxJournalSize(maxJournalSize) {
        this.maxJournalSize = maxJournalSize;
    }
    getTail() {
        return this.tail;
    }
    getHead() {
        return this.head;
    }
    getConsumerAcknowledgedOffset() {
        return this.consumerAcknowledgedOffset;
    }
    getConsumerLocalOffset() {
        return this.consumerLocalOffset;
    }
    /**
     * Returns event journal database name.
     */
    getEventJournalTableName() {
        return `${SearchEventJournal.eventJournalTableName}:${this.userID}:journal`;
    }
    /**
     * Returns event meta datatabase name.
     */
    getMetaTableName() {
        return `${SearchEventJournal.eventJournalTableName}:${this.userID}:metainfo`;
    }
    getMetaTableTailKey() {
        return `tail`;
    }
    getMetaTableHeadKey() {
        return `head`;
    }
    getMetaTableVersionKey() {
        return 'version';
    }
    getMetaTableConsumerAcknowledgedOffsetKey() {
        return 'consumer_ack_offset';
    }
    /**
     * Removes all event tables for provided event types for current user.
     *
     * Designed to be performed inside transaction.
     * @param db transaction object
     * @param entryTypes requested node entries types
     */
    async clean(trc, db) {
        this.tail = 0;
        this.head = 0;
        this.consumerAcknowledgedOffset = 0;
        this.consumerLocalOffset = 0;
        this.index.clean();
        await db.clearTable(trc, this.getEventJournalTableName());
        await db.clearTable(trc, this.getMetaTableName());
    }
    async setMetaParameters(trc, db) {
        await db.setValue(trc, this.getMetaTableName(), this.getMetaTableVersionKey(), SearchEventJournal.eventJournalVersion);
    }
    /**
     * Checks if reindexation is required.
     *
     * Designed to be performed inside transaction.
     * @param events external storage events
     */
    async isReindexationRequired(trc, db) {
        const version = await db.getValue(trc, null, this.getMetaTableName(), this.getMetaTableVersionKey());
        conduit_utils_1.logger.debug(`SearchEventJournal: database version: ${version}, local version: ${SearchEventJournal.eventJournalVersion}`);
        // no initial event export was performed
        if (version === undefined || version === null) {
            return true;
        }
        // initial event export was performed, but the event format has changed.
        if (version !== SearchEventJournal.eventJournalVersion) {
            conduit_utils_1.logger.info('SearchEventJournal: version mismatch.');
            return true;
        }
        // checks if the queue invariants are broken
        if ((this.head > this.consumerAcknowledgedOffset) || (this.consumerAcknowledgedOffset > this.tail)) {
            conduit_utils_1.logger.error(`SearchEventJournal: queue invariants are broken: head: ${this.head}, consumerAck: ${this.consumerAcknowledgedOffset}; tail: ${this.tail}`);
            return true;
        }
        return false;
    }
    async exportInTransaction(trc, events, db) {
        let eventsToExport;
        let discardedEventsAccumulator = 0;
        const journalSize = this.tail - this.head;
        if ((journalSize + events.length) > this.maxJournalSize) {
            const totalEventsToExport = this.maxJournalSize - journalSize;
            eventsToExport = events.slice(0, totalEventsToExport);
            discardedEventsAccumulator += events.length - totalEventsToExport;
            conduit_utils_1.logger.error(`SearchEventJournal: ${events.length - totalEventsToExport} events discarded; reason: cannot exceed max journal size!`);
        }
        else {
            eventsToExport = events;
        }
        for (const event of eventsToExport) {
            const serializedSearchStorageChangeEvent = getSearchEventJournalEntry(event);
            if (serializedSearchStorageChangeEvent === undefined) {
                conduit_utils_1.logger.trace(`SearchEventJournal: event with id ${event.nodeRef.id} discarded; reason: unable to serialize event!`);
                discardedEventsAccumulator += 1;
                continue;
            }
            if (this.index.has(event) && (event.indexationType === SearchProcessor_1.SearchStorageIndexationType.LIVE_INDEXATION_EVENT)) {
                conduit_utils_1.logger.trace(`SearchEventJournal: event with id ${event.nodeRef.id} discarded: reason: it's already in the index`);
                discardedEventsAccumulator += 1;
                continue;
            }
            conduit_utils_1.logger.trace(`SearchEventJournal: event with id ${event.nodeRef.id} added to journal and index`);
            this.index.add(event);
            await db.setValue(trc, this.getEventJournalTableName(), this.tail.toString(), serializedSearchStorageChangeEvent);
            this.tail += 1;
        }
        conduit_utils_1.logger.trace(`SearchEventJournal: total discarded events: ${discardedEventsAccumulator};`);
        await db.setValue(trc, this.getMetaTableName(), this.getMetaTableTailKey(), this.tail);
    }
    /**
     * Exports events to the external storage in order to allow incremental indexation.
     * @param events external storage events
     */
    async export(trc, events) {
        if (events.length === 0) {
            conduit_utils_1.logger.debug('SearchExporter: no input events');
            return;
        }
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchEventJournal.eventJournalTableName}`, async (db) => {
            await this.exportInTransaction(trc, events, db);
        });
    }
    async getEvents(trc, db, keys) {
        const events = new Array();
        const values = await db.batchGetValues(trc, null, this.getEventJournalTableName(), keys);
        for (const key of keys) {
            if (values[key]) {
                const event = getSearchStorageChangeEvent(values[key]);
                this.index.remove(event);
                events.push(event);
            }
        }
        return events;
    }
    /**
     * Returns next batch for the indexation.
     */
    async getBatch(trc) {
        // nothing to process
        if (this.consumerLocalOffset === this.tail) {
            return [];
        }
        const keys = [];
        for (let i = this.consumerLocalOffset; i < this.consumerLocalOffset + this.batchSize; ++i) {
            if (i === this.tail) {
                break;
            }
            keys.push(i.toString());
        }
        const events = await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchEventJournal.eventJournalTableName}`, async (db) => {
            return await this.getEvents(trc, db, keys);
        });
        this.consumerLocalOffset += keys.length;
        return events;
    }
    /**
     * Acknowledges the processed events by moving consumer offset forward.
     */
    async acknowledge(trc, processedEvents) {
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchEventJournal.eventJournalTableName}`, async (db) => {
            this.consumerAcknowledgedOffset = this.consumerAcknowledgedOffset + processedEvents;
            await db.setValue(trc, this.getMetaTableName(), this.getMetaTableConsumerAcknowledgedOffsetKey(), this.consumerAcknowledgedOffset);
        });
    }
    /**
     * Truncates event journal, limits numbers of entries truncated, moves head forward.
     */
    async truncate(trc) {
        if (this.head === this.consumerAcknowledgedOffset) {
            return;
        }
        await this.localKeyValueStorageProvider().transact(trc, `GraphDB.${SearchEventJournal.eventJournalTableName}`, async (db) => {
            let truncatedEntries = 0;
            for (let i = this.head; i < this.consumerAcknowledgedOffset; ++i) {
                await db.removeValue(trc, this.getEventJournalTableName(), i.toString());
                truncatedEntries += 1;
                if (truncatedEntries === this.truncateBatchSize) {
                    break;
                }
            }
            this.head += truncatedEntries;
            await db.setValue(trc, this.getMetaTableName(), this.getMetaTableHeadKey(), this.head);
        });
    }
}
exports.SearchEventJournal = SearchEventJournal;
SearchEventJournal.eventJournalTableName = 'OfflineSearchEventJournal';
SearchEventJournal.eventJournalVersion = 3;
//# sourceMappingURL=SearchEventJournal.js.map