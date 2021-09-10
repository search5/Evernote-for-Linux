"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationMilestoneIndexConfig = exports.generateGamificationMilestoneId = exports.gamificationMilestoneTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const en_gamification_data_model_1 = require("en-gamification-data-model");
exports.gamificationMilestoneTypeDef = {
    name: en_data_model_1.EntityTypes.GamificationMilestone,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    // nsyncFeatureGroup: 'Gamification',
    schema: Object.assign(Object.assign({}, en_gamification_data_model_1.GamificationMilestoneEntitySchema.fields), { created: 'timestamp', updated: 'timestamp' }),
    fieldValidation: {
        milestoneKey: {
            min: 0,
            max: 999,
        },
    },
};
async function generateGamificationMilestoneId(trc, ctx, milestoneKey) {
    return await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.GamificationMilestone, en_data_model_1.DefaultDeterministicIdGenerator, en_gamification_data_model_1.formDeterministicGamificationMilestoneIdParts(ctx.userID, milestoneKey));
}
exports.generateGamificationMilestoneId = generateGamificationMilestoneId;
// TO-DO: Complete the Index Config
exports.gamificationMilestoneIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.gamificationMilestoneTypeDef, {
    indexResolvers: {},
    queries: {
        GamificationMilestones: {
            params: {},
        },
    },
});
//# sourceMappingURL=GamificationMilestone.js.map