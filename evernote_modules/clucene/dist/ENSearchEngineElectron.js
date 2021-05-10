"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ENElectronClucene_1 = require("./ENElectronClucene");
const en_search_engine_shared_1 = require("en-search-engine-shared");
exports.defaultQueryWithParams = {
    filterString: '',
    queryString: en_search_engine_shared_1.EMPTY_QUERY,
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
            return en_search_engine_shared_1.ENCLuceneHelper.setResultFlags(en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup(), pquery);
        }
        const searchWordsBuilder = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.searchWords);
        searchWordsBuilder.dontPrintAnd = false;
        const parsedSearchWords = searchWordsBuilder.build();
        const luceneQuery = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(parsedQuery, true, documentType);
        const queryWithParams = {
            filterString: luceneQuery,
            queryString: parsedSearchWords !== null && parsedSearchWords !== void 0 ? parsedSearchWords : en_search_engine_shared_1.EMPTY_QUERY,
            sortType: order !== null && order !== void 0 ? order : en_search_engine_shared_1.ENSortType.RELEVANCE,
            reverseOrder: (ascending !== undefined && ascending !== null) ? !ascending : false,
            from: offset !== null && offset !== void 0 ? offset : 0,
            size: maxNotes !== null && maxNotes !== void 0 ? maxNotes : -1,
        };
        const result = await this.clucene.search(queryWithParams);
        return en_search_engine_shared_1.ENCLuceneHelper.setResultFlags(result, pquery);
    }
    async suggest(query, documentType, optimization) {
        const suggestOptimization = optimization !== null && optimization !== void 0 ? optimization : ENSearchEngineElectron.defaultSuggestOptimization;
        // console.log('query: ', query);
        const param = new en_search_engine_shared_1.QueryStringParserParam();
        // while parsing query string for suggestions mustn't ignore stopwords, set stop word list as empty
        const pquery = en_search_engine_shared_1.QueryStringParser.parseWithParams(query, param);
        const queryBuilderFilters = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.filter);
        queryBuilderFilters.dontPrintAnd = false;
        const filters = queryBuilderFilters.build();
        // modify query
        let suggestResult = new Array();
        if (pquery.firstSearchWords && pquery.firstSearchWords.length > 0) {
            // there is string begining, we want to search it in entities fields
            const searchTokens = pquery.firstSearchWords.map(firstSearchWord => firstSearchWord.token);
            const suggestTypes = ['notebookText', 'spaceText', 'tagText', 'authorText', 'title', 'stackText'];
            for (const suggestType of suggestTypes) {
                const conditions = new Array();
                for (const searchToken of searchTokens) {
                    const escapedToken = en_search_engine_shared_1.ESQueryStringBuilder.escapeReservedChars(searchToken);
                    if (en_search_engine_shared_1.ENCLuceneHelper.primaryToAltFields.has(suggestType)) {
                        const singleConditionWithAlts = [`${suggestType}:${escapedToken}*`];
                        const altSuggestTypes = en_search_engine_shared_1.ENCLuceneHelper.primaryToAltFields.get(suggestType);
                        for (const altSuggestType of altSuggestTypes) {
                            if (altSuggestType.type === en_search_engine_shared_1.ENSearchAlternativeFieldType.SUFFIX) {
                                const suffixConditions = new Array();
                                const tokens = en_search_engine_shared_1.ENCLuceneHelper.nGramTokenize(searchToken, 3);
                                for (const token of tokens) {
                                    const truncatedEscapedToken = en_search_engine_shared_1.ESQueryStringBuilder.escapeReservedChars(token);
                                    suffixConditions.push(`${altSuggestType.name}:${truncatedEscapedToken}*^0.1`);
                                }
                                singleConditionWithAlts.push(`(${suffixConditions.join(' AND ')})`);
                            }
                            else {
                                singleConditionWithAlts.push(`${altSuggestType.name}:${escapedToken}*^0.5`);
                            }
                        }
                        const condition = `(${singleConditionWithAlts.join(' OR ')})`;
                        conditions.push(condition);
                    }
                    else {
                        conditions.push(`${suggestType}:${escapedToken}*`);
                    }
                }
                const suggestQueryString = conditions.join(" AND ");
                const suggestFilterString = (filters ? (filters + ' AND ') : '') + suggestQueryString;
                const queryWithParams = Object.assign({}, exports.defaultQueryWithParams);
                queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(suggestFilterString, true, documentType);
                queryWithParams.queryString = suggestQueryString;
                suggestResult = suggestResult.concat(await this.clucene.suggest(queryWithParams, searchTokens, suggestType));
            }
        }
        else {
            // zero suggest returns all entities from recently updated notes
            const queryWithParams = {
                filterString: en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(filters !== null && filters !== void 0 ? filters : en_search_engine_shared_1.EMPTY_QUERY, true, documentType),
                queryString: en_search_engine_shared_1.EMPTY_QUERY,
                sortType: en_search_engine_shared_1.ENSortType.UPDATED,
                reverseOrder: true,
                from: 0,
                size: 128,
            };
            suggestResult = await this.clucene.suggest(queryWithParams, [], null);
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
        queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(filters !== null && filters !== void 0 ? filters : en_search_engine_shared_1.EMPTY_QUERY, true, documentType);
        const currentResults = await this.clucene.search(queryWithParams);
        for (const suggest of suggestResults) {
            // console.log('escapeReservedChars: ', ESQueryStringBuilder.escapeReservedChars(suggest.value));
            const suggestFilter = suggest.type + ':"' + en_search_engine_shared_1.ESQueryStringBuilder.escapeReservedChars(suggest.value) + '"';
            const queryWithNewFilter = (filters ? (filters + ' AND ') : '') + suggestFilter;
            queryWithParams.filterString = en_search_engine_shared_1.ENCLuceneHelper.createLuceneQuery(queryWithNewFilter, true, documentType);
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
ENSearchEngineElectron.version = '12';
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