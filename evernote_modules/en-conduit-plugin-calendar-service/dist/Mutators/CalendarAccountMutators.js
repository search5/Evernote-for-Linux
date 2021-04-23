"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarAccountCreate = exports.calendarAccountUpdate = void 0;
const conduit_core_1 = require("conduit-core");
const CalendarConstants_1 = require("../CalendarConstants");
exports.calendarAccountUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        calendarAccountId: 'ID',
        isConnected: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const calendarAccountRef = { id: params.calendarAccountId, type: CalendarConstants_1.CalendarEntityTypes.CalendarAccount };
        const newFields = {
            isConnected: params.isConnected,
        };
        plan.results.result = calendarAccountRef.id;
        plan.ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: calendarAccountRef,
            node: ctx.assignFields(CalendarConstants_1.CalendarEntityTypes.CalendarAccount, newFields),
        });
        return plan;
    },
};
/**
 * To be used by fakebackend to make the entity when it first arrives from google.
 * This mutator won't be used when connected to Nsync, as entity will be created on the backend and will arrive through Nsync.
 */
exports.calendarAccountCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    isInternal: true,
    params: {
        calendarAccountId: 'ID',
        isConnected: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const calendarAccountGenID = await ctx.generateDeterministicIDWithPrefix(trc, ctx.userID, CalendarConstants_1.CalendarEntityTypes.CalendarAccount, params.calendarAccountId);
        const calendarAccountID = calendarAccountGenID[1];
        const calendarAccountRef = { id: calendarAccountID, type: CalendarConstants_1.CalendarEntityTypes.CalendarAccount };
        const newFields = {
            isConnected: params.isConnected,
        };
        const calendarAccountEntity = await ctx.createEntity(calendarAccountRef, newFields, ctx.userID);
        plan.results.result = calendarAccountRef.id;
        plan.ops.push({
            changeType: 'Node:CREATE',
            node: calendarAccountEntity,
            id: calendarAccountGenID,
        });
        return plan;
    },
};
//# sourceMappingURL=CalendarAccountMutators.js.map