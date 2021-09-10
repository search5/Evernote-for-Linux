"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationSummaryIndexConfig = exports.generateGamificationSummaryId = exports.gamificationSummaryTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const en_gamification_data_model_1 = require("en-gamification-data-model");
exports.gamificationSummaryTypeDef = {
    name: en_data_model_1.EntityTypes.GamificationSummary,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    // nsyncFeatureGroup: 'Gamification',
    schema: Object.assign(Object.assign({}, en_gamification_data_model_1.GamificationSummaryEntitySchema.fields), { created: 'timestamp', updated: 'timestamp' }),
    fieldValidation: {
        selectedGoalType: {
            min: 0,
            max: 99,
        },
    },
};
async function generateGamificationSummaryId(trc, ctx) {
    return await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.GamificationMilestone, en_data_model_1.DefaultDeterministicIdGenerator);
}
exports.generateGamificationSummaryId = generateGamificationSummaryId;
// TO-DO: Complete the Index Config
exports.gamificationSummaryIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.gamificationSummaryTypeDef, {
    indexResolvers: {},
    queries: {
        GamificationSummaries: {
            params: {},
        },
    },
});
//# sourceMappingURL=GamificationSummary.js.map