"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCloseEvent = exports.recordBodyClickEvent = exports.recordOpenEvent = void 0;
const conduit_utils_1 = require("conduit-utils");
// TODO: move to en-conduit-notifications-shared
// TODO: figure out scheduledNotificationType from passed through metadata.
// For now, only task reminder notifications go through this code path
const SCHEDULED_NOTIFICATION_TYPE = 'TaskReminder';
function recordOpenEvent() {
    conduit_utils_1.recordEvent({
        category: 'notification',
        action: 'open',
        label: 'system',
        notificationType: SCHEDULED_NOTIFICATION_TYPE,
    });
}
exports.recordOpenEvent = recordOpenEvent;
function recordBodyClickEvent() {
    conduit_utils_1.recordEvent({
        category: 'notification',
        action: 'click',
        label: 'body',
        notificationType: SCHEDULED_NOTIFICATION_TYPE,
    });
}
exports.recordBodyClickEvent = recordBodyClickEvent;
function recordCloseEvent() {
    conduit_utils_1.recordEvent({
        category: 'notification',
        action: 'dismiss',
        label: 'button-close',
        notificationType: SCHEDULED_NOTIFICATION_TYPE,
    });
}
exports.recordCloseEvent = recordCloseEvent;
//# sourceMappingURL=analytics.js.map