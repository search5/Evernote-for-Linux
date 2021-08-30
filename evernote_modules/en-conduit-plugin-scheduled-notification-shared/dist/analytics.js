"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTriggerEvent = exports.recordCloseEvent = exports.recordActionClickEvent = exports.recordBodyClickEvent = exports.recordOpenEvent = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_notifications_templates_1 = require("en-notifications-templates");
const const_1 = require("./const");
/**
 * Helper utility to record metadata fields needed for all notifications
 *
 * @param event - custom fields, unique to this event
 * @param metadata - metadata to extract all shared values
 */
function recordEventWithMetadata(event, metadata) {
    const { notificationType, schedulingEntityID, dataSourceEntityID, target, expectedNotificationTime, notificationEntityId } = metadata;
    const eventWithMetadata = Object.assign(Object.assign({}, event), { notificationType,
        dataSourceEntityID,
        schedulingEntityID,
        target,
        expectedNotificationTime,
        notificationEntityId });
    conduit_utils_1.recordEvent(eventWithMetadata);
}
function getNotificationButtonClickActionLabel(actionType) {
    switch (actionType) {
        case en_notifications_templates_1.SystemNotificationActionName.CalendarCreateNote:
            return 'button-create';
        case en_notifications_templates_1.SystemNotificationActionName.CalendarNavigateToNote:
            return 'button-open';
        default:
            return undefined;
    }
}
function recordOpenEvent(metadata) {
    recordEventWithMetadata({
        category: 'notification',
        action: 'open',
        label: 'system',
        actualNotificationTime: Date.now(),
    }, metadata);
}
exports.recordOpenEvent = recordOpenEvent;
function recordBodyClickEvent(metadata) {
    recordEventWithMetadata({
        category: 'notification',
        action: 'click',
        label: 'body',
    }, metadata);
}
exports.recordBodyClickEvent = recordBodyClickEvent;
/**
 * As of 2021-06-17 this is only used in Electron on MacOS,
 * `action` here represents a button click,
 * not to be confused with notification body click recorded elsewhere.
 *
 * See here to learn more about actions:
 * https://www.electronjs.org/docs/api/structures/notification-action
 *
 * See here for more details on current usage decisions made:
 * https://evernote.jira.com/browse/GRIN-1137
 * @param metadata
 * @param actionType
 */
function recordActionClickEvent(metadata, actionType) {
    recordEventWithMetadata({
        category: 'notification',
        action: 'click',
        label: getNotificationButtonClickActionLabel(actionType),
    }, metadata);
}
exports.recordActionClickEvent = recordActionClickEvent;
function recordCloseEvent(metadata) {
    recordEventWithMetadata({
        category: 'notification',
        action: 'dismiss',
        label: 'button-close',
    }, metadata);
}
exports.recordCloseEvent = recordCloseEvent;
function recordTriggerEvent(metadata, sendAt, now, dropped) {
    if (sendAt !== 0 && sendAt !== metadata.expectedNotificationTime) {
        conduit_utils_1.logger.error(` Notification ${metadata.notificationEntityId} sendAt time ${sendAt} did not match metadata expectedNotificationTime ${metadata.expectedNotificationTime}`);
    }
    recordEventWithMetadata({
        category: 'notification',
        action: 'trigger',
        label: 'system',
        actualNotificationTime: now,
        gracePeriod: const_1.DEFAULT_NOTIFICATION_GRACE_PERIOD,
        dropped,
    }, metadata);
}
exports.recordTriggerEvent = recordTriggerEvent;
//# sourceMappingURL=analytics.js.map