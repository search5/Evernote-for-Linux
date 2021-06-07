"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchLoader = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const SearchUtils_1 = require("../SearchUtils");
/**
 * Final stage of the ETL pipeline. Loads transformed data to the search engine.
 */
class SearchLoader {
    constructor(searchEngine) {
        this.searchEngine = searchEngine;
    }
    async processDeleteEvent(event) {
        switch (event.documentType) {
            case en_search_engine_shared_1.ENDocumentType.TAG:
                await this.searchEngine.deleteTag(event.guid);
                return false;
            case en_search_engine_shared_1.ENDocumentType.NOTEBOOK:
                await this.searchEngine.deleteNotebook(event.guid);
                return false;
            case en_search_engine_shared_1.ENDocumentType.STACK:
                await this.searchEngine.deleteStack(event.guid);
                return false;
            case en_search_engine_shared_1.ENDocumentType.WORKSPACE:
                await this.searchEngine.deleteWorkspace(event.guid);
                return false;
            default:
                await this.searchEngine.deleteDocument(event.guid);
                return true;
        }
    }
    async processIndexEvent(event) {
        if (event.documentType !== en_search_engine_shared_1.ENDocumentType.STACK) {
            conduit_utils_1.logger.trace(`SearchLoader: processIndexEvent: guid: ${event.guid}; documentType: ${event.documentType}`);
        }
        else {
            conduit_utils_1.logger.trace(`SearchLoader: processIndexEvent: stack`);
        }
        switch (event.documentType) {
            case en_search_engine_shared_1.ENDocumentType.TAG:
                if (event.document) {
                    await this.searchEngine.addTag(event.document);
                }
                return false;
            case en_search_engine_shared_1.ENDocumentType.NOTEBOOK:
                if (event.document) {
                    await this.searchEngine.addNotebook(event.document);
                }
                return false;
            case en_search_engine_shared_1.ENDocumentType.STACK:
                if (event.document) {
                    await this.searchEngine.addStack(event.document);
                }
                return false;
            case en_search_engine_shared_1.ENDocumentType.WORKSPACE:
                if (event.document) {
                    await this.searchEngine.addWorkspace(event.document);
                }
                return false;
            default:
                if (event.document) {
                    await this.searchEngine.addDocument(event.document);
                    return true;
                }
                return false;
        }
    }
    /**
     * Processes input event events.
     *
     * If it's create/replace event, loads data to the search engine index. Otherwise,
     * removes the corresponding document.
     * @param events transformed events with the raw text
     * @return true if the main index was updated.
     */
    async process(events) {
        let indexUpdated = false;
        for (const event of events) {
            switch (event.eventType) {
                case SearchUtils_1.SearchStorageEventType.DELETE:
                    conduit_utils_1.logger.trace('SearchLoader deleteDocument:' + event.guid);
                    indexUpdated = await this.processDeleteEvent(event);
                    break;
                default:
                    const document = event.document;
                    if (document) {
                        indexUpdated = await this.processIndexEvent(event);
                    }
                    break;
            }
        }
        return indexUpdated;
    }
    /**
     * Cleans all from the search engine index.
     */
    async cleanIndex() {
        return await this.searchEngine.clear();
    }
}
exports.SearchLoader = SearchLoader;
//# sourceMappingURL=SearchLoader.js.map