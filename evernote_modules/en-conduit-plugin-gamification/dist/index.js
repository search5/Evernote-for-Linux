"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENGamificationPlugin = void 0;
const en_data_model_1 = require("en-data-model");
const GamificationGoal_1 = require("./EntityTypes/GamificationGoal");
const GamificationMilestone_1 = require("./EntityTypes/GamificationMilestone");
const GamificationSummary_1 = require("./EntityTypes/GamificationSummary");
const GamificationMilestoneMutators_1 = require("./mutators/GamificationMilestoneMutators");
const GamificationSummaryMutators_1 = require("./mutators/GamificationSummaryMutators");
const CurrentGamificationGoal_1 = require("./queries/CurrentGamificationGoal");
function getENGamificationPlugin() {
    return {
        name: 'ENGamificaiton',
        defineQueries: di => {
            const queries = {
                GamificationCurrentGoal: CurrentGamificationGoal_1.gamificationCurrentGoalQuery,
            };
            return queries;
        },
        entityTypes: di => {
            const entityTypes = {
                [en_data_model_1.EntityTypes.GamificationSummary]: {
                    typeDef: GamificationSummary_1.gamificationSummaryTypeDef,
                    indexConfig: GamificationSummary_1.gamificationSummaryIndexConfig,
                    nsyncType: en_data_model_1.NSyncEntityType.GAMIFICATION_SUMMARY,
                },
                [en_data_model_1.EntityTypes.GamificationGoal]: {
                    typeDef: GamificationGoal_1.gamificationGoalTypeDef,
                    indexConfig: GamificationGoal_1.gamificationGoalIndexConfig,
                    nsyncType: en_data_model_1.NSyncEntityType.GAMIFICATION_GOAL,
                },
                [en_data_model_1.EntityTypes.GamificationMilestone]: {
                    typeDef: GamificationMilestone_1.gamificationMilestoneTypeDef,
                    indexConfig: GamificationMilestone_1.gamificationMilestoneIndexConfig,
                    nsyncType: en_data_model_1.NSyncEntityType.GAMIFICATION_MILESTONE,
                },
            };
            return entityTypes;
        },
        mutatorDefs: di => {
            const result = Object.assign(Object.assign({}, GamificationSummaryMutators_1.createGamificationSummaryMutators()), GamificationMilestoneMutators_1.createMilestoneMutators());
            return result;
        },
    };
}
exports.getENGamificationPlugin = getENGamificationPlugin;
//# sourceMappingURL=index.js.map