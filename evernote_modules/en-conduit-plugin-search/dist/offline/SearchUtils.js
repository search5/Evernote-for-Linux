"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchTypeConversions = exports.SearchStorageEventType = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const SearchSchemaTypes_1 = require("../SearchSchemaTypes");
var SearchStorageEventType;
(function (SearchStorageEventType) {
    SearchStorageEventType[SearchStorageEventType["INDEX"] = 0] = "INDEX";
    SearchStorageEventType[SearchStorageEventType["DELETE"] = 1] = "DELETE";
})(SearchStorageEventType = exports.SearchStorageEventType || (exports.SearchStorageEventType = {}));
/**
 * Provides forward / backward mappings between the ENDocumentType / NodeType enums.
 */
class SearchTypeConversions {
    static initializeDocumentTypeToNodeType() {
        const documentTypeToNodeType = new Map();
        documentTypeToNodeType.set(en_search_engine_shared_1.ENDocumentType.NOTE, en_core_entity_types_1.CoreEntityTypes.Note);
        documentTypeToNodeType.set(en_search_engine_shared_1.ENDocumentType.MESSAGE, en_core_entity_types_1.CoreEntityTypes.Message);
        documentTypeToNodeType.set(en_search_engine_shared_1.ENDocumentType.ATTACHMENT, en_core_entity_types_1.CoreEntityTypes.Attachment);
        return documentTypeToNodeType;
    }
    static initializNodeTypeToDocumentType() {
        const nodeTypeToDocumentType = new Map();
        nodeTypeToDocumentType.set(en_core_entity_types_1.CoreEntityTypes.Note, en_search_engine_shared_1.ENDocumentType.NOTE);
        nodeTypeToDocumentType.set(en_core_entity_types_1.CoreEntityTypes.Message, en_search_engine_shared_1.ENDocumentType.MESSAGE);
        nodeTypeToDocumentType.set(en_core_entity_types_1.CoreEntityTypes.Attachment, en_search_engine_shared_1.ENDocumentType.ATTACHMENT);
        return nodeTypeToDocumentType;
    }
    static initializeSearchExResultTypeToDocumentType() {
        const searchExResultTypeToDocumentType = new Map();
        searchExResultTypeToDocumentType.set(SearchSchemaTypes_1.SearchExResultType.NOTE, en_search_engine_shared_1.ENDocumentType.NOTE);
        searchExResultTypeToDocumentType.set(SearchSchemaTypes_1.SearchExResultType.MESSAGE, en_search_engine_shared_1.ENDocumentType.MESSAGE);
        return searchExResultTypeToDocumentType;
    }
    static initializeDocumentTypeToSearchExResultType() {
        const searchExResultTypeToDocumentType = new Map();
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENDocumentType.NOTE, SearchSchemaTypes_1.SearchExResultType.NOTE);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENDocumentType.MESSAGE, SearchSchemaTypes_1.SearchExResultType.MESSAGE);
        return searchExResultTypeToDocumentType;
    }
    static initializeSuggestTypeToSearchExResultType() {
        const searchExResultTypeToDocumentType = new Map();
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.TITLE, SearchSchemaTypes_1.SearchExResultType.NOTE);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.NOTEBOOK, SearchSchemaTypes_1.SearchExResultType.NOTEBOOK);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.SPACE, SearchSchemaTypes_1.SearchExResultType.WORKSPACE);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.TAG, SearchSchemaTypes_1.SearchExResultType.TAG);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.AUTHOR, SearchSchemaTypes_1.SearchExResultType.AUTHOR);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.HISTORY, SearchSchemaTypes_1.SearchExResultType.HISTORY);
        searchExResultTypeToDocumentType.set(en_search_engine_shared_1.ENSuggestResultType.STACK, SearchSchemaTypes_1.SearchExResultType.STACK);
        return searchExResultTypeToDocumentType;
    }
    static initializeSearchStorageEventTypeToStorageChangeType() {
        const searchStorageEventTypeTostorageChangeType = new Map();
        searchStorageEventTypeTostorageChangeType.set(SearchStorageEventType.INDEX, conduit_storage_1.StorageChangeType.Replace);
        searchStorageEventTypeTostorageChangeType.set(SearchStorageEventType.DELETE, conduit_storage_1.StorageChangeType.Delete);
        return searchStorageEventTypeTostorageChangeType;
    }
    static initializeStorageChangeTypToSearchStorageEventType() {
        const storageChangeTypeToSearchStorageEventType = new Map();
        storageChangeTypeToSearchStorageEventType.set(conduit_storage_1.StorageChangeType.Create, SearchStorageEventType.INDEX);
        storageChangeTypeToSearchStorageEventType.set(conduit_storage_1.StorageChangeType.Replace, SearchStorageEventType.INDEX);
        storageChangeTypeToSearchStorageEventType.set(conduit_storage_1.StorageChangeType.Undo, SearchStorageEventType.INDEX);
        storageChangeTypeToSearchStorageEventType.set(conduit_storage_1.StorageChangeType.Delete, SearchStorageEventType.DELETE);
        return storageChangeTypeToSearchStorageEventType;
    }
    static initializeSearchExSortOrderToSortType() {
        const searchExSortOrderToSortType = new Map();
        searchExSortOrderToSortType.set(1 /* CREATED */, en_search_engine_shared_1.ENSortType.CREATED);
        searchExSortOrderToSortType.set(2 /* UPDATED */, en_search_engine_shared_1.ENSortType.UPDATED);
        searchExSortOrderToSortType.set(3 /* RELEVANCE */, en_search_engine_shared_1.ENSortType.RELEVANCE);
        searchExSortOrderToSortType.set(5 /* TITLE */, en_search_engine_shared_1.ENSortType.TITLE);
        return searchExSortOrderToSortType;
    }
}
exports.SearchTypeConversions = SearchTypeConversions;
SearchTypeConversions.DOCUMENT_TYPE_TO_NODE_TYPE = SearchTypeConversions.initializeDocumentTypeToNodeType();
SearchTypeConversions.NODE_TYPE_TO_DOCUMENT_TYPE = SearchTypeConversions.initializNodeTypeToDocumentType();
SearchTypeConversions.SEARCH_EX_RESULT_TYPE_TO_DOCUMENT_TYPE = SearchTypeConversions.initializeSearchExResultTypeToDocumentType();
SearchTypeConversions.DOCUMENT_TYPE_TO_SEARCH_EX_RESULT_TYPE = SearchTypeConversions.initializeDocumentTypeToSearchExResultType();
SearchTypeConversions.SUGGEST_TYPE_TO_SEARCH_EX_RESULT_TYPE = SearchTypeConversions.initializeSuggestTypeToSearchExResultType();
SearchTypeConversions.SEARCH_STORAGE_EVENT_TYPE_TO_STORAGE_CHANGE_TYPE = SearchTypeConversions.initializeSearchStorageEventTypeToStorageChangeType();
SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE = SearchTypeConversions.initializeStorageChangeTypToSearchStorageEventType();
SearchTypeConversions.SEARCH_EX_SORT_ORDER_TO_SORT_TYPE = SearchTypeConversions.initializeSearchExSortOrderToSortType();
//# sourceMappingURL=SearchUtils.js.map