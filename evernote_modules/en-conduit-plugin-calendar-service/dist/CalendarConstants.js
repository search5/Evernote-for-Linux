"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarSettingsDeterministicIdGenerator = exports.CalendarEntityTypes = void 0;
const conduit_utils_1 = require("conduit-utils");
exports.CalendarEntityTypes = {
    CalendarAccount: 'CalendarAccount',
    UserCalendarSettings: 'UserCalendarSettings',
    CalendarSettings: 'CalendarSettings',
    CalendarEvent: 'CalendarEvent',
    CalendarEventLink: 'CalendarEventLink',
};
exports.CalendarSettingsDeterministicIdGenerator = (() => {
    const entityTypeMap = new Map();
    entityTypeMap.set(exports.CalendarEntityTypes.CalendarSettings, 22);
    return new conduit_utils_1.DeterministicIdGenerator(entityTypeMap);
})();
//# sourceMappingURL=CalendarConstants.js.map