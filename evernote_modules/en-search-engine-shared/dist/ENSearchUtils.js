"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ENSearchIndexManager_1 = require("./ENSearchIndexManager");
const ENSearchTypes_1 = require("./ENSearchTypes");
class ENSearchUtils {
    static initializeDocumentTypeToIndexName() {
        const out = new Map();
        //todo:: add other types
        out.set(ENSearchTypes_1.ENDocumentType.TAG, ENSearchIndexManager_1.ENIndexName.Tag);
        out.set(ENSearchTypes_1.ENDocumentType.NOTEBOOK, ENSearchIndexManager_1.ENIndexName.Notebook);
        out.set(ENSearchTypes_1.ENDocumentType.STACK, ENSearchIndexManager_1.ENIndexName.Stack);
        out.set(ENSearchTypes_1.ENDocumentType.WORKSPACE, ENSearchIndexManager_1.ENIndexName.Workspace);
        return out;
    }
    static initializeOtherIndexDocumentTypes() {
        const out = new Set();
        out.add(ENSearchTypes_1.ENDocumentType.TAG);
        out.add(ENSearchTypes_1.ENDocumentType.NOTEBOOK);
        out.add(ENSearchTypes_1.ENDocumentType.STACK);
        out.add(ENSearchTypes_1.ENDocumentType.WORKSPACE);
        return out;
    }
    static initializeDocumentTypeToLabel() {
        const out = new Map();
        out.set(ENSearchTypes_1.ENDocumentType.TAG, 'tag_utf8');
        out.set(ENSearchTypes_1.ENDocumentType.NOTEBOOK, 'notebook_utf8');
        out.set(ENSearchTypes_1.ENDocumentType.STACK, 'stack_utf8');
        out.set(ENSearchTypes_1.ENDocumentType.WORKSPACE, 'space_utf8');
        return out;
    }
}
exports.ENSearchUtils = ENSearchUtils;
ENSearchUtils.DOCUMENT_TYPE_TO_INDEX_NAME = ENSearchUtils.initializeDocumentTypeToIndexName();
ENSearchUtils.OTHER_INDEX_DOCUMENT_TYPES = ENSearchUtils.initializeOtherIndexDocumentTypes();
ENSearchUtils.DOCUMENT_TYPE_TO_LABEL = ENSearchUtils.initializeDocumentTypeToLabel();
class ENSearchQueryUtils {
    /**
     * Returns guid request. WARNING: this does not work for stack
     * @param guid primary guid
     * @returns
     */
    static getSearchGuidRequest(guid) {
        return `_id:"${guid}"`;
    }
    static escapeSearchString(label) {
        return label.replace(/"/g, '\\"');
    }
    static getSearchRequest(label, documentType) {
        let query = '';
        const escapedLabel = ENSearchQueryUtils.escapeSearchString(label);
        switch (documentType) {
            case ENSearchTypes_1.ENDocumentType.TAG:
                query = `tag:"${escapedLabel}"`;
                break;
            case ENSearchTypes_1.ENDocumentType.NOTEBOOK:
                query = `notebook:"${escapedLabel}"`;
                break;
            case ENSearchTypes_1.ENDocumentType.STACK:
                query = `stack:"${escapedLabel}"`;
                break;
            case ENSearchTypes_1.ENDocumentType.WORKSPACE:
                query = `space:"${escapedLabel}"`;
                break;
        }
        return query;
    }
}
exports.ENSearchQueryUtils = ENSearchQueryUtils;
//# sourceMappingURL=ENSearchUtils.js.map