"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskReminderNotificationData = void 0;
const l10n_1 = require("../l10n");
const __1 = require("..");
function getBody(dueDate, l10n, dueDateUIOption) {
    if (!dueDate) {
        return '';
    }
    const addDueDateCopy = (dueDateString, l10n) => {
        return l10n.l('dueAtDate', { DATE: dueDateString });
    };
    const addDueDateTimeCopy = (dueDateString, timeString, l10n) => {
        return l10n.l('dueAtDateTime', { DATE: dueDateString, TIME: timeString });
    };
    switch (dueDateUIOption) {
        case __1.DueDateUIOption.Date:
            return addDueDateCopy(l10n.t(dueDate, 'YearMonthDay'), l10n);
        case __1.DueDateUIOption.DateTime:
            return addDueDateTimeCopy(l10n.t(dueDate, 'YearMonthDay'), l10n.t(dueDate, 'HourMinute'), l10n);
        case null:
        case undefined:
        default:
            return '';
    }
}
function createTaskReminderNotificationData(notificationId, srcData, locale, logger) {
    const l10n = l10n_1.L10N.getInstance(locale, logger);
    const { taskID, title, dueDate, dueDateUIOption } = srcData;
    const target = taskID;
    const actionName = __1.SystemNotificationActionName.NavigateToTask;
    const body = getBody(dueDate, l10n, dueDateUIOption);
    return {
        id: notificationId,
        title: title ? title : l10n.l('untitledTask'),
        body,
        clickNotificationActionTarget: target,
        clickNotificationActionName: actionName,
        closeButtonText: l10n.l('close'),
    };
}
exports.createTaskReminderNotificationData = createTaskReminderNotificationData;
//# sourceMappingURL=createTaskReminderNotificationData.js.map