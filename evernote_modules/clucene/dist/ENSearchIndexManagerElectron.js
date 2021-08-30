"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const en_search_engine_shared_1 = require("en-search-engine-shared");
const ENElectronClucene_1 = require("./ENElectronClucene");
const ENSearchEngineElectron_1 = require("./ENSearchEngineElectron");
const en_search_engine_shared_2 = require("en-search-engine-shared");
class ENSearchIndexManagerElectron {
    constructor(logger) {
        this.indicesMetaInfo = new Map();
        this.logger = logger;
        this.clucene = new ENElectronClucene_1.CLuceneWrapper(this.logger);
        this.searchEngine = new ENSearchEngineElectron_1.ENSearchEngineElectron(logger, this.clucene);
        this.indicesMetaInfo.set(en_search_engine_shared_1.ENIndexName.Note, { version: this.searchEngine.getVersion(), isModified: false });
        // notebook
        const notebookScheme = en_search_engine_shared_1.getNotebookIndexSchema();
        this.indicesMetaInfo.set(en_search_engine_shared_1.ENIndexName.Notebook, { version: notebookScheme['version'], isModified: false, scheme: en_search_engine_shared_1.getNotebookIndexSchema() });
        // tag
        const tagScheme = en_search_engine_shared_1.getTagIndexSchema();
        this.indicesMetaInfo.set(en_search_engine_shared_1.ENIndexName.Tag, { version: tagScheme['version'], isModified: false, scheme: en_search_engine_shared_1.getTagIndexSchema() });
        // stack
        const stackScheme = en_search_engine_shared_1.getStackIndexSchema();
        this.indicesMetaInfo.set(en_search_engine_shared_1.ENIndexName.Stack, { version: stackScheme['version'], isModified: false, scheme: stackScheme });
        // workspace
        const workspaceScheme = en_search_engine_shared_1.getWorkspaceIndexSchema();
        this.indicesMetaInfo.set(en_search_engine_shared_1.ENIndexName.Workspace, { version: workspaceScheme['version'], isModified: false, scheme: workspaceScheme });
    }
    async init() {
        await this.searchEngine.init();
        await this.setMappings();
    }
    updateIndexMetainformation(indexName, isModified) {
        if (this.indicesMetaInfo.has(indexName)) {
            this.indicesMetaInfo.get(indexName).isModified = isModified;
        }
    }
    async setMappings() {
        // set index mappings
        for (const index of this.indicesMetaInfo) {
            if (index[0] !== en_search_engine_shared_1.ENIndexName.Note) {
                const result = await this.clucene.executeAsync(index[1].scheme);
                const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
                if (error) {
                    this.logger.error(`ENSearchIndexManagerElectron: setMappings: failed to set mapping for index ${index[0]}; reason: ${error}`);
                }
                this.updateIndexMetainformation(index[0], false);
            }
        }
    }
    destructor() {
        this.searchEngine.destructor();
    }
    // Search operations
    async search(params) {
        if (params.documentType) {
            if (en_search_engine_shared_1.ENSearchUtils.OTHER_INDEX_DOCUMENT_TYPES.has(params.documentType)) {
                return await this.searchOtherTypes(params);
            }
        }
        return await this.searchEngine.search(params);
    }
    async suggest(query, params) {
        return await this.searchEngine.suggest(query, params);
    }
    async searchOtherTypes(params) {
        const pquery = en_search_engine_shared_1.QueryStringParser.parse(params.query);
        const queryBuilder = new en_search_engine_shared_1.ESQueryStringBuilder(pquery.fullQuery);
        queryBuilder.dontPrintAnd = false;
        const parsedQuery = queryBuilder.build();
        // console.log('parsedQuery: ', parsedQuery);
        if (parsedQuery === null) {
            return en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup();
        }
        const indexName = en_search_engine_shared_1.ENSearchUtils.DOCUMENT_TYPE_TO_INDEX_NAME.get(params.documentType);
        const labelField = en_search_engine_shared_1.ENSearchUtils.DOCUMENT_TYPE_TO_LABEL.get(params.documentType);
        const searchCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getSearchIndexCommand(parsedQuery, indexName, params.offset, params.maxNotes, params.order, params.ascending, [labelField]);
        const results = this.clucene.execute(searchCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(results);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: searchOtherTypes: failed to perform search; reason: ${error}`);
            return en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup();
        }
        const resultGroup = en_search_engine_shared_1.ENCLuceneHelper.createSearchResultsForOtherIndices(results, params.documentType, labelField);
        return resultGroup;
    }
    // CRUD operations
    async addDocument(document) {
        await this.searchEngine.addDocument(document);
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Note, true);
    }
    async deleteDocument(guid) {
        await this.searchEngine.deleteDocument(guid);
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Note, true);
    }
    async addNotebook(notebook) {
        //
        const addNotebookCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getAddNotebookCommand(notebook);
        const result = await this.clucene.executeAsync(addNotebookCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: addNotebook: failed to add notebook: guid: ${notebook.guid}; reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Notebook, true);
    }
    async deleteNotebook(guid) {
        const deleteNotebookCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getDeleteNotebookCommand(guid);
        const result = await this.clucene.executeAsync(deleteNotebookCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: deleteNotebook: failed to delete notebook: guid: ${guid}; reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Notebook, true);
    }
    async addTag(tag) {
        const addTagCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getAddTagCommand(tag);
        const result = await this.clucene.executeAsync(addTagCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: addTag: failed to add tag: guid: ${tag.guid}; reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Tag, true);
    }
    async deleteTag(guid) {
        const deleteTagCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getDeleteTagCommand(guid);
        const result = await this.clucene.executeAsync(deleteTagCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: deleteTag: failed to delete tag: guid: ${guid}; reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Tag, true);
    }
    async addStack(stack) {
        const addStackCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getAddStackCommand(stack);
        const result = await this.clucene.executeAsync(addStackCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: addStack: failed to add stack. reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Stack, true);
    }
    async deleteStack(guid) {
        const deleteStackCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getDeleteStackCommand(guid);
        const result = await this.clucene.executeAsync(deleteStackCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: deleteStack: failed to delete stack. reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Stack, true);
    }
    async addWorkspace(workspace) {
        const addWorkspaceCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getAddWorkspaceCommand(workspace);
        const result = await this.clucene.executeAsync(addWorkspaceCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: addWorkspace: failed to add workspace ${workspace.guid}. reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Workspace, true);
    }
    async deleteWorkspace(guid) {
        const deleteWorkspaceCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getDeleteWorkspaceCommand(guid);
        const result = await this.clucene.executeAsync(deleteWorkspaceCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: deleteWorkspace: failed to delete workspace ${guid}. reason: ${error}`);
        }
        this.updateIndexMetainformation(en_search_engine_shared_1.ENIndexName.Workspace, true);
    }
    async exportNoteIndex() {
        const indexData = await this.searchEngine.exportIndex();
        return { version: this.searchEngine.getVersion(), type: this.searchEngine.getEngineType(), index: indexData };
    }
    async exportOtherIndex(index) {
        const version = this.indicesMetaInfo.get(index).version;
        const exportCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getExportCommand(index);
        const indexData = await this.clucene.executeAsync(exportCommand);
        const error = en_search_engine_shared_1.ENCLuceneHelper.getError(indexData);
        if (error) {
            this.logger.error(`ENSearchIndexManagerElectron: exportOtherIndex: failed to export index ${index}. reason: ${error}`);
            return { version, type: ENSearchIndexManagerElectron.engineType, index: '' };
            ;
        }
        return { version, type: ENSearchIndexManagerElectron.engineType, index: indexData['index_data'] };
    }
    async exportIndices(indices) {
        const exportInfo = new Map();
        for (const index of indices) {
            let exportIndexInfo;
            if (index === en_search_engine_shared_1.ENIndexName.Note) {
                exportIndexInfo = await this.exportNoteIndex();
            }
            else {
                exportIndexInfo = await this.exportOtherIndex(index);
            }
            exportInfo.set(index, exportIndexInfo);
            this.updateIndexMetainformation(index, true);
        }
        return exportInfo;
    }
    shouldExport() {
        for (const index of this.indicesMetaInfo) {
            if (index[1].isModified) {
                return true;
            }
        }
        return false;
    }
    async export(indices) {
        if (indices) {
            return await this.exportIndices(indices);
        }
        else {
            const modifiedIndices = new Array();
            for (const index of this.indicesMetaInfo) {
                if (index[1].isModified) {
                    modifiedIndices.push(index[0]);
                }
            }
            return await this.exportIndices(modifiedIndices);
        }
    }
    async importInternal(indices) {
        for (const index of indices) {
            if (index[0] === en_search_engine_shared_1.ENIndexName.Note) {
                await this.searchEngine.importIndex(index[1].index);
            }
            else {
                const indexMetaInfo = this.indicesMetaInfo.get(index[0]);
                await this.clucene.executeAsync(indexMetaInfo.scheme);
                const importCommand = en_search_engine_shared_2.ENSearchIndexCommandHelper.getImportCommand(index[0], index[1]);
                const result = await this.clucene.executeAsync(importCommand);
                const error = en_search_engine_shared_1.ENCLuceneHelper.getError(result);
                if (error) {
                    this.logger.error(`ENSearchIndexManagerElectron: import: failed to export index ${index[0]}. reason: ${error}`);
                }
            }
            this.updateIndexMetainformation(index[0], false);
        }
    }
    async import(indices) {
        // first clean all indices
        const emptyIndices = new Map();
        for (const index of this.indicesMetaInfo) {
            emptyIndices.set(index[0], { version: index[1].version, index: '', type: this.getEngineType() });
        }
        // first call cleans all indices
        await this.importInternal(emptyIndices);
        if (indices.size !== 0) {
            await this.importInternal(indices);
        }
    }
    async clear() {
        const emptyIndices = new Map();
        await this.import(emptyIndices);
    }
    async isMetadataQuery(query) {
        return await this.searchEngine.isMetadataQuery(query);
    }
    async isQueryWithFilters(query) {
        return en_search_engine_shared_1.QueryStringParser.isQueryWithFilters(query);
    }
    getVersion(index) {
        if (index === en_search_engine_shared_1.ENIndexName.Note) {
            return this.searchEngine.getVersion();
        }
        else {
            return this.indicesMetaInfo.get(index).version;
        }
    }
    getEngineType() {
        return ENSearchIndexManagerElectron.engineType;
    }
    getIndexNames() {
        return Array.from(this.indicesMetaInfo.keys());
    }
}
exports.ENSearchIndexManagerElectron = ENSearchIndexManagerElectron;
ENSearchIndexManagerElectron.engineType = 'electron';
function provideSearchIndexManager(logger) {
    return new ENSearchIndexManagerElectron(logger);
}
exports.provideSearchIndexManager = provideSearchIndexManager;
//# sourceMappingURL=ENSearchIndexManagerElectron.js.map