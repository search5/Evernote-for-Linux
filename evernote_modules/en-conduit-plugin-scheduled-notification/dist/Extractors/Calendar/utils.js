"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarNotificationData = exports.getUserLocale = void 0;
const conduit_utils_1 = require("conduit-utils");
const ScheduledNotificationConstants_1 = require("../../ScheduledNotificationConstants");
const const_1 = require("./const");
const l10n_1 = require("./l10n");
function getUserLocale(user) {
    if (!user || !user.NodeFields || !user.NodeFields.Attributes || !user.NodeFields.Attributes.preferredLanguage) {
        return const_1.DEFAULT_LOCALE;
    }
    else {
        return user.NodeFields.Attributes.preferredLanguage;
    }
}
exports.getUserLocale = getUserLocale;
function extractCalendarNotificationData(notificationEntity, locale = const_1.DEFAULT_LOCALE) {
    if (!notificationEntity) {
        conduit_utils_1.logger.warn(`notificationEntity is not defined. Aborting`);
        return null;
    }
    if (!notificationEntity.NodeFields || !notificationEntity.NodeFields.data) {
        conduit_utils_1.logger.warn(`Cannot get notification data for notification ID ${notificationEntity.id}. Data field is missing. Aborting`);
        return null;
    }
    const { noteID, calendarEventId, title, startTime, endTime, notificationTime, location, clientType, } = notificationEntity.NodeFields.data;
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
        if (notificationTime < startTime) {
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
    return {
        notification: {
            id: notificationEntity.id,
            title: localizedTitle,
            body: `${meetingDescription}, ${location}`,
            clickNotificationActionTarget: target,
            clickNotificationActionName: actionName,
        },
        sendAt: Number(notificationTime),
        updated: notificationEntity.NodeFields.updated,
        targetClientType: clientType,
    };
}
exports.extractCalendarNotificationData = extractCalendarNotificationData;
//# sourceMappingURL=utils.js.map