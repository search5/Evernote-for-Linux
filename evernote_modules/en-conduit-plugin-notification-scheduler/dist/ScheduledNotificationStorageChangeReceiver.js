"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledNotificationStorageChangeReceiver = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_data_model_1 = require("en-data-model");
const gTrcPool = new conduit_utils_1.AsyncTracePool('ScheduledNotificationStorageChangeReceiver');
/**
 * Receives StorageChangeEvents emitted by the graphDB, and calls the appropriate operations
 * on the NotificationManager based on changes to ScheduledNotification entities
 */
class ScheduledNotificationStorageChangeReceiver {
    constructor(notificationManager, graphDB) {
        this.notificationManager = notificationManager;
        this.graphDB = graphDB;
        const watchedEventTypes = [conduit_storage_1.StorageChangeType.Create, conduit_storage_1.StorageChangeType.Replace, conduit_storage_1.StorageChangeType.Delete];
        this.eventFilter = new conduit_storage_1.StorageChangeEventFilter(watchedEventTypes, [en_data_model_1.EntityTypes.ScheduledNotification]);
    }
    /**
     * Processes the storage change events for the purposes of scheduling, updating, and
     * unscheduling local notifications.  Listens only to ScheduledNotification node events.
     * @param events StorageChangeEvents[]
     */
    handleChangeEvents(events, onCompletion = () => undefined) {
        this.handleChangeEventsAsync(events)
            .then(onCompletion)
            .catch(async (e) => {
            conduit_utils_1.logger.error('ScheduledNotificationStorageChangeReceiver -- Error occurred during async handling of change events', e);
            await gTrcPool.runTraced(null, async (trc) => {
                const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, this.graphDB);
                if (notificationLogsEnabled) {
                    conduit_utils_1.recordMetric({
                        name: 'LOCAL_NOTIFICATION_LOG',
                        date: Date.now(),
                        duration: 0,
                        error: `ScheduledNotificationStorageChangeReceiver -- Error occurred during async handling of change events`,
                        errorMessage: e.message,
                    });
                }
            });
        });
    }
    async handleChangeEventsAsync(events) {
        for (const event of events) {
            if (this.eventFilter.isSupportedNodeEvent(event)) {
                switch (event.type) {
                    case conduit_storage_1.StorageChangeType.Create:
                    case conduit_storage_1.StorageChangeType.Replace:
                    case conduit_storage_1.StorageChangeType.Delete:
                        const notificationId = event.path[conduit_storage_1.StorageChangePath.Key];
                        await this.storageEventTriggeredForEntity(notificationId);
                        break;
                    default:
                        throw new Error(`Unsupported storage change event type: ${event.type}`);
                }
            }
        }
    }
    async storageEventTriggeredForEntity(id) {
        await gTrcPool.runTraced(null, async (trc) => {
            const sn = await this.graphDB.getNodeWithoutGraphQLContext(trc, { type: en_data_model_1.EntityTypes.ScheduledNotification, id });
            if (!sn) {
                // SN not found - treat as deleted
                await this.notificationManager.deleteNotification(trc, id);
            }
            else {
                // Use latest data to perform an upsert
                conduit_utils_1.logger.info(`ScheduledNotificationStorageChangeReceiver -- Attempting to upsert notification entity with id ${sn.id}`);
                const data = await this.notificationManager.upsertNotification(trc, this.graphDB, sn);
                if (data && data.warn) {
                    const message = data.warn;
                    conduit_utils_1.logger.warn(message);
                    const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, this.graphDB);
                    if (notificationLogsEnabled) {
                        conduit_utils_1.recordMetric({
                            name: 'LOCAL_NOTIFICATION_LOG',
                            date: Date.now(),
                            duration: 0,
                            error: message,
                        });
                    }
                }
            }
        });
    }
}
exports.ScheduledNotificationStorageChangeReceiver = ScheduledNotificationStorageChangeReceiver;
//# sourceMappingURL=ScheduledNotificationStorageChangeReceiver.js.map