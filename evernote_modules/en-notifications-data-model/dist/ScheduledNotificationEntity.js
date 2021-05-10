"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledNotificationEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const NotificationTypes_1 = require("./NotificationTypes");
exports.ScheduledNotificationEntitySchema = {
    fields: {
        scheduledNotificationType: NotificationTypes_1.ScheduledNotificationTypeSchema,
        mute: 'boolean',
        payload: en_ts_utils_1.NullableStruct({
            calendarEventId: 'string',
            notificationTime: 'timestamp',
            clientType: 'string',
            title: 'string',
            startTime: 'timestamp',
            endTime: 'timestamp',
            location: en_ts_utils_1.NullableString,
            noteID: en_ts_utils_1.NullableID,
            isAllDay: en_ts_utils_1.NullableBoolean,
        }),
        scheduling: en_ts_utils_1.NullableEntityRef,
        dataSource: en_ts_utils_1.NullableEntityRef,
    },
    embeddedAssociations: {
        scheduling: {
            targetType: null,
            targetIsSrc: true,
            isNsyncParent: false,
        },
        dataSource: {
            targetType: null,
            targetIsSrc: false,
            isNsyncParent: false,
        },
    },
};
//# sourceMappingURL=ScheduledNotificationEntity.js.map