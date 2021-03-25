"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationManagerSNUtilityDI = void 0;
const conduit_utils_1 = require("conduit-utils");
const TaskConstants_1 = require("../TaskConstants");
const notificationDataExtractor_1 = require("./notificationDataExtractor");
const ScheduledNotificationUtils_1 = require("./ScheduledNotificationUtils");
function getNotificationIsMute(notification) {
    return notification.NodeFields.mute;
}
exports.notificationManagerSNUtilityDI = {
    getNotificationData: async (trc, graphDB, notificationEntity) => {
        const refs = ScheduledNotificationUtils_1.getDependencyRefsForSN(notificationEntity);
        if (!refs) {
            conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Graph edges for dependencies are missing. Aborting`);
            return null;
        }
        let dataSourceEntity = null;
        const schedulingEntity = await graphDB.getNodeWithoutGraphQLContext(trc, refs.schedulingRef);
        if (refs.schedulingRef.id !== refs.dataSourceRef.id) {
            dataSourceEntity = await graphDB.getNodeWithoutGraphQLContext(trc, refs.dataSourceRef);
        }
        const notificationData = notificationDataExtractor_1.notificationDataExtractor[notificationEntity.NodeFields.scheduledNotificationType].extract(notificationEntity.id, notificationEntity.NodeFields.updated, schedulingEntity, dataSourceEntity);
        return notificationData;
    },
    getScheduledNotifications: async (trc, graphDB) => {
        const ret = {
            muted: [],
            active: [],
        };
        const scheduledNotifications = await graphDB.getGraphNodesByType(trc, null, TaskConstants_1.TaskEntityTypes.ScheduledNotification);
        for (const sn of scheduledNotifications) {
            if (getNotificationIsMute(sn)) {
                ret.muted.push(sn.id);
            }
            else {
                ret.active.push(sn);
            }
        }
        return ret;
    },
    getNotificationIsMute,
};
//# sourceMappingURL=notificationManagerSNUtilityDI.js.map