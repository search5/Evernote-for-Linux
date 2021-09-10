"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGamificationSummaryMutators = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_gamification_data_model_1 = require("en-gamification-data-model");
const GamificationGoalHelpers_1 = require("../helpers/GamificationGoalHelpers");
const GamificationSummaryHelpers_1 = require("../helpers/GamificationSummaryHelpers");
;
;
const gamificationInitialize = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        goalType: 'number',
    },
    execute: async (trc, ctx, params) => {
        const { goalType: goalTypeUnsafe } = params;
        if (!Object.values(en_gamification_data_model_1.GamificationGoalTypes).includes(goalTypeUnsafe)) {
            throw new conduit_utils_1.MalformedDataError('Invalid GoalType! Only values from the GamificationGoalTypes enumuration are accepted.');
        }
        const goalType = goalTypeUnsafe;
        const plan = {
            results: {},
            ops: [],
        };
        await GamificationGoalHelpers_1.createGoal(trc, ctx, plan, goalType);
        await GamificationSummaryHelpers_1.createSummary(trc, ctx, plan, goalType);
        return plan;
    },
};
const gamificationSelectGoal = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        goalType: 'number',
    },
    execute: async (trc, ctx, params) => {
        const { goalType: goalTypeUnsafe } = params;
        if (!Object.values(en_gamification_data_model_1.GamificationGoalTypes).includes(goalTypeUnsafe)) {
            throw new conduit_utils_1.MalformedDataError('Invalid GoalType! Only values from the GamificationGoalTypes enumuration are accepted.');
        }
        const goalType = goalTypeUnsafe;
        const plan = {
            results: {},
            ops: [],
        };
        await GamificationSummaryHelpers_1.selectGoal(trc, ctx, plan, goalType);
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