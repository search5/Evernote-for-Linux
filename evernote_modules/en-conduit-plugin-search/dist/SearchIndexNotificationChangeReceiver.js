"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndexNotificationChangeReceiver = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_core_entity_types_1 = require("en-core-entity-types");
/**
 * Receives database events and send notification when online index is updated.
 */
class SearchIndexNotificationChangeReceiver {
    constructor(di) {
        this.di = di;
        // delay to allow complete online indexing
        this.onlineIndexingDelayMilliseconds = 30000;
        this.minIntervalBetweenNotificationsMilliseconds = 2000;
        this.waitForMinIntervalBetweenNotifications = false;
        const supportedStorageChangeTypes = [conduit_storage_1.StorageChangeType.Create, conduit_storage_1.StorageChangeType.Replace, conduit_storage_1.StorageChangeType.Delete];
        const supportedStreamingEventTypes = [en_core_entity_types_1.CoreEntityTypes.Attachment, en_core_entity_types_1.CoreEntityTypes.Message, en_core_entity_types_1.CoreEntityTypes.Note, en_core_entity_types_1.CoreEntityTypes.Notebook, en_core_entity_types_1.CoreEntityTypes.Tag,
            en_conduit_plugin_task_1.TaskEntityTypes.Task, en_core_entity_types_1.CoreEntityTypes.Stack, en_core_entity_types_1.CoreEntityTypes.Workspace];
        this.eventFilter = new conduit_storage_1.StorageChangeEventFilter(supportedStorageChangeTypes, supportedStreamingEventTypes);
    }
    sendNotificationWithDelay() {
        setTimeout(() => {
            this.di.emitEvent(conduit_view_types_1.ConduitEvent.SEARCH_INDEX_UPDATED);
        }, this.onlineIndexingDelayMilliseconds);
    }
    async handleChangeEvents(events) {
        if (this.waitForMinIntervalBetweenNotifications) {
            return;
        }
        let needSendNotification = false;
        for (const event of events) {
            if (this.eventFilter.isSupportedNodeEvent(event)) {
                needSendNotification = true;
                break;
            }
        }
        if (needSendNotification) {
            this.sendNotificationWithDelay();
            this.waitForMinIntervalBetweenNotifications = true;
            setTimeout(() => {
                this.waitForMinIntervalBetweenNotifications = false;
            }, this.minIntervalBetweenNotificationsMilliseconds);
        }
    }
}
exports.SearchIndexNotificationChangeReceiver = SearchIndexNotificationChangeReceiver;
//# sourceMappingURL=SearchIndexNotificationChangeReceiver.js.map