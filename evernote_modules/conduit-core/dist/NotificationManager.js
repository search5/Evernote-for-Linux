"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const conduit_utils_1 = require("conduit-utils");
// Note that when adding a grace period a notification may fire twice.
// If needed we might want to persist our notification cache until ScheduledNotifications are synced/hybrid
const DEFAULT_GRACE_PERIOD = 0;
const CACHE_SIZE_LIMIT = 200;
class NotificationManager {
    constructor(di, gracePeriod) {
        this.di = di;
        this.gracePeriod = gracePeriod;
        this.notificationCache = {};
        this.schedulingCompleteOrUnstarted = Promise.resolve();
    }
    async destructor(trc, graphDB) {
        await this.unschedulePendingNotifications(trc, graphDB);
    }
    async scheduleExistingScheduledNotifications(trc, graphDB) {
        return (this.schedulingCompleteOrUnstarted = new Promise(async (res) => {
            try {
                await graphDB.waitUntilReady(trc);
                conduit_utils_1.logger.debug('NotificationManager -- Scheduling all found ScheduledNotifications');
                // this method is not awaited so we need to take special precautions
                if (!graphDB.destructed()) {
                    const scheduled = await this.di.getScheduledNotifications(trc, graphDB);
                    for (const snID of scheduled.muted) {
                        // Skipping over mute notification.
                        // It really shouldn't be scheduled already, but just in case ->
                        await this.deleteNotification(trc, snID);
                    }
                    for (const sn of scheduled.active) {
                        conduit_utils_1.logger.info(`NotificationManager -- Attempting to upsert notification entity with id ${sn.id}`);
                        await this.upsertNotification(trc, graphDB, sn);
                    }
                }
            }
            finally {
                // Always resolve so that unschedulePendingNotifications method is not stuck awaiting this.
                res();
            }
        }));
    }
    async unschedulePendingNotifications(trc, graphDB) {
        await this.schedulingCompleteOrUnstarted;
        conduit_utils_1.logger.debug('NotificationManager -- Unscheduling all pending ScheduledNotifications');
        const scheduled = await this.di.getScheduledNotifications(trc, graphDB);
        for (const snID of scheduled.muted) {
            await this.deleteNotification(trc, snID);
        }
        for (const sn of scheduled.active) {
            await this.deleteNotification(trc, sn.id);
        }
    }
    async upsertNotification(trc, graphDB, notificationEntity) {
        const notificationData = await this.di.getNotificationData(trc, graphDB, notificationEntity);
        const cachedData = this.notificationCache[notificationEntity.id] || null;
        if (!notificationData) {
            return { warn: 'Cannot extract notification data. Aborting upsert.' };
        }
        if (cachedData && cachedData.updated === notificationData.updated) {
            // Notification or deps haven't changed since we cached the data.
            conduit_utils_1.logger.info(`NotificationManager -- Notification has not changed since last upserted. Aborting upsert.`, `-- id: '${notificationEntity.id}`, `-- updated: ${notificationData.updated}`, `-- sendAt: ${notificationData.sendAt}`);
            return;
        }
        if (this.di.getNotificationIsMute(notificationEntity)) {
            // notification was muted. Unschedule and remove from cache
            await this.deleteNotification(trc, notificationData.notification.id);
        }
        else if (this.shouldNotFire(notificationData.sendAt, cachedData)) {
            // notification changed to past do or shown already, unschedule just in case and update the cache
            this.unschedule(notificationData.notification.id);
            this.addToCache(notificationData, true);
        }
        else {
            this.schedule(notificationData);
            this.addToCache(notificationData, false);
        }
    }
    async deleteNotification(trc, id) {
        this.unschedule(id);
        delete this.notificationCache[id];
    }
    shouldNotFire(sendAt, cachedData) {
        const prevScheduledTime = cachedData === null || cachedData === void 0 ? void 0 : cachedData.sendAt;
        const curTime = Date.now();
        if (sendAt + (this.gracePeriod || DEFAULT_GRACE_PERIOD) >= curTime) {
            // Notification is in the future / within grace period
            if (prevScheduledTime === sendAt && sendAt <= curTime) {
                // notification in the cache with the same, past sendAt value, assume sent
                conduit_utils_1.logger.debug(`Notification for time '${sendAt}' fired already. Not showing`);
                return true;
            }
            return false;
        }
        // notification may have been rescheduled to the past or old. Unschedule
        return true;
    }
    addToCache(data, updateOnly) {
        const exists = this.notificationCache[data.notification.id];
        if (updateOnly && !exists) {
            return;
        }
        this.notificationCache[data.notification.id] = { sendAt: data.sendAt, updated: data.updated };
        // a bit of a crude way to make sure this object doesn't get too big...
        // TODO(droth) move to cache class that takes care of this
        const keys = Object.keys(this.notificationCache);
        if (keys.length > CACHE_SIZE_LIMIT) {
            delete this.notificationCache[keys[0]];
        }
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=NotificationManager.js.map