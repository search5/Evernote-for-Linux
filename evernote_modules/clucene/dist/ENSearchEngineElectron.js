"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ENElectronClucene_1 = require("./ENElectronClucene");
const en_search_engine_shared_1 = require("en-search-engine-shared");
exports.defaultQueryWithParams = {
    queryString: '',
    sortType: en_search_engine_shared_1.ENSortType.RELEVANCE,
    reverseOrder: false,
    from: 0,
    size: -1
};
class ENSearchEngineElectron {
    constructor(logger) {
        this.clucene = new ENElectronClucene_1.CLuceneWrapper(logger);
    }
    async init() {
    }
    destructor() {
    }
    async importIndex(index) {
        const buffer = Buffer.from(index);
        await this.clucene.loadRAMDirectoryAsync(buffer, buffer.length);
    }
    async exportIndex() {
        const index = await this.clucene.dumpRAMDirectoryAsync();
        return (' ' + index.buffer).slice(1);
    }
    async addDocument(document) {
        await this.clucene.addDocumentAsync(document);
    }
    async deleteDocument(guid) {
        await this.clucene.deleteDocumentAsync(guid);
    }
    async search(query, documentType, offset, maxNotes, order, ascending) {
        const pquery = en_search_engine_shared_1.QueryStringParser.parse(query);
        const queryBuilder = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.fullQuery);
        queryBuilder.dontPrintAnd = false;
        const parsedQuery = queryBuilder.build();
        // console.log('parsedQuery: ', parsedQuery);
        if (parsedQuery === null) {
            return en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup();
        }
        const luceneQuery = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(parsedQuery, true, documentType);
        const queryWithParams = {
            queryString: luceneQuery,
            sortType: order !== null && order !== void 0 ? order : en_search_engine_shared_1.ENSortType.RELEVANCE,
            reverseOrder: (ascending !== undefined && ascending !== null) ? !ascending : false,
            from: offset !== null && offset !== void 0 ? offset : 0,
            size: maxNotes !== null && maxNotes !== void 0 ? maxNotes : -1,
        };
        return await this.clucene.search(queryWithParams);
    }
    async suggest(query, documentType, optimization) {
        const suggestOptimization = optimization !== null && optimization !== void 0 ? optimization : ENSearchEngineElectron.defaultSuggestOptimization;
        // console.log('query: ', query);
        const param = new en_search_engine_shared_1.QueryStringParserParam();
        // while parsing query string for suggestions mustn't ignore stopwords, set stop word list as empty
        const pquery = en_search_engine_shared_1.QueryStringParser.parseWithParams(query, param);
        // split query to filters and search words
        const queryBuilderFilters = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.filter);
        queryBuilderFilters.dontPrintAnd = false;
        const filters = queryBuilderFilters.build();
        // console.log('filters: ', filters);
        let suggestResult = new Array();
        // modify query
        if (pquery.firstSearchWords && pquery.firstSearchWords.length > 0) {
            // there is string begining, we want to search it in entities fields
            const suggestTypes = ['notebookText', 'spaceText', 'tagText', 'authorText', 'title', 'stackText'];
            for (const suggestType of suggestTypes) {
                const conditions = new Array();
                for (const firstSearchWord of pquery.firstSearchWords) {
                    const escapedToken = en_search_engine_shared_1.ESQueryStringBuilder.escapeReservedChars(firstSearchWord.token);
                    if (en_search_engine_shared_1.ENCLuceneHelper.primaryToAltFields.has(suggestType)) {
                        const altSuggestType = en_search_engine_shared_1.ENCLuceneHelper.primaryToAltFields.get(suggestType);
                        conditions.push(`(${suggestType}:${escapedToken}* OR ${altSuggestType}:${escapedToken}*)`);
                    }
                    else {
                        conditions.push(`${suggestType}:${escapedToken}*`);
                    }
                }
                // searchWords have prefixes 'content:', replace them with current entity name
                // split/join trick to replace all occurrences of the substring, as sting.replace only works with the first match 
                const suggestQuery = (filters ? (filters + ' AND ') : '') + conditions.join(" AND ");
                // console.log('suggestQuery: ', suggestQuery);
                const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
                queryWithParams.queryString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(suggestQuery, true, documentType);
                suggestResult = suggestResult.concat(await this.clucene.suggest(queryWithParams, suggestType));
            }
        }
        else {
            // zero suggest returns all entities from recently updated notes
            const suggestQuery = filters ? filters : '*:*';
            const queryWithParams = {
                queryString: en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(suggestQuery, true, documentType),
                sortType: en_search_engine_shared_1.ENSortType.UPDATED,
                reverseOrder: true,
                from: 0,
                size: 128,
            };
            suggestResult = await this.clucene.suggest(queryWithParams, null);
        }
        if (suggestOptimization === en_search_engine_shared_1.ENSuggestOptimization.O3) {
            return await this.filterOutUselessSuggests(suggestResult, filters);
        }
        return suggestResult;
    }
    async filterOutUselessSuggests(suggestResults, filters, documentType) {
        // remove suggests which don't narrow current results
        const filteredSuggestResult = new Array();
        const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
        queryWithParams.queryString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(filters ? filters : '*:*', true, documentType);
        const currentResults = await this.clucene.search(queryWithParams);
        for (const suggest of suggestResults) {
            const suggestFilter = suggest.type + ':"' + en_search_engine_shared_1.ESQueryStringBuilder.escapeReservedChars(suggest.value) + '"';
            const queryWithNewFilter = (filters ? (filters + ' AND ') : '') + suggestFilter;
            queryWithParams.queryString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(queryWithNewFilter, true, documentType);
            const filterResults = await this.clucene.search(queryWithParams);
            if (filterResults.results.length < currentResults.results.length) {
                filteredSuggestResult.push(suggest);
            }
        }
        return filteredSuggestResult;
    }
    async clear() {
        await this.clucene.loadRAMDirectoryAsync(Buffer.from(''), 0);
    }
    async getAllIds(documentType) {
        const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
        queryWithParams.queryString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery('*:*', true, documentType);
        return await this.clucene.search(queryWithParams);
    }
    /**
     * Checks if query contains only metadata filtering.
     */
    async isMetadataQuery(query) {
        return en_search_engine_shared_1.QueryStringParser.isMetadataQuery(query);
    }
    async indexInfo() {
        return {};
    }
    getVersion() {
        return ENSearchEngineElectron.version;
    }
    getEngineType() {
        return ENSearchEngineElectron.type;
    }
}
exports.ENSearchEngineElectron = ENSearchEngineElectron;
// indicates major version of index. should be updated when the new index version is incompatible
// with the previous one
ENSearchEngineElectron.version = '11';
ENSearchEngineElectron.type = 'electron';
ENSearchEngineElectron.defaultSuggestOptimization = en_search_engine_shared_1.ENSuggestOptimization.O3;
/**
 * Base factory function.
 */
function provideSearchEngine(logger) {
    return new ENSearchEngineElectron(logger);
}
exports.provideSearchEngine = provideSearchEngine;
//# sourceMappingURL=ENSearchEngineElectron.js.map