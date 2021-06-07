"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchProcessor = exports.SearchStorageIndexationType = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchExtractor_1 = require("./etl/SearchExtractor");
const SearchLoader_1 = require("./etl/SearchLoader");
const SearchTransformer_1 = require("./etl/SearchTransformer");
const SearchExporter_1 = require("./exporters/SearchExporter");
const SearchUtils_1 = require("./SearchUtils");
var SearchStorageIndexationType;
(function (SearchStorageIndexationType) {
    SearchStorageIndexationType[SearchStorageIndexationType["INITIAL_INDEXATION_EVENT"] = 0] = "INITIAL_INDEXATION_EVENT";
    SearchStorageIndexationType[SearchStorageIndexationType["LAST_INITIAL_INDEXATION_EVENT"] = 1] = "LAST_INITIAL_INDEXATION_EVENT";
    SearchStorageIndexationType[SearchStorageIndexationType["LIVE_INDEXATION_EVENT"] = 2] = "LIVE_INDEXATION_EVENT";
})(SearchStorageIndexationType = exports.SearchStorageIndexationType || (exports.SearchStorageIndexationType = {}));
/**
 * ETL manager class.
 *
 * Performs extract/transform/load steps for the each input database event.
 */
class SearchProcessor {
    constructor(graphDB, searchEngine) {
        this.supportedStreamingEventTypes = [en_core_entity_types_1.CoreEntityTypes.Attachment, en_core_entity_types_1.CoreEntityTypes.Message, en_core_entity_types_1.CoreEntityTypes.Note,
            en_data_model_1.EntityTypes.Task, en_core_entity_types_1.CoreEntityTypes.Tag, en_core_entity_types_1.CoreEntityTypes.Notebook, en_core_entity_types_1.CoreEntityTypes.Workspace, en_core_entity_types_1.CoreEntityTypes.Stack];
        // maximum time for the processing pipeline
        this.maxProcessingTime = 200;
        // maximum intervals between two flushes
        this.maxFlushInterval = 2 * 60 * 1000;
        // current event batch
        this.batch = [];
        // required in order to defer the events export up to the first process function call
        this.deferredEventsForExport = [];
        // renaming events
        // current transformed from renaming event note events
        this.transformedNoteEventsFromRenamingEvent = [];
        // maximum number of transformed from renaming event note events to journal export
        this.transformedNoteEventsFromRenamingEventBatchSize = 100;
        this.logoutRequested = false;
        this.searchTransformer = new SearchTransformer_1.SearchTransformer();
        // special flag for the initial index load/login/logout/change user cases.
        this.requiresInitialization = true;
        this.latestFlush = Date.now();
        this.processedEvents = 0;
        this.supportedReindexationTypes = new Array();
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Message);
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Note);
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Tag);
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Notebook);
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Stack);
        this.supportedReindexationTypes.push(en_core_entity_types_1.CoreEntityTypes.Workspace);
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
    // todo:: should be separate function in order to simplify tests
    deduplicateEvents(events) {
        const eventsWithDeduplicateInformation = new Array();
        const reverseEvents = events.reverse();
        const entrySet = new Set();
        for (const event of reverseEvents) {
            const key = `${event.nodeRef.id}:${event.nodeRef.type}:${event.eventType}`;
            if (entrySet.has(key)) {
                eventsWithDeduplicateInformation.push({ searchStorageChangeEvent: event, isDuplicate: true });
            }
            else {
                entrySet.add(key);
                eventsWithDeduplicateInformation.push({ searchStorageChangeEvent: event, isDuplicate: false });
            }
        }
        return eventsWithDeduplicateInformation.reverse();
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
        // eslint-disable-next-line max-len
        conduit_utils_1.logger.trace(`SearchProcessor: batch size: ${this.batch.length}; head: ${this.searchExporter.getHead()}; consumerAcknowledgedOffset: ${this.searchExporter.getConsumerAcknowledgedOffset()}; consumerLocalOffset: ${this.searchExporter.getConsumerLocalOffset()}; tail: ${this.searchExporter.getTail()}`);
        let indexUpdated = false;
        while (this.batch.length !== 0 || this.transformedNoteEventsFromRenamingEvent.length !== 0) {
            await params.yieldCheck;
            if (Date.now() - timestamp > this.maxProcessingTime) {
                break;
            }
            // checks if there're more note events for export to the journal
            if (this.transformedNoteEventsFromRenamingEvent.length !== 0) {
                await this.exportTransformedNoteEvents(trc);
                continue;
            }
            const event = this.batch.shift();
            const shouldProcessEvent = await this.shouldProcessEvent(trc, event);
            if (!event.isDuplicate && shouldProcessEvent) {
                const extractionResults = await this.searchExtractor.process(trc, [event.searchStorageChangeEvent]);
                const transformationResults = await this.searchTransformer.process(extractionResults);
                if (transformationResults[0] && SearchUtils_1.SearchRenamingEventsUtils.RENAMING_EVENT_NODE_TYPES.has(event.searchStorageChangeEvent.nodeRef.type)) {
                    await this.processSecondaryIndexEvent(trc, transformationResults[0]);
                }
                else {
                    indexUpdated = (await this.searchLoader.process(transformationResults)) || indexUpdated;
                }
            }
            this.processedEvents += 1;
            await this.getEvents(trc);
        }
        if (indexUpdated) {
            di.emitEvent(conduit_view_types_1.ConduitEvent.SEARCH_INDEX_UPDATED);
        }
        if (this.transformedNoteEventsFromRenamingEvent.length === 0 && this.searchEngine.shouldExport() && Date.now() - this.latestFlush > this.maxFlushInterval) {
            try {
                await this.searchExporter.exportIndex(trc);
                conduit_utils_1.logger.trace('SearchProcessor: processed events:  ' + this.processedEvents);
                await this.searchExporter.acknowledge(trc, this.processedEvents);
                this.processedEvents = 0;
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
     * Processes events which can trigger reindexation (tag, notebook, workspace).
     *
     * @param trc tracing context
     * @param event etl transformation step event
     */
    async processSecondaryIndexEventWithReindexation(trc, event) {
        if (event.document && event.document.content) {
            if (!this.searchExporter.isInitialIndexationFinished()) {
                // initial indexation event case - simply loads document to index
                conduit_utils_1.logger.trace(`SearchProcessor: process initial other index event: guid: ${event.guid}; documentType: ${event.documentType}`);
                await this.searchLoader.process([event]);
            }
            else {
                // live indexation event case - check if the update / reindexation is required
                const searchGuidRequest = en_search_engine_shared_1.ENSearchQueryUtils.getSearchGuidRequest(event.guid);
                const searchGuidResults = await this.searchEngine.search(searchGuidRequest, event.documentType);
                if (searchGuidResults.totalResultCount > 1) {
                    conduit_utils_1.logger.error(`SearchProcessor: secondary index is corrupted: it contains more than one entry with the specified guid: ${event.guid}; type: ${event.documentType}`);
                    return;
                }
                // eslint-disable-next-line max-len
                conduit_utils_1.logger.trace(`SearchProcessor: process live other index event: guid: ${event.guid}; guid search results length: ${searchGuidResults.totalResultCount}`);
                if (searchGuidResults.totalResultCount === 0) {
                    conduit_utils_1.logger.trace(`SearchProcessor: process live other index event: guid: ${event.guid}; new document`);
                    await this.searchLoader.process([event]);
                }
                else {
                    if (!searchGuidResults.results[0].label) {
                        conduit_utils_1.logger.error(`SearchProcessor: secondary index is corrupted: it does not contain the field source; guid: ${event.guid}; type: ${event.documentType}`);
                        return;
                    }
                    if (searchGuidResults.results[0].label !== event.document.content) {
                        conduit_utils_1.logger.trace(`SearchProcessor: process live other index event: guid: ${event.guid}; changed name`);
                        // first - update entry in the secondary index
                        await this.searchLoader.process([event]);
                        // second - generate list of note events
                        switch (event.documentType) {
                            case en_search_engine_shared_1.ENDocumentType.TAG:
                            case en_search_engine_shared_1.ENDocumentType.NOTEBOOK:
                                for (const guid of event.noteGuids) {
                                    this.transformedNoteEventsFromRenamingEvent.push(SearchUtils_1.SearchRenamingEventsUtils.createNoteEvent(guid, SearchStorageIndexationType.LIVE_INDEXATION_EVENT));
                                }
                                conduit_utils_1.logger.trace(`SearchProcessor: process live other index event: guid: ${event.guid}; generated note events: ${this.transformedNoteEventsFromRenamingEvent.length}`);
                                break;
                            case en_search_engine_shared_1.ENDocumentType.WORKSPACE:
                                const workspaceConduitGuid = en_thrift_connector_1.convertGuidFromService(event.guid, en_core_entity_types_1.CoreEntityTypes.Workspace);
                                const workspaceNoteIds = await this.searchExtractor.extractNoteIdsForWorkspace(trc, workspaceConduitGuid);
                                for (const guid of workspaceNoteIds) {
                                    // todo:: think about propagating indexation type to transform events
                                    this.transformedNoteEventsFromRenamingEvent.push(SearchUtils_1.SearchRenamingEventsUtils.createNoteEvent(guid, SearchStorageIndexationType.LIVE_INDEXATION_EVENT));
                                }
                                // eslint-disable-next-line max-len
                                conduit_utils_1.logger.trace(`SearchProcessor: process live other index event: guid: ${event.guid}; workspace generated note events: ${this.transformedNoteEventsFromRenamingEvent.length}`);
                                break;
                        }
                    }
                    else {
                        conduit_utils_1.logger.trace(`SearchProcessor: process live other index event: guid: ${event.guid}; duplicate event`);
                    }
                }
            }
        }
    }
    /**
     * Processes secondary indices events (tag, notebook, stack, space).
     * Separates stack processing from the other types (since change stack event automatically triggers the corresponding note update event.)
     *
     * @param trc
     * @param event
     */
    async processSecondaryIndexEvent(trc, event) {
        switch (event.eventType) {
            // all delete events are simply propagated
            case SearchUtils_1.SearchStorageEventType.DELETE:
                await this.searchLoader.process([event]);
                break;
            case SearchUtils_1.SearchStorageEventType.INDEX:
                // check if this is the type, which requires reindexation if the renaming event is occured
                switch (event.documentType) {
                    case en_search_engine_shared_1.ENDocumentType.TAG:
                    case en_search_engine_shared_1.ENDocumentType.NOTEBOOK:
                    case en_search_engine_shared_1.ENDocumentType.WORKSPACE:
                        await this.processSecondaryIndexEventWithReindexation(trc, event);
                        break;
                    // for the stack it's sufficient to simply propagate the event
                    case en_search_engine_shared_1.ENDocumentType.STACK:
                        await this.searchLoader.process([event]);
                        break;
                }
                break;
        }
    }
    async shouldProcessEvent(trc, event) {
        let shouldProcessEvent = true;
        // defers live indexation processing event
        if (!this.searchExporter.isInitialIndexationFinished()) {
            switch (event.searchStorageChangeEvent.indexationType) {
                case SearchStorageIndexationType.LIVE_INDEXATION_EVENT:
                    await this.processEvents(trc, [event.searchStorageChangeEvent]);
                    conduit_utils_1.logger.trace(`SearchProcessor: shouldProcessEvent: guid: ${event.searchStorageChangeEvent.nodeRef.id}. event is deferred until initial indexation is finished.`);
                    shouldProcessEvent = false;
                    break;
                // set persistent flag that initial event processing is ended and processes the event
                case SearchStorageIndexationType.LAST_INITIAL_INDEXATION_EVENT:
                    await this.searchExporter.setInitialEventsProcessingStateLocal(SearchExporter_1.InitialEventsProcessingState.FINISHED);
                    shouldProcessEvent = false;
                    conduit_utils_1.logger.info(`SearchProcessor: finished processing initial indexation events.`);
                    break;
                // processes event
                default:
                    // process initial indexation event
                    shouldProcessEvent = true;
                    break;
            }
        }
        else {
            conduit_utils_1.logger.trace(`SearchProcessor: process live event: ${event.searchStorageChangeEvent.nodeRef.id}.`);
        }
        return shouldProcessEvent;
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
        if (conduit_utils_1.isNullish(this.userID)) {
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
    async exportTransformedNoteEvents(trc) {
        const transformedNoteEventsFromRenamingEventBatch = [];
        while (this.transformedNoteEventsFromRenamingEvent.length !== 0
            && transformedNoteEventsFromRenamingEventBatch.length !== this.transformedNoteEventsFromRenamingEventBatchSize) {
            const transformedEvent = this.transformedNoteEventsFromRenamingEvent.shift();
            if (transformedEvent) {
                transformedNoteEventsFromRenamingEventBatch.push(transformedEvent);
            }
        }
        conduit_utils_1.logger.trace(`SearchProcessor: exportTransformedNoteEvents: exported batch size: ${transformedNoteEventsFromRenamingEventBatch.length}`);
        await this.searchExporter.exportEvents(trc, transformedNoteEventsFromRenamingEventBatch);
    }
    /**
     * Provides currently supported types for processing.
     */
    getSupportedStreamingEventTypes() {
        return this.supportedStreamingEventTypes;
    }
    isInitialIndexationFinished() {
        return this.searchExporter.isInitialIndexationFinished();
    }
}
exports.SearchProcessor = SearchProcessor;
//# sourceMappingURL=SearchProcessor.js.map