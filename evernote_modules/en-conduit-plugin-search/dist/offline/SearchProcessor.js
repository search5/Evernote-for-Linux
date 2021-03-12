"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchProcessor = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_core_entity_types_1 = require("en-core-entity-types");
const SearchExtractor_1 = require("./etl/SearchExtractor");
const SearchLoader_1 = require("./etl/SearchLoader");
const SearchTransformer_1 = require("./etl/SearchTransformer");
const SearchExporter_1 = require("./exporters/SearchExporter");
/**
 * ETL manager class.
 *
 * Performs extract/transform/load steps for the each input database event.
 */
class SearchProcessor {
    constructor(graphDB, searchEngine) {
        this.supportedStreamingEventTypes = [en_core_entity_types_1.CoreEntityTypes.Attachment, en_core_entity_types_1.CoreEntityTypes.Message, en_core_entity_types_1.CoreEntityTypes.Note, en_conduit_plugin_task_1.TaskEntityTypes.Task];
        // maximum time for the processing pipeline
        this.maxProcessingTime = 200;
        // maximum intervals between two flushes
        this.maxFlushInterval = 2 * 60 * 1000;
        // maximum not processed events in journal
        this.maxTailOffset = 5;
        // current event batch
        this.batch = [];
        // required in order to defer the events export up to the first process function call
        this.deferredEventsForExport = [];
        this.logoutRequested = false;
        this.searchTransformer = new SearchTransformer_1.SearchTransformer();
        // special flag for the initial index load/login/logout/change user cases.
        this.requiresInitialization = true;
        this.requiresFlush = false;
        this.latestFlush = Date.now();
        this.processedEvents = 0;
        this.supportedReindexationTypes = new Array();
        // ENSearchEngineWeb for now does not support search by messages.
        if (searchEngine.getEngineType() !== 'shared') {
            this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Message);
        }
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Note);
        this.searchEngine = searchEngine;
        this.searchExtractor = new SearchExtractor_1.SearchExtractor(graphDB);
        this.searchLoader = new SearchLoader_1.SearchLoader(searchEngine);
        this.searchExporter = new SearchExporter_1.SearchExporter(searchEngine, () => graphDB.getLocalKeyValStorage());
    }
    async cleanLocalState() {
        this.batch = [];
        this.deferredEventsForExport = [];
        this.reindexationState = undefined;
        await this.searchLoader.cleanIndex();
    }
    async cleanLocalAndPersistedStates(trc) {
        await this.cleanLocalState();
        await this.searchExporter.clean(trc);
    }
    setUserID(userID) {
        this.userID = userID;
        this.searchExporter.setUserID(userID);
    }
    /**
     * Performs initial diff between external and the search engine index ids.
     * Generates required events and loads them to them main queue.
     */
    async init(trc) {
        await this.searchEngine.init();
        await this.searchExporter.init(trc);
        conduit_utils_1.logger.debug(`SearchProcessor: deferred queue size: ${this.deferredEventsForExport.length}`);
        this.reindexationState = await this.searchExporter.getReindexationState(trc);
        if (this.reindexationState !== SearchExporter_1.ReindexationState.FINISHED) {
            conduit_utils_1.logger.debug('SearchProcessor: setup reindexation');
            this.deferredEventsForExport = [];
            const graphDBIdsInfo = await this.searchExtractor.getIds(trc, this.supportedReindexationTypes);
            this.reindexationState = await this.searchExporter.setupReindexation(trc, graphDBIdsInfo);
        }
        else {
            // first step is to export deferred events in order to persist them as fast as possible.
            // no need to add these events to the processing queue since they will be automatically extracted from the external database
            await this.exportDeferredEvents(trc);
        }
        await this.searchExporter.import(trc);
    }
    hasMoreNotesToProcess() {
        return this.batch.length > 0;
    }
    async exportDeferredEvents(trc) {
        if (this.deferredEventsForExport.length === 0) {
            return;
        }
        // note, that this.deferredEventsForExport is not directly exported in order to avoid a potential race
        const events = this.deferredEventsForExport.splice(0, this.deferredEventsForExport.length);
        await this.searchExporter.exportEvents(trc, events);
    }
    deduplicateEvents(events) {
        const entryMap = new Map();
        let currentPosition = 0;
        this.processedEvents += events.length;
        while (events.length !== 0) {
            const event = events.shift();
            if (event) {
                entryMap.set(`${event.nodeRef.id}:${event.nodeRef.type}:${event.eventType}`, [event, currentPosition]);
            }
            currentPosition++;
        }
        const batch = Array.from(entryMap.values())
            .sort((lhs, rhs) => {
            if (lhs[1] > rhs[1]) {
                return 1;
            }
            if (lhs[1] < rhs[1]) {
                return -1;
            }
            return 0;
        }).map(entry => entry[0]);
        conduit_utils_1.logger.debug(`SearchProcessor: deduplicated entries: ${currentPosition - batch.length}`);
        return batch;
    }
    async getEvents(trc) {
        if (this.batch.length === 0) {
            const batch = await this.searchExporter.getBatch(trc);
            this.batch = this.deduplicateEvents(batch);
        }
    }
    /**
     * Processes events from the main queue. Performs ETL pipeline.
     * @param userID current user id
     * @param yieldCheck external yield object
     */
    async process(trc, di, params) {
        // no auth case
        if (params.personalUserID === undefined || params.personalUserID === null) {
            return false;
        }
        // if logout/login or change user event was received it's required to calculate the updates for index
        if (this.requiresInitialization) {
            this.setUserID(params.personalUserID);
            await this.init(trc);
            this.requiresInitialization = false;
            return this.hasMoreNotesToProcess();
        }
        else {
            // to handle potential race
            await this.exportDeferredEvents(trc);
        }
        const timestamp = Date.now();
        await this.getEvents(trc);
        conduit_utils_1.logger.trace(`SearchProcessor: batch size: ${this.batch.length}; head: ${this.searchExporter.getHead()}; consumerAcknowledgedOffset: ${this.searchExporter.getConsumerAcknowledgedOffset()}; consumerLocalOffset: ${this.searchExporter.getConsumerLocalOffset()}; tail: ${this.searchExporter.getTail()}`);
        let indexUpdated = false;
        while (this.batch.length !== 0) {
            await params.yieldCheck;
            if (Date.now() - timestamp > this.maxProcessingTime) {
                break;
            }
            const event = this.batch.shift();
            if (event) {
                const extractionResults = await this.searchExtractor.process(trc, [event]);
                const transformationResults = await this.searchTransformer.process(extractionResults);
                indexUpdated = (await this.searchLoader.process(transformationResults)) || indexUpdated;
                this.requiresFlush = true;
            }
            await this.getEvents(trc);
        }
        if (indexUpdated) {
            di.emitEvent(conduit_view_types_1.ConduitEvent.SEARCH_INDEX_UPDATED);
        }
        if (this.requiresFlush && Date.now() - this.latestFlush > this.maxFlushInterval) {
            try {
                await this.searchExporter.exportIndex(trc);
                conduit_utils_1.logger.trace('SearchProcessor: processed events:  ' + this.processedEvents);
                await this.searchExporter.acknowledge(trc, this.processedEvents);
                this.processedEvents = 0;
                this.requiresFlush = false;
                this.latestFlush = Date.now();
            }
            catch (err) {
                conduit_utils_1.logger.error('SearchExporter: failed to save index.', err);
            }
        }
        await this.searchExporter.truncate(trc);
        return this.hasMoreNotesToProcess();
    }
    /**
     * Processes logout event, performs clean.
     */
    async processLogoutEvent(trc) {
        if (this.logoutRequested) {
            return;
        }
        this.logoutRequested = true;
        conduit_utils_1.logger.debug('SearchProcessor: logout: invalidate search index.');
        await this.cleanLocalAndPersistedStates(trc);
        this.setUserID(null);
        this.requiresInitialization = true;
        this.logoutRequested = false;
    }
    /**
     * Add events to the main processing queue.
     * @param events database events.
     */
    async processEvents(trc, events) {
        // main process function has not yet been called case, userID must be directly obtained from the graphDB
        if (this.userID === undefined || this.userID === null) {
            const userID = await this.searchExtractor.extractUserId(trc);
            if (!userID) {
                return;
            }
            this.searchExporter.setUserID(userID);
            this.userID = userID;
        }
        // it's prohibited to export events during the initial downsync due to performance impact.
        // event export is deferred up to the first init function call.
        // there are no versions for these events at this stage.
        if (this.requiresInitialization) {
            for (const event of events) {
                conduit_utils_1.logger.trace(`SearchProcessor: deferred event: ${event.nodeRef.type}; guid: ${event.nodeRef.id}; userID: ${this.userID}; event type: ${event.eventType};`);
                // NOTE, there could be a race when this eventHandler is called after this.deferredEventsForExport queue has been persisted (but before requiresInitialization has been set)
                // in order to address this problem additional event export is added to the main process function
                this.deferredEventsForExport.push(event);
            }
        }
        else {
            // all node events should be exported to the external database in order to maintain the search version subsystem.
            await this.searchExporter.exportEvents(trc, events);
            for (const event of events) {
                conduit_utils_1.logger.trace(`SearchProcessor: live event: ${event.nodeRef.type}; guid: ${event.nodeRef.id}; userID: ${this.userID}; event type: ${event.eventType};`);
            }
        }
    }
    /**
     * Provides currently supported types for processing.
     */
    getSupportedStreamingEventTypes() {
        return this.supportedStreamingEventTypes;
    }
    isInitialIndexationFinished() {
        return (this.reindexationState === SearchExporter_1.ReindexationState.FINISHED &&
            this.searchExporter.getTail() - this.searchExporter.getConsumerLocalOffset() < this.maxTailOffset);
    }
}
exports.SearchProcessor = SearchProcessor;
//# sourceMappingURL=SearchProcessor.js.map