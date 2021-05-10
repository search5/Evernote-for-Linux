"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarAccountEntitySchema = void 0;
const CalendarProvider_1 = require("./types/CalendarProvider");
exports.CalendarAccountEntitySchema = {
    fields: {
        isConnected: 'boolean',
        provider: CalendarProvider_1.CalendarProviderSchema,
        userIdFromExternalProvider: 'string',
    },
};
//# sourceMappingURL=CalendarAccountEntity.js.map