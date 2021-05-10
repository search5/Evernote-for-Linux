"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarNotification = exports.extractCalendarNotificationData = void 0;
const conduit_utils_1 = require("conduit-utils");
const ScheduledNotificationConstants_1 = require("../../ScheduledNotificationConstants");
const const_1 = require("../shared/const");
const locale_1 = require("../shared/locale");
const l10n_1 = require("./l10n");
const ONE_DAY = 24 * 60 * 60 * 1000;
function extractCalendarNotificationData(notificationEntity, locale = const_1.DEFAULT_LOCALE) {
    if (!notificationEntity) {
        conduit_utils_1.logger.warn(`notificationEntity is not defined. Aborting`);
        return null;
    }
    if (!notificationEntity.NodeFields || !notificationEntity.NodeFields.payload) {
        conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Data field is missing. Aborting`);
        return null;
    }
    const { noteID, calendarEventId, title, startTime, endTime, notificationTime, location, clientType, isAllDay, } = notificationEntity.NodeFields.payload;
    let target;
    let actionName;
    let localizedTitle;
    if (noteID) {
        target = noteID;
        actionName = ScheduledNotificationConstants_1.NotificationActionNames.CalendarNavigateToNote;
        localizedTitle = l10n_1.openNoteTitle(title, locale);
    }
    else {
        target = calendarEventId;
        actionName = ScheduledNotificationConstants_1.NotificationActionNames.CalendarCreateNote;
        localizedTitle = l10n_1.createNoteTitle(title, locale);
    }
    let meetingDescription;
    try {
        if (isAllDay) {
            meetingDescription = l10n_1.getAllDay(locale);
        }
        else if (endTime - startTime >= ONE_DAY) {
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
        conduit_utils_1.logger.warn(`Cannot construct meeting description for notification ID ${notificationEntity.id}. ${err.stack} Aborting`);
        return null;
    }
    let body = meetingDescription;
    if (location) {
        body = `${meetingDescription}, ${location}`;
    }
    return {
        notification: {
            id: notificationEntity.id,
            title: localizedTitle,
            body,
            clickNotificationActionTarget: target,
            clickNotificationActionName: actionName,
        },
        sendAt: Number(notificationTime),
        updated: notificationEntity.NodeFields.updated,
        targetClientType: clientType,
    };
}
exports.extractCalendarNotificationData = extractCalendarNotificationData;
async function extractCalendarNotification(trc, graphDB, notificationEntity) {
    const user = await graphDB.getNodeWithoutGraphQLContext(trc, const_1.UserRef);
    if (!user) {
        conduit_utils_1.logger.warn(`Unable to fetch user info. Aborting`);
        return null;
    }
    return extractCalendarNotificationData(notificationEntity, locale_1.getUserLocale(user));
}
exports.extractCalendarNotification = extractCalendarNotification;
//# sourceMappingURL=index.js.map