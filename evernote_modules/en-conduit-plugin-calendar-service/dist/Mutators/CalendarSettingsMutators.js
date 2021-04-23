"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarSettingsUpsert = void 0;
const conduit_core_1 = require("conduit-core");
const CalendarConstants_1 = require("../CalendarConstants");
const CalendarSettings_1 = require("../EntityTypes/CalendarSettings");
exports.calendarSettingsUpsert = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        useTemplateForNewNotes: 'boolean',
        mobileOpenNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
        mobileCreateNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
        desktopOpenNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
        desktopCreateNoteMinutes: CalendarSettings_1.NotificationOptionsSchema,
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const calendarSettingsGenId = await ctx.generateDeterministicID(trc, ctx.userID, CalendarConstants_1.CalendarEntityTypes.CalendarSettings, CalendarConstants_1.CalendarSettingsDeterministicIdGenerator);
        const calendarSettingsRef = { id: calendarSettingsGenId[1], type: CalendarConstants_1.CalendarEntityTypes.CalendarSettings };
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
                node: ctx.assignFields(CalendarConstants_1.CalendarEntityTypes.CalendarSettings, newFields),
            });
        }
        return plan;
    },
};
//# sourceMappingURL=CalendarSettingsMutators.js.map