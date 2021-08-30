"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ENSearchIndexManager_1 = require("./ENSearchIndexManager");
const ENSearchTypes_1 = require("./ENSearchTypes");
class ENSearchIndexCommandHelper {
    static getAddNotebookCommand(notebook) {
        let notebookDoc = {};
        notebookDoc['document'] = {};
        notebookDoc['document']['_id'] = notebook.guid;
        notebookDoc['document']['notebook'] = notebook.content;
        notebookDoc['document']['notebook_utf8'] = notebook.content;
        notebookDoc['action'] = 'add_document';
        notebookDoc['index'] = ENSearchIndexManager_1.ENIndexName.Notebook;
        return notebookDoc;
    }
    static getDeleteNotebookCommand(guid) {
        let notebookDoc = {};
        notebookDoc['document'] = {};
        notebookDoc['document']['_id'] = guid;
        notebookDoc['action'] = 'delete_document';
        notebookDoc['index'] = ENSearchIndexManager_1.ENIndexName.Notebook;
        return notebookDoc;
    }
    static getAddTagCommand(tag) {
        let tagDoc = {};
        tagDoc['document'] = {};
        tagDoc['document']['_id'] = tag.guid;
        tagDoc['document']['tag'] = tag.content;
        tagDoc['document']['tag_utf8'] = tag.content;
        tagDoc['action'] = 'add_document';
        tagDoc['index'] = ENSearchIndexManager_1.ENIndexName.Tag;
        return tagDoc;
    }
    // todo:: dedup delete commands by adding index parameter
    static getDeleteTagCommand(guid) {
        let tagDoc = {};
        tagDoc['document'] = {};
        tagDoc['document']['_id'] = guid;
        tagDoc['action'] = 'delete_document';
        tagDoc['index'] = ENSearchIndexManager_1.ENIndexName.Tag;
        return tagDoc;
    }
    static getAddStackCommand(stack) {
        let stackDoc = {};
        stackDoc['document'] = {};
        stackDoc['document']['_id'] = stack.content;
        stackDoc['document']['stack'] = stack.content;
        stackDoc['document']['stack_utf8'] = stack.content;
        stackDoc['action'] = 'add_document';
        stackDoc['index'] = ENSearchIndexManager_1.ENIndexName.Stack;
        return stackDoc;
    }
    // todo:: dedup delete commands by adding index parameter
    // todo:: change delete stack command by delete by query command
    static getDeleteStackCommand(guid) {
        let stackDoc = {};
        stackDoc['document'] = {};
        stackDoc['document']['_id'] = guid;
        stackDoc['action'] = 'delete_document';
        stackDoc['index'] = ENSearchIndexManager_1.ENIndexName.Stack;
        return stackDoc;
    }
    static getAddWorkspaceCommand(workspace) {
        let workspaceDoc = {};
        workspaceDoc['document'] = {};
        workspaceDoc['document']['_id'] = workspace.guid;
        workspaceDoc['document']['space'] = workspace.content;
        workspaceDoc['document']['space_utf8'] = workspace.content;
        workspaceDoc['action'] = 'add_document';
        workspaceDoc['index'] = ENSearchIndexManager_1.ENIndexName.Workspace;
        return workspaceDoc;
    }
    static getDeleteWorkspaceCommand(guid) {
        let workspaceDoc = {};
        workspaceDoc['document'] = {};
        workspaceDoc['document']['_id'] = guid;
        workspaceDoc['action'] = 'delete_document';
        workspaceDoc['index'] = ENSearchIndexManager_1.ENIndexName.Workspace;
        return workspaceDoc;
    }
    static getExportCommand(index) {
        let exportCommand = {};
        exportCommand['action'] = 'export_index';
        exportCommand['index'] = index;
        return exportCommand;
    }
    // todo:: rename parameters
    static getImportCommand(indexName, index) {
        let importCommand = {};
        importCommand['action'] = 'import_index';
        importCommand['index_data'] = index.index;
        importCommand['index'] = indexName;
        return importCommand;
    }
    // todo:: change api only for certain ENDocumentType parameters
    static getSearchIndexCommand(query, indexName, offset, maxNotes, order, ascending, storedFields) {
        let searchCommand = {};
        searchCommand['action'] = 'search';
        // todo:: handle empty query case?;
        searchCommand['queryString'] = query || ENSearchTypes_1.EMPTY_QUERY;
        searchCommand['index'] = indexName;
        searchCommand['order'] = order !== null && order !== void 0 ? order : ENSearchTypes_1.ENSortType.RELEVANCE;
        searchCommand['reverseOrder'] = (ascending !== undefined && ascending !== null) ? !ascending : false;
        searchCommand['from'] = offset !== null && offset !== void 0 ? offset : 0;
        searchCommand['size'] = maxNotes !== null && maxNotes !== void 0 ? maxNotes : 128;
        if (storedFields) {
            searchCommand['stored_fields'] = storedFields;
        }
        return searchCommand;
    }
}
exports.ENSearchIndexCommandHelper = ENSearchIndexCommandHelper;
//# sourceMappingURL=ENSearchIndexCommandHelper.js.map