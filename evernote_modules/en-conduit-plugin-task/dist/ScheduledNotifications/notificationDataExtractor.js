"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationDataExtractor = void 0;
const conduit_utils_1 = require("conduit-utils");
const ScheduledNotificationConstants_1 = require("./ScheduledNotificationConstants");
const TaskReminder = {
    extract: (id, updated, reminder, task) => {
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
    },
};
exports.notificationDataExtractor = {
    TaskReminder,
};
//# sourceMappingURL=notificationDataExtractor.js.map