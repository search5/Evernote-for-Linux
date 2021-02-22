"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENSchedulerPlugin = void 0;
const conduit_utils_1 = require("conduit-utils");
const ScheduledNotificationStorageChangeReceiver_1 = require("./ScheduledNotificationStorageChangeReceiver");
function getENSchedulerPlugin() {
    return {
        name: 'ENScheduler',
        defineStorageAccess: async (graphDB) => {
            const notificationManager = graphDB.getNotificationManager();
            if (!notificationManager) {
                conduit_utils_1.logger.warn('Notification manager not found, ScheduledNotificationStorageChangeReceiver will not be registered.');
                return;
            }
            const scheduledNotificationStorageChangeReceiver = new ScheduledNotificationStorageChangeReceiver_1.ScheduledNotificationStorageChangeReceiver(notificationManager, graphDB);
            graphDB.addChangeHandler(scheduledNotificationStorageChangeReceiver);
        },
    };
}
exports.getENSchedulerPlugin = getENSchedulerPlugin;
//# sourceMappingURL=index.js.map