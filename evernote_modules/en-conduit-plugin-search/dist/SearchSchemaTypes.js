"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogRequestArgs = exports.SearchLogEventType = exports.SearchExSchema = exports.GraphQLSearchExCustomResult = exports.GraphQLSearchExMeta = exports.GraphQLSearchExResultGroup = exports.GraphQLSearchExResult = exports.GraphQLSearchExNote = exports.GraphQLSearchExBaseResult = exports.GraphQlSearchExHighlight = exports.SearchExSchemaArgs = exports.SearchExResultType = exports.SuggestSchemaArgs = exports.SuggestSchema = exports.SearchSchemaArgs = exports.SearchSchema = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
/** Information that is required for SendLogRequest mutation. */
const SearchLogInfoType = new graphql_1.GraphQLObjectType({
    name: 'SearchLogInfo',
    fields: {
        /** Actual search string sent to backend. */
        searchStr: { type: graphql_1.GraphQLString },
        /** Search session guid. */
        searchGuid: { type: graphql_1.GraphQLString },
    },
});
const SearchResultType = new graphql_1.GraphQLObjectType({
    name: 'SearchResult',
    fields: {
        noteID: { type: graphql_1.GraphQLString },
        containerID: { type: graphql_1.GraphQLString },
        score: { type: graphql_1.GraphQLFloat },
        label: { type: graphql_1.GraphQLString },
        updated: { type: graphql_1.GraphQLFloat },
    },
});
exports.SearchSchema = new graphql_1.GraphQLObjectType({
    name: 'SearchSchema',
    fields: {
        results: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(SearchResultType))) },
        resultCount: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        startIndex: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        searchLogInfo: { type: SearchLogInfoType },
    },
});
exports.SearchSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    searchStr: conduit_utils_1.NullableString,
    offset: conduit_utils_1.NullableInt,
    maxNotes: conduit_utils_1.NullableInt,
    order: conduit_utils_1.NullableInt,
});
const SuggestResultType = new graphql_1.GraphQLObjectType({
    name: 'SuggestResult',
    fields: {
        displayValue: { type: graphql_1.GraphQLString },
        objectGuid: { type: graphql_1.GraphQLString },
        score: { type: graphql_1.GraphQLFloat },
        type: { type: graphql_1.GraphQLString },
        searchFilter: { type: graphql_1.GraphQLString },
    },
});
exports.SuggestSchema = new graphql_1.GraphQLObjectType({
    name: 'SuggestSchema',
    fields: {
        results: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(SuggestResultType))) },
        searchLogInfo: { type: SearchLogInfoType },
    },
});
exports.SuggestSchemaArgs = conduit_core_1.schemaToGraphQLArgs({
    searchStr: conduit_utils_1.NullableString,
    filters: conduit_utils_1.NullableListOf('string'),
    maxResults: conduit_utils_1.NullableInt,
    searchExecuted: conduit_utils_1.NullableBoolean,
    locale: conduit_utils_1.NullableString,
});
/** Field for a text search */
const GraphQLSearchExTextField = new graphql_1.GraphQLEnumType({
    name: 'SearchExTextField',
    values: {
        /** All note fields as in regular note search */
        ALL: { value: 0 /* ALL */ },
        /** Field that corresponds to requested type (eg notebook name for type NOTEBOOK). Suitable for suggest requests. */
        NAME: { value: 1 /* NAME */ },
    },
});
var SearchExResultType;
(function (SearchExResultType) {
    /** Text that user earlier entered as a query. */
    SearchExResultType["HISTORY"] = "history_filter";
    /** Text extracted from user notes. */
    SearchExResultType["TEXT"] = "text_filter";
    SearchExResultType["NOTE"] = "note_filter";
    SearchExResultType["NOTEBOOK"] = "notebook_filter";
    SearchExResultType["WORKSPACE"] = "workspace_filter";
    SearchExResultType["TAG"] = "tag_filter";
    SearchExResultType["AUTHOR"] = "author_filter";
    /** Various attributes that note may posses. Include attachemnt types, named entities (eg phone number) etc */
    SearchExResultType["CONTAINS"] = "contains_filter";
    SearchExResultType["MESSAGE"] = "message_filter";
    SearchExResultType["STACK"] = "stack_filter";
})(SearchExResultType = exports.SearchExResultType || (exports.SearchExResultType = {}));
/** Type of SearchEx result */
const GraphQLSearchExResultType = new graphql_1.GraphQLEnumType({
    name: 'SearchExResultType',
    values: {
        /** Text that user earlier entered as a query. */
        HISTORY: { value: SearchExResultType.HISTORY },
        /** Text extracted from user notes. */
        TEXT: { value: SearchExResultType.TEXT },
        NOTE: { value: SearchExResultType.NOTE },
        NOTEBOOK: { value: SearchExResultType.NOTEBOOK },
        WORKSPACE: { value: SearchExResultType.WORKSPACE },
        TAG: { value: SearchExResultType.TAG },
        AUTHOR: { value: SearchExResultType.AUTHOR },
        /** Various attributes that note may posses. Include attachemnt types, named entities (eg phone number) etc */
        CONTAINS: { value: SearchExResultType.CONTAINS },
        MESSAGE: { value: SearchExResultType.MESSAGE },
        STACK: { value: SearchExResultType.STACK },
    },
});
const GraphQLSearchExSortOrder = new graphql_1.GraphQLEnumType({
    name: 'SearchExSortOrder',
    values: {
        CREATED: { value: 1 /* CREATED */ },
        UPDATED: { value: 2 /* UPDATED */ },
        RELEVANCE: { value: 3 /* RELEVANCE */ },
        TITLE: { value: 5 /* TITLE */ },
        REMINDER_ORDER: { value: 6 /* REMINDER_ORDER */ },
        REMINDER_TIME: { value: 7 /* REMINDER_TIME */ },
        REMINDER_DONE_TIME: { value: 8 /* REMINDER_DONE_TIME */ },
    },
});
/** Specifications for a group of results to return */
const GraphQLSearchExResultSpec = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExResultSpec',
    fields: {
        /** Required type (NOTE, NOTEBOOK etc) */
        type: { type: new graphql_1.GraphQLNonNull(GraphQLSearchExResultType) },
        /** What filed to use for text search if queryStr has non empty text query (besides filters) */
        textSearchField: { type: GraphQLSearchExTextField },
        /** Start from partticular position in result list. Use for pagination of results. */
        startIndex: { type: graphql_1.GraphQLInt },
        /** Maximum number of results to return */
        maxResults: { type: graphql_1.GraphQLInt },
        /** Sort type preference (eg time or relevance) */
        sort: { type: GraphQLSearchExSortOrder },
        /** Sort order preference, true for ascending. Default depends on `sort` parameter */
        ascending: { type: graphql_1.GraphQLBoolean },
    },
});
/** A query that user explicitly told us to search for */
const SearchExQuery = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExQuery',
    fields: {
        /** Short search string (supposedly from UI search box) concatenated with filter strings (from pills selected by user) */
        searchStr: { type: graphql_1.GraphQLString },
    },
});
const SearchExLocation = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExLocation',
    fields: {
        latitude: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLFloat) },
        longitude: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLFloat) },
        altitude: { type: graphql_1.GraphQLFloat },
    },
});
/**
 * Information that is related to query but was not explicitly specified by user
 * Please do not confuse with SearchContextBytes (see [[SearchLogInfo]]).
 */
const SearchExQueryContext = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExQueryContext',
    fields: {
        /** Huge chunk of text. May come from web article or from cursor vicinity in edited note. */
        text: { type: graphql_1.GraphQLString },
        /** url of web page */
        url: { type: graphql_1.GraphQLString },
        /** id of note that is related to query */
        noteID: { type: graphql_1.GraphQLString },
        /** user coordinates */
        location: { type: SearchExLocation },
        /** overrides the locale from user settings */
        locale: { type: graphql_1.GraphQLString },
        timeZone: { type: graphql_1.GraphQLString },
    },
});
const GraphQLSearchExLocalSearchMode = new graphql_1.GraphQLEnumType({
    name: 'SearchExLocalSearchMode',
    values: {
        /** Online search is preferred, local search can be used for some queries.  */
        AUTO: { value: "Auto" /* AUTO */ },
        /** Strictly local search. */
        STRICT: { value: "Strict" /* STRICT */ },
    },
});
const GraphQLSearchExProcessingSpec = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExProcessingSpec',
    fields: {
        fullBooleanSearch: { type: graphql_1.GraphQLBoolean },
        /** Search mode (AUTO, STRICT). Default is AUTO. */
        localSearchMode: { type: GraphQLSearchExLocalSearchMode },
    },
});
const SearchExParam = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExParam',
    fields: {
        /** List of specifications for result groups you want to retrieve */
        resultSpec: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(GraphQLSearchExResultSpec))) },
        /** List of parameters that will affect all of the requested groups */
        processingSpec: { type: GraphQLSearchExProcessingSpec },
    },
});
/** Custom search arguments. For debug and quick prototyping. */
const SearchExCustom = new graphql_1.GraphQLInputObjectType({
    name: 'SearchExCustom',
    fields: {
        debug: { type: graphql_1.GraphQLString },
        abTest: { type: graphql_1.GraphQLString },
    },
});
exports.SearchExSchemaArgs = Object.assign({}, {
    query: { type: SearchExQuery },
    queryContext: { type: SearchExQueryContext },
    param: { type: new graphql_1.GraphQLNonNull(SearchExParam) },
    custom: { type: SearchExCustom },
});
exports.GraphQlSearchExHighlight = new graphql_1.GraphQLObjectType({
    name: 'SearchExHighlight',
    fields: {
        terms: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)) },
    },
});
exports.GraphQLSearchExBaseResult = new graphql_1.GraphQLObjectType({
    name: 'SearchExBaseResult',
    fields: {
        type: { type: new graphql_1.GraphQLNonNull(GraphQLSearchExResultType) },
        /** ID of item (transformed from service guid). For types with meaningless guid (eg TEXT) random guid string will be provided. */
        id: { type: graphql_1.GraphQLString },
        /** Name of result (eg notebook name for type NOTEBOOK). */
        label: { type: graphql_1.GraphQLString },
        score: { type: graphql_1.GraphQLFloat },
        searchFilter: { type: graphql_1.GraphQLString },
        highlight: { type: exports.GraphQlSearchExHighlight },
    },
    isTypeOf: (value) => value.type !== SearchExResultType.NOTE,
});
exports.GraphQLSearchExNote = new graphql_1.GraphQLObjectType({
    name: 'SearchExNote',
    fields: {
        /** Type of result (NOTE). */
        type: { type: new graphql_1.GraphQLNonNull(GraphQLSearchExResultType) },
        /** ID of note (transformed from service guid). */
        id: { type: graphql_1.GraphQLString },
        /** Note title. */
        label: { type: graphql_1.GraphQLString },
        score: { type: graphql_1.GraphQLFloat },
        /** Search filter to find this particular note. */
        searchFilter: { type: graphql_1.GraphQLString },
        highlight: { type: exports.GraphQlSearchExHighlight },
        created: { type: graphql_1.GraphQLFloat },
        updated: { type: graphql_1.GraphQLFloat },
        snippet: { type: graphql_1.GraphQLString },
    },
    isTypeOf: (value) => value.type === SearchExResultType.NOTE,
});
/** Union of possible results that may be returned from SearchEx */
exports.GraphQLSearchExResult = new graphql_1.GraphQLUnionType({
    name: 'SearchExResult',
    types: [exports.GraphQLSearchExNote, exports.GraphQLSearchExBaseResult],
});
exports.GraphQLSearchExResultGroup = new graphql_1.GraphQLObjectType({
    name: 'SearchExResultGroup',
    fields: {
        type: { type: new graphql_1.GraphQLNonNull(GraphQLSearchExResultType) },
        /** Total notes found. If exceedes maxResults + startIndex, you can retrieve more notes with subsequent calls. */
        totalResultCount: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        /** Provided results start from this position in a full result list. */
        startIndex: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        results: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.GraphQLSearchExResult))) },
        /** Aggregates highlight terms from all items in 'results'. */
        highlight: { type: exports.GraphQlSearchExHighlight },
    },
});
/** Additonal backend information about search request. */
exports.GraphQLSearchExMeta = new graphql_1.GraphQLObjectType({
    name: 'SearchExMeta',
    fields: {
        /** Pass this to SendLogRequest when user clicks a note. */
        searchLogInfo: { type: SearchLogInfoType },
    },
});
exports.GraphQLSearchExCustomResult = new graphql_1.GraphQLObjectType({
    name: 'SearchExCustomResult',
    fields: {
        debug: { type: graphql_1.GraphQLString },
        abTest: { type: graphql_1.GraphQLString },
    },
});
exports.SearchExSchema = new graphql_1.GraphQLObjectType({
    name: 'SearchExSchema',
    fields: {
        results: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.GraphQLSearchExResultGroup))) },
        meta: { type: exports.GraphQLSearchExMeta },
        custom: { type: exports.GraphQLSearchExCustomResult },
    },
});
/** Clone of SearchLogInfo, but of input type. */
const SearchLogInfoProperty = new graphql_1.GraphQLInputObjectType({
    name: 'SearchLogInfoProperty',
    fields: {
        searchStr: { type: graphql_1.GraphQLString },
        searchGuid: { type: graphql_1.GraphQLString },
    },
});
const LogRequestProperty = new graphql_1.GraphQLInputObjectType({
    name: 'LogRequestProperty',
    fields: conduit_core_1.schemaToGraphQLArgs({
        name: 'string',
        value: 'string',
    }),
});
/** possible eventType values for SendLogRequest */
var SearchLogEventType;
(function (SearchLogEventType) {
    SearchLogEventType["SEARCH_CLICK"] = "search_select_info";
    SearchLogEventType["EXIT"] = "search_exit_info";
    SearchLogEventType["SUGGEST_CLICK"] = "suggest_click";
    SearchLogEventType["NOTE_VIEW"] = "note_view";
})(SearchLogEventType = exports.SearchLogEventType || (exports.SearchLogEventType = {}));
/** Type of user activity event to record. */
const SearchLogEventTypeProperty = new graphql_1.GraphQLEnumType({
    name: 'SearchLogEventTypeProperty',
    values: {
        /** Click on a note in search menu. */
        SEARCH_CLICK: { value: SearchLogEventType.SEARCH_CLICK },
        /** End of current search session. */
        EXIT: { value: SearchLogEventType.EXIT },
        /** Click on one of suggestions in dropdown list. */
        SUGGEST_CLICK: { value: SearchLogEventType.SUGGEST_CLICK },
        /** Note view without search. */
        NOTE_VIEW: { value: SearchLogEventType.NOTE_VIEW },
    },
});
exports.LogRequestArgs = Object.assign({}, conduit_core_1.schemaToGraphQLArgs({
    selectedObjectID: conduit_utils_1.NullableID,
    selectTime: conduit_utils_1.NullableTimestamp,
    exitTime: conduit_utils_1.NullableTimestamp,
}), {
    /** Clicked object type. Default is NOTE. */
    selectedObjectType: { type: graphql_1.GraphQLString },
    /** Already selected without user action. */
    autoSelected: { type: graphql_1.GraphQLBoolean },
    /** Deprecated! Please omit this argument (Query string is already present in searchLogInfo) */
    userQuery: { type: graphql_1.GraphQLString },
    /** Index of selected object (eg note or suggest) */
    noteRank: { type: graphql_1.GraphQLInt },
    /** Type of user action. */
    eventType: { type: SearchLogEventTypeProperty },
    /** Use data obtained as SearchLogInfo from SearchEx. */
    searchLogInfo: { type: SearchLogInfoProperty },
    /** Deprecated! Please omit this argument */
    properties: { type: new graphql_1.GraphQLList(LogRequestProperty) },
    /** Deprecated! Please omit this argument */
    sensitiveProperties: { type: new graphql_1.GraphQLList(LogRequestProperty) },
});
//# sourceMappingURL=SearchSchemaTypes.js.map