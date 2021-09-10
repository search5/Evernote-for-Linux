"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelUp = exports.createGoal = void 0;
const en_data_model_1 = require("en-data-model");
const en_gamification_data_model_1 = require("en-gamification-data-model");
const GamificationGoal_1 = require("../EntityTypes/GamificationGoal");
const GamificationMilestoneHelpers_1 = require("./GamificationMilestoneHelpers");
async function createGoal(trc, ctx, plan, goalType) {
    const gamificationGoalGenId = await GamificationGoal_1.generateGamificationGoalId(trc, ctx, goalType);
    const gamificationGoalId = gamificationGoalGenId[1];
    const goalRef = { type: en_data_model_1.EntityTypes.GamificationGoal, id: gamificationGoalId };
    const existingGoal = await ctx.fetchEntity(trc, goalRef);
    if (!existingGoal) {
        const newGoal = ctx.createEntity(goalRef, {
            goalType,
            level: en_gamification_data_model_1.GamificaitonLevels.One,
        }, ctx.userID);
        plan.ops.push({
            changeType: 'Node:CREATE',
            node: newGoal,
            id: gamificationGoalGenId,
        });
    }
    await GamificationMilestoneHelpers_1.milestoneCreateForLevel(trc, ctx, plan, goalType, en_gamification_data_model_1.GamificaitonLevels.One);
}
exports.createGoal = createGoal;
async function levelUp(trc, ctx, plan) {
    // 1. Check if all milestones for the given level are complete
    // 2. Increment GAMIFICATION_LEVEL if all levels are complete
    // 3. Create a new set of Gamification milestones for the new level (there is a function to do this)
}
exports.levelUp = levelUp;
//# sourceMappingURL=GamificationGoalHelpers.js.map