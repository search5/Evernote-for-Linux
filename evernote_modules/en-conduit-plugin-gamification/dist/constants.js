"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelTypes = exports.Levels = exports.goalTypes = exports.Goal = exports.SCHEMA_VERSION = void 0;
exports.SCHEMA_VERSION = 1;
var Goal;
(function (Goal) {
    Goal[Goal["NoteTaker"] = 0] = "NoteTaker";
    Goal[Goal["Organizer"] = 1] = "Organizer";
    Goal[Goal["Creative"] = 2] = "Creative";
})(Goal = exports.Goal || (exports.Goal = {}));
exports.goalTypes = Object.values(Goal);
var Levels;
(function (Levels) {
    Levels[Levels["Level1"] = 1] = "Level1";
    Levels[Levels["Level2"] = 2] = "Level2";
    Levels[Levels["Level3"] = 3] = "Level3";
    Levels[Levels["Level4"] = 4] = "Level4";
    Levels[Levels["Level5"] = 5] = "Level5";
    Levels[Levels["Level6"] = 6] = "Level6";
    Levels[Levels["Level7"] = 7] = "Level7";
    Levels[Levels["Level8"] = 8] = "Level8";
    Levels[Levels["Level9"] = 9] = "Level9";
    Levels[Levels["Level10"] = 10] = "Level10";
})(Levels = exports.Levels || (exports.Levels = {}));
exports.levelTypes = Object.values(Levels);
//# sourceMappingURL=constants.js.map