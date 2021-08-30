"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldDropNotification = exports.extractNotificationMetadata = exports.getNotificationLogsEnabledFlag = void 0;
const conduit_utils_1 = require("conduit-utils");
const analytics_1 = require("./analytics");
const const_1 = require("./const");
async function getNotificationLogsEnabledFlag(trc, context) {
    var _a;
    return (_a = (await context.getLocalSettings().getConduitValue(trc, null, 'local_notifications_logs_enabled'))) !== null && _a !== void 0 ? _a : false;
}
exports.getNotificationLogsEnabledFlag = getNotificationLogsEnabledFlag;
function extractNotificationMetadata(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return {
        notificationType: (_b = (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.notificationType) !== null && _b !== void 0 ? _b : null,
        target: (_d = (_c = data.metadata) === null || _c === void 0 ? void 0 : _c.target) !== null && _d !== void 0 ? _d : null,
        schedulingEntityID: (_f = (_e = data.metadata) === null || _e === void 0 ? void 0 : _e.schedulingEntityID) !== null && _f !== void 0 ? _f : null,
        dataSourceEntityID: (_h = (_g = data.metadata) === null || _g === void 0 ? void 0 : _g.dataSourceEntityID) !== null && _h !== void 0 ? _h : null,
        expectedNotificationTime: (_j = data.metadata) === null || _j === void 0 ? void 0 : _j.expectedNotificationTime,
        notificationEntityId: (_k = data.metadata) === null || _k === void 0 ? void 0 : _k.notificationEntityId,
    };
}
exports.extractNotificationMetadata = extractNotificationMetadata;
function shouldDropNotification(id, metadata, sendAt, now, client) {
    let dropNotification = false;
    const tooLate = now > sendAt + const_1.DEFAULT_NOTIFICATION_GRACE_PERIOD;
    if (sendAt === 0) {
        // For now, the only use case that sets sendAt to zero is passing notification
        // from Ion Conduit to Ion main thread. We should avoid setting it to zero and set an actual
        // value instead.
        conduit_utils_1.logger.info(`Notification ${id} without scheduled time processed at time ${now}, with grace period ${const_1.DEFAULT_NOTIFICATION_GRACE_PERIOD}, client ${client}`);
        dropNotification = false;
    }
    else if (tooLate) {
        conduit_utils_1.logger.error(`Notification ${id} triggered late, scheduled time ${sendAt}, actual time ${now}, grace period ${const_1.DEFAULT_NOTIFICATION_GRACE_PERIOD}, client ${client}`);
        dropNotification = true;
    }
    analytics_1.recordTriggerEvent(metadata, sendAt, now, dropNotification);
    return dropNotification;
}
exports.shouldDropNotification = shouldDropNotification;
//# sourceMappingURL=utils.js.map