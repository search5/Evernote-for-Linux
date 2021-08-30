"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronNotifications = void 0;
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
/**
 * Class responsible for handling Electron Notifications,
 */
class ElectronNotifications {
    constructor(notificationConstructor = electron_1.Notification) {
        this.notificationConstructor = notificationConstructor;
        this.pendingNotifications = {};
    }
    /**
     * Adds a notification. Notifications that have been shown are automatically removed.
     * @param notificationData electron specific notification data object
     * @param sendAt UTC timestamp at which the notification should be shown to the user
     */
    addPendingNotification(notificationData, sendAt = 0) {
        // treat as an upsert
        this.removePendingNotification(notificationData.id);
        const notification = this.createElectronNotificationFromData(notificationData);
        const mutableTimeoutId = conduit_utils_1.setTimeoutForTimestamp(() => {
            if (!en_conduit_plugin_scheduled_notification_shared_1.shouldDropNotification(notificationData.id, notificationData.metadata, sendAt, Date.now(), 'desktop')) {
                en_conduit_plugin_scheduled_notification_shared_1.recordOpenEvent(notificationData.metadata);
                notification.show();
            }
            delete this.pendingNotifications[notificationData.id];
        }, sendAt);
        this.pendingNotifications[notificationData.id] = {
            unschedule: () => {
                conduit_utils_1.clearMutableTimeout(mutableTimeoutId);
            },
            data: notificationData,
            time: sendAt,
        };
    }
    /**
     * Gets a pending notification and the time at which the notification should be shown.
     * @param id the identifier of the pending notification
     * @returns js object with data and time params.
     * data: the original object supplied to addPendingNotification
     * time: the time at which the notification should be shown, or 0 if the time passed at creation or was not provided
     * or null if notification was not found
     */
    getPendingNotification(id) {
        const pendingNotificationHandler = this.pendingNotifications[id];
        if (!pendingNotificationHandler) {
            return null;
        }
        return { data: pendingNotificationHandler.data, time: pendingNotificationHandler.time };
    }
    /**
     * Removes a pending notification and unschedules it
     * @param id identifier of the pending notification
     */
    removePendingNotification(id) {
        if (!this.pendingNotifications[id]) {
            return;
        }
        this.pendingNotifications[id].unschedule();
        delete this.pendingNotifications[id];
    }
    /**
     * Create a an Electron.Notification instance and sets event handlers
     * @param notificationData electron specific notification data object
     * @returns Electron.Notification object created from the data provided
     */
    createElectronNotificationFromData(notificationData) {
        var _a;
        const notification = new this.notificationConstructor({
            title: notificationData.title,
            body: notificationData.body,
            subtitle: notificationData.subtitle,
            closeButtonText: notificationData.closeButtonText,
            actions: (_a = notificationData.buttons) === null || _a === void 0 ? void 0 : _a.map(button => ({
                text: button.text,
                type: 'button',
            })),
            timeoutType: 'default',
            icon: notificationData.iconPath ? electron_1.nativeImage.createFromDataURL(notificationData.iconPath) : undefined,
        });
        let isClosedFromNotificationAction = false; // this flag to check whether close event originated from notification's action event handling;
        notification.on('click', conduit_utils_1.once(() => {
            en_conduit_plugin_scheduled_notification_shared_1.recordBodyClickEvent(notificationData.metadata);
            const callback = notificationData.onClick;
            this.removePendingNotification(notificationData.id);
            notification.close();
            if (callback) {
                callback();
                return;
            }
            conduit_utils_1.logger.info('No onClick callback defined for ElectronNotification');
        }));
        notification.on('action', (_, actionIdx) => {
            var _a, _b;
            const callback = (_a = notificationData.buttons) === null || _a === void 0 ? void 0 : _a[actionIdx].onClick;
            const actionType = (_b = notificationData.buttons) === null || _b === void 0 ? void 0 : _b[actionIdx].actionType;
            en_conduit_plugin_scheduled_notification_shared_1.recordActionClickEvent(notificationData.metadata, actionType);
            this.removePendingNotification(notificationData.id);
            isClosedFromNotificationAction = true;
            notification.close();
            if (callback) {
                callback();
                return;
            }
            conduit_utils_1.logger.info(`No onClick callback defined for button index num: '${actionIdx}'`);
        });
        notification.on('close', () => {
            if (!isClosedFromNotificationAction) {
                en_conduit_plugin_scheduled_notification_shared_1.recordCloseEvent(notificationData.metadata);
            }
            const callback = notificationData.onClose;
            this.removePendingNotification(notificationData.id);
            if (callback) {
                callback();
                return;
            }
            conduit_utils_1.logger.info('No onClose callback defined for ElectronNotification');
        });
        return notification;
    }
}
exports.ElectronNotifications = ElectronNotifications;
//# sourceMappingURL=ElectronNotifications.js.map