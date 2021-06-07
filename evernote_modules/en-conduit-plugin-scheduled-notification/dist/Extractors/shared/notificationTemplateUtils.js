"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformToConduitNotificationData = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_notifications_templates_1 = require("en-notifications-templates");
const ScheduledNotificationConstants_1 = require("../../ScheduledNotificationConstants");
function transformToConduitNotificationData(data) {
    const inputActionName = data.clickNotificationActionName;
    let actionName;
    switch (inputActionName) {
        case en_notifications_templates_1.SystemNotificationActionName.CalendarCreateNote:
            actionName = ScheduledNotificationConstants_1.NotificationActionNames.CalendarCreateNote;
            break;
        case en_notifications_templates_1.SystemNotificationActionName.CalendarNavigateToNote:
            actionName = ScheduledNotificationConstants_1.NotificationActionNames.CalendarNavigateToNote;
            break;
        case en_notifications_templates_1.SystemNotificationActionName.NavigateToNote:
            actionName = ScheduledNotificationConstants_1.NotificationActionNames.NavigateToNote;
            break;
        default:
            throw conduit_utils_1.absurd(inputActionName, `unhandled switch case in transformToConduitNotificationData ${inputActionName}`);
    }
    return Object.assign(Object.assign({}, data), { clickNotificationActionName: actionName });
}
exports.transformToConduitNotificationData = transformToConduitNotificationData;
//# sourceMappingURL=notificationTemplateUtils.js.map