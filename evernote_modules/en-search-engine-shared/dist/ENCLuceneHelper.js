"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ENSearchTypes_1 = require("./ENSearchTypes");
const ESQueryStringBuilder_1 = require("./parsers/advanced/ESQueryStringBuilder");
class ENCLuceneHelper {
    static initializePrimaryToAltFields() {
        const result = new Map();
        result.set(ENCLuceneHelper.tagTextField, [{ name: ENCLuceneHelper.tagTextAltField, type: ENSearchTypes_1.ENSearchAlternativeFieldType.ALTERNATIVE }, { name: ENCLuceneHelper.tagTextSuffixField, type: ENSearchTypes_1.ENSearchAlternativeFieldType.SUFFIX }]);
        result.set(ENCLuceneHelper.notebookTextField, [{ name: ENCLuceneHelper.notebookTextAltField, type: ENSearchTypes_1.ENSearchAlternativeFieldType.ALTERNATIVE }, { name: ENCLuceneHelper.notebookTextSuffixField, type: ENSearchTypes_1.ENSearchAlternativeFieldType.SUFFIX }]);
        result.set(ENCLuceneHelper.spaceTextField, [{ name: ENCLuceneHelper.spaceTextAltField, type: ENSearchTypes_1.ENSearchAlternativeFieldType.ALTERNATIVE }, { name: ENCLuceneHelper.spaceTextSuffixField, type: ENSearchTypes_1.ENSearchAlternativeFieldType.SUFFIX }]);
        result.set(ENCLuceneHelper.stackText, [{ name: ENCLuceneHelper.stackTextAlt, type: ENSearchTypes_1.ENSearchAlternativeFieldType.ALTERNATIVE }, { name: ENCLuceneHelper.stackTextSuffix, type: ENSearchTypes_1.ENSearchAlternativeFieldType.SUFFIX }]);
        result.set(ENCLuceneHelper.title, [{ name: ENCLuceneHelper.titleAlt, type: ENSearchTypes_1.ENSearchAlternativeFieldType.ALTERNATIVE }, { name: ENCLuceneHelper.titleSuffix, type: ENSearchTypes_1.ENSearchAlternativeFieldType.SUFFIX }]);
        return result;
    }
    static initializeSuggestTypeToFieldName() {
        const suggestTypeToFieldName = new Map();
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.TITLE, ENCLuceneHelper.title);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.NOTEBOOK, ENCLuceneHelper.notebookTextField);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.SPACE, ENCLuceneHelper.spaceTextField);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.TAG, ENCLuceneHelper.tagTextField);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.AUTHOR, ENCLuceneHelper.authorText);
        // suggestTypeToFieldName.set(ENSuggestResultType.HISTORY);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.STACK, ENCLuceneHelper.stackText);
        return suggestTypeToFieldName;
    }
    static initializeSuggestTypeToMainFieldName() {
        const suggestTypeToFieldName = new Map();
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.TITLE, ENCLuceneHelper.title);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.NOTEBOOK, ENCLuceneHelper.notebookField);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.SPACE, ENCLuceneHelper.spaceField);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.TAG, ENCLuceneHelper.tagField);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.AUTHOR, ENCLuceneHelper.author);
        // suggestTypeToFieldName.set(ENSuggestResultType.HISTORY);
        suggestTypeToFieldName.set(ENSearchTypes_1.ENSuggestResultType.STACK, ENCLuceneHelper.stack);
        return suggestTypeToFieldName;
    }
    static truncateField(value, limit) {
        let truncatedValue = value;
        if (value.length > limit) {
            truncatedValue = value.substring(0, limit);
        }
        return truncatedValue;
    }
    static createLuceneQuery(query, searchOnlyActiveNotes, documentType) {
        let luceneQuery = '(' + query + ')';
        if (documentType !== undefined && documentType !== null) {
            luceneQuery += ` AND ${ENCLuceneHelper.typeField}:${documentType}`;
        }
        if (searchOnlyActiveNotes) {
            luceneQuery += ` AND ${ENCLuceneHelper.activeField}:1`;
        }
        return luceneQuery;
    }
    static getConditionsForSuggestType(suggestFieldName, searchTokens) {
        const conditions = new Array();
        for (const searchToken of searchTokens) {
            const escapedToken = ESQueryStringBuilder_1.ESQueryStringBuilder.escapeReservedChars(searchToken);
            if (ENCLuceneHelper.primaryToAltFields.has(suggestFieldName)) {
                const singleConditionWithAlts = [`${suggestFieldName}:${escapedToken}*`];
                const altSuggestTypes = ENCLuceneHelper.primaryToAltFields.get(suggestFieldName);
                for (const altSuggestType of altSuggestTypes) {
                    if (altSuggestType.type === ENSearchTypes_1.ENSearchAlternativeFieldType.SUFFIX) {
                        const suffixConditions = new Array();
                        const tokens = ENCLuceneHelper.nGramTokenize(searchToken, 3);
                        for (const token of tokens) {
                            const truncatedEscapedToken = ESQueryStringBuilder_1.ESQueryStringBuilder.escapeReservedChars(token);
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
                conditions.push(`${suggestFieldName}:${escapedToken}*`);
            }
        }
        return conditions;
    }
    static nGramTokenize(searchWord, nGramSize) {
        const result = new Array();
        if (searchWord.length === 0) {
            return result;
        }
        if (searchWord.length < nGramSize) {
            result.push(searchWord);
            return result;
        }
        for (let i = 0; i < searchWord.length; ++i) {
            let nGram = '';
            if (i + nGramSize < searchWord.length) {
                nGram = searchWord.substring(i, i + nGramSize);
            }
            else {
                nGram = searchWord.substring(i);
            }
            result.push(nGram);
        }
        return result;
    }
    static setResultFlags(searchResult, parsedQuery) {
        searchResult.resultFlags = {
            isValidQueryStr: parsedQuery.success,
            isBoolean: parsedQuery.isBoolean,
            isGeo: parsedQuery.isGeo,
            isFiltered: parsedQuery.filter !== null,
        };
        return searchResult;
    }
    static emptySearchResultGroup() {
        return {
            totalResultCount: 0,
            startIndex: 0,
            results: [],
        };
    }
    static createSearchResults(searchResultGroup) {
        const resultGroup = this.emptySearchResultGroup();
        if (!this.validateJson(searchResultGroup)) {
            return resultGroup;
        }
        for (const document of searchResultGroup.documents) {
            const result = {
                guid: document.guid,
                type: document.type,
                version: document.version,
                score: document.score,
            };
            resultGroup.results.push(result);
        }
        resultGroup.startIndex = searchResultGroup.startIndex;
        resultGroup.totalResultCount = searchResultGroup.totalResultCount;
        return resultGroup;
    }
    static createSearchResultsForOtherIndices(searchResultGroup, documentType, fieldName) {
        const resultGroup = this.emptySearchResultGroup();
        if (!this.validateJsonV2(searchResultGroup)) {
            return resultGroup;
        }
        for (const document of searchResultGroup.documents) {
            const result = {
                guid: document.guid,
                type: documentType,
                // todo:: remove version from old index
                version: 0,
                score: document.score,
                label: document[fieldName]
            };
            resultGroup.results.push(result);
        }
        resultGroup.startIndex = searchResultGroup.startIndex;
        resultGroup.totalResultCount = searchResultGroup.totalResultCount;
        return resultGroup;
    }
    static createSuggestResults(searchResultGroup, searchWords, suggestType) {
        const results = new Array();
        if (!this.validateJson(searchResultGroup)) {
            return results;
        }
        // will need to ckeck that each search word has it's own pair in entity name
        // sort search words by length, first will try to match longer words
        searchWords.sort((a, b) => b.length - a.length);
        for (const document of searchResultGroup.documents) {
            if ((suggestType === null || suggestType === 'notebookText') && document.hasOwnProperty('nbGuid') && document.hasOwnProperty('notebook')) {
                const suggest = { type: ENSearchTypes_1.ENSuggestResultType.NOTEBOOK, guid: document.nbGuid, value: document.notebook, score: document.score };
                if (this.validateSuggest(results, searchWords, suggest)) {
                    results.push(suggest);
                }
            }
            if ((suggestType === null || suggestType === 'spaceText') && document.hasOwnProperty('spaceGuid') && document.hasOwnProperty('space')) {
                const suggest = { type: ENSearchTypes_1.ENSuggestResultType.SPACE, guid: document.spaceGuid, value: document.space, score: document.score };
                if (this.validateSuggest(results, searchWords, suggest)) {
                    results.push(suggest);
                }
            }
            if ((suggestType === null || suggestType === 'tagText') && document.hasOwnProperty('tagGuid') && document.hasOwnProperty('tag')) {
                if (document.tag.length === document.tagGuid.length) {
                    for (let i = 0; i < document.tag.length; ++i) {
                        const suggest = { type: ENSearchTypes_1.ENSuggestResultType.TAG, guid: document.tagGuid[i], value: document.tag[i], score: document.score };
                        if (this.validateSuggest(results, searchWords, suggest)) {
                            results.push(suggest);
                        }
                    }
                }
            }
            if ((suggestType === null || suggestType === 'authorText') && document.hasOwnProperty('creatorId') && document.hasOwnProperty('author')) {
                const suggest = { type: ENSearchTypes_1.ENSuggestResultType.AUTHOR, guid: document.creatorId, value: document.author, score: document.score };
                if (this.validateSuggest(results, searchWords, suggest)) {
                    results.push(suggest);
                }
            }
            if ((suggestType === null || suggestType === 'title') && document.hasOwnProperty('title')) {
                const suggest = { type: ENSearchTypes_1.ENSuggestResultType.TITLE, guid: document.guid, value: document.title, score: document.score };
                if (this.validateSuggest(results, searchWords, suggest)) {
                    results.push(suggest);
                }
            }
            if ((suggestType === null || suggestType === 'stackText') && document.hasOwnProperty('stack')) {
                const suggest = { type: ENSearchTypes_1.ENSuggestResultType.STACK, guid: document.stack, value: document.stack, score: document.score };
                if (this.validateSuggest(results, searchWords, suggest)) {
                    results.push(suggest);
                }
            }
        }
        // sort results by type, then by score
        results.sort((a, b) => {
            if (a.type < b.type) {
                return -1;
            }
            if (a.type === b.type) {
                return b.score - a.score;
            }
            if (a.type > b.type) {
                return 1;
            }
            return 0;
        });
        return results;
    }
    static validateJson(searchResults) {
        if (!searchResults.hasOwnProperty('documents') || !Array.isArray(searchResults.documents)) {
            return false;
        }
        if (!searchResults.hasOwnProperty('startIndex') || !(typeof searchResults.startIndex === 'number')) {
            return false;
        }
        if (!searchResults.hasOwnProperty('totalResultCount') || !(typeof searchResults.totalResultCount === 'number')) {
            return false;
        }
        const storedStringFields = ['nbGuid', 'notebook', 'spaceGuid', 'space', 'creatorId', 'author', 'title'];
        const storedStringArraysFields = ['tagGuid', 'tag'];
        for (const document of searchResults.documents) {
            // required fields
            if (!document.hasOwnProperty('guid') || !(typeof document.guid === 'string')) {
                return false;
            }
            if (!document.hasOwnProperty('type') || !(typeof document.type === 'number')) {
                return false;
            }
            if (!document.hasOwnProperty('version') || !(typeof document.version === 'number')) {
                return false;
            }
            // these fields are optional, check the types if they exist
            for (const field of storedStringFields) {
                if (document.hasOwnProperty(field) && !(typeof document[field] === 'string')) {
                    return false;
                }
            }
            for (const field of storedStringArraysFields) {
                if (document.hasOwnProperty(field) && !((document[field] instanceof Array) && document[field].every(item => typeof item === "string"))) {
                    return false;
                }
            }
        }
        return true;
    }
    static validateJsonV2(searchResults) {
        if (!searchResults.hasOwnProperty('documents') || !Array.isArray(searchResults.documents)) {
            return false;
        }
        if (!searchResults.hasOwnProperty('startIndex') || !(typeof searchResults.startIndex === 'number')) {
            return false;
        }
        if (!searchResults.hasOwnProperty('totalResultCount') || !(typeof searchResults.totalResultCount === 'number')) {
            return false;
        }
        const storedStringFields = ['nbGuid', 'notebook', 'spaceGuid', 'space', 'creatorId', 'author', 'title', 'tagGuid', 'tag'];
        for (const document of searchResults.documents) {
            // required fields
            if (!document.hasOwnProperty('guid') || !(typeof document.guid === 'string')) {
                return false;
            }
            // these fields are optional, check the types if they exist
            for (const field of storedStringFields) {
                if (document.hasOwnProperty(field) && !(typeof document[field] === 'string')) {
                    return false;
                }
            }
        }
        return true;
    }
    static validateSuggest(results, searchWords, suggest) {
        if (suggest.guid === '' || suggest.value === '') {
            return false;
        }
        // note can contain tags which are not relevant to query, need to check each
        // in case of notebook, space, author, title one word query defenetly match, check only multiterm query
        let tokens = suggest.value.split(' ');
        let foundAllWords = true;
        for (const searchWord of searchWords) {
            let matchIndex = -1;
            for (let i = 0; i < tokens.length; ++i) {
                if (tokens[i].toLowerCase().indexOf(searchWord.toLowerCase()) !== -1) {
                    matchIndex = i;
                    break;
                }
            }
            if (matchIndex < 0) {
                foundAllWords = false;
                break;
            }
            else {
                tokens.splice(matchIndex, 1);
            }
        }
        if (!foundAllWords) {
            return false;
        }
        if (results.find(result => (result.type === suggest.type && result.guid === suggest.guid))) {
            return false;
        }
        return true;
    }
    static getError(engineOutput) {
        if (typeof engineOutput === 'object' && engineOutput.hasOwnProperty('error')) {
            return JSON.stringify(engineOutput['error']);
        }
        return undefined;
    }
}
exports.ENCLuceneHelper = ENCLuceneHelper;
ENCLuceneHelper.contentField = 'content';
ENCLuceneHelper.typeField = 'type';
ENCLuceneHelper.versionField = 'version';
ENCLuceneHelper.activeField = 'active';
// notebook
ENCLuceneHelper.notebookField = 'notebook';
ENCLuceneHelper.notebookTextField = 'notebookText';
ENCLuceneHelper.notebookTextAltField = 'notebookTextAlt';
ENCLuceneHelper.notebookTextSuffixField = 'notebookTextSuffix';
ENCLuceneHelper.notebookGuidField = 'nbGuid';
// stack
ENCLuceneHelper.stack = 'stack';
ENCLuceneHelper.stackText = 'stackText';
ENCLuceneHelper.stackTextAlt = 'stackTextAlt';
ENCLuceneHelper.stackTextSuffix = 'stackTextSuffix';
// tag
ENCLuceneHelper.tagField = 'tag';
ENCLuceneHelper.tagTextField = 'tagText';
ENCLuceneHelper.tagTextAltField = 'tagTextAlt';
ENCLuceneHelper.tagTextSuffixField = 'tagTextSuffix';
ENCLuceneHelper.tagGuidField = 'tagGuid';
// space
ENCLuceneHelper.spaceField = 'space';
ENCLuceneHelper.spaceTextField = 'spaceText';
ENCLuceneHelper.spaceTextAltField = 'spaceTextAlt';
ENCLuceneHelper.spaceTextSuffixField = 'spaceTextSuffix';
ENCLuceneHelper.spaceGuidField = 'spaceGuid';
// resource
ENCLuceneHelper.resourceMime = 'resourceMime';
ENCLuceneHelper.resourceFileName = 'resourceFileName';
ENCLuceneHelper.created = 'created';
ENCLuceneHelper.updated = 'updated';
// note title
ENCLuceneHelper.title = 'title';
ENCLuceneHelper.titleAlt = 'titleAlt';
ENCLuceneHelper.titleSuffix = 'titleSuffix';
ENCLuceneHelper.titleRaw = 'titleRaw';
ENCLuceneHelper.subjectDate = 'subjectDate';
// author
ENCLuceneHelper.author = 'author';
ENCLuceneHelper.authorText = 'authorText';
ENCLuceneHelper.creatorId = 'creatorId';
ENCLuceneHelper.lastEditorId = 'lastEditorId';
ENCLuceneHelper.source = 'source';
ENCLuceneHelper.sourceApplication = 'sourceApplication';
ENCLuceneHelper.sourceURL = 'sourceURL';
ENCLuceneHelper.contentClass = 'contentClass';
ENCLuceneHelper.placeName = 'placeName';
ENCLuceneHelper.applicationData = 'applicationData';
ENCLuceneHelper.reminderOrder = 'reminderOrder';
ENCLuceneHelper.reminderTime = 'reminderTime';
ENCLuceneHelper.reminderDoneTime = 'reminderDoneTime';
ENCLuceneHelper.contains = 'contains';
ENCLuceneHelper.task = 'task';
ENCLuceneHelper.taskCompleted = 'taskCompleted';
ENCLuceneHelper.taskNotCompleted = 'taskNotCompleted';
ENCLuceneHelper.primaryToAltFields = ENCLuceneHelper.initializePrimaryToAltFields();
ENCLuceneHelper.exists = '_exists_';
ENCLuceneHelper.maxRecognitionPlainTextSize = 1048576;
ENCLuceneHelper.maxRecognitionFilesPerNote = 10;
ENCLuceneHelper.maxNotePlainTextLength = 1048576;
ENCLuceneHelper.maxFieldSize = 255;
ENCLuceneHelper.maxTaskSize = 300;
ENCLuceneHelper.maxTasksPerNote = 1000;
ENCLuceneHelper.suggestTypeToFieldName = ENCLuceneHelper.initializeSuggestTypeToFieldName();
ENCLuceneHelper.suggestTypeToMainFieldName = ENCLuceneHelper.initializeSuggestTypeToMainFieldName();
//# sourceMappingURL=ENCLuceneHelper.js.map