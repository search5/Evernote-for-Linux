"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCalendarSettingsTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const CalendarConstants_1 = require("../CalendarConstants");
exports.userCalendarSettingsTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        isActive: 'boolean',
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY_LINK,
            from: {
                type: CalendarConstants_1.CalendarEntityTypes.CalendarAccount,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'userCalendarSettings',
            },
        },
    },
};
//# sourceMappingURL=UserCalendarSettings.js.map