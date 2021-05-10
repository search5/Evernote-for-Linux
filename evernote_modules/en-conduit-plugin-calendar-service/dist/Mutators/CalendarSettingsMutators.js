"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarSettingsUpsert = void 0;
const conduit_core_1 = require("conduit-core");
const en_calendar_data_model_1 = require("en-calendar-data-model");
const en_data_model_1 = require("en-data-model");
exports.calendarSettingsUpsert = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        useTemplateForNewNotes: 'boolean',
        mobileOpenNoteMinutes: en_calendar_data_model_1.NotificationOptionsSchema,
        mobileCreateNoteMinutes: en_calendar_data_model_1.NotificationOptionsSchema,
        desktopOpenNoteMinutes: en_calendar_data_model_1.NotificationOptionsSchema,
        desktopCreateNoteMinutes: en_calendar_data_model_1.NotificationOptionsSchema,
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const calendarSettingsGenId = await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.CalendarSettings, en_data_model_1.DefaultDeterministicIdGenerator);
        const calendarSettingsRef = { id: calendarSettingsGenId[1], type: en_data_model_1.EntityTypes.CalendarSettings };
        const newFields = {
            useTemplateForNewNotes: params.useTemplateForNewNotes,
            desktopReminders: {
                createNoteMinutes: params.desktopCreateNoteMinutes,
                openNoteMinutes: params.desktopOpenNoteMinutes,
            },
            mobileReminders: {
                createNoteMinutes: params.mobileCreateNoteMinutes,
                openNoteMinutes: params.mobileOpenNoteMinutes,
            },
        };
        plan.results.result = calendarSettingsGenId[1];
        const existingCalendarSettings = await ctx.fetchEntity(trc, calendarSettingsRef);
        if (!existingCalendarSettings) {
            const calendarSettingsEntity = await ctx.createEntity(calendarSettingsRef, newFields, ctx.userID);
            plan.ops.push({
                changeType: 'Node:CREATE',
                node: calendarSettingsEntity,
                id: calendarSettingsGenId,
            });
        }
        else {
            plan.ops.push({
                changeType: 'Node:UPDATE',
                nodeRef: calendarSettingsRef,
                node: ctx.assignFields(en_data_model_1.EntityTypes.CalendarSettings, newFields),
            });
        }
        return plan;
    },
};
//# sourceMappingURL=CalendarSettingsMutators.js.map