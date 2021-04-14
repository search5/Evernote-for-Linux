"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const en_search_engine_shared_1 = require("en-search-engine-shared");
function loadNativeLuceneModuleWithConfiguration(configuration) {
    try {
        clucene = require(`../build/${configuration}/clucene-binding`);
    }
    catch (error) {
        // tslint:disable-next-line:no-console
        console.log(error);
        // tslint:disable-next-line:no-console
        console.log(`CLucene: ${configuration}: unsupported on this platform`);
    }
}
/**
 * Tries to load native module first in the Release, then in the Debug configuration.
 * See end of the building section:
 * https://nodejs.org/api/addons.html
 */
function loadNativeLuceneModule() {
    if (!clucene) {
        loadNativeLuceneModuleWithConfiguration('Release');
    }
    if (!clucene) {
        loadNativeLuceneModuleWithConfiguration('Debug');
    }
    if (clucene) {
        clucene.STORE_YES = 1;
        clucene.STORE_NO = 2;
        clucene.STORE_COMPRESS = 4;
        clucene.INDEX_NO = 16;
        clucene.INDEX_TOKENIZED = 32;
        clucene.INDEX_UNTOKENIZED = 64;
        clucene.INDEX_NONORMS = 128;
        clucene.TERMVECTOR_NO = 256;
        clucene.TERMVECTOR_YES = 512;
        clucene.TERMVECTOR_WITH_POSITIONS = 512 | 1024;
        clucene.TERMVECTOR_WITH_OFFSETS = 512 | 2048;
        clucene.TERMVECTOR_WITH_POSITIONS_OFFSETS = (512 | 1024) | (512 | 2048);
    }
}
let clucene = null;
loadNativeLuceneModule();
/**
 * Wrapper around Clucene native module.
 */
class CLuceneWrapper {
    constructor(logger) {
        if (CLuceneWrapper.isValid()) {
            this.cl = new clucene.Lucene();
            this.logger = logger;
        }
    }
    /**
     * Checks clucene load state.
     */
    static isValid() {
        return clucene !== null;
    }
    /**
     * Imports index from the serialized representation.
     *
     * @param buffer serialized index
     * @param size serialized index size
     */
    async loadRAMDirectory(buffer, size) {
        if (!CLuceneWrapper.isValid()) {
            return Promise.reject(new Error('CLucene: unsupported on this platform'));
        }
        return new Promise((resolve, _) => {
            this.cl.loadRAMDirectory(buffer, size, (error) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'loadRAMDirectory', error));
                    return resolve();
                }
                resolve();
            });
        });
    }
    /**
 * Imports index from the serialized representation.
 *
 * @param buffer serialized index
 * @param size serialized index size
 */
    async loadRAMDirectoryAsync(buffer, size) {
        if (!CLuceneWrapper.isValid()) {
            return Promise.reject(new Error('CLucene: unsupported on this platform'));
        }
        return new Promise((resolve, _) => {
            this.cl.loadRAMDirectoryAsync(buffer, size, (error) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'loadRAMDirectoryAsync', error));
                    return resolve();
                }
                resolve();
            });
        });
    }
    /**
     * Exports index to the serialized representation.
     */
    async dumpRAMDirectory() {
        if (!CLuceneWrapper.isValid()) {
            return Promise.reject(new Error('CLucene: unsupported on this platform'));
        }
        return new Promise((resolve, _) => {
            this.cl.dumpRAMDirectory((error, dumpTime, size, buffer) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'dumpRAMDirectory', error));
                    return resolve({ elapsed_time_ms: 0, size: 0, buffer: '' });
                }
                const result = { elapsed_time_ms: dumpTime, size, buffer };
                resolve(result);
            });
        });
    }
    async dumpRAMDirectoryAsync() {
        if (!CLuceneWrapper.isValid()) {
            return Promise.reject(new Error('CLucene: unsupported on this platform'));
        }
        return new Promise((resolve, _) => {
            this.cl.dumpRAMDirectoryAsync((error, dumpTime, size, buffer) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'dumpRAMDirectoryAsync', error));
                    return resolve({ elapsed_time_ms: 0, size: 0, buffer: '' });
                }
                const result = { elapsed_time_ms: dumpTime, size, buffer };
                resolve(result);
            });
        });
    }
    async createContentField(document) {
        let noteContent = document.content;
        if (document.type === en_search_engine_shared_1.ENDocumentType.NOTE) {
            noteContent = await this.parseENMLAsync(document.content);
        }
        if (noteContent.length > en_search_engine_shared_1.ENCLuceneHelper.maxNotePlainTextLength) {
            noteContent = noteContent.substring(0, en_search_engine_shared_1.ENCLuceneHelper.maxNotePlainTextLength);
        }
        if (document.title) {
            noteContent = noteContent.concat('\n' + en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.title, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize));
        }
        if (document.resourceRecoTopTexts) {
            let recognitionResourceFiles = 0;
            for (const resourceRecoTopText of document.resourceRecoTopTexts) {
                if (recognitionResourceFiles >= en_search_engine_shared_1.ENCLuceneHelper.maxRecognitionFilesPerNote) {
                    break;
                }
                let recognitionPlainText = await this.parseRecognitionDataAsync(resourceRecoTopText);
                if (recognitionPlainText.length >= en_search_engine_shared_1.ENCLuceneHelper.maxRecognitionPlainTextSize) {
                    recognitionPlainText = recognitionPlainText.substring(0, en_search_engine_shared_1.ENCLuceneHelper.maxRecognitionPlainTextSize);
                }
                recognitionResourceFiles += 1;
                noteContent = noteContent.concat('\n' + recognitionPlainText);
            }
        }
        if (document.resourceFileNames) {
            for (const resourceFileName of document.resourceFileNames) {
                noteContent = noteContent.concat('\n' + en_search_engine_shared_1.ENCLuceneHelper.truncateField(resourceFileName, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize));
            }
        }
        if (document.tasks) {
            const maxTasks = Math.min(document.tasks.length, en_search_engine_shared_1.ENCLuceneHelper.maxTasksPerNote);
            for (let i = 0; i < maxTasks; ++i) {
                if (document.tasks[i].content) {
                    noteContent = noteContent.concat('\n' + en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.tasks[i].content, en_search_engine_shared_1.ENCLuceneHelper.maxTaskSize));
                }
            }
        }
        return noteContent;
    }
    async createLuceneDocument(document) {
        const doc = new clucene.LuceneDocument();
        const content = await this.createContentField(document);
        let existsContent = '';
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.contentField, content, clucene.STORE_NO | clucene.INDEX_TOKENIZED);
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.typeField, document.type.toString(), clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.versionField, document.version.toString(), clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.activeField, Number(document.active).toString(), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        if (document.notebook) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.notebookField + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.notebookField, document.notebook, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.notebookTextField, document.notebook, clucene.STORE_NO | clucene.INDEX_TOKENIZED);
        }
        if (document.notebookGuid) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.notebookGuidField + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.notebookGuidField, document.notebookGuid, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        }
        if (document.stack) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.stack + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.stack, document.stack, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.stackText, document.stack, clucene.STORE_NO | clucene.INDEX_TOKENIZED);
        }
        if (document.tags && document.tags.length !== 0) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.tagField + ' ');
            for (const tag of document.tags) {
                doc.addField(en_search_engine_shared_1.ENCLuceneHelper.tagField, tag, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
                doc.addField(en_search_engine_shared_1.ENCLuceneHelper.tagTextField, tag, clucene.STORE_NO | clucene.INDEX_TOKENIZED);
            }
        }
        if (document.tagGuids && document.tagGuids.length !== 0) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.tagGuidField + ' ');
            for (const tagGuid of document.tagGuids) {
                doc.addField(en_search_engine_shared_1.ENCLuceneHelper.tagGuidField, tagGuid, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
            }
        }
        if (document.space) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.spaceField + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.spaceField, document.space, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.spaceTextField, document.space, clucene.STORE_NO | clucene.INDEX_TOKENIZED);
        }
        if (document.spaceGuid) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.spaceGuidField + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.spaceGuidField, document.spaceGuid, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        }
        if (document.resourceMimes && document.resourceMimes.length !== 0) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.resourceMime + ' ');
            for (const resourceMime of document.resourceMimes) {
                doc.addField(en_search_engine_shared_1.ENCLuceneHelper.resourceMime, en_search_engine_shared_1.ENCLuceneHelper.truncateField(resourceMime, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
            }
        }
        if (document.resourceFileNames && document.resourceFileNames.length !== 0) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.resourceFileName + ' ');
            for (const resourceFileName of document.resourceFileNames) {
                doc.addField(en_search_engine_shared_1.ENCLuceneHelper.resourceFileName, en_search_engine_shared_1.ENCLuceneHelper.truncateField(resourceFileName, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_TOKENIZED);
            }
        }
        // created, updated, title - possible fields for sorting, should always exist
        const created = document.created ? document.created.toString() : '0';
        existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.created + ' ');
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.created, created, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        const updated = document.updated ? document.updated.toString() : '0';
        existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.updated + ' ');
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.updated, updated, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        const title = document.title ? en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.title, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize) : '';
        existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.title + ' ');
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.title, title, clucene.STORE_YES | clucene.INDEX_TOKENIZED);
        doc.addField(en_search_engine_shared_1.ENCLuceneHelper.titleRaw, title, clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        if (document.subjectDate) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.subjectDate + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.subjectDate, document.subjectDate.toString(), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.author) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.author + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.author, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.author, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.authorText, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.author, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_TOKENIZED);
        }
        if (document.creatorId) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.creatorId + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.creatorId, document.creatorId, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        }
        if (document.lastEditorId) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.lastEditorId + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.lastEditorId, document.lastEditorId, clucene.STORE_YES | clucene.INDEX_UNTOKENIZED);
        }
        if (document.source) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.source + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.source, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.source, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.sourceApplication) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.sourceApplication + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.sourceApplication, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.sourceApplication, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.sourceURL) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.sourceURL + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.sourceURL, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.sourceURL, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.contentClass) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.contentClass + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.contentClass, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.contentClass, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.placeName) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.placeName + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.placeName, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.placeName, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.applicationData) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.applicationData + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.applicationData, en_search_engine_shared_1.ENCLuceneHelper.truncateField(document.applicationData, en_search_engine_shared_1.ENCLuceneHelper.maxFieldSize), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.reminderOrder) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.reminderOrder + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.reminderOrder, document.reminderOrder.toString(), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.reminderTime) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.reminderTime + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.reminderTime, document.reminderTime.toString(), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.reminderDoneTime) {
            existsContent = existsContent.concat(en_search_engine_shared_1.ENCLuceneHelper.reminderDoneTime + ' ');
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.reminderDoneTime, document.reminderDoneTime.toString(), clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
        }
        if (document.tasks && document.tasks.length !== 0) {
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.contains, en_search_engine_shared_1.ENCLuceneHelper.task, clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
            let taskCompleted = false;
            let taskNotCompleted = false;
            const maxTasks = Math.min(document.tasks.length, en_search_engine_shared_1.ENCLuceneHelper.maxTasksPerNote);
            for (let i = 0; i < maxTasks; ++i) {
                if (document.tasks[i].completed && !taskCompleted) {
                    doc.addField(en_search_engine_shared_1.ENCLuceneHelper.contains, en_search_engine_shared_1.ENCLuceneHelper.taskCompleted, clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
                    taskCompleted = true;
                }
                if (!document.tasks[i].completed && !taskNotCompleted) {
                    doc.addField(en_search_engine_shared_1.ENCLuceneHelper.contains, en_search_engine_shared_1.ENCLuceneHelper.taskNotCompleted, clucene.STORE_NO | clucene.INDEX_UNTOKENIZED);
                    taskNotCompleted = true;
                }
            }
        }
        if (existsContent.length !== 0) {
            doc.addField(en_search_engine_shared_1.ENCLuceneHelper.exists, existsContent, clucene.STORE_NO | clucene.INDEX_TOKENIZED);
        }
        return doc;
    }
    addDocument(document) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        const doc = this.createLuceneDocument(document);
        const { error, indexTime, docsReplaced } = this.cl.addDocument(document.guid, doc, CLuceneWrapper.indexName);
        if (error) {
            this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'addDocument', `guid: ${document.guid}; ${error}`));
            return { elapsed_time_ms: 0, total_documents_ops: 0 };
        }
        const result = { elapsed_time_ms: indexTime, total_documents_ops: docsReplaced };
        return result;
    }
    async addDocumentAsync(document) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        const doc = await this.createLuceneDocument(document);
        return new Promise((resolve, _) => {
            this.cl.addDocumentAsync(document.guid, doc, CLuceneWrapper.indexName, (error, indexTime, docsReplaced) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'addDocumentAsync', `guid: ${document.guid}; ${error}`));
                    return resolve({ elapsed_time_ms: 0, total_documents_ops: 0 });
                }
                const result = { elapsed_time_ms: indexTime, total_documents_ops: docsReplaced };
                resolve(result);
            });
        });
    }
    deleteDocument(guid) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        const { error, deleteTime, docsDeleted } = this.cl.deleteDocument(guid, CLuceneWrapper.indexName);
        if (error) {
            this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'deleteDocument', `guid: ${guid}; ${error}`));
            return { elapsed_time_ms: 0, total_documents_ops: 0 };
        }
        const result = { elapsed_time_ms: deleteTime, total_documents_ops: docsDeleted };
        return result;
    }
    async deleteDocumentAsync(guid) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        return new Promise((resolve, _) => {
            this.cl.deleteDocumentAsync(guid, CLuceneWrapper.indexName, (error, deleteTime, docsDeleted) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'deleteDocumentAsync', `guid: ${guid}; ${error}`));
                    return resolve({ elapsed_time_ms: 0, total_documents_ops: 0 });
                }
                const result = { elapsed_time_ms: deleteTime, total_documents_ops: docsDeleted };
                resolve(result);
            });
        });
    }
    parseRecognitionData(recognitionData) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        const { error, recognitionText } = this.cl.parseRecognitionData(recognitionData);
        if (error) {
            this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'parseRecognitionData', error));
            return '';
        }
        return recognitionText;
    }
    parseRecognitionDataAsync(recognitionData) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        return new Promise((resolve, _) => {
            this.cl.parseRecognitionDataAsync(recognitionData, (error, recognitionPlainText) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'parseRecognitionDataAsync', error));
                    return resolve('');
                }
                resolve(recognitionPlainText);
            });
        });
    }
    parseENMLAsync(enml) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        return new Promise((resolve, _) => {
            this.cl.parseENMLAsync(enml, (error, searchText) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'parseENMLAsync', error));
                    return resolve('');
                }
                resolve(searchText);
            });
        });
    }
    search(queryWithParams) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        // console.log('search query: ', queryWithParams);
        const { error, result } = this.cl.search('', JSON.stringify(queryWithParams));
        if (error) {
            this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'search', error));
            return en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup();
        }
        return en_search_engine_shared_1.ENCLuceneHelper.createSearchResults(JSON.parse(result));
    }
    async searchAsync(queryWithParams) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        return new Promise((resolve, reject) => {
            this.cl.searchAsync('', JSON.stringify(queryWithParams), (error, result, searchTime) => {
                if (error) {
                    this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'searchAsync', error));
                    return resolve(en_search_engine_shared_1.ENCLuceneHelper.emptySearchResultGroup());
                }
                resolve(en_search_engine_shared_1.ENCLuceneHelper.createSearchResults(JSON.parse(result)));
            });
        });
    }
    suggest(queryWithParams, searchTokens, suggestType) {
        if (!CLuceneWrapper.isValid()) {
            throw new Error('CLucene: unsupported on this platform');
        }
        // console.log('suggest query: ', queryWithParams);
        queryWithParams.stored_fields = ['nbGuid', 'notebook', 'spaceGuid', 'space', 'tagGuid', 'tag', 'creatorId', 'author', 'title', 'stack'];
        const { error, result } = this.cl.search('', JSON.stringify(queryWithParams));
        if (error) {
            this.logger.error(en_search_engine_shared_1.formatSearchEngineException('CLuceneWrapper', 'suggest', error));
            return [];
        }
        return en_search_engine_shared_1.ENCLuceneHelper.createSuggestResults(JSON.parse(result), searchTokens, suggestType);
    }
}
exports.CLuceneWrapper = CLuceneWrapper;
//clucene fields
CLuceneWrapper.indexName = 'search';
//# sourceMappingURL=ENElectronClucene.js.map