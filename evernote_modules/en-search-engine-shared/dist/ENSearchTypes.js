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
})(ENDocumentType = exports.ENDocumentType || (exports.ENDocumentType = {}));
var ENSuggestResultType;
(function (ENSuggestResultType) {
    ENSuggestResultType["HISTORY"] = "history";
    ENSuggestResultType["TITLE"] = "title";
    ENSuggestResultType["NOTEBOOK"] = "notebook";
    ENSuggestResultType["SPACE"] = "space";
    ENSuggestResultType["TAG"] = "tag";
    ENSuggestResultType["AUTHOR"] = "author";
})(ENSuggestResultType = exports.ENSuggestResultType || (exports.ENSuggestResultType = {}));
var ENSortType;
(function (ENSortType) {
    ENSortType[ENSortType["CREATED"] = 1] = "CREATED";
    ENSortType[ENSortType["UPDATED"] = 2] = "UPDATED";
    ENSortType[ENSortType["RELEVANCE"] = 3] = "RELEVANCE";
    ENSortType[ENSortType["TITLE"] = 5] = "TITLE";
})(ENSortType = exports.ENSortType || (exports.ENSortType = {}));
//# sourceMappingURL=ENSearchTypes.js.map