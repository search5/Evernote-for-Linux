"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 * 0_NKGKB|21
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMilestoneMutators = void 0;
const conduit_core_1 = require("conduit-core");
const GamificationMilestoneHelpers_1 = require("../helpers/GamificationMilestoneHelpers");
;
;
const gamificationMilestoneMarkComplete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        milestoneKey: 'number',
    },
    execute: async (trc, ctx, params) => {
        const { milestoneKey, } = params;
        const plan = {
            results: {
                result: null,
            },
            ops: [],
        };
        await GamificationMilestoneHelpers_1.milestoneComplete(trc, ctx, plan, milestoneKey);
        return plan;
    },
};
const gamificationMilestoneMarkIncement = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    params: {
        milestoneKey: 'number',
    },
    execute: async (trc, ctx, params) => {
        const { milestoneKey, } = params;
        const plan = {
            results: {},
            ops: [],
        };
        await GamificationMilestoneHelpers_1.incrementMilesone(trc, ctx, plan, milestoneKey);
        return plan;
    },
};
const createMilestoneMutators = () => {
    return {
        gamificationMilestoneMarkComplete,
        gamificationMilestoneMarkIncement,
    };
};
exports.createMilestoneMutators = createMilestoneMutators;
//# sourceMappingURL=GamificationMilestoneMutators.js.map