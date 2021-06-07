"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchTransformer = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchUtils_1 = require("../SearchUtils");
const SearchExtractorTypes_1 = require("./SearchExtractorTypes");
/**
 * Performs the second stage of the ETL pipeline. Transforms external GraphDB representation to the search engine one.
 */
class SearchTransformer {
    transformTags(tagNodes) {
        const labels = new Array();
        const tagGuids = new Array();
        if (tagNodes) {
            for (const tagNode of tagNodes) {
                if (tagNode) {
                    labels.push(tagNode.label);
                    tagGuids.push(en_thrift_connector_1.convertGuidToService(tagNode.id, en_core_entity_types_1.CoreEntityTypes.Tag));
                }
            }
        }
        return { labels, tagGuids };
    }
    getNoteIds(edges, checkSrcType) {
        const noteIDs = [];
        for (const edgeKey in edges) {
            const edge = edges[edgeKey];
            if (checkSrcType) {
                if ((edge === null || edge === void 0 ? void 0 : edge.srcType) === en_core_entity_types_1.CoreEntityTypes.Note) {
                    const noteID = edge.srcID;
                    noteIDs.push(noteID);
                }
            }
            else {
                if ((edge === null || edge === void 0 ? void 0 : edge.dstType) === en_core_entity_types_1.CoreEntityTypes.Note) {
                    const noteID = edge.dstID;
                    noteIDs.push(noteID);
                }
            }
        }
        return noteIDs;
    }
    transformTagEvent(event) {
        if (event.data) {
            const tguid = en_thrift_connector_1.convertGuidToService(event.data.id, en_core_entity_types_1.CoreEntityTypes.Tag);
            const tag = {
                guid: tguid,
                content: event.data.label,
            };
            let noteGuids = this.getNoteIds(event.data.inputs.refs, true);
            noteGuids = noteGuids.concat(this.getNoteIds(event.data.inputs.refsInTrash, true));
            return { guid: tguid, eventType: SearchUtils_1.SearchStorageEventType.INDEX, document: tag, documentType: en_search_engine_shared_1.ENDocumentType.TAG, noteGuids };
        }
        return undefined;
    }
    transformNotebookEvent(event) {
        if (event.data) {
            const tguid = en_thrift_connector_1.convertGuidToService(event.data.id, en_core_entity_types_1.CoreEntityTypes.Notebook);
            const notebook = {
                guid: tguid,
                content: event.data.label,
            };
            let noteGuids = this.getNoteIds(event.data.outputs.children, false);
            noteGuids = noteGuids.concat(this.getNoteIds(event.data.outputs.childrenInTrash, false));
            return { guid: tguid, eventType: SearchUtils_1.SearchStorageEventType.INDEX, document: notebook, documentType: en_search_engine_shared_1.ENDocumentType.NOTEBOOK, noteGuids };
        }
        return undefined;
    }
    transformWorkspaceEvent(event) {
        if (event.data) {
            const tguid = en_thrift_connector_1.convertGuidToService(event.data.id, en_core_entity_types_1.CoreEntityTypes.Workspace);
            const workspace = {
                guid: tguid,
                content: event.data.label,
            };
            return { guid: tguid, eventType: SearchUtils_1.SearchStorageEventType.INDEX, document: workspace, documentType: en_search_engine_shared_1.ENDocumentType.WORKSPACE };
        }
        return undefined;
    }
    transformStackEvent(event) {
        if (event.data) {
            const stack = {
                content: event.data.label,
            };
            return { eventType: SearchUtils_1.SearchStorageEventType.INDEX, document: stack, documentType: en_search_engine_shared_1.ENDocumentType.STACK };
        }
        return undefined;
    }
    transformNotebook(containerInfo) {
        if (!containerInfo || !containerInfo.notebook) {
            return undefined;
        }
        return { notebookGuid: en_thrift_connector_1.convertGuidToService(containerInfo.notebook.id, en_core_entity_types_1.CoreEntityTypes.Notebook), label: containerInfo.notebook.label };
    }
    transformWorkspace(containerInfo) {
        if (!containerInfo || !containerInfo.workspace) {
            return undefined;
        }
        return { workspaceGuid: en_thrift_connector_1.convertGuidToService(containerInfo.workspace.id, en_core_entity_types_1.CoreEntityTypes.Workspace), workspace: containerInfo.workspace.label };
    }
    transformAttachment(attachment, transformedAttachments) {
        if (attachment.recognitionData) {
            transformedAttachments.recognitionDatas.push(attachment.recognitionData);
        }
        transformedAttachments.mimes.push(attachment.mime);
        transformedAttachments.filenames.push(attachment.filename);
    }
    transformAttachments(attachments) {
        const transformedAttachments = { recognitionDatas: [], filenames: [], mimes: [] };
        if (!attachments) {
            return transformedAttachments;
        }
        for (const attachment of attachments) {
            if (attachment) {
                this.transformAttachment(attachment, transformedAttachments);
            }
        }
        return transformedAttachments;
    }
    transformTask(task) {
        return {
            content: task.label,
            completed: task.taskCompleted,
        };
    }
    transformTasks(tasks) {
        if (!tasks) {
            return undefined;
        }
        const transformedTasks = new Array();
        for (const task of tasks) {
            transformedTasks.push(this.transformTask(task));
        }
        return transformedTasks;
    }
    async transformNote(event) {
        var _a, _b;
        if (event.data) {
            const noteNode = event.data.shift();
            // transforms attachments
            const attachments = this.transformAttachments(event.attachments);
            // transforms notebook
            const notebook = this.transformNotebook(event.containerInfo);
            // transforms workspace
            const workspace = this.transformWorkspace(event.containerInfo);
            // transforms tags
            const tags = this.transformTags(event.tags);
            const tguid = en_thrift_connector_1.convertGuidToService(noteNode.id, en_core_entity_types_1.CoreEntityTypes.Note);
            const creatorId = event.creatorId ? en_thrift_connector_1.convertGuidToService(event.creatorId, en_core_entity_types_1.CoreEntityTypes.Profile) : undefined;
            const lastEditorId = event.lastEditorId ? en_thrift_connector_1.convertGuidToService(event.lastEditorId, en_core_entity_types_1.CoreEntityTypes.Profile) : undefined;
            const document = {
                guid: tguid,
                content: (_a = event.enmlContent) !== null && _a !== void 0 ? _a : '',
                type: en_search_engine_shared_1.ENDocumentType.NOTE,
                version: 0,
                active: !noteNode.NodeFields.deleted,
                tags: tags.labels,
                tagGuids: tags.tagGuids,
                notebook: notebook === null || notebook === void 0 ? void 0 : notebook.label,
                notebookGuid: notebook === null || notebook === void 0 ? void 0 : notebook.notebookGuid,
                stack: (_b = event.containerInfo) === null || _b === void 0 ? void 0 : _b.stack,
                space: workspace === null || workspace === void 0 ? void 0 : workspace.workspace,
                spaceGuid: workspace === null || workspace === void 0 ? void 0 : workspace.workspaceGuid,
                resourceFileNames: attachments.filenames,
                resourceMimes: attachments.mimes,
                resourceRecoTopTexts: attachments.recognitionDatas,
                created: event.created,
                updated: event.updated,
                title: event.title,
                subjectDate: event.subjectDate,
                author: event.author,
                creatorId,
                lastEditorId,
                source: event.source,
                sourceApplication: event.sourceApplication,
                sourceURL: event.sourceURL,
                contentClass: event.contentClass,
                reminderOrder: event.reminderOrder,
                reminderTime: event.reminderTime,
                reminderDoneTime: event.reminderDoneTime,
                tasks: this.transformTasks(event.tasks),
            };
            conduit_utils_1.logger.trace('SearchTransfomer: note: documentID: ' + document.guid + '; version: ' + document.version);
            return { guid: tguid, document, documentType: en_search_engine_shared_1.ENDocumentType.NOTE, eventType: SearchUtils_1.SearchStorageEventType.INDEX };
        }
        return null;
    }
    async transformMessage(event) {
        if (event.data) {
            const messageNode = event.data.shift();
            // TODO the "as any" cast below is because a refactor exposed a type problem here; tguid for a message is a number but is getting shoved
            // into a field that is supposed to be a string. Search team needs to fix this.
            const tguid = en_thrift_connector_1.convertGuidToService(messageNode.id, en_core_entity_types_1.CoreEntityTypes.Message);
            const document = {
                guid: tguid, content: messageNode.label, type: en_search_engine_shared_1.ENDocumentType.MESSAGE, version: 0, active: true,
            };
            conduit_utils_1.logger.trace('SearchTransformer: message: documentID:' + document.guid + '; version: ' + document.version);
            return { guid: tguid, document, documentType: en_search_engine_shared_1.ENDocumentType.MESSAGE, eventType: SearchUtils_1.SearchStorageEventType.INDEX };
        }
        return null;
    }
    async processIndexEvent(event) {
        switch (event.extractionEventType) {
            case SearchExtractorTypes_1.SearchStorageExtractionEventDocumentType.TAG:
                return this.transformTagEvent(event);
            case SearchExtractorTypes_1.SearchStorageExtractionEventDocumentType.NOTEBOOK:
                return this.transformNotebookEvent(event);
            case SearchExtractorTypes_1.SearchStorageExtractionEventDocumentType.STACK:
                return this.transformStackEvent(event);
            case SearchExtractorTypes_1.SearchStorageExtractionEventDocumentType.WORKSPACE:
                return this.transformWorkspaceEvent(event);
            case SearchExtractorTypes_1.SearchStorageExtractionEventDocumentType.MESSAGE:
                return this.transformMessage(event);
            case SearchExtractorTypes_1.SearchStorageExtractionEventDocumentType.NOTE:
                return await this.transformNote(event);
            default:
                conduit_utils_1.logger.error(`SearchTransformer: processIndexEvent: unknown SearchStorageExtractionEventDocumentType`);
        }
    }
    async processDeleteEvent(event) {
        const tguid = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
        const inputDocumentType = SearchUtils_1.SearchTypeConversions.NODE_TYPE_TO_DOCUMENT_TYPE.get(event.nodeRef.type);
        let documentType;
        switch (inputDocumentType) {
            case en_search_engine_shared_1.ENDocumentType.TAG:
            case en_search_engine_shared_1.ENDocumentType.NOTEBOOK:
            case en_search_engine_shared_1.ENDocumentType.STACK:
            case en_search_engine_shared_1.ENDocumentType.WORKSPACE:
            case en_search_engine_shared_1.ENDocumentType.MESSAGE:
                documentType = inputDocumentType;
                break;
            default:
                documentType = en_search_engine_shared_1.ENDocumentType.NOTE;
        }
        return { guid: tguid, eventType: SearchUtils_1.SearchStorageEventType.DELETE, documentType };
    }
    /**
     * Processes input event from the search extractor. Transforms external represenation to the search engine one.
     * @param events the search extractor output events
     */
    async process(events) {
        const results = new Array();
        for (const event of events) {
            if (event.eventType === conduit_storage_1.StorageChangeType.Delete) {
                const transformResult = await this.processDeleteEvent(event);
                results.push(transformResult);
            }
            else {
                const transformResult = await this.processIndexEvent(event);
                if (transformResult) {
                    results.push(transformResult);
                }
            }
        }
        return results;
    }
}
exports.SearchTransformer = SearchTransformer;
//# sourceMappingURL=SearchTransformer.js.map