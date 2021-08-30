"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENGamificationPlugin = void 0;
const en_data_model_1 = require("en-data-model");
const GamificationGoal_1 = require("./EntityTypes/GamificationGoal");
const GamificationMilestone_1 = require("./EntityTypes/GamificationMilestone");
const GamificationSummary_1 = require("./EntityTypes/GamificationSummary");
const GamificationMilestoneMutators_1 = require("./mutators/GamificationMilestoneMutators");
const GamificationSummaryMutators_1 = require("./mutators/GamificationSummaryMutators");
function getENGamificationPlugin() {
    return {
        name: 'ENGamificaiton',
        defineQueries: di => {
            const queries = {};
            return queries;
        },
        entityTypes: di => {
            const entityTypes = {
                [en_data_model_1.EntityTypes.GamificationSummary]: {
                    typeDef: GamificationSummary_1.gamificationSummaryTypeDef,
                    indexConfig: GamificationSummary_1.gamificationSummaryIndexConfig,
                },
                [en_data_model_1.EntityTypes.GamificationGoal]: {
                    typeDef: GamificationGoal_1.gamificationGoalTypeDef,
                    indexConfig: GamificationGoal_1.gamificationGoalIndexConfig,
                },
                [en_data_model_1.EntityTypes.GamificationMilestone]: {
                    typeDef: GamificationMilestone_1.gamificationMilestoneTypeDef,
                    indexConfig: GamificationMilestone_1.gamificationMilestoneIndexConfig,
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