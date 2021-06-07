"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var ENDocumentType;
(function (ENDocumentType) {
    ENDocumentType[ENDocumentType["NOTE"] = 0] = "NOTE";
    ENDocumentType[ENDocumentType["MESSAGE"] = 1] = "MESSAGE";
    ENDocumentType[ENDocumentType["ATTACHMENT"] = 2] = "ATTACHMENT";
    ENDocumentType[ENDocumentType["NOTEBOOK"] = 3] = "NOTEBOOK";
    ENDocumentType[ENDocumentType["TAG"] = 4] = "TAG";
    ENDocumentType[ENDocumentType["STACK"] = 5] = "STACK";
    ENDocumentType[ENDocumentType["WORKSPACE"] = 6] = "WORKSPACE";
})(ENDocumentType = exports.ENDocumentType || (exports.ENDocumentType = {}));
var ENSuggestResultType;
(function (ENSuggestResultType) {
    ENSuggestResultType["HISTORY"] = "history";
    ENSuggestResultType["TITLE"] = "title";
    ENSuggestResultType["NOTEBOOK"] = "notebook";
    ENSuggestResultType["SPACE"] = "space";
    ENSuggestResultType["TAG"] = "tag";
    ENSuggestResultType["AUTHOR"] = "author";
    ENSuggestResultType["STACK"] = "stack";
})(ENSuggestResultType = exports.ENSuggestResultType || (exports.ENSuggestResultType = {}));
var ENSortType;
(function (ENSortType) {
    ENSortType[ENSortType["CREATED"] = 1] = "CREATED";
    ENSortType[ENSortType["UPDATED"] = 2] = "UPDATED";
    ENSortType[ENSortType["RELEVANCE"] = 3] = "RELEVANCE";
    ENSortType[ENSortType["TITLE"] = 5] = "TITLE";
})(ENSortType = exports.ENSortType || (exports.ENSortType = {}));
exports.EMPTY_QUERY = '*:*';
var ENSuggestOptimization;
(function (ENSuggestOptimization) {
    ENSuggestOptimization[ENSuggestOptimization["NONE"] = 0] = "NONE";
    ENSuggestOptimization[ENSuggestOptimization["O3"] = 1] = "O3";
})(ENSuggestOptimization = exports.ENSuggestOptimization || (exports.ENSuggestOptimization = {}));
var ENSearchAlternativeFieldType;
(function (ENSearchAlternativeFieldType) {
    ENSearchAlternativeFieldType[ENSearchAlternativeFieldType["ALTERNATIVE"] = 0] = "ALTERNATIVE";
    ENSearchAlternativeFieldType[ENSearchAlternativeFieldType["SUFFIX"] = 1] = "SUFFIX";
})(ENSearchAlternativeFieldType = exports.ENSearchAlternativeFieldType || (exports.ENSearchAlternativeFieldType = {}));
//# sourceMappingURL=ENSearchTypes.js.map