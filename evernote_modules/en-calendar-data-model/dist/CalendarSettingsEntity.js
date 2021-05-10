"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarSettingsEntitySchema = void 0;
const ActionReminders_1 = require("./types/ActionReminders");
exports.CalendarSettingsEntitySchema = {
    fields: {
        useTemplateForNewNotes: 'boolean',
        desktopReminders: ActionReminders_1.ActionRemindersSchema,
        mobileReminders: ActionReminders_1.ActionRemindersSchema,
    },
};
//# sourceMappingURL=CalendarSettingsEntity.js.map