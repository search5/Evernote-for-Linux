"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTaskReminder = exports.extractTaskReminderData = void 0;
const conduit_utils_1 = require("conduit-utils");
const ScheduledNotificationConstants_1 = require("../../ScheduledNotificationConstants");
const ScheduledNotificationUtils_1 = require("../../ScheduledNotificationUtils");
const extractTaskReminderData = (id, updated, reminder, task) => {
    var _a;
    const title = task ? (task.label || 'Untitled Task') : ''; // TODO(droth) is this for all falsy task labels?
    const noteID = task && ((_a = conduit_utils_1.firstStashEntry(task.inputs.parent)) === null || _a === void 0 ? void 0 : _a.srcID) || '';
    const sendAt = (reminder === null || reminder === void 0 ? void 0 : reminder.NodeFields.reminderDate) || 0;
    return {
        notification: {
            id,
            body: title,
            clickNotificationActionTarget: noteID,
            clickNotificationActionName: ScheduledNotificationConstants_1.NotificationActionNames.NavigateToNote,
        },
        sendAt,
        updated,
    };
};
exports.extractTaskReminderData = extractTaskReminderData;
const extractTaskReminder = async (trc, graphDB, notificationEntity) => {
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
    const notificationData = exports.extractTaskReminderData(notificationEntity.id, notificationEntity.NodeFields.updated, schedulingEntity, dataSourceEntity);
    return notificationData;
};
exports.extractTaskReminder = extractTaskReminder;
//# sourceMappingURL=index.js.map