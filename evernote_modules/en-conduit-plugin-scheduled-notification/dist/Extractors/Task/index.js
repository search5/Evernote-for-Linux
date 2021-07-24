"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTaskReminder = exports.extractTaskReminderData = void 0;
const conduit_utils_1 = require("conduit-utils");
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
    var _a, _b, _c, _d, _e, _f;
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
    return {
        notification: notificationTemplateUtils_1.transformToConduitNotificationData(systemNotificationData),
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
    const user = await graphDB.getNodeWithoutGraphQLContext(trc, const_1.UserRef);
    if (!user) {
        conduit_utils_1.logger.warn(`Cannot get user for notification ID ${notificationEntity.id}. Aborting`);
        return null;
    }
    let dataSourceEntity = null;
    const schedulingEntity = await graphDB.getNodeWithoutGraphQLContext(trc, refs.schedulingRef);
    if (refs.schedulingRef.id !== refs.dataSourceRef.id) {
        dataSourceEntity = await graphDB.getNodeWithoutGraphQLContext(trc, refs.dataSourceRef);
    }
    const notificationData = exports.extractTaskReminderData(notificationEntity.id, notificationEntity.NodeFields.updated, schedulingEntity, dataSourceEntity, locale_1.getUserLocale(user));
    return notificationData;
};
exports.extractTaskReminder = extractTaskReminder;
//# sourceMappingURL=index.js.map