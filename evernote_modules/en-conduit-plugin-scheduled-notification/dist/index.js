"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENScheduledNotificationPlugin = void 0;
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_data_model_1 = require("en-data-model");
__exportStar(require("./notificationManagerSNUtilityDI"), exports);
__exportStar(require("./ScheduledNotificationConstants"), exports);
function getENScheduledNotificationPlugin() {
    return {
        name: 'ENScheduledNotification',
        entityTypes: () => {
            const entityTypes = {
                [en_data_model_1.EntityTypes.ScheduledNotification]: {
                    typeDef: en_conduit_plugin_scheduled_notification_shared_1.scheduledNotificationTypeDef,
                    indexConfig: en_conduit_plugin_scheduled_notification_shared_1.scheduledNotificationIndexConfig,
                    nsyncType: en_data_model_1.NSyncEntityType.SCHEDULED_NOTIFICATION,
                },
            };
            return entityTypes;
        },
    };
}
exports.getENScheduledNotificationPlugin = getENScheduledNotificationPlugin;
//# sourceMappingURL=index.js.map