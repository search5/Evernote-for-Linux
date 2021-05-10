"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarUserCalendarSettingsUpdate = void 0;
const conduit_core_1 = require("conduit-core");
const en_data_model_1 = require("en-data-model");
exports.calendarUserCalendarSettingsUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        userCalendarSettingsId: 'ID',
        isActive: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const userCalendarSettingsRef = { id: params.userCalendarSettingsId, type: en_data_model_1.EntityTypes.UserCalendarSettings };
        const newFields = {
            isActive: params.isActive,
        };
        plan.results.result = userCalendarSettingsRef.id;
        // REVIEW: check if I have access to the userCalendarSettings
        plan.ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: userCalendarSettingsRef,
            node: ctx.assignFields(en_data_model_1.EntityTypes.UserCalendarSettings, newFields),
        });
        return plan;
    },
};
//# sourceMappingURL=UserCalendarSettings.js.map