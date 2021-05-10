"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCalendarSettingsEntitySchema = void 0;
const UserCalendarData_1 = require("./types/UserCalendarData");
exports.UserCalendarSettingsEntitySchema = {
    fields: {
        isActive: 'boolean',
        userCalendarExternalId: 'string',
        data: UserCalendarData_1.UserCalendarDataSchema,
    },
};
//# sourceMappingURL=UserCalendarSettingsEntity.js.map