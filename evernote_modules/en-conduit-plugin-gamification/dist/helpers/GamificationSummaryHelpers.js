"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectGoal = exports.createSummary = void 0;
async function createSummary(trc, ctx, plan, goal) {
    // 1. Check if Gamification Summary record exists
    // 2. If not record exists, crate a GAMIFICATION_SUMMARY record with the selected goal specified
}
exports.createSummary = createSummary;
async function selectGoal(trc, ctx, plan, goal) {
    // 1. Update the selectedGoal in the GAMIFICATION_SUMMARY record
}
exports.selectGoal = selectGoal;
//# sourceMappingURL=GamificationSummaryHelpers.js.map