"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCalendarNotificationData = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const l10n_1 = require("../l10n");
const notifications_1 = require("../types/notifications");
function createCalendarNotificationData(notificationId, srcData, locale, logger) {
    const { noteID, calendarEventId, title, startTime, endTime, notificationTime, location, isAllDay, } = srcData;
    let target;
    let actionName;
    let localizedTitle;
    let localizedButtonText;
    if (noteID) {
        target = noteID;
        actionName = notifications_1.SystemNotificationActionName.CalendarNavigateToNote;
        // Empty string is treated as false, conversion to Boolean leads to TS error
        if (title) {
            localizedTitle = l10n_1.openNoteTitle(title, locale);
        }
        else {
            localizedTitle = l10n_1.openNoteUntitled(locale);
        }
        localizedButtonText = l10n_1.openNote(locale);
    }
    else {
        target = calendarEventId;
        actionName = notifications_1.SystemNotificationActionName.CalendarCreateNote;
        if (title) {
            localizedTitle = l10n_1.createNoteTitle(title, locale);
        }
        else {
            localizedTitle = l10n_1.createNoteUntitled(locale);
        }
        localizedButtonText = l10n_1.createNote(locale);
    }
    let meetingDescription;
    try {
        if (isAllDay) {
            meetingDescription = l10n_1.getAllDay(locale);
        }
        else if (endTime - startTime >= en_ts_utils_1.MILLIS_IN_ONE_DAY) {
            meetingDescription = l10n_1.getMultiDay(startTime, endTime, locale);
        }
        else if (notificationTime < startTime) {
            meetingDescription = l10n_1.getStartsAt(startTime, locale);
        }
        else if (notificationTime > endTime) {
            meetingDescription = l10n_1.getEndedAt(endTime, locale);
        }
        else {
            meetingDescription = l10n_1.getTimeRange(startTime, endTime, locale);
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
        closeButtonText: l10n_1.getClose(locale),
    };
}
exports.createCalendarNotificationData = createCalendarNotificationData;
//# sourceMappingURL=createCalendarNotificationData.js.map