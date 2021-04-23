"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCalendarSettingsCreate = exports.userCalendarSettingsUpdate = void 0;
const conduit_core_1 = require("conduit-core");
const CalendarConstants_1 = require("../CalendarConstants");
exports.userCalendarSettingsUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        userCalendarSettingsId: 'ID',
        isActive: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const userCalendarSettingsRef = { id: params.userCalendarSettingsId, type: CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings };
        const newFields = {
            isActive: params.isActive,
        };
        plan.results.result = userCalendarSettingsRef.id;
        // REVIEW: check if I have access to the userCalendarSettings
        plan.ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: userCalendarSettingsRef,
            node: ctx.assignFields(CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings, newFields),
        });
        return plan;
    },
};
/**
 * To be used by fakebackend to make the entity when it first arrives from google.
 * This mutator won't be used when connected to Nsync, as entity will be created on the backend and will arrive through Nsync.
 */
exports.userCalendarSettingsCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    isInternal: true,
    params: {
        userCalendarSettingsId: 'ID',
        parentAccount: 'ID',
        isActive: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const userCalendarSettingsGenID = await ctx.generateDeterministicIDWithPrefix(trc, ctx.userID, CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings, params.userCalendarSettingsId);
        const userCalendarSettingsID = userCalendarSettingsGenID[1];
        const userCalendarSettingsRef = { id: userCalendarSettingsID, type: CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings };
        const newFields = {
            isActive: params.isActive,
        };
        const userCalendarSettingsEntity = await ctx.createEntity(userCalendarSettingsRef, newFields, ctx.userID);
        plan.results.result = userCalendarSettingsRef.id;
        plan.ops.push({
            changeType: 'Node:CREATE',
            node: userCalendarSettingsEntity,
            id: userCalendarSettingsGenID,
        }, {
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: params.parentAccount, srcType: CalendarConstants_1.CalendarEntityTypes.CalendarAccount, srcPort: 'userCalendarSettings',
                    dstID: userCalendarSettingsID, dstType: CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings, dstPort: 'parent',
                }],
        });
        return plan;
    },
};
//# sourceMappingURL=UserCalendarSettings.js.map