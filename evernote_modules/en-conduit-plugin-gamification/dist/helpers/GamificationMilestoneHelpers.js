"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.milestoneCreateForLevel = exports.gamificaionNotebookIncrement = exports.gamificaionTagIncrement = exports.gamificaionNoteIncrement = exports.incrementMilesone = exports.milestoneComplete = exports.milestoneCreate = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_gamification_data_model_1 = require("en-gamification-data-model");
const GamificationMilestone_1 = require("../EntityTypes/GamificationMilestone");
const GamificationGoalHelpers_1 = require("./GamificationGoalHelpers");
async function milestoneCreate(trc, ctx, plan, milestoneKey) {
    const gamificationMilestoneGenId = await GamificationMilestone_1.generateGamificationMilestoneId(trc, ctx, milestoneKey);
    const gamificationMilestoneId = gamificationMilestoneGenId[1];
    const milestoneRef = { type: en_data_model_1.EntityTypes.GamificationMilestone, id: gamificationMilestoneId };
    const existingMilestone = await ctx.fetchEntity(trc, milestoneRef);
    if (!existingMilestone) {
        const newMilestone = ctx.createEntity(milestoneRef, {
            milestoneKey,
            complete: false,
            progress: 0,
        }, ctx.userID);
        plan.results = {
            result: gamificationMilestoneId,
        };
        plan.ops.push({
            changeType: 'Node:CREATE',
            node: newMilestone,
            id: gamificationMilestoneGenId,
        });
    }
}
exports.milestoneCreate = milestoneCreate;
async function milestoneComplete(trc, ctx, plan, milestoneKey) {
    const gamificationMilestoneGenId = await GamificationMilestone_1.generateGamificationMilestoneId(trc, ctx, milestoneKey);
    const gamificationMilestoneId = gamificationMilestoneGenId[1];
    const milestoneRef = { type: en_data_model_1.EntityTypes.GamificationMilestone, id: gamificationMilestoneId };
    const existingMilestone = await ctx.fetchEntity(trc, milestoneRef);
    if (!existingMilestone) {
        throw new conduit_utils_1.NotFoundError(gamificationMilestoneId, 'No milestone with milestoneKey: ' + milestoneKey + ' exists!');
    }
    plan.ops.push({
        changeType: 'Node:UPDATE',
        node: ctx.assignFields(en_data_model_1.EntityTypes.GamificationMilestone, {
            complete: true,
        }),
        nodeRef: milestoneRef,
    });
    await GamificationGoalHelpers_1.levelUp(trc, ctx, plan);
}
exports.milestoneComplete = milestoneComplete;
async function incrementMilesone(trc, ctx, plan, milestoneKey) {
    // Increment the milesotne by 1
    // Check the the new progress value is enough to mark the milestone as "complete"
}
exports.incrementMilesone = incrementMilesone;
async function gamificaionNoteIncrement(trc, ctx, plan, milestoneKey) {
    // Load the user’s current goal
    // Check to see if the current goal has any milestones that count how many notes the user has completed and that such milestone(s) are not completed
    // Increment the loaded note milestones’ progress by 1
}
exports.gamificaionNoteIncrement = gamificaionNoteIncrement;
async function gamificaionTagIncrement(trc, ctx, plan, milestoneKey) {
    // Load the user’s current goal
    // Check to see if the current goal has any milestones that count how many tags the user has completed and that such milestone(s) are not completed
    // Increment the loaded tag milestones’ progress by 1
}
exports.gamificaionTagIncrement = gamificaionTagIncrement;
async function gamificaionNotebookIncrement(trc, ctx, plan, milestoneKey) {
    // Load the user’s current goal
    // Check to see if the current goal has any milestones that count how many notebooks the user has completed and that such milestone(s) are not completed
    // Increment the loaded notebook milestones’ progress by 1
}
exports.gamificaionNotebookIncrement = gamificaionNotebookIncrement;
async function milestoneCreateForLevel(trc, ctx, plan, goal, level) {
    var _a, _b;
    const milestoneKeys = (_b = (_a = en_gamification_data_model_1.GamificaitonLevelsMilestones.get(goal)) === null || _a === void 0 ? void 0 : _a.get(level)) !== null && _b !== void 0 ? _b : [];
    await conduit_utils_1.allSettled(milestoneKeys.map(milestone => milestoneCreate(trc, ctx, plan, milestone)));
}
exports.milestoneCreateForLevel = milestoneCreateForLevel;
//# sourceMappingURL=GamificationMilestoneHelpers.js.map