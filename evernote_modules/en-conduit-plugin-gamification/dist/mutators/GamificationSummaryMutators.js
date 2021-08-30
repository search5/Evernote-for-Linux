"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGamificationSummaryMutators = void 0;
const conduit_core_1 = require("conduit-core");
const GamificationGoalHelpers_1 = require("../helpers/GamificationGoalHelpers");
const GamificationSummaryHelpers_1 = require("../helpers/GamificationSummaryHelpers");
;
;
const gamificationInitialize = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        goal: 'number',
    },
    execute: async (trc, ctx, params) => {
        const { goal } = params;
        const plan = {
            results: {},
            ops: [],
        };
        await GamificationGoalHelpers_1.createGoal(trc, ctx, plan, goal);
        await GamificationSummaryHelpers_1.createSummary(trc, ctx, plan, goal);
        return plan;
    },
};
const gamificationSelectGoal = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        goal: 'number',
    },
    execute: async (trc, ctx, params) => {
        const { goal } = params;
        const plan = {
            results: {},
            ops: [],
        };
        await GamificationSummaryHelpers_1.selectGoal(trc, ctx, plan, goal);
        return plan;
    },
};
const createGamificationSummaryMutators = () => {
    return {
        gamificationInitialize,
        gamificationSelectGoal,
    };
};
exports.createGamificationSummaryMutators = createGamificationSummaryMutators;
//# sourceMappingURL=GamificationSummaryMutators.js.map