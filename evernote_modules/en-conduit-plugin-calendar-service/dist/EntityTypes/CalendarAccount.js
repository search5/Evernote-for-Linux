"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarAccountTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const CalendarConstants_1 = require("../CalendarConstants");
exports.calendarAccountTypeDef = {
    name: CalendarConstants_1.CalendarEntityTypes.CalendarAccount,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    fieldValidation: {},
    schema: {
        isConnected: 'boolean',
    },
    edges: {},
};
//# sourceMappingURL=CalendarAccount.js.map