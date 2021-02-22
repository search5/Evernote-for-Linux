"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchLoader = void 0;
const conduit_utils_1 = require("conduit-utils");
const SearchUtils_1 = require("../SearchUtils");
/**
 * Final stage of the ETL pipeline. Loads transformed data to the search engine.
 */
class SearchLoader {
    constructor(searchEngine) {
        this.searchEngine = searchEngine;
    }
    /**
     * Processes input event events.
     *
     * If it's create/replace event, loads data to the search engine index. Otherwise,
     * removes the corresponding document.
     * @param events transformed events with the raw text
     * @return true if index was updated.
     */
    async process(events) {
        let indexUpdated = false;
        for (const event of events) {
            switch (event.type) {
                case SearchUtils_1.SearchStorageEventType.DELETE:
                    conduit_utils_1.logger.trace('SearchLoader deleteDocument:' + event.guid);
                    await this.searchEngine.deleteDocument(event.guid);
                    indexUpdated = true;
                    break;
                default:
                    const document = event.document;
                    if (document) {
                        conduit_utils_1.logger.trace('SearchLoader addDocument:' + document.guid + '; version: ' + document.version);
                        await this.searchEngine.addDocument(document);
                        indexUpdated = true;
                    }
                    break;
            }
        }
        return indexUpdated;
    }
    /**
     * Returns all ids from the search engine index.
     *
     * This method is required in order to perform the initial diff between external database and the search engine index.
     */
    async getIds() {
        const engineResultGroup = await this.searchEngine.getAllIds();
        const results = new Map();
        for (const engineResult of engineResultGroup.results) {
            if (!results.has(engineResult.type)) {
                const resultsForTypeEmpty = new Map();
                results.set(engineResult.type, resultsForTypeEmpty);
            }
            const resultsForType = results.get(engineResult.type);
            resultsForType.set(engineResult.guid, engineResult.version);
        }
        return results;
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