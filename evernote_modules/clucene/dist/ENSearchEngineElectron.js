"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// import { ENSearchEngineLogger } from 'en-search-engine-shared';
const en_search_engine_shared_1 = require("en-search-engine-shared");
exports.defaultQueryWithParams = {
    filterString: '',
    queryString: en_search_engine_shared_1.EMPTY_QUERY,
    sortType: en_search_engine_shared_1.ENSortType.RELEVANCE,
    reverseOrder: false,
    from: 0,
    size: en_search_engine_shared_1.PAGE_SIZE,
};
exports.defaultResultSpec = [{ type: en_search_engine_shared_1.ENSuggestResultType.HISTORY, maxResults: 5 }, { type: en_search_engine_shared_1.ENSuggestResultType.TITLE, maxResults: 5 },
    { type: en_search_engine_shared_1.ENSuggestResultType.NOTEBOOK, maxResults: 5 }, { type: en_search_engine_shared_1.ENSuggestResultType.SPACE, maxResults: 5 }, { type: en_search_engine_shared_1.ENSuggestResultType.TAG, maxResults: 5 },
    { type: en_search_engine_shared_1.ENSuggestResultType.AUTHOR, maxResults: 5 }, { type: en_search_engine_shared_1.ENSuggestResultType.STACK, maxResults: 5 }];
class ENSearchEngineElectron {
    constructor(logger, clucene) {
        this.clucene = clucene;
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
    async search(params) {
        var _a, _b, _c;
        const param = new en_search_engine_shared_1.QueryStringParserParam();
        if (params.isFullBooleanSearch) {
            param.booleanOperatorsEnabled = true;
        }
        const pquery = en_search_engine_shared_1.QueryStringParser.parseWithParams(params.query, param);
        const queryBuilder = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.fullQueryWithoutStopWords);
        queryBuilder.dontPrintAnd = false;
        const parsedQuery = queryBuilder.build();
        // console.log('parsedQuery: ', parsedQuery);
        if (parsedQuery === null) {
            return en_search_engine_shared_1.ENCLuceneHelper.setResultFlags(en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup(), pquery);
        }
        const searchWordsBuilder = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.searchWords);
        searchWordsBuilder.dontPrintAnd = false;
        const parsedSearchWords = searchWordsBuilder.build();
        const luceneQuery = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(parsedQuery, true, params.documentType);
        const queryWithParams = {
            filterString: luceneQuery,
            queryString: parsedSearchWords !== null && parsedSearchWords !== void 0 ? parsedSearchWords : en_search_engine_shared_1.EMPTY_QUERY,
            sortType: (_a = params.order) !== null && _a !== void 0 ? _a : en_search_engine_shared_1.ENSortType.RELEVANCE,
            reverseOrder: (params.ascending !== undefined && params.ascending !== null) ? !params.ascending : false,
            from: (_b = params.offset) !== null && _b !== void 0 ? _b : 0,
            size: (_c = params.maxNotes) !== null && _c !== void 0 ? _c : en_search_engine_shared_1.PAGE_SIZE,
        };
        const result = await this.clucene.search(queryWithParams);
        return en_search_engine_shared_1.ENCLuceneHelper.setResultFlags(result, pquery);
    }
    async suggest(query, params) {
        var _a;
        const suggestOptimization = (_a = params.optimization) !== null && _a !== void 0 ? _a : ENSearchEngineElectron.defaultSuggestOptimization;
        // console.log('query: ', query);
        const param = new en_search_engine_shared_1.QueryStringParserParam();
        // while parsing query string for suggestions mustn't ignore stopwords, set stop word list as empty
        const pquery = en_search_engine_shared_1.QueryStringParser.parseWithParams(query, param);
        const queryBuilderFilters = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.filter);
        queryBuilderFilters.dontPrintAnd = false;
        const filters = queryBuilderFilters.build();
        const resultSpec = params.resultSpec.length > 0 ? params.resultSpec : exports.defaultResultSpec;
        // modify query
        let suggestResult = new Array();
        let searchTokens = [];
        if (pquery.firstSearchWords && pquery.firstSearchWords.length > 0) {
            searchTokens = pquery.firstSearchWords.map(firstSearchWord => en_search_engine_shared_1.ESQueryStringBuilder.removeSurroundingPunctuation(firstSearchWord.token)).filter(token => token.length !== 0);
        }
        for (const suggestResultSpec of resultSpec) {
            const suggestFieldName = en_search_engine_shared_1.ENCLuceneHelper.suggestTypeToFieldName.get(suggestResultSpec.type);
            if (suggestFieldName) {
                let suggestQueryString = '';
                const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
                if (searchTokens.length > 0) {
                    // there is string begining, we want to search it in entities fields
                    const conditions = en_search_engine_shared_1.ENCLuceneHelper.getConditionsForSuggestType(suggestFieldName, searchTokens);
                    suggestQueryString = conditions.join(" AND ");
                }
                else {
                    // zero suggest returns all entities from recently updated notes
                    const suggestBaseFieldName = en_search_engine_shared_1.ENCLuceneHelper.suggestTypeToMainFieldName.get(suggestResultSpec.type);
                    if (suggestBaseFieldName) {
                        suggestQueryString = en_search_engine_shared_1.ENCLuceneHelper.exists + ':' + suggestBaseFieldName;
                        queryWithParams.sortType = en_search_engine_shared_1.ENSortType.UPDATED;
                        queryWithParams.reverseOrder = true;
                    }
                }
                if (suggestQueryString.length > 0) {
                    const suggestFilterString = (filters ? (filters + ' AND ') : '') + suggestQueryString;
                    queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(suggestFilterString, true, params.documentType);
                    queryWithParams.queryString = suggestQueryString;
                    queryWithParams.stored_fields = ['nbGuid', 'notebook', 'spaceGuid', 'space', 'tagGuid', 'tag', 'creatorId', 'author', 'title', 'stack'];
                    queryWithParams.from = 0;
                    let fieldSuggestResult = new Array();
                    const maxPages = 1; // increase this value for pagination
                    while (queryWithParams.from < en_search_engine_shared_1.PAGE_SIZE * maxPages) {
                        // console.log('queryWithParams: ', queryWithParams);
                        let pageSuggestResult = await this.clucene.suggest(queryWithParams, searchTokens, suggestFieldName);
                        if (pageSuggestResult.length === 0) {
                            break;
                        }
                        if (suggestOptimization === en_search_engine_shared_1.ENSuggestOptimization.O3 && filters) {
                            // filter results only if searchString contains filters
                            pageSuggestResult = await this.filterOutUselessSuggests(pageSuggestResult, filters, suggestResultSpec.maxResults - fieldSuggestResult.length);
                        }
                        for (const suggest of pageSuggestResult) {
                            if (fieldSuggestResult.find(result => (result.type === suggest.type && result.guid === suggest.guid)) === undefined) {
                                fieldSuggestResult.push(suggest);
                            }
                        }
                        queryWithParams.from += en_search_engine_shared_1.PAGE_SIZE;
                        if (fieldSuggestResult.length >= suggestResultSpec.maxResults) {
                            fieldSuggestResult = fieldSuggestResult.slice(0, suggestResultSpec.maxResults);
                            break;
                        }
                    }
                    suggestResult = suggestResult.concat(fieldSuggestResult);
                }
            }
        }
        return suggestResult;
    }
    async filterOutUselessSuggests(suggestResults, filters, maxResults, documentType) {
        // remove suggests which don't narrow current results
        const filteredSuggestResult = new Array();
        const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
        queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(filters !== null && filters !== void 0 ? filters : en_search_engine_shared_1.EMPTY_QUERY, true, documentType);
        queryWithParams.size = 0;
        const currentResults = await this.clucene.search(queryWithParams);
        for (const suggest of suggestResults) {
            // console.log('escapeReservedChars: ', ESQueryStringBuilder.escapeReservedChars(suggest.value));
            const suggestFilter = suggest.type + ':"' + en_search_engine_shared_1.ESQueryStringBuilder.escapeReservedChars(suggest.value) + '"';
            const queryWithNewFilter = (filters ? (filters + ' AND ') : '') + suggestFilter;
            queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(queryWithNewFilter, true, documentType);
            const filterResults = await this.clucene.search(queryWithParams);
            if (filterResults.totalResultCount < currentResults.totalResultCount) {
                filteredSuggestResult.push(suggest);
                if (filteredSuggestResult.length === maxResults) {
                    break;
                }
            }
        }
        return filteredSuggestResult;
    }
    async clear() {
        await this.clucene.loadRAMDirectoryAsync(Buffer.from(''), 0);
    }
    async getAllIds(documentType) {
        const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
        queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(en_search_engine_shared_1.EMPTY_QUERY, true, documentType);
        return await this.clucene.search(queryWithParams);
    }
    /**
     * Checks if query contains only metadata filtering.
     */
    async isMetadataQuery(query) {
        return en_search_engine_shared_1.QueryStringParser.isMetadataQuery(query);
    }
    async isQueryWithFilters(query) {
        return en_search_engine_shared_1.QueryStringParser.isQueryWithFilters(query);
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
ENSearchEngineElectron.version = '14';
ENSearchEngineElectron.type = 'electron';
ENSearchEngineElectron.defaultSuggestOptimization = en_search_engine_shared_1.ENSuggestOptimization.O3;
//# sourceMappingURL=ENSearchEngineElectron.js.map