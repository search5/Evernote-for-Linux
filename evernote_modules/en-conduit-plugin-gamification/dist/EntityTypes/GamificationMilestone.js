"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationMilestoneIndexConfig = exports.gamificationMilestoneTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
exports.gamificationMilestoneTypeDef = {
    name: en_data_model_1.EntityTypes.GamificationMilestone,
    syncSource: conduit_storage_1.SyncSource.LOCAL,
    // nsyncFeatureGroup: 'Gamification',
    schema: {
        milestoneKey: 'number',
        complete: 'boolean',
        progress: 'number',
        created: 'timestamp',
        updated: 'timestamp',
    },
    fieldValidation: {
        milestoneKey: {
            min: 0,
            max: 999,
        },
    },
};
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