"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationSummaryIndexConfig = exports.gamificationSummaryTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
exports.gamificationSummaryTypeDef = {
    name: en_data_model_1.EntityTypes.GamificationSummary,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    // nsyncFeatureGroup: 'Gamification',
    schema: {
        selectedGoal: 'number',
        created: 'timestamp',
        updated: 'timestamp',
    },
    fieldValidation: {
        selectedGoal: {
            min: 0,
            max: 99,
        },
    },
};
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