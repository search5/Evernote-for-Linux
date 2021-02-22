"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Simple parser that parses findMessages request.
 */
class ENMessageQueryParser {
    constructor() {
        //
    }
    parse(query) {
        // empty query - invalid case
        if (query.length === 0) {
            return null;
        }
        // first step - truncate query
        let truncatedQuery = '';
        if (query.length > ENMessageQueryParser.MAX_QUERY_LENGTH) {
            truncatedQuery = query.slice(ENMessageQueryParser.MAX_QUERY_LENGTH);
        }
        else {
            truncatedQuery = query;
        }
        // second step - check if query has filter - unsupported query
        // otherwise filter out english stop words
        const filterTokenTest = truncatedQuery.split(' ');
        let filteredQuery = '';
        for (const token of filterTokenTest) {
            if (token.indexOf(':') !== -1 && !token.endsWith(':')) {
                return null;
            }
            else {
                // filter out stop words
                if (ENMessageQueryParser.ENGLISH_STOP_WORDS.has(token.toLowerCase())) {
                    if (filteredQuery.slice(-1) !== ' ') {
                        filteredQuery = filteredQuery.concat(' ');
                    }
                }
                else {
                    for (const ch of token) {
                        // filter out special characters
                        if (ENMessageQueryParser.RESERVED_CHARACTERS.has(ch)) {
                            if (filteredQuery.slice(-1) !== ' ') {
                                filteredQuery = filteredQuery.concat(' ');
                            }
                        }
                        else {
                            filteredQuery = filteredQuery.concat(ch);
                        }
                    }
                    if (filteredQuery.slice(-1) !== ' ') {
                        filteredQuery = filteredQuery.concat(' ');
                    }
                }
            }
        }
        // trim and the start / end
        const trimmedQuery = filteredQuery.trim();
        if (trimmedQuery.length === 0) {
            return null;
        }
        let conjunctionQuery = '';
        const trimmedSplitQuery = trimmedQuery.split(' ');
        for (const token of trimmedSplitQuery) {
            // add conjunction after each token
            conjunctionQuery = conjunctionQuery.concat(token + '*' + ENMessageQueryParser.CONJUNCTION);
        }
        // truncate conjunction at the end
        const result = conjunctionQuery.slice(0, -ENMessageQueryParser.CONJUNCTION.length);
        if (result.length === 0) {
            return null;
        }
        return result;
    }
}
exports.ENMessageQueryParser = ENMessageQueryParser;
ENMessageQueryParser.MAX_QUERY_LENGTH = 64;
ENMessageQueryParser.CONJUNCTION = ' AND ';
ENMessageQueryParser.ENGLISH_STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by",
    "for", "if", "in", "into", "is", "it",
    "no", "not", "of", "on", "or", "such",
    "that", "the", "their", "then", "there", "these",
    "they", "this", "to", "was", "will", "with"
]);
// from ESQueryStringBuilder
// includes all lucene reserved characters
// // https://lucene.apache.org/core/2_9_4/queryparsersyntax.html#Escaping%20Special%20Characters
ENMessageQueryParser.RESERVED_CHARACTERS = new Set([
    '+', '-', '=', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '/', '\\'
]);
//# sourceMappingURL=ENMessageQueryParser.js.map