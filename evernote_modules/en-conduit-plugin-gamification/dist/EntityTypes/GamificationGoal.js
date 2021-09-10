"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationGoalIndexConfig = exports.generateGamificationGoalId = exports.gamificationGoalTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const en_gamification_data_model_1 = require("en-gamification-data-model");
exports.gamificationGoalTypeDef = {
    name: en_data_model_1.EntityTypes.GamificationGoal,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    // nsyncFeatureGroup: 'Gamification',
    schema: Object.assign(Object.assign({}, en_gamification_data_model_1.GamificationGoalEntitySchema.fields), { created: 'timestamp', updated: 'timestamp' }),
    fieldValidation: {
        goalType: {
            min: 0,
            max: 99,
        },
        level: {
            min: 1,
            max: 99,
        },
    },
};
async function generateGamificationGoalId(trc, ctx, goalType) {
    return await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.GamificationMilestone, en_data_model_1.DefaultDeterministicIdGenerator, [{
            parts: [goalType],
        }]);
}
exports.generateGamificationGoalId = generateGamificationGoalId;
// TO-DO: Complete the Index Config
exports.gamificationGoalIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.gamificationGoalTypeDef, {
    indexResolvers: {},
    queries: {
        GamificationGoals: {
            params: {},
        },
    },
});
//# sourceMappingURL=GamificationGoal.js.map