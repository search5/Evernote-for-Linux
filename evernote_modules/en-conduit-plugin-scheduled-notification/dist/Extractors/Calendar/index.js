"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarNotification = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const utils_1 = require("./utils");
async function extractCalendarNotification(trc, graphDB, notificationEntity) {
    // Fetch user info
    const userRef = {
        id: conduit_core_1.PERSONAL_USER_ID,
        type: en_core_entity_types_1.CoreEntityTypes.User,
    };
    const user = await graphDB.getNodeWithoutGraphQLContext(trc, userRef);
    if (!user) {
        conduit_utils_1.logger.warn(`Unable to fetch user info. Aborting`);
        return null;
    }
    return utils_1.extractCalendarNotificationData(notificationEntity, utils_1.getUserLocale(user));
}
exports.extractCalendarNotification = extractCalendarNotification;
//# sourceMappingURL=index.js.map