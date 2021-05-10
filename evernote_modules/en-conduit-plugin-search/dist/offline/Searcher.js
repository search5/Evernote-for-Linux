"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Searcher = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchExUtil_1 = require("../SearchExUtil");
const SearchSchemaTypes_1 = require("../SearchSchemaTypes");
const SearchUtils_1 = require("./SearchUtils");
/**
 * Search engine adapter.
 *
 * Transforms internal search engine results to the Search/SearchEx ones.
 */
class Searcher {
    constructor(searchEngine) {
        this.quickSwitcherTypes = [SearchSchemaTypes_1.SearchExResultType.TAG, SearchSchemaTypes_1.SearchExResultType.NOTE,
            SearchSchemaTypes_1.SearchExResultType.NOTEBOOK, SearchSchemaTypes_1.SearchExResultType.STACK, SearchSchemaTypes_1.SearchExResultType.WORKSPACE];
        this.searchEngine = searchEngine;
    }
    /**
     * Performs search for input query. If query is empty returns all ids.
     *
     * Supports only NOTE type and considered as legacy.
     * @param query input query.
     */
    async search(query) {
        const startTime = new Date().getTime();
        let guids = new Array();
        // search api by design does not support entry types except note
        if (query.length === 0) {
            guids = (await this.searchEngine.getAllIds(en_search_engine_shared_1.ENDocumentType.NOTE)).results.map(entry => entry.guid);
        }
        else {
            guids = (await this.searchEngine.search(query, en_search_engine_shared_1.ENDocumentType.NOTE)).results.map(entry => entry.guid);
        }
        const results = [];
        for (const guid of guids) {
            results.push({
                noteID: en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Note),
                containerID: null,
                score: 0,
                label: null,
                updated: null,
            });
        }
        const searchTime = new Date().getTime() - startTime;
        conduit_utils_1.logger.debug(`Searcher: time: ${searchTime}; found: ${guids.length}`);
        return {
            results,
            resultCount: results.length,
            startIndex: 0,
            searchLogInfo: null,
        };
    }
    getSearchExNote(searchResult) {
        return {
            type: SearchSchemaTypes_1.SearchExResultType.NOTE,
            id: SearchExUtil_1.serviceGuidToObjectID(searchResult.guid, SearchSchemaTypes_1.SearchExResultType.NOTE),
            label: null,
            score: searchResult.score,
            searchFilter: null,
            highlight: null,
            updated: null,
            snippet: null,
        };
    }
    getSearchExNoteFromSuggest(searchResult) {
        return {
            type: SearchSchemaTypes_1.SearchExResultType.NOTE,
            id: SearchExUtil_1.serviceGuidToObjectID(searchResult.guid, SearchSchemaTypes_1.SearchExResultType.NOTE),
            label: searchResult.value,
            score: searchResult.score,
            searchFilter: SearchExUtil_1.composeSearchFilterString(searchResult.guid, SearchSchemaTypes_1.SearchExResultType.NOTE),
            highlight: null,
            updated: null,
            snippet: null,
        };
    }
    getSearchExBaseResult(searchResult, documentType) {
        return {
            type: documentType,
            id: SearchExUtil_1.serviceGuidToObjectID(searchResult.guid, documentType),
            label: null,
            score: searchResult.score,
            searchFilter: null,
            highlight: null,
        };
    }
    getSearchExBaseResultFromSuggest(searchResult, documentType) {
        return {
            type: documentType,
            id: SearchExUtil_1.serviceGuidToObjectID(searchResult.guid, documentType),
            label: searchResult.value,
            score: searchResult.score,
            searchFilter: SearchExUtil_1.composeSearchFilterString(searchResult.guid, documentType),
            highlight: null,
        };
    }
    isSearchRequest(resultSpecInstance) {
        return resultSpecInstance.textSearchField === null || resultSpecInstance.textSearchField === 0 /* ALL */;
    }
    /**
     * Performs search for input query and specific result type. If query is empty returns all ids.
     * @param query SearchEx query.
     * @param requestedType type to search for (eg notes or messages).
     */
    async searchExOneType(args, requestedType) {
        const result = SearchExUtil_1.emptySearchExResult();
        const resSpec = SearchExUtil_1.findResultSpec(args, requestedType);
        if (resSpec === null || !this.isSearchRequest(resSpec)) {
            return result;
        }
        const searchStr = SearchExUtil_1.getSearchString(args);
        if (searchStr.length === 0) {
            return result;
        }
        const offset = resSpec.startIndex || 0;
        const maxNotes = resSpec.maxResults || 128;
        const sortOrder = resSpec.sort || 3 /* RELEVANCE */;
        const ascending = resSpec.ascending || false;
        const engineResultGroup = await this.searchEngine.search(searchStr, SearchUtils_1.SearchTypeConversions.SEARCH_EX_RESULT_TYPE_TO_DOCUMENT_TYPE.get(requestedType), offset, maxNotes, SearchUtils_1.SearchTypeConversions.SEARCH_EX_SORT_ORDER_TO_SORT_TYPE.get(sortOrder), ascending);
        const resGroup = SearchExUtil_1.emptyResultGroup(requestedType);
        for (const searchResult of engineResultGroup.results) {
            const res = requestedType === SearchSchemaTypes_1.SearchExResultType.NOTE ? this.getSearchExNote(searchResult) : this.getSearchExBaseResult(searchResult, requestedType);
            resGroup.results.push(res);
        }
        resGroup.startIndex = engineResultGroup.startIndex;
        resGroup.totalResultCount = engineResultGroup.totalResultCount;
        result.results.push(resGroup);
        if (engineResultGroup.resultFlags !== undefined) {
            result.meta = {
                resultFlags: {
                    isValidQueryStr: engineResultGroup.resultFlags.isValidQueryStr,
                    isBoolean: engineResultGroup.resultFlags.isBoolean,
                    isGeo: engineResultGroup.resultFlags.isGeo,
                    isFiltered: engineResultGroup.resultFlags.isFiltered,
                },
            };
        }
        return result;
    }
    async isQuickSwitcherRequest(args) {
        if (!args.param || !args.param.resultSpec) {
            return false;
        }
        const totalRequestedTypes = args.param.resultSpec.length;
        if (totalRequestedTypes !== this.quickSwitcherTypes.length) {
            return false;
        }
        for (const quickSwitcherType of this.quickSwitcherTypes) {
            const resSpec = SearchExUtil_1.findResultSpec(args, quickSwitcherType);
            if (resSpec === null || this.isSearchRequest(resSpec)) {
                return false;
            }
        }
        if (await this.isQueryWithFilters(args)) {
            return false;
        }
        return true;
    }
    async suggest(args, authData) {
        const searchExRet = SearchExUtil_1.emptySearchExResult();
        const searchStr = SearchExUtil_1.getSearchString(args);
        let engineResults = new Array();
        if (await this.isQuickSwitcherRequest(args)) {
            engineResults = await this.searchEngine.suggest(searchStr, en_search_engine_shared_1.ENDocumentType.NOTE, en_search_engine_shared_1.ENSuggestOptimization.NONE);
        }
        else {
            engineResults = await this.searchEngine.suggest(searchStr, en_search_engine_shared_1.ENDocumentType.NOTE);
        }
        // TODO: resotre this when full sync for large buiness acoounts is enabled
        // in case of empty request in business account we should limit note scope for suggest
        // if (searchStr.length === 0 && authData.vaultAuth) {
        //   const clientUserId: string = authData.userID.toString();
        //   searchStr = 'any: creatorId:' + clientUserId + ' lastEditorId:' + clientUserId;
        // }
        if (engineResults) {
            for (const engineSuggestion of engineResults) {
                if (!engineSuggestion.guid) {
                    throw new conduit_utils_1.InternalError('Missing guid in offline suggest response');
                }
                if (!engineSuggestion.type) {
                    throw new conduit_utils_1.InternalError('Missing type in offline suggest response');
                }
                const resultType = SearchUtils_1.SearchTypeConversions.SUGGEST_TYPE_TO_SEARCH_EX_RESULT_TYPE.get(engineSuggestion.type);
                if (!resultType) {
                    throw new conduit_utils_1.InternalError('Invalid type in offline suggest response');
                }
                // disable author suggestions for personal account
                // TODO: remove this when author field is always present
                if (resultType === SearchSchemaTypes_1.SearchExResultType.AUTHOR && !authData.vaultAuth) {
                    continue;
                }
                // find corresponding result group
                let resultGroup = searchExRet.results.find(g => g.type === resultType);
                if (!resultGroup) {
                    resultGroup = SearchExUtil_1.emptyResultGroup(resultType);
                    searchExRet.results.push(resultGroup);
                }
                if (resultType === SearchSchemaTypes_1.SearchExResultType.NOTE) {
                    resultGroup.results.push(this.getSearchExNoteFromSuggest(engineSuggestion));
                }
                else {
                    resultGroup.results.push(this.getSearchExBaseResultFromSuggest(engineSuggestion, resultType));
                }
                resultGroup.totalResultCount += 1;
            }
        }
        return searchExRet;
    }
    async isMetadataQuery(args) {
        const resSpec = SearchExUtil_1.findResultSpec(args, SearchSchemaTypes_1.SearchExResultType.NOTE);
        if (resSpec === null || !this.isSearchRequest(resSpec)) {
            // allow only search request
            return false;
        }
        const searchStr = SearchExUtil_1.getSearchString(args);
        return await this.searchEngine.isMetadataQuery(searchStr);
    }
    async isQueryWithFilters(args) {
        const searchStr = SearchExUtil_1.getSearchString(args);
        return await this.searchEngine.isQueryWithFilters(searchStr);
    }
    /**
     * Returns true if query can be processed locally
     *
     * @param args searchEx query.
     */
    async isLocallyProcessedQuery(args) {
        return await this.isMetadataQuery(args) || await this.isQuickSwitcherRequest(args);
    }
}
exports.Searcher = Searcher;
//# sourceMappingURL=Searcher.js.map