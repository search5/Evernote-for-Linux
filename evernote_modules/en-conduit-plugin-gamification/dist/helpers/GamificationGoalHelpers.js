"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelUp = exports.createGoal = void 0;
const en_data_model_1 = require("en-data-model");
const GamificationMilestoneHelpers_1 = require("./GamificationMilestoneHelpers");
async function createGoal(trc, ctx, plan, goal) {
    const gamificationGoalGenId = await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.GamificationGoal, en_data_model_1.DefaultDeterministicIdGenerator, [{
            parts: [goal],
        }]);
    const gamificationGoalId = gamificationGoalGenId[1];
    const goalRef = { type: en_data_model_1.EntityTypes.GamificationGoal, id: gamificationGoalId };
    const existingGoal = await ctx.fetchEntity(trc, goalRef);
    if (!existingGoal) {
        const newGoal = ctx.createEntity(goalRef, {
            goal,
            level: 1,
        }, ctx.userID);
        plan.ops.push({
            changeType: 'Node:CREATE',
            node: newGoal,
            id: gamificationGoalGenId,
        });
    }
    await GamificationMilestoneHelpers_1.milestoneCreateForLevel(trc, ctx, plan, 1, goal);
}
exports.createGoal = createGoal;
async function levelUp(trc, ctx, plan) {
    // 1. Check if all milestones for the given level are complete
    // 2. Increment GAMIFICATION_LEVEL if all levels are complete
    // 3. Create a new set of Gamification milestones for the new level (there is a function to do this)
}
exports.levelUp = levelUp;
//# sourceMappingURL=GamificationGoalHelpers.js.map