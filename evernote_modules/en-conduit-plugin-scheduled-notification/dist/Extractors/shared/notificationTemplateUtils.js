"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformToConduitNotificationData = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_notifications_templates_1 = require("en-notifications-templates");
const ScheduledNotificationConstants_1 = require("../../ScheduledNotificationConstants");
function transformActionName(inputActionName) {
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
            throw conduit_utils_1.absurd(inputActionName, `unhandled switch case in transformActionName ${inputActionName}`);
    }
    return actionName;
}
function transformToConduitNotificationData(data) {
    var _a;
    const inputActionName = data.clickNotificationActionName;
    const actionName = transformActionName(inputActionName);
    const buttons = (_a = data.buttons) === null || _a === void 0 ? void 0 : _a.map(button => (Object.assign(Object.assign({}, button), { action: {
            target: button.action.target,
            name: transformActionName(button.action.name),
        } })));
    return Object.assign(Object.assign({}, data), { buttons, clickNotificationActionName: actionName });
}
exports.transformToConduitNotificationData = transformToConduitNotificationData;
//# sourceMappingURL=notificationTemplateUtils.js.map