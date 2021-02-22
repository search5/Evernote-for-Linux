"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchStorageChangeReceiver = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_data_model_1 = require("en-data-model");
const trc = conduit_utils_1.createTraceContext('SearchStorageChangeReceiver');
/**
 * Receives database events and adds them to the SearchProcessor main processing queue.
 */
class SearchStorageChangeReceiver {
    constructor(searchProcessor) {
        this.nodeTables = new Map();
        this.supportedStorageChangeTypes = new Set();
        this.searchProcessor = searchProcessor;
        this.searchProcessor.getSupportedStreamingEventTypes().forEach(supportedType => this.nodeTables.set(conduit_storage_1.tableForNodeType(supportedType), supportedType));
        this.supportedStorageChangeTypes.add(conduit_storage_1.StorageChangeType.Create);
        this.supportedStorageChangeTypes.add(conduit_storage_1.StorageChangeType.Replace);
    }
    isSupportedNodeEvent(event) {
        const tableName = event.path[conduit_storage_1.StorageChangePath.TableName];
        if (tableName && this.nodeTables.has(tableName)) {
            // there's no need to process attachment delete events since the corresponding note change event
            // should be triggered
            const nodeType = this.nodeTables.get(tableName);
            if (nodeType === en_data_model_1.CoreEntityTypes.Attachment && event.type === conduit_storage_1.StorageChangeType.Delete) {
                return false;
            }
            // Task creation / update events are required in order
            // to update the corresponding note if the existing tasks are updated
            if (nodeType === en_conduit_plugin_task_1.TaskEntityTypes.Task) {
                if (this.supportedStorageChangeTypes.has(event.type)) {
                    return true;
                }
                return false;
            }
            return true;
        }
        return false;
    }
    isAttachmentEvent(event) {
        const tableName = event.path[conduit_storage_1.StorageChangePath.TableName];
        if (tableName && tableName === conduit_storage_1.tableForNodeType(en_data_model_1.CoreEntityTypes.Attachment) && this.supportedStorageChangeTypes.has(event.type)) {
            return true;
        }
        return false;
    }
    /**
     * Checks if the input event is the task event. Event conversion is deffered up
     * to the OfflineSearchIndexActivity indexation stage.
     * @param event input event from the conduit storage system
     */
    isTaskEvent(event) {
        const tableName = event.path[conduit_storage_1.StorageChangePath.TableName];
        if (tableName && tableName === conduit_storage_1.tableForNodeType(en_conduit_plugin_task_1.TaskEntityTypes.Task) && this.supportedStorageChangeTypes.has(event.type)) {
            conduit_utils_1.logger.trace(`SearchStorageChangeReceiver: taskEvent ${event.type}`);
            return true;
        }
        return false;
    }
    transformAttachmentEvent(event) {
        const storageChangeValueEvent = event;
        const attachmentNode = storageChangeValueEvent.value;
        const edge = conduit_utils_1.firstStashEntry(attachmentNode.inputs.parent);
        if ((edge === null || edge === void 0 ? void 0 : edge.srcType) === en_data_model_1.CoreEntityTypes.Note) {
            const noteID = edge.srcID;
            conduit_utils_1.logger.trace(`SearchStorageChangeReceiver: transformed attachment: ${attachmentNode.id} event to note event: ${noteID}`);
            return { nodeRef: { id: noteID, type: en_data_model_1.CoreEntityTypes.Note }, localTimestamp: Date.now(), eventType: conduit_storage_1.StorageChangeType.Replace };
        }
        return null;
    }
    transformTaskEvent(event) {
        const storageChangeValueEvent = event;
        const taskNode = storageChangeValueEvent.value;
        const edge = conduit_utils_1.firstStashEntry(taskNode.inputs.parent);
        if ((edge === null || edge === void 0 ? void 0 : edge.srcType) === en_data_model_1.CoreEntityTypes.Note) {
            const noteID = edge.srcID;
            conduit_utils_1.logger.trace(`SearchStorageChangeReceiver: transformed task: ${taskNode.id} event to note event: ${noteID}`);
            return { nodeRef: { id: noteID, type: en_data_model_1.CoreEntityTypes.Note }, localTimestamp: Date.now(), eventType: conduit_storage_1.StorageChangeType.Replace };
        }
        return null;
    }
    isSupportedStorageChangeValueEvent(event, table, key, value) {
        const tableName = event.path[conduit_storage_1.StorageChangePath.TableName];
        if (tableName && tableName === table && event.path[conduit_storage_1.StorageChangePath.Key] === key && this.supportedStorageChangeTypes.has(event.type)) {
            const storageChangeValueEvent = event;
            if (!value) {
                conduit_utils_1.logger.debug('SearchStorageChangeReceiver: event: ' + event.type + '; value: no value');
                return true;
            }
            if (storageChangeValueEvent.value === value) {
                conduit_utils_1.logger.debug('SearchStorageChangeReceiver: event: ' + event.type + ';');
                return true;
            }
        }
        return false;
    }
    /**
     * Main event handling function. Filters relevant events, adds them to the search processor queue
     * @param events external database events
     */
    async handleChangeEvents(events) {
        const receiveDate = Date.now();
        const results = new Array();
        for (const event of events) {
            // checks if it's a logout event
            if (this.isSupportedStorageChangeValueEvent(event, 'Auth', 'AuthState', conduit_view_types_1.AuthState.NoAuth)) {
                await this.searchProcessor.processLogoutEvent(trc);
            }
            // filters only relevant events
            if (this.isSupportedNodeEvent(event)) {
                if (this.isAttachmentEvent(event)) {
                    const noteEvent = this.transformAttachmentEvent(event);
                    if (noteEvent) {
                        results.push(noteEvent);
                        continue;
                    }
                }
                if (this.isTaskEvent(event)) {
                    const noteEvent = this.transformTaskEvent(event);
                    if (noteEvent) {
                        results.push(noteEvent);
                        continue;
                    }
                }
                results.push({
                    nodeRef: { id: event.path[conduit_storage_1.StorageChangePath.Key], type: this.nodeTables.get(event.path[conduit_storage_1.StorageChangePath.TableName]) },
                    localTimestamp: receiveDate,
                    eventType: event.type,
                });
            }
        }
        // passes them to the search processor
        if (results.length !== 0) {
            await this.searchProcessor.processEvents(trc, results);
        }
    }
}
exports.SearchStorageChangeReceiver = SearchStorageChangeReceiver;
//# sourceMappingURL=SearchStorageChangeReceiver.js.map