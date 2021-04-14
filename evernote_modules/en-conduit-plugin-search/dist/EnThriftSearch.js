"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineMessageSearch = exports.sendLogRequest = exports.onlineSearchEx = exports.onlineRelatedWithExArgs = exports.onlineSuggest = exports.onlineSearch = exports.searchLogInfoEncodeBase64 = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const en_thrift_connector_1 = require("en-thrift-connector");
const js_base64_1 = require("js-base64");
const SearchExUtil_1 = require("./SearchExUtil");
const SearchSchemaTypes_1 = require("./SearchSchemaTypes");
// Note that encode/decode are not inverse of each other (sadly).
function searchLogInfoEncodeBase64(searchLogInfo) {
    const jsonStr = conduit_utils_1.safeStringify({ 1: { str: searchLogInfo.searchGuid }, 2: { str: searchLogInfo.searchStr } });
    return js_base64_1.Base64.encode(jsonStr);
}
exports.searchLogInfoEncodeBase64 = searchLogInfoEncodeBase64;
function searchLogInfoDecode(searchLogInfoBytes) {
    if (searchLogInfoBytes instanceof String) {
        throw new Error('searchLogInfoBytes must be of type Uint8Array');
    }
    if (searchLogInfoBytes instanceof Uint8Array) {
        const jsonStr = String.fromCharCode.apply(null, searchLogInfoBytes);
        const jsonObj = conduit_utils_1.safeParse(jsonStr);
        if (!jsonObj || !jsonObj['1']) {
            throw new Error('Error parsing searchLogInfoBytes json');
        }
        return { searchGuid: jsonObj['1'].str, searchStr: jsonObj['2'] ? jsonObj['2'].str : '' };
    }
    return { searchGuid: '', searchStr: '' };
}
function createNoteFilter(rawQuery, order) {
    const filter = {
        order,
        includeAllReadableWorkspaces: true,
        rawWords: rawQuery,
        words: rawQuery,
    };
    return filter;
}
async function onlineSearch(trc, thriftComm, auth, args) {
    const offset = args.offset || 0;
    const maxNotes = args.maxNotes || 128;
    const order = args.order || 3 /* RELEVANCE */;
    const filter = createNoteFilter(args.searchStr, order);
    const resultSpec = {
        includeTitle: true,
        includeUpdated: true,
        includeDeleted: true,
        includeNotebookGuid: true,
        includeAttributes: true,
        includeUpdateSequenceNum: true,
    };
    const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const notes = await noteStore.findNotesMetadata(trc, auth.token, filter, offset, maxNotes, resultSpec);
    const results = [];
    for (const note of notes.notes) {
        results.push({
            noteID: note.guid ? en_thrift_connector_1.convertGuidFromService(note.guid, en_core_entity_types_1.CoreEntityTypes.Note) : null,
            containerID: note.notebookGuid ? en_thrift_connector_1.convertGuidFromService(note.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook) : null,
            score: note.score === undefined ? null : note.score,
            label: note.title === undefined ? null : note.title,
            updated: note.updated === undefined ? null : note.updated,
        });
    }
    const logInfo = notes.searchContextBytes ? searchLogInfoDecode(notes.searchContextBytes) : null;
    return {
        results,
        resultCount: notes.totalNotes,
        startIndex: notes.startIndex,
        searchLogInfo: logInfo,
    };
}
exports.onlineSearch = onlineSearch;
function getSearchFilterFromV2Suggest(serverSuggestion) {
    const value = conduit_utils_1.safeParse(serverSuggestion.value); // extract filter string from searchV2 filter
    if (value && value.filters && value.filters.length > 0) {
        const lastFilter = value.filters[value.filters.length - 1];
        return lastFilter.value;
    }
    else {
        throw new Error('Missing or invalid serverSuggestion.value');
    }
}
async function onlineSuggest(trc, thriftComm, authData, args) {
    const serverFilters = args.filters ? args.filters.map(filter => {
        return {
            type: 'text',
            displayValue: '',
            value: filter,
        };
    }) : []; // filter strings repacked to searchV2 format
    const query = {
        query: args.searchStr || '',
        filters: serverFilters,
    };
    const contextFilter = {
        includeAllReadableWorkspaces: true,
    };
    const request = {
        query: conduit_utils_1.safeStringify(query),
        maxResults: args.maxResults || 30,
        contextFilter,
    };
    // We can remove this when we decide to get rid of 'Aggregation' suggest type.
    // For now always set it to 'true'. History suggester doesn't accept 'false' combined with empty searchStr.
    request.customAttributes = [{ name: 'search', value: 'true' }];
    if (args.locale) {
        request.customAttributes.push({ name: 'locale', value: args.locale });
    }
    const noteStore = thriftComm.getNoteStore(authData.urls.noteStoreUrl);
    const suggestionResults = await noteStore.findSearchSuggestionsV2(trc, authData.token, request);
    const suggests = [];
    if (suggestionResults && suggestionResults.suggestions) {
        for (const serverSuggestion of suggestionResults.suggestions) {
            if (!serverSuggestion.objectGuid) {
                throw new Error('Missing or invalid serverSuggestion.objectGuid');
            }
            if (!serverSuggestion.type) {
                throw new Error('Missing or invalid serverSuggestion.type');
            }
            const suggestion = {
                displayValue: serverSuggestion.displayValue || null,
                objectGuid: SearchExUtil_1.serviceGuidToObjectID(serverSuggestion.objectGuid, serverSuggestion.type),
                score: serverSuggestion.score || null,
                type: serverSuggestion.type,
                searchFilter: getSearchFilterFromV2Suggest(serverSuggestion),
            };
            suggests.push(suggestion);
        }
    }
    const logInfo = { searchStr: null, searchGuid: null };
    if (suggestionResults.customAttributes) {
        for (const attr of suggestionResults.customAttributes) {
            if (attr.name === 'searchQuery') {
                logInfo.searchStr = attr.value || null;
            }
            if (attr.name === 'searchGuid') {
                logInfo.searchGuid = attr.value || null;
            }
        }
    }
    return {
        results: suggests,
        searchLogInfo: logInfo,
    };
}
exports.onlineSuggest = onlineSuggest;
async function onlineRelatedWithExArgs(trc, thriftComm, authData, args) {
    const noteFilter = createNoteFilter('', null);
    let noteGuidArg = null;
    let plainTextArg;
    let referenceUriArg;
    if (args.queryContext) {
        if (args.queryContext.noteID) {
            noteGuidArg = en_thrift_connector_1.convertGuidToService(args.queryContext.noteID, en_core_entity_types_1.CoreEntityTypes.Note);
        }
        plainTextArg = args.queryContext.text;
        referenceUriArg = args.queryContext.url;
    }
    const request = {
        noteGuid: noteGuidArg,
        plainText: plainTextArg || null,
        filter: noteFilter,
        referenceUri: referenceUriArg || null,
    };
    const resultSpec = {
        includeContainingNotebooks: true,
        includeDebugInfo: false,
    };
    const isBusiness = authData.serviceLevel === en_thrift_connector_1.AuthServiceLevel.BUSINESS;
    const defaultMaxResults = 5;
    for (const spec of args.param.resultSpec) {
        switch (spec.type) {
            case SearchSchemaTypes_1.SearchExResultType.NOTE:
                resultSpec.maxNotes = spec.maxResults || defaultMaxResults;
                break;
            case SearchSchemaTypes_1.SearchExResultType.NOTEBOOK:
                resultSpec.maxNotebooks = spec.maxResults || defaultMaxResults;
                break;
            case SearchSchemaTypes_1.SearchExResultType.TAG:
                resultSpec.maxTags = spec.maxResults || defaultMaxResults;
                break;
            case SearchSchemaTypes_1.SearchExResultType.AUTHOR:
                if (isBusiness) { // Author recommendations are allowed only for business
                    resultSpec.maxExperts = spec.maxResults || defaultMaxResults;
                }
                break;
        }
    }
    const noteStore = thriftComm.getNoteStore(authData.urls.noteStoreUrl);
    const relatedResults = await noteStore.findRelated(trc, authData.token, request, resultSpec);
    const searchExRet = {
        results: [],
        meta: null,
        custom: null,
    };
    if (relatedResults && relatedResults.notes) {
        const resList = [];
        for (const note of relatedResults.notes) {
            if (note.guid) {
                const res = {
                    type: SearchSchemaTypes_1.SearchExResultType.NOTE,
                    id: SearchExUtil_1.serviceGuidToObjectID(note.guid, SearchSchemaTypes_1.SearchExResultType.NOTE),
                    label: note.title || null,
                    score: null,
                    searchFilter: SearchExUtil_1.composeSearchFilterString(note.guid, SearchSchemaTypes_1.SearchExResultType.NOTE),
                };
                resList.push(res);
            }
        }
        const resGroup = {
            type: SearchSchemaTypes_1.SearchExResultType.NOTE,
            results: resList,
            totalResultCount: resList.length,
            startIndex: 0,
            highlight: null,
        };
        searchExRet.results.push(resGroup);
    }
    if (relatedResults && relatedResults.notebooks) {
        const resList = [];
        for (const notebook of relatedResults.notebooks) {
            if (notebook.guid) {
                const res = {
                    type: SearchSchemaTypes_1.SearchExResultType.NOTEBOOK,
                    id: SearchExUtil_1.serviceGuidToObjectID(notebook.guid, SearchSchemaTypes_1.SearchExResultType.NOTEBOOK),
                    label: notebook.name || null,
                    score: null,
                    searchFilter: SearchExUtil_1.composeSearchFilterString(notebook.guid, SearchSchemaTypes_1.SearchExResultType.NOTEBOOK),
                };
                resList.push(res);
            }
        }
        const resGroup = {
            type: SearchSchemaTypes_1.SearchExResultType.NOTEBOOK,
            results: resList,
            totalResultCount: resList.length,
            startIndex: 0,
            highlight: null,
        };
        searchExRet.results.push(resGroup);
    }
    if (relatedResults && relatedResults.tags) {
        const resList = [];
        for (const tag of relatedResults.tags) {
            if (tag.guid) {
                const res = {
                    type: SearchSchemaTypes_1.SearchExResultType.TAG,
                    id: SearchExUtil_1.serviceGuidToObjectID(tag.guid, SearchSchemaTypes_1.SearchExResultType.TAG),
                    label: tag.name || null,
                    score: null,
                    searchFilter: SearchExUtil_1.composeSearchFilterString(tag.guid, SearchSchemaTypes_1.SearchExResultType.TAG),
                };
                resList.push(res);
            }
        }
        const resGroup = {
            type: SearchSchemaTypes_1.SearchExResultType.TAG,
            results: resList,
            totalResultCount: resList.length,
            startIndex: 0,
            highlight: null,
        };
        searchExRet.results.push(resGroup);
    }
    if (relatedResults && relatedResults.experts) {
        const resList = [];
        for (const expert of relatedResults.experts) {
            if (expert.id) {
                const userIdStr = expert.id.toString();
                const res = {
                    type: SearchSchemaTypes_1.SearchExResultType.AUTHOR,
                    id: SearchExUtil_1.serviceGuidToObjectID(userIdStr, SearchSchemaTypes_1.SearchExResultType.AUTHOR),
                    label: expert.name || null,
                    score: null,
                    searchFilter: SearchExUtil_1.composeSearchFilterString(userIdStr, SearchSchemaTypes_1.SearchExResultType.AUTHOR),
                };
                resList.push(res);
            }
        }
        const resGroup = {
            type: SearchSchemaTypes_1.SearchExResultType.AUTHOR,
            results: resList,
            totalResultCount: resList.length,
            startIndex: 0,
            highlight: null,
        };
        searchExRet.results.push(resGroup);
    }
    return searchExRet;
}
exports.onlineRelatedWithExArgs = onlineRelatedWithExArgs;
async function onlineSearchEx(trc, thriftComm, authData, args, setSearchShareMetadata) {
    const searchStr = SearchExUtil_1.getSearchString(args);
    // We perform suggestion request to monolith and then unpack required searchExResult fields from customAttributes
    const contextFilter = {
        includeAllReadableWorkspaces: true,
    };
    const request = {
        query: searchStr,
        contextFilter,
        customAttributes: [{ name: 'SearchExQuery', value: conduit_utils_1.safeStringify(args) }],
    };
    const noteStore = thriftComm.getNoteStore(authData.urls.noteStoreUrl);
    const resp = await noteStore.findSearchSuggestionsV2(trc, authData.token, request);
    const searchExRet = SearchExUtil_1.emptySearchExResult();
    // unpack searchExRet from customAttributes
    if (resp && resp.customAttributes) {
        for (const attr of resp.customAttributes) {
            if (attr.name === 'SearchExResult') {
                const resultEx = conduit_utils_1.safeParse(attr.value);
                if (resultEx) {
                    if (resultEx.results) {
                        searchExRet.results = resultEx.results;
                    }
                    if (resultEx.meta) {
                        searchExRet.meta = resultEx.meta;
                    }
                    if (resultEx.custom) {
                        searchExRet.custom = resultEx.custom;
                    }
                }
                break;
            }
        }
    }
    // unpack actual search items from suggestion list
    if (resp && resp.suggestions) {
        for (const serverSuggestion of resp.suggestions) {
            if (!serverSuggestion.objectGuid) {
                throw new conduit_utils_1.InternalError('Invalid serverSuggestion.objectGuid in searchEx response');
            }
            if (!serverSuggestion.type) {
                throw new conduit_utils_1.InternalError('Invalid serverSuggestion.type in searchEx response');
            }
            const resultType = serverSuggestion.type;
            const suggestion = conduit_utils_1.safeParse(serverSuggestion.value);
            suggestion.id = resultType === SearchSchemaTypes_1.SearchExResultType.STACK ? // stacks don't have real guids
                SearchExUtil_1.serviceGuidToObjectID(serverSuggestion.displayValue, resultType) :
                SearchExUtil_1.serviceGuidToObjectID(serverSuggestion.objectGuid, resultType);
            // Cache shared objects metadata to help demand fetch unsynced shared notes.
            if (resultType === SearchSchemaTypes_1.SearchExResultType.NOTE && suggestion.isShared) {
                if (suggestion.label && suggestion.shardId && suggestion.containerId) {
                    setSearchShareMetadata(suggestion.id, {
                        shareName: suggestion.label,
                        shardId: `s${suggestion.shardId}`,
                        nbGuid: suggestion.containerId,
                    });
                }
                else {
                    conduit_utils_1.logger.debug('Search share accept metadata missing for note:', suggestion);
                }
            }
            for (const resultGroup of searchExRet.results) {
                if (resultGroup.type === resultType) {
                    if (resultType === SearchSchemaTypes_1.SearchExResultType.NOTE) {
                        resultGroup.results.push(suggestion);
                    }
                    else {
                        resultGroup.results.push(suggestion);
                    }
                    break;
                }
            }
        }
    }
    return searchExRet;
}
exports.onlineSearchEx = onlineSearchEx;
function addProperty(properties, nameStr, val) {
    if (val) {
        properties.push({ name: nameStr, value: val });
    }
}
async function sendLogRequest(trc, thriftComm, auth, args) {
    const searchLogInfoBase64 = args.searchLogInfo ? searchLogInfoEncodeBase64(args.searchLogInfo) : null;
    const selectedObjectType = args.selectedObjectType || SearchSchemaTypes_1.SearchExResultType.NOTE;
    const propertiesArr = [];
    addProperty(propertiesArr, 'client_time', args.selectTime ? args.selectTime.toString() : null);
    addProperty(propertiesArr, 'exit_time', args.exitTime ? args.exitTime.toString() : null); // currently ignored by backend
    addProperty(propertiesArr, 'auto_selected', (args.autoSelected !== null && args.autoSelected !== undefined) ?
        args.autoSelected.toString() : null); // currently ignored by backend
    addProperty(propertiesArr, 'search_guid', args.searchLogInfo ? args.searchLogInfo.searchGuid : null); // currently ignored by backend
    addProperty(propertiesArr, 'rank', args.noteRank ? args.noteRank.toString() : null);
    addProperty(propertiesArr, 'item_guid', args.selectedObjectID ? SearchExUtil_1.objectIDToServiceGuid(args.selectedObjectID, selectedObjectType) : null);
    addProperty(propertiesArr, 'search_context', searchLogInfoBase64);
    const sensitivePropertiesArr = [];
    addProperty(sensitivePropertiesArr, 'query', args.searchLogInfo ? args.searchLogInfo.searchStr : null);
    const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const request = {
        logRequestEvent: {
            eventType: args.eventType,
            properties: propertiesArr,
            sensitiveProperties: sensitivePropertiesArr,
        },
    };
    await noteStore.sendLogRequest(trc, auth.token, request);
    return true;
}
exports.sendLogRequest = sendLogRequest;
/**
 * Finds messages via the corresponding call of the `findMessages` thrift function and wraps results into the `SearchEx` format.
 *
 * Link to the `findMessages` thrift documentation:
 * http://evernote-thrift-docs.s3-website-us-east-1.amazonaws.com/MessageStore.html#Fn_MessageStore_findMessages
 * Link to the monolith implementation:
 * https://source.build.etonreve.com/projects/WEB/repos/web/browse/notestore/src/main/java/com/evernote/search/userindex/lucene40/MessageIndexImpl.java#557
 *
 * @param trc tracing context
 * @param thriftComm required for the `AsyncMessageStore` instance
 * @param authData required for the `AsyncMessageStore` instance and `findMessages` request
 * @param searchStr search string or empty string
 * @param messageResultSpec specification of the output `SearchEx` format
 */
async function onlineMessageSearch(trc, thriftComm, authData, args) {
    var _a, _b;
    const result = SearchExUtil_1.emptySearchExResult();
    const messageResultSpec = SearchExUtil_1.findResultSpec(args, SearchSchemaTypes_1.SearchExResultType.MESSAGE);
    if (!messageResultSpec) {
        return result;
    }
    const searchStr = SearchExUtil_1.getSearchString(args);
    // search by specific fields is not supported
    if (messageResultSpec.textSearchField === 1 /* NAME */) {
        return result;
    }
    const messageQueryParser = new en_search_engine_shared_1.ENMessageQueryParser();
    const modifiedSearchStr = messageQueryParser.parse(searchStr);
    // invalid request case
    if (modifiedSearchStr === null) {
        return result;
    }
    const messageStore = thriftComm.getMessageStore(authData.urls.messageStoreUrl);
    const filter = {
        query: modifiedSearchStr,
        sortField: 'body',
        reverse: (_a = messageResultSpec.ascending) !== null && _a !== void 0 ? _a : false,
    };
    const resultSpec = {
        includeBody: false,
        includeAttachments: false,
        includeDestinationIdentityIds: false,
    };
    const maxMessages = messageResultSpec.maxResults || 0;
    const pagination = {
        afterOffset: (_b = messageResultSpec.startIndex) !== null && _b !== void 0 ? _b : 0,
    };
    const response = await messageStore.findMessages(trc, authData.token, filter, resultSpec, maxMessages, pagination);
    const messagesResults = response.messages.map(m => {
        return {
            type: SearchSchemaTypes_1.SearchExResultType.MESSAGE,
            label: m.body || '',
            id: m.id ? en_thrift_connector_1.convertGuidFromService(m.id, en_core_entity_types_1.CoreEntityTypes.Message) : null,
            // according to document the response does not include lucene score
            score: null,
            searchFilter: null,
        };
    });
    const messageResGroup = {
        type: SearchSchemaTypes_1.SearchExResultType.MESSAGE,
        totalResultCount: messagesResults.length,
        startIndex: pagination.afterOffset,
        results: messagesResults,
    };
    result.results.push(messageResGroup);
    return result;
}
exports.onlineMessageSearch = onlineMessageSearch;
//# sourceMappingURL=EnThriftSearch.js.map