"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchExtractor = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_core_entity_types_1 = require("en-core-entity-types");
/**
 * First stage of the search ETL pipeline. Extracts required information from the external storage (GraphDB).
 */
class SearchExtractor {
    constructor(graphDB) {
        this.noteContentField = 'content.content';
        this.recognitionField = 'recognition.content';
        this.graphDB = graphDB;
    }
    async extractContainerInfo(trc, noteNode) {
        let notebook = null;
        let workspace = null;
        let stackName;
        const edge = conduit_utils_1.firstStashEntry(noteNode.inputs.parent);
        if (edge) {
            if (edge.srcType === en_core_entity_types_1.CoreEntityTypes.Notebook) {
                const notebookNodeRef = { id: edge.srcID, type: en_core_entity_types_1.CoreEntityTypes.Notebook };
                notebook = (await this.graphDB.getNodeWithoutGraphQLContext(trc, notebookNodeRef));
                // extact stack
                const stackEdge = conduit_utils_1.firstStashEntry(notebook === null || notebook === void 0 ? void 0 : notebook.inputs.stack);
                if (stackEdge && stackEdge.srcType === en_core_entity_types_1.CoreEntityTypes.Stack) {
                    const stackNodeRef = { id: stackEdge.srcID, type: en_core_entity_types_1.CoreEntityTypes.Stack };
                    const stack = (await this.graphDB.getNodeWithoutGraphQLContext(trc, stackNodeRef));
                    if (stack) {
                        stackName = stack.label;
                    }
                }
            }
            if (edge.srcType === en_core_entity_types_1.CoreEntityTypes.Workspace) {
                const workspaceNodeRef = { id: edge.srcID, type: en_core_entity_types_1.CoreEntityTypes.Workspace };
                workspace = (await this.graphDB.getNodeWithoutGraphQLContext(trc, workspaceNodeRef));
            }
        }
        return { notebook, workspace, stack: stackName };
    }
    async extractTags(trc, noteNode) {
        const tags = new Array();
        for (const tag in noteNode.outputs.tags) {
            const tagEdge = noteNode.outputs.tags[tag];
            const tagNodeRef = { id: tagEdge.dstID, type: en_core_entity_types_1.CoreEntityTypes.Tag };
            const tagNode = (await this.graphDB.getNodeWithoutGraphQLContext(trc, tagNodeRef));
            tags.push(tagNode);
        }
        return tags;
    }
    async extractCachedField(trc, nodeRef, field) {
        const cached = await this.graphDB.getNodeCachedFieldRaw(trc, nodeRef, field);
        let data;
        if (cached && cached.node) {
            data = cached.values[field];
        }
        return data;
    }
    async extractAttachment(trc, attachmentID) {
        const attachmentNodeRef = { id: attachmentID, type: en_core_entity_types_1.CoreEntityTypes.Attachment };
        const attachmentNode = await this.graphDB.getNodeWithoutGraphQLContext(trc, attachmentNodeRef);
        if (!attachmentNode) {
            return undefined;
        }
        const recognitionData = await this.extractCachedField(trc, attachmentNodeRef, this.recognitionField);
        const filename = attachmentNode.NodeFields.filename;
        const mime = attachmentNode.NodeFields.mime;
        conduit_utils_1.logger.trace(`SearchExtractor: extractAttachment: id: ${attachmentNodeRef.id}; recognitionData length: ${recognitionData === null || recognitionData === void 0 ? void 0 : recognitionData.length}; filename length: ${filename.length};`);
        return { recognitionData, filename, mime };
    }
    async extractAttachments(trc, noteNode) {
        const attachments = new Array();
        let recognitionResourceFiles = 0;
        for (const attachment in noteNode.outputs.attachments) {
            if (recognitionResourceFiles >= SearchExtractor.maxRecognitionFilesPerNote) {
                break;
            }
            const attachmentEdge = noteNode.outputs.attachments[attachment];
            const extractedAttachment = await this.extractAttachment(trc, attachmentEdge.dstID);
            if (!extractedAttachment) {
                continue;
            }
            recognitionResourceFiles += 1;
            attachments.push(extractedAttachment);
        }
        return attachments;
    }
    async extractTask(trc, taskID) {
        const taskNodeRef = { id: taskID, type: en_conduit_plugin_task_1.TaskEntityTypes.Task };
        const taskNode = await this.graphDB.getNodeWithoutGraphQLContext(trc, taskNodeRef);
        if (!taskNode) {
            return undefined;
        }
        return {
            label: taskNode.label,
            taskCompleted: taskNode.NodeFields.status === 'completed',
        };
    }
    async extractTasks(trc, noteNode) {
        const tasks = new Array();
        let extractedTasks = 0;
        for (const task in noteNode.outputs.tasks) {
            if (extractedTasks >= SearchExtractor.maxTasksPerNote) {
                break;
            }
            const taskEdge = noteNode.outputs.tasks[task];
            const extractedTask = await this.extractTask(trc, taskEdge.dstID);
            if (!extractedTask) {
                continue;
            }
            extractedTasks += 1;
            tasks.push(extractedTask);
        }
        return tasks;
    }
    async extractNote(trc, event) {
        const noteNode = await this.graphDB.getNodeWithoutGraphQLContext(trc, event.nodeRef);
        if (noteNode) {
            conduit_utils_1.logger.trace('SearchExtractor: note id: ' + event.nodeRef.id + ';');
            // extract notebook
            const containerInfo = await this.extractContainerInfo(trc, noteNode);
            // extract tags
            const tags = await this.extractTags(trc, noteNode);
            // extract attachments
            const attachments = await this.extractAttachments(trc, noteNode);
            // extract creatorId
            const cEdge = noteNode && conduit_utils_1.firstStashEntry(noteNode.outputs.creator);
            const creatorId = cEdge ? cEdge.dstID : undefined;
            // extract lastEditorId (note: when user edits his own note, lEdge will be undefined)
            const lEdge = noteNode && conduit_utils_1.firstStashEntry(noteNode.outputs.lastEditor);
            const lastEditorId = lEdge ? lEdge.dstID : undefined;
            // extract tasks
            const tasks = await this.extractTasks(trc, noteNode);
            // extract cached note content if it's downloaded
            const cached = await this.graphDB.getNodeCachedFieldRaw(trc, event.nodeRef, this.noteContentField);
            return {
                nodeRef: event.nodeRef,
                localTimestamp: event.localTimestamp,
                eventType: event.eventType,
                data: [noteNode],
                enmlContent: cached ? cached.values[this.noteContentField] : undefined,
                containerInfo,
                tags,
                attachments,
                created: noteNode.NodeFields.created,
                updated: noteNode.NodeFields.updated,
                title: noteNode.label,
                subjectDate: noteNode.NodeFields.Attributes.subjectDate || undefined,
                author: noteNode.NodeFields.Attributes.Editor.author || undefined,
                creatorId,
                lastEditorId,
                source: noteNode.NodeFields.Attributes.Source.source || undefined,
                sourceApplication: noteNode.NodeFields.Attributes.Source.sourceApplication || undefined,
                sourceURL: noteNode.NodeFields.Attributes.Source.sourceURL || undefined,
                contentClass: noteNode.NodeFields.Attributes.contentClass || undefined,
                reminderOrder: noteNode.NodeFields.Attributes.Reminder.reminderOrder || undefined,
                reminderTime: noteNode.NodeFields.Attributes.Reminder.reminderTime || undefined,
                reminderDoneTime: noteNode.NodeFields.Attributes.Reminder.reminderDoneTime || undefined,
                tasks,
            };
        }
        return null;
    }
    /**
     * Extracts message information.
     * @param event database event with the timestamp.
     */
    async extractMessage(trc, event) {
        const messageNode = await this.graphDB.getNodeWithoutGraphQLContext(trc, event.nodeRef);
        if (messageNode) {
            conduit_utils_1.logger.trace('SearchExtractor: message id: ' + event.nodeRef.id + ';');
            return {
                nodeRef: event.nodeRef,
                localTimestamp: event.localTimestamp,
                eventType: event.eventType,
                data: [messageNode],
            };
        }
        return null;
    }
    /**
     * Extracts current userID.
     *
     * If it's not set, returns null. This method is required to perform login/logout processing.
     */
    async extractUserId(trc) {
        const userNode = await this.graphDB.getNodeWithoutGraphQLContext(trc, { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User });
        if (userNode) {
            return userNode.NodeFields.internal_userID;
        }
        return null;
    }
    /**
     * Processes input event batch.
     *
     * If it's create/replace note event, tries to extract note content.
     * Otherwise simply adds the same event to the output queue.
     * @param events database events with the timestamps.
     */
    async process(trc, events) {
        const results = new Array();
        while (events.length !== 0) {
            const event = events.shift();
            const eventType = event === null || event === void 0 ? void 0 : event.eventType;
            switch (eventType) {
                case conduit_storage_1.StorageChangeType.Undo:
                    break;
                case conduit_storage_1.StorageChangeType.Delete:
                    results.push(event);
                    break;
                default:
                    const result = event.nodeRef.type === en_core_entity_types_1.CoreEntityTypes.Note ? await this.extractNote(trc, event) : await this.extractMessage(trc, event);
                    if (result) {
                        results.push(result);
                    }
                    break;
            }
        }
        return results;
    }
    /**
     * Returns all supported ids from the external database.
     *
     * This method is required in order to perform the initial diff between search engine index and the external datbase.
     */
    async getIds(trc, supportedTypes) {
        const idsByType = new Map();
        const allIds = new Set();
        for (const supportedType of supportedTypes) {
            const nodeRefs = await this.graphDB.getGraphNodeRefsByType(trc, null, supportedType);
            const ids = new Array();
            for (const nodeRef of nodeRefs) {
                ids.push(nodeRef.id);
                allIds.add(nodeRef.id);
            }
            idsByType.set(supportedType, ids);
        }
        return { idsByType, allIds };
    }
}
exports.SearchExtractor = SearchExtractor;
SearchExtractor.maxRecognitionFilesPerNote = 10;
SearchExtractor.maxTasksPerNote = 1000;
//# sourceMappingURL=SearchExtractor.js.map