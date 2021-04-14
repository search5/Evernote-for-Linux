"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronNotificationManager = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const electron_1 = __importDefault(require("electron"));
const electron_local_notifications_1 = require("electron-local-notifications");
const ElectronNotificationConverter_1 = require("./ElectronNotificationConverter");
class ElectronNotificationManager extends conduit_core_1.NotificationManager {
    constructor(di) {
        super(di);
        this.electronNotifications = new electron_local_notifications_1.ElectronNotifications(electron_1.default.remote.Notification);
        this.notificationConverter = ElectronNotificationConverter_1.getElectronNotificationConverter(di);
    }
    async schedule(notificationData) {
        if (notificationData.targetClientType && !notificationData.targetClientType.includes('desktop')) {
            conduit_utils_1.logger.debug(`Notification ID ${notificationData.notification.id} is not targeting desktop client type`);
            return;
        }
        const convertedNotification = this.notificationConverter.convert(notificationData.notification);
        conduit_utils_1.logger.debug(`ElectronNotificationsScheduler -- schedule: id: ${convertedNotification.id} `, `-- title: ${convertedNotification.title} `, `-- subtitle: ${convertedNotification.subtitle}`, `-- body: ${convertedNotification.body}`, `-- sendAt: ${notificationData.sendAt} `);
        this.electronNotifications.addPendingNotification(convertedNotification, notificationData.sendAt);
    }
    unschedule(notificationId) {
        conduit_utils_1.logger.debug(`ElectronNotificationsScheduler -- unschedule: ${notificationId}`);
        this.electronNotifications.removePendingNotification(notificationId);
    }
}
exports.ElectronNotificationManager = ElectronNotificationManager;
//# sourceMappingURL=ElectronNotificationManager.js.map