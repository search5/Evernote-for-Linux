"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchTransformer = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_search_engine_shared_1 = require("en-search-engine-shared");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchUtils_1 = require("../SearchUtils");
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
                    tagGuids.push(en_thrift_connector_1.convertGuidToService(tagNode.id, en_data_model_1.CoreEntityTypes.Tag));
                }
            }
        }
        return { labels, tagGuids };
    }
    transformNotebook(containerInfo) {
        if (!containerInfo || !containerInfo.notebook) {
            return undefined;
        }
        return { notebookGuid: en_thrift_connector_1.convertGuidToService(containerInfo.notebook.id, en_data_model_1.CoreEntityTypes.Notebook), label: containerInfo.notebook.label };
    }
    transformWorkspace(containerInfo) {
        if (!containerInfo || !containerInfo.workspace) {
            return undefined;
        }
        return { workspaceGuid: en_thrift_connector_1.convertGuidToService(containerInfo.workspace.id, en_data_model_1.CoreEntityTypes.Workspace), workspace: containerInfo.workspace.label };
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
            const tguid = en_thrift_connector_1.convertGuidToService(noteNode.id, en_data_model_1.CoreEntityTypes.Note);
            const creatorId = event.creatorId ? en_thrift_connector_1.convertGuidToService(event.creatorId, en_data_model_1.CoreEntityTypes.Profile) : undefined;
            const lastEditorId = event.lastEditorId ? en_thrift_connector_1.convertGuidToService(event.lastEditorId, en_data_model_1.CoreEntityTypes.Profile) : undefined;
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
            const eventType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
            return { guid: tguid, type: eventType, document };
        }
        return null;
    }
    async transformMessage(event) {
        if (event.data) {
            const messageNode = event.data.shift();
            // TODO the "as any" cast below is because a refactor exposed a type problem here; tguid for a message is a number but is getting shoved
            // into a field that is supposed to be a string. Search team needs to fix this.
            const tguid = en_thrift_connector_1.convertGuidToService(messageNode.id, en_data_model_1.CoreEntityTypes.Message);
            const document = {
                guid: tguid, content: messageNode.label, type: en_search_engine_shared_1.ENDocumentType.MESSAGE, version: 0, active: true,
            };
            conduit_utils_1.logger.trace('SearchTransformer: message: documentID:' + document.guid + '; version: ' + document.version);
            const eventType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
            return { guid: tguid, type: eventType, document };
        }
        return null;
    }
    /**
     * Processes input event from the search extractor. Transforms external represenation to the search engine one.
     * @param events the search extractor output events
     */
    async process(events) {
        const results = new Array();
        for (const event of events) {
            if (event.eventType === conduit_storage_1.StorageChangeType.Delete) {
                const tguid = en_thrift_connector_1.convertGuidToService(event.nodeRef.id, event.nodeRef.type);
                const eventType = SearchUtils_1.SearchTypeConversions.STORAGE_CHANGE_TYPE_TO_SEARCH_STORAGE_EVENT_TYPE.get(event.eventType);
                results.push({ guid: tguid, type: eventType });
            }
            else {
                const transformResult = event.nodeRef.type === en_data_model_1.CoreEntityTypes.Note ? await this.transformNote(event) : await this.transformMessage(event);
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