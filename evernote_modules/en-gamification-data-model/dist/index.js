"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationEntitySchemas = void 0;
const en_data_model_1 = require("en-data-model");
const GamificationGoalEntity_1 = require("./entities/GamificationGoalEntity");
const GamificationMilestoneEntity_1 = require("./entities/GamificationMilestoneEntity");
const GamificationSummaryEntity_1 = require("./entities/GamificationSummaryEntity");
__exportStar(require("./entities/GamificationGoalEntity"), exports);
__exportStar(require("./entities/GamificationMilestoneEntity"), exports);
__exportStar(require("./entities/GamificationSummaryEntity"), exports);
__exportStar(require("./schema/GamificationMilestoneSchema"), exports);
__exportStar(require("./types/GamificationGoalTypes"), exports);
__exportStar(require("./types/GamificationMilestoneKeys"), exports);
exports.GamificationEntitySchemas = {
    [en_data_model_1.EntityTypes.GamificationGoal]: GamificationGoalEntity_1.GamificationGoalEntitySchema,
    [en_data_model_1.EntityTypes.GamificationMilestone]: GamificationMilestoneEntity_1.GamificationMilestoneEntitySchema,
    [en_data_model_1.EntityTypes.GamificationSummary]: GamificationSummaryEntity_1.GamificationSummaryEntitySchema,
};
//# sourceMappingURL=index.js.map