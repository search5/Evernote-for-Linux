"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
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
exports.NotificationsEntitySchemas = void 0;
const en_data_model_1 = require("en-data-model");
const ScheduledNotificationEntity_1 = require("./ScheduledNotificationEntity");
__exportStar(require("./NotificationTypes"), exports);
__exportStar(require("./ScheduledNotificationEntity"), exports);
exports.NotificationsEntitySchemas = {
    [en_data_model_1.EntityTypes.ScheduledNotification]: ScheduledNotificationEntity_1.ScheduledNotificationEntitySchema,
};
//# sourceMappingURL=index.js.map