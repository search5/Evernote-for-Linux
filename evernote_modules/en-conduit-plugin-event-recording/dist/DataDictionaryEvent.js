"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateBaseEventProperties = void 0;
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
const conduit_utils_1 = require("conduit-utils");
function populateBaseEventProperties() {
    const timestampUtc = Date.now();
    const offsetMin = new Date().getTimezoneOffset();
    const timestampLocal = timestampUtc + offsetMin * conduit_utils_1.MILLIS_IN_ONE_MINUTE;
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
        eventId: conduit_utils_1.uuid(),
        timestampUtc,
        timestampLocal,
        sentTimestampUtc: 0,
        localTimezone,
        language: '',
        globalUserId: '',
        authenticatedGlobalUserId: '',
        client: '',
        clientVersion: '',
        clientBuild: '',
        deviceMake: '',
        deviceModel: '',
        deviceId: '',
        deviceType: '',
        platform: '',
        platformVersion: '',
        screenSize: '',
        screenResolution: '',
        userTier: '',
        offlineEvent: '',
        systemTriggered: '',
        browser: '',
        browserVersion: '',
        editorVersion: '',
        editorHitFlag: '',
        category: '',
        action: '',
        label: '',
    };
}
exports.populateBaseEventProperties = populateBaseEventProperties;
//# sourceMappingURL=DataDictionaryEvent.js.map