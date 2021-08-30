"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTaskReminder = exports.extractTaskReminderData = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_notifications_data_model_1 = require("en-notifications-data-model");
const en_notifications_templates_1 = require("en-notifications-templates");
const en_tasks_data_model_1 = require("en-tasks-data-model");
const ScheduledNotificationUtils_1 = require("../../ScheduledNotificationUtils");
const const_1 = require("../shared/const");
const locale_1 = require("../shared/locale");
const notificationTemplateUtils_1 = require("../shared/notificationTemplateUtils");
const mapDueDateOption = new Map();
mapDueDateOption.set(en_tasks_data_model_1.DueDateUIOption.date_only, en_notifications_templates_1.DueDateUIOption.Date);
mapDueDateOption.set(en_tasks_data_model_1.DueDateUIOption.date_time, en_notifications_templates_1.DueDateUIOption.DateTime);
const extractTaskReminderData = (id, updated, reminder, task, locale = const_1.DEFAULT_LOCALE) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!task) {
        conduit_utils_1.logger.error(`taskID is not set for node ${id} reminder ${reminder === null || reminder === void 0 ? void 0 : reminder.id}`);
    }
    const dueDateUIOption = (_a = task === null || task === void 0 ? void 0 : task.NodeFields) === null || _a === void 0 ? void 0 : _a.dueDateUIOption;
    const mapDueDate = dueDateUIOption ? mapDueDateOption.get(dueDateUIOption) : undefined;
    const systemNotificationData = en_notifications_templates_1.createSystemNotificationData({
        notificationId: id,
        notificationType: en_notifications_templates_1.SystemNotificationType.TaskReminder,
        srcData: {
            taskID: (_b = task === null || task === void 0 ? void 0 : task.id) !== null && _b !== void 0 ? _b : '',
            title: (_c = task === null || task === void 0 ? void 0 : task.label) !== null && _c !== void 0 ? _c : '',
            dueDate: (_e = (_d = task === null || task === void 0 ? void 0 : task.NodeFields) === null || _d === void 0 ? void 0 : _d.dueDate) !== null && _e !== void 0 ? _e : null,
            dueDateUIOption: mapDueDate !== null && mapDueDate !== void 0 ? mapDueDate : null,
        },
        locale,
        logger: conduit_utils_1.logger,
    });
    const sendAt = ((_f = reminder === null || reminder === void 0 ? void 0 : reminder.NodeFields) === null || _f === void 0 ? void 0 : _f.reminderDate) || 0;
    const metadata = {
        notificationType: en_notifications_data_model_1.ScheduledNotificationType.TaskReminder,
        schedulingEntityID: (_g = reminder === null || reminder === void 0 ? void 0 : reminder.id) !== null && _g !== void 0 ? _g : null,
        dataSourceEntityID: (_h = task === null || task === void 0 ? void 0 : task.id) !== null && _h !== void 0 ? _h : null,
        target: (_j = task === null || task === void 0 ? void 0 : task.id) !== null && _j !== void 0 ? _j : '',
        expectedNotificationTime: Number(sendAt),
        notificationEntityId: id,
    };
    return {
        notification: notificationTemplateUtils_1.transformToConduitNotificationData(systemNotificationData, metadata),
        sendAt,
        updated,
    };
};
exports.extractTaskReminderData = extractTaskReminderData;
const extractTaskReminder = async (trc, graphDB, notificationEntity) => {
    const refs = ScheduledNotificationUtils_1.getDependencyRefsForSN(notificationEntity);
    if (!refs) {
        conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Graph edges for dependencies are missing. Aborting`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, graphDB);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `Cannot get notification data for notification ID ${notificationEntity.id}. Graph edges for dependencies are missing. Aborting`,
                notificationEntityId: notificationEntity.id,
            });
        }
        return null;
    }
    const user = await graphDB.getNodeWithoutGraphQLContext(trc, const_1.UserRef);
    if (!user) {
        conduit_utils_1.logger.warn(`Cannot get user for notification ID ${notificationEntity.id}. Aborting`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, graphDB);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `Cannot get user for notification ID ${notificationEntity.id}. Aborting`,
                notificationEntityId: notificationEntity.id,
            });
        }
        return null;
    }
    let dataSourceEntity = null;
    const schedulingEntity = await graphDB.getNodeWithoutGraphQLContext(trc, refs.schedulingRef);
    if (refs.schedulingRef.id !== refs.dataSourceRef.id) {
        dataSourceEntity = await graphDB.getNodeWithoutGraphQLContext(trc, refs.dataSourceRef);
    }
    conduit_utils_1.logger.info(`Extracting task reminder data for ScheduledNotification ${notificationEntity.id}`, schedulingEntity);
    const notificationData = exports.extractTaskReminderData(notificationEntity.id, notificationEntity.NodeFields.updated, schedulingEntity, dataSourceEntity, locale_1.getUserLocale(user));
    return notificationData;
};
exports.extractTaskReminder = extractTaskReminder;
//# sourceMappingURL=index.js.map