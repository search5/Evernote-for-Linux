"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POLL_INTERVAL = exports.DAYS_AFTER_TO_CACHE = exports.DAYS_BEFORE_TO_CACHE = exports.CALENDAR_UPDATES_ROW_NAME = exports.CALENDAR_UPDATES_TABLE_NAME = exports.EPHEMERAL_EVENTS_BY_ID_TABLE_NAME = exports.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME = void 0;
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
const conduit_utils_1 = require("conduit-utils");
exports.EPHEMERAL_EVENTS_BY_DAY_TABLE_NAME = 'CalendarEventsByDay';
exports.EPHEMERAL_EVENTS_BY_ID_TABLE_NAME = 'CalendarEventsById';
exports.CALENDAR_UPDATES_TABLE_NAME = 'UserCalendarUpdates';
exports.CALENDAR_UPDATES_ROW_NAME = 'lastUpdated';
exports.DAYS_BEFORE_TO_CACHE = 7;
exports.DAYS_AFTER_TO_CACHE = 14;
exports.POLL_INTERVAL = 30 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
//# sourceMappingURL=CalendarConstants.js.map