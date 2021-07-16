"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCalendarNotificationData = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const l10n_1 = require("../l10n");
const __1 = require("../");
function createCalendarNotificationData(notificationId, srcData, locale, logger) {
    const l10n = l10n_1.L10N.getInstance(locale, logger);
    const { noteID, calendarEventId, title, startTime, endTime, notificationTime, location, isAllDay, } = srcData;
    let target;
    let actionName;
    let localizedTitle;
    let localizedButtonText;
    if (noteID) {
        target = noteID;
        actionName = __1.SystemNotificationActionName.CalendarNavigateToNote;
        // Empty string is treated as false, conversion to Boolean leads to TS error
        if (title) {
            localizedTitle = l10n.l('openNoteForEvent', { EVENT_TITLE: title });
        }
        else {
            localizedTitle = l10n.l('openNoteForUntitledEvent');
        }
        localizedButtonText = l10n.l('openNote');
    }
    else {
        target = calendarEventId;
        actionName = __1.SystemNotificationActionName.CalendarCreateNote;
        if (title) {
            localizedTitle = l10n.l('createNoteForEvent', { EVENT_TITLE: title });
        }
        else {
            localizedTitle = l10n.l('createNoteForUntitledEvent');
        }
        localizedButtonText = l10n.l('createNote');
    }
    let meetingDescription;
    try {
        if (isAllDay) {
            meetingDescription = l10n.l('allDay');
        }
        else if (endTime - startTime >= en_ts_utils_1.MILLIS_IN_ONE_DAY) {
            meetingDescription = l10n.l('timeRange', {
                START_TIME: l10n.t(startTime, 'MonthDay'),
                END_TIME: l10n.t(endTime, 'MonthDay'),
            });
        }
        else if (notificationTime < startTime) {
            meetingDescription = l10n.l('startsAt', {
                TIME: l10n.t(startTime, 'HourMinute'),
            });
        }
        else if (notificationTime > endTime) {
            meetingDescription = l10n.l('endedAt', {
                TIME: l10n.t(endTime, 'HourMinute'),
            });
        }
        else {
            meetingDescription = l10n.l('timeRange', {
                START_TIME: l10n.t(startTime, 'HourMinute'),
                END_TIME: l10n.t(endTime, 'HourMinute'),
            });
        }
    }
    catch (err) {
        if (logger) {
            logger.warn(`Cannot construct meeting description for notification ID ${notificationId}. ${err.stack} Aborting`);
        }
        return null;
    }
    let body = meetingDescription;
    if (location) {
        body = `${meetingDescription}, ${location}`;
    }
    return {
        id: notificationId,
        title: localizedTitle,
        body,
        clickNotificationActionTarget: target,
        clickNotificationActionName: actionName,
        buttons: [
            {
                text: localizedButtonText,
                action: {
                    target,
                    name: actionName,
                },
            },
        ],
        closeButtonText: l10n.l('close'),
    };
}
exports.createCalendarNotificationData = createCalendarNotificationData;
//# sourceMappingURL=createCalendarNotificationData.js.map