"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificaitonLevelsSchema = exports.GamificaitonLevels = exports.GamificationGoalTypesSchema = exports.GamificationGoalTypes = void 0;
const en_ts_utils_1 = require("en-ts-utils");
var GamificationGoalTypes;
(function (GamificationGoalTypes) {
    GamificationGoalTypes[GamificationGoalTypes["NoteTaker"] = 0] = "NoteTaker";
    GamificationGoalTypes[GamificationGoalTypes["Organizer"] = 1] = "Organizer";
    GamificationGoalTypes[GamificationGoalTypes["Creative"] = 2] = "Creative";
    GamificationGoalTypes[GamificationGoalTypes["Placeholder"] = 99] = "Placeholder";
})(GamificationGoalTypes = exports.GamificationGoalTypes || (exports.GamificationGoalTypes = {}));
exports.GamificationGoalTypesSchema = en_ts_utils_1.EnumWithKeys(GamificationGoalTypes, 'GamificationGoalTypes');
var GamificaitonLevels;
(function (GamificaitonLevels) {
    GamificaitonLevels[GamificaitonLevels["One"] = 1] = "One";
    GamificaitonLevels[GamificaitonLevels["Two"] = 2] = "Two";
    GamificaitonLevels[GamificaitonLevels["Three"] = 3] = "Three";
    GamificaitonLevels[GamificaitonLevels["Four"] = 4] = "Four";
    GamificaitonLevels[GamificaitonLevels["Five"] = 5] = "Five";
    GamificaitonLevels[GamificaitonLevels["Six"] = 6] = "Six";
    GamificaitonLevels[GamificaitonLevels["Seven"] = 7] = "Seven";
    GamificaitonLevels[GamificaitonLevels["Eight"] = 8] = "Eight";
    GamificaitonLevels[GamificaitonLevels["Nine"] = 9] = "Nine";
    GamificaitonLevels[GamificaitonLevels["Ten"] = 10] = "Ten";
    GamificaitonLevels[GamificaitonLevels["Placeholder"] = 99] = "Placeholder";
})(GamificaitonLevels = exports.GamificaitonLevels || (exports.GamificaitonLevels = {}));
exports.GamificaitonLevelsSchema = en_ts_utils_1.EnumWithKeys(GamificaitonLevels, 'GamificaitonLevels');
//# sourceMappingURL=GamificationGoalTypes.js.map