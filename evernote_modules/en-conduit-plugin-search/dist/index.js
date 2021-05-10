"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENSearchPlugin = exports.getShareAcceptMetadataForNote = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const EnThriftSearch_1 = require("./EnThriftSearch");
const Searcher_1 = require("./offline/Searcher");
const SearchProcessor_1 = require("./offline/SearchProcessor");
const SearchStorageChangeReceiver_1 = require("./offline/SearchStorageChangeReceiver");
const SearchExUtil_1 = require("./SearchExUtil");
const SearchIndexNotificationChangeReceiver_1 = require("./SearchIndexNotificationChangeReceiver");
const SearchSchemaTypes_1 = require("./SearchSchemaTypes");
// Cache to store metadata for shared note(book)s that help conduit demand fetch unsynced shared notes.
const SEARCH_SHARE_METADATA_TABLE = 'SearchShareMetadata';
const gSearchShareMetadata = new conduit_utils_1.CacheManager({ softCap: 800, hardCap: 1000 });
// **WARNING**: the offline search WON'T work correctly in the case of multiple conduit instances
// due to the offline search global variables (the same state will be shared accross all instances)
let gSearchStorageChangeReceiver;
let gSearchStorageProcessor;
let gSearcher;
let gSearchEngine;
/**
 * Cleans up global variables, calls gSearchEngine destructor if it's defined.
 */
function clean() {
    gSearchStorageChangeReceiver = undefined;
    en_thrift_connector_1.OfflineSearchIndexActivity.setupIndexation(undefined);
    gSearchStorageProcessor = undefined;
    gSearcher = undefined;
    gSearchEngine === null || gSearchEngine === void 0 ? void 0 : gSearchEngine.destructor();
    gSearchEngine = undefined;
    gSearchShareMetadata.emptyAll();
}
/**
 * Main indexation processing function. Performs indexation if the search processor is created.
 * @param userID current user id
 * @param yieldCheck external yield object
 */
async function process(trc, di, params) {
    if (gSearchStorageProcessor) {
        return await gSearchStorageProcessor.process(trc, di, params);
    }
    return false;
}
function setShareAcceptMetadataForNote(id, value) {
    gSearchShareMetadata.put(SEARCH_SHARE_METADATA_TABLE, id, value);
}
function getShareAcceptMetadataForNote(id) {
    return gSearchShareMetadata.get(SEARCH_SHARE_METADATA_TABLE, id) || null;
}
exports.getShareAcceptMetadataForNote = getShareAcceptMetadataForNote;
function getENSearchPlugin(provideSearchEngine, di) {
    async function searchResolver(parent, args, context) {
        if (args.searchStr === null || args.searchStr === undefined) {
            throw new Error('Missing searchStr for searchResolver');
        }
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        let authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        if (authData.vaultAuth) {
            authData = authData.vaultAuth;
        }
        try {
            return await EnThriftSearch_1.onlineSearch(context.trc, context.thriftComm, authData, args);
        }
        catch (err) {
            if (err instanceof conduit_utils_1.RetryError) { // offline mode
                if (gSearcher) {
                    conduit_utils_1.logger.debug('searchResolver offline mode');
                    return await gSearcher.search(args.searchStr);
                }
            }
            throw err;
        }
    }
    async function suggestResolver(parent, args, context) {
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        let authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        if (authData.vaultAuth) {
            authData = authData.vaultAuth;
        }
        try {
            return await EnThriftSearch_1.onlineSuggest(context.trc, context.thriftComm, authData, args);
        }
        catch (err) {
            if (err instanceof conduit_utils_1.RetryError) {
                // return empty results for the offline case.
                return { results: new Array(), searchLogInfo: null };
            }
            throw err;
        }
    }
    async function searchExResolver(parent, args, context) {
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        const authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        if (SearchExUtil_1.getLocalSearchMode(args) === "Strict" /* STRICT */) {
            // strictly offline
            if (gSearcher) {
                return await offlineModeSearchEx(args, authData);
            }
            else {
                return SearchExUtil_1.emptySearchExResult();
            }
        }
        else {
            // auto - prefer online
            try {
                return await onlineModeSearchEx(args, context, authData);
            }
            catch (err) {
                if (err instanceof conduit_utils_1.RetryError) { // we are offline
                    if (gSearcher) {
                        return await offlineModeSearchEx(args, authData);
                    }
                }
                throw err;
            }
        }
    }
    const searchExTypes = new Set([SearchSchemaTypes_1.SearchExResultType.HISTORY, SearchSchemaTypes_1.SearchExResultType.TEXT, SearchSchemaTypes_1.SearchExResultType.NOTE, SearchSchemaTypes_1.SearchExResultType.NOTEBOOK,
        SearchSchemaTypes_1.SearchExResultType.STACK, SearchSchemaTypes_1.SearchExResultType.WORKSPACE, SearchSchemaTypes_1.SearchExResultType.TAG, SearchSchemaTypes_1.SearchExResultType.AUTHOR, SearchSchemaTypes_1.SearchExResultType.CONTAINS]);
    // SearchEx in online mode. Offline engine calls are allowed too.
    // Some functions will throw exception if we are actaully offline.
    async function onlineModeSearchEx(args, context, authData) {
        const personalAuthData = authData;
        if (authData.vaultAuth) {
            authData = authData.vaultAuth;
        }
        if (args.queryContext && (args.queryContext.text || args.queryContext.url || args.queryContext.noteID)) { // related notes mode is not supported by onlineSearchEx now
            return await EnThriftSearch_1.onlineRelatedWithExArgs(context.trc, context.thriftComm, authData, args);
        }
        else {
            const searchExArgs = SearchExUtil_1.selectResultGroups(args, searchExTypes);
            const messageArgs = SearchExUtil_1.selectResultGroup(args, SearchSchemaTypes_1.SearchExResultType.MESSAGE);
            const resultPromises = [];
            if (searchExArgs) {
                if (gSearcher && await gSearcher.isLocallyProcessedQuery(searchExArgs) &&
                    gSearchStorageProcessor && gSearchStorageProcessor.isInitialIndexationFinished()) {
                    // offline search is enough
                    resultPromises.push(offlineModeSearchEx(searchExArgs, authData));
                }
                else {
                    resultPromises.push(EnThriftSearch_1.onlineSearchEx(context.trc, context.thriftComm, authData, searchExArgs, setShareAcceptMetadataForNote));
                }
            }
            if (messageArgs) {
                // for messages we prefer offline results whenever they are available
                const messageRes = gSearcher ?
                    gSearcher.searchExOneType(messageArgs, SearchSchemaTypes_1.SearchExResultType.MESSAGE) : EnThriftSearch_1.onlineMessageSearch(context.trc, context.thriftComm, personalAuthData, messageArgs);
                resultPromises.push(messageRes);
            }
            return await SearchExUtil_1.combineResults(args, resultPromises);
        }
    }
    // searchExTypes extended with stack.
    const offlineSearchExTypes = new Set([SearchSchemaTypes_1.SearchExResultType.HISTORY, SearchSchemaTypes_1.SearchExResultType.TEXT, SearchSchemaTypes_1.SearchExResultType.NOTE, SearchSchemaTypes_1.SearchExResultType.NOTEBOOK,
        SearchSchemaTypes_1.SearchExResultType.WORKSPACE, SearchSchemaTypes_1.SearchExResultType.TAG, SearchSchemaTypes_1.SearchExResultType.AUTHOR, SearchSchemaTypes_1.SearchExResultType.CONTAINS, SearchSchemaTypes_1.SearchExResultType.STACK]);
    // Strictly offline search (online calls are not allowed).
    async function offlineModeSearchEx(args, authData) {
        if (gSearcher) {
            SearchExUtil_1.setDefaults(args);
            const suggestArgs = SearchExUtil_1.selectResultGroups(args, offlineSearchExTypes, 1 /* NAME */);
            const noteArgs = SearchExUtil_1.selectResultGroup(args, SearchSchemaTypes_1.SearchExResultType.NOTE, 0 /* ALL */);
            const messageArgs = SearchExUtil_1.selectResultGroup(args, SearchSchemaTypes_1.SearchExResultType.MESSAGE, 0 /* ALL */);
            const resultPromises = [];
            if (suggestArgs) {
                resultPromises.push(gSearcher.suggest(suggestArgs, authData));
            }
            if (noteArgs) {
                resultPromises.push(gSearcher.searchExOneType(noteArgs, SearchSchemaTypes_1.SearchExResultType.NOTE));
            }
            if (messageArgs) {
                resultPromises.push(gSearcher.searchExOneType(messageArgs, SearchSchemaTypes_1.SearchExResultType.MESSAGE));
            }
            return await SearchExUtil_1.combineResults(args, resultPromises);
        }
        throw new conduit_utils_1.InternalError('Offline search is not available');
    }
    async function logResolver(parent, args, context) {
        if (!args) {
            throw new conduit_utils_1.InternalError('Missing args for send log operation');
        }
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        let authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        if (authData.vaultAuth) {
            authData = authData.vaultAuth;
        }
        const success = await EnThriftSearch_1.sendLogRequest(context.trc, context.thriftComm, authData, args);
        return { success };
    }
    return {
        name: 'ENSearch',
        defineMutators: () => {
            const mutators = {};
            /** Report information about user activity (user clicks) to search backend. */
            mutators.SendLogRequest = {
                args: SearchSchemaTypes_1.LogRequestArgs,
                type: conduit_core_1.GenericMutationResult,
                resolve: logResolver,
            };
            return mutators;
        },
        defineQueries: () => {
            const out = {};
            if (SearchSchemaTypes_1.SearchSchema) {
                out.Search = {
                    type: SearchSchemaTypes_1.SearchSchema,
                    args: SearchSchemaTypes_1.SearchSchemaArgs,
                    resolve: searchResolver,
                };
            }
            if (SearchSchemaTypes_1.SuggestSchema) {
                out.Suggest = {
                    type: SearchSchemaTypes_1.SuggestSchema,
                    args: SearchSchemaTypes_1.SuggestSchemaArgs,
                    resolve: suggestResolver,
                };
            }
            if (SearchSchemaTypes_1.SearchExSchema) {
                /** Main entry point for all search queries. Combines search, suggestion and related notes functionality. */
                out.SearchEx = {
                    type: SearchSchemaTypes_1.SearchExSchema,
                    args: SearchSchemaTypes_1.SearchExSchemaArgs,
                    resolve: searchExResolver,
                };
            }
            return out;
        },
        /**
         * Search processor setup.
         * **WARNING**: the offline search WON'T work correctly in the case of multiple conduit instances
         * due to the offline search global variables (the same state will be shared accross all instances)
         */
        defineStorageAccess: (graphDB) => {
            return new Promise(resolve => {
                if (provideSearchEngine) {
                    // creates search engine with the provided factory function
                    gSearchEngine = provideSearchEngine(conduit_utils_1.logger);
                    conduit_utils_1.logger.debug(`SearchEngine: type:${gSearchEngine.getEngineType()}; version:${gSearchEngine.getVersion()}`);
                    gSearcher = new Searcher_1.Searcher(gSearchEngine);
                    // creates search processor and injects the search engine
                    gSearchStorageProcessor = new SearchProcessor_1.SearchProcessor(graphDB, gSearchEngine);
                    // injects indexation hook in the activity
                    en_thrift_connector_1.OfflineSearchIndexActivity.setupIndexation(process);
                    // injects search processor in the storage event receiver
                    gSearchStorageChangeReceiver = new SearchStorageChangeReceiver_1.SearchStorageChangeReceiver(gSearchStorageProcessor);
                    // adds subscription to the GraphDB events for storage event receiver.
                    graphDB.addChangeHandler(gSearchStorageChangeReceiver);
                }
                else {
                    // clean up global variables for the proper work of the E2E tests
                    clean();
                }
                if (di) {
                    // add subscription to the GraphDB events for indexation notifications
                    graphDB.addChangeHandler(new SearchIndexNotificationChangeReceiver_1.SearchIndexNotificationChangeReceiver(di));
                }
                resolve();
            });
        },
        destructor: async () => {
            // clean up in the case of the user switch
            clean();
        },
    };
}
exports.getENSearchPlugin = getENSearchPlugin;
//# sourceMappingURL=index.js.map