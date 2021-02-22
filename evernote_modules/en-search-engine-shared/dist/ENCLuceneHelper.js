"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ENSearchTypes_1 = require("./ENSearchTypes");
class ENCLuceneHelper {
    static truncateField(value, limit) {
        let truncatedValue = value;
        if (value.length > limit) {
            truncatedValue = value.substring(0, limit);
        }
        return truncatedValue;
    }
    static createLuceneQuery(query, searchOnlyActiveNotes, documentType) {
        let luceneQuery = '(' + query + ')';
        if (documentType !== undefined) {
            luceneQuery += ` AND ${ENCLuceneHelper.typeField}:${documentType}`;
        }
        if (searchOnlyActiveNotes) {
            luceneQuery += ` AND ${ENCLuceneHelper.activeField}:1`;
        }
        return luceneQuery;
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
    static createSuggestResults(searchResultGroup, query, suggestType) {
        const results = new Array();
        if (!this.validateJson(searchResultGroup)) {
            return results;
        }
        // will need to ckeck that each search word has it's own pair in entity name
        let searchWords = new Array();
        if (suggestType !== null) {
            // extract search words from query
            const filter = suggestType + ':';
            let beg = 0;
            while ((beg = query.indexOf(filter, beg)) >= 0) {
                beg += filter.length;
                const end = query.indexOf('*', beg);
                if (end > 0) {
                    searchWords.push(query.substr(beg, end - beg));
                }
            }
            // sort search words by length, first will try to match longer words
            searchWords.sort((a, b) => b.length - a.length);
            // console.log('searchWords: ', searchWords);
        }
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
    static validateSuggest(results, searchWords, suggest) {
        if (suggest.guid === '' || suggest.value === '') {
            return false;
        }
        if (suggest.type === ENSearchTypes_1.ENSuggestResultType.TAG || searchWords.length > 1) {
            // note can contain tags which are not relevant to query, need to check each
            // in case of notebook, space, author, title one word query defenetly match, check only multiterm query
            let tokens = suggest.value.split(' ');
            let foundAllWords = true;
            for (const searchWord of searchWords) {
                let matchIndex = -1;
                for (let i = 0; i < tokens.length; ++i) {
                    if (tokens[i].startsWith(searchWord)) {
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
        }
        if (results.find(result => (result.type === suggest.type && result.guid === suggest.guid))) {
            return false;
        }
        return true;
    }
}
exports.ENCLuceneHelper = ENCLuceneHelper;
ENCLuceneHelper.contentField = 'content';
ENCLuceneHelper.typeField = 'type';
ENCLuceneHelper.versionField = 'version';
ENCLuceneHelper.activeField = 'active';
ENCLuceneHelper.notebookField = 'notebook';
ENCLuceneHelper.notebookTextField = 'notebookText';
ENCLuceneHelper.notebookGuidField = 'nbGuid';
ENCLuceneHelper.stack = 'stack';
ENCLuceneHelper.tagField = 'tag';
ENCLuceneHelper.tagTextField = 'tagText';
ENCLuceneHelper.tagGuidField = 'tagGuid';
ENCLuceneHelper.spaceField = 'space';
ENCLuceneHelper.spaceTextField = 'spaceText';
ENCLuceneHelper.spaceGuidField = 'spaceGuid';
ENCLuceneHelper.resourceMime = 'resourceMime';
ENCLuceneHelper.resourceFileName = 'resourceFileName';
ENCLuceneHelper.created = 'created';
ENCLuceneHelper.updated = 'updated';
ENCLuceneHelper.title = 'title';
ENCLuceneHelper.titleRaw = 'titleRaw';
ENCLuceneHelper.subjectDate = 'subjectDate';
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
ENCLuceneHelper.exists = '_exists_';
ENCLuceneHelper.maxRecognitionPlainTextSize = 1048576;
ENCLuceneHelper.maxRecognitionFilesPerNote = 10;
ENCLuceneHelper.maxNotePlainTextLength = 1048576;
ENCLuceneHelper.maxFieldSize = 255;
ENCLuceneHelper.maxTaskSize = 300;
ENCLuceneHelper.maxTasksPerNote = 1000;
//# sourceMappingURL=ENCLuceneHelper.js.map