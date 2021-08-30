"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationGoalIndexConfig = exports.gamificationGoalTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
exports.gamificationGoalTypeDef = {
    name: en_data_model_1.EntityTypes.GamificationGoal,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    // nsyncFeatureGroup: 'Gamification',
    schema: {
        goal: 'number',
        level: 'number',
        created: 'timestamp',
        updated: 'timestamp',
    },
    fieldValidation: {
        goal: {
            min: 0,
            max: 99,
        },
        level: {
            min: 1,
            max: 99,
        },
    },
};
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