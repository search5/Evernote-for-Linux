"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.milestoneData = exports.GamificaitonLevelsMilestones = exports.GamificationMilestoneKeysSchema = exports.GamificationMilestoneKeys = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const GamificationGoalTypes_1 = require("./GamificationGoalTypes");
var GamificationMilestoneKeys;
(function (GamificationMilestoneKeys) {
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToTourNoteEditor"] = 0] = "HowToTourNoteEditor";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToScanWhiteboards"] = 1] = "HowToScanWhiteboards";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToCreateTags"] = 2] = "HowToCreateTags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToCaptureWebContent"] = 3] = "HowToCaptureWebContent";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToChangeViewOptions"] = 4] = "HowToChangeViewOptions";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToCreateNotebooks"] = 5] = "HowToCreateNotebooks";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToSetupShortcutNote"] = 6] = "HowToSetupShortcutNote";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToSearch"] = 7] = "HowToSearch";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToUseFiltersToSearch"] = 8] = "HowToUseFiltersToSearch";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreateProjectPlan"] = 9] = "DoCreateProjectPlan";
    GamificationMilestoneKeys[GamificationMilestoneKeys["HowToConnectIFTTT"] = 10] = "HowToConnectIFTTT";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate1Notes"] = 11] = "DoCreate1Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate3Notes"] = 12] = "DoCreate3Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate6Notes"] = 13] = "DoCreate6Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate9Notes"] = 14] = "DoCreate9Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate10Notes"] = 15] = "DoCreate10Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate40Notes"] = 16] = "DoCreate40Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate55Notes"] = 17] = "DoCreate55Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate60Notes"] = 18] = "DoCreate60Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate70Notes"] = 19] = "DoCreate70Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate80Notes"] = 20] = "DoCreate80Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate90Notes"] = 21] = "DoCreate90Notes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate10MultimediaNotes"] = 22] = "DoCreate10MultimediaNotes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate20MultimediaNotes"] = 23] = "DoCreate20MultimediaNotes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate40MultimediaNotes"] = 24] = "DoCreate40MultimediaNotes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate80MultimediaNotes"] = 25] = "DoCreate80MultimediaNotes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate120MultimediaNotes"] = 26] = "DoCreate120MultimediaNotes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoCreate160MultimediaNotes"] = 27] = "DoCreate160MultimediaNotes";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddATag"] = 28] = "DoAddATag";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAdd2Tags"] = 29] = "DoAdd2Tags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAdd5Tags"] = 30] = "DoAdd5Tags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAdd10Tags"] = 31] = "DoAdd10Tags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAdd15Tags"] = 32] = "DoAdd15Tags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAdd25Tags"] = 33] = "DoAdd25Tags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAdd50Tags"] = 34] = "DoAdd50Tags";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddANotebook"] = 35] = "DoAddANotebook";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddNotebookEN1"] = 36] = "DoAddNotebookEN1";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddNotebookEN2"] = 37] = "DoAddNotebookEN2";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddNotebookEN3"] = 38] = "DoAddNotebookEN3";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddNotebookEN4"] = 39] = "DoAddNotebookEN4";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddNotebookEN5"] = 40] = "DoAddNotebookEN5";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddNotebookEN6"] = 41] = "DoAddNotebookEN6";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddAttachement"] = 42] = "DoAddAttachement";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAttachAWebClip"] = 43] = "DoAttachAWebClip";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAddSketchNote"] = 44] = "DoAddSketchNote";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoUseEvernote2Days"] = 45] = "DoUseEvernote2Days";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoUseEvernote3Days"] = 46] = "DoUseEvernote3Days";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAttachAFile"] = 47] = "DoAttachAFile";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoAttachAnImage"] = 48] = "DoAttachAnImage";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoSetAReminder"] = 49] = "DoSetAReminder";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoRecordAudioNote"] = 50] = "DoRecordAudioNote";
    GamificationMilestoneKeys[GamificationMilestoneKeys["DoSaveSearch"] = 51] = "DoSaveSearch";
    GamificationMilestoneKeys[GamificationMilestoneKeys["Read5CreativeMinds"] = 52] = "Read5CreativeMinds";
    GamificationMilestoneKeys[GamificationMilestoneKeys["ReadEvernotesBeginnerGuide"] = 53] = "ReadEvernotesBeginnerGuide";
    GamificationMilestoneKeys[GamificationMilestoneKeys["Read38Things"] = 54] = "Read38Things";
    GamificationMilestoneKeys[GamificationMilestoneKeys["ReadScanDocuments"] = 55] = "ReadScanDocuments";
    GamificationMilestoneKeys[GamificationMilestoneKeys["ReadGettingThingsDone"] = 56] = "ReadGettingThingsDone";
    GamificationMilestoneKeys[GamificationMilestoneKeys["WatchEvernoteForGmail"] = 57] = "WatchEvernoteForGmail";
    GamificationMilestoneKeys[GamificationMilestoneKeys["Placeholder"] = 999] = "Placeholder";
})(GamificationMilestoneKeys = exports.GamificationMilestoneKeys || (exports.GamificationMilestoneKeys = {}));
exports.GamificationMilestoneKeysSchema = en_ts_utils_1.EnumWithKeys(GamificationMilestoneKeys, 'GamificationMilestoneKeys');
const noteTakerGamificaitonLevels = new Map([
    [GamificationGoalTypes_1.GamificaitonLevels.One,
        [
            GamificationMilestoneKeys.HowToTourNoteEditor,
            GamificationMilestoneKeys.DoCreate1Notes
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Two,
        [
            GamificationMilestoneKeys.HowToScanWhiteboards,
            GamificationMilestoneKeys.DoCreate3Notes,
            GamificationMilestoneKeys.DoAddAttachement,
            GamificationMilestoneKeys.DoUseEvernote2Days
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Three,
        [
            GamificationMilestoneKeys.HowToChangeViewOptions,
            GamificationMilestoneKeys.DoCreate6Notes,
            GamificationMilestoneKeys.DoAddSketchNote,
            GamificationMilestoneKeys.DoUseEvernote3Days
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Four,
        [
            GamificationMilestoneKeys.HowToSetupShortcutNote,
            GamificationMilestoneKeys.DoCreate9Notes,
            GamificationMilestoneKeys.DoSetAReminder,
            GamificationMilestoneKeys.DoRecordAudioNote
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Five,
        [
            GamificationMilestoneKeys.DoCreate40Notes,
            GamificationMilestoneKeys.DoCreate10MultimediaNotes,
            GamificationMilestoneKeys.DoAdd2Tags,
            GamificationMilestoneKeys.DoAddNotebookEN1
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Six,
        [
            GamificationMilestoneKeys.DoCreate55Notes,
            GamificationMilestoneKeys.DoCreate20MultimediaNotes,
            GamificationMilestoneKeys.DoAdd5Tags,
            GamificationMilestoneKeys.DoAddNotebookEN2
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Seven,
        [GamificationMilestoneKeys.DoCreate60Notes,
            GamificationMilestoneKeys.DoCreate40MultimediaNotes,
            GamificationMilestoneKeys.DoAdd10Tags,
            GamificationMilestoneKeys.DoAddNotebookEN3
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Eight,
        [
            GamificationMilestoneKeys.DoCreate70Notes,
            GamificationMilestoneKeys.DoCreate80MultimediaNotes,
            GamificationMilestoneKeys.DoAdd15Tags,
            GamificationMilestoneKeys.DoAddNotebookEN4
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Nine,
        [
            GamificationMilestoneKeys.DoCreate80Notes,
            GamificationMilestoneKeys.DoCreate120MultimediaNotes,
            GamificationMilestoneKeys.DoAdd25Tags,
            GamificationMilestoneKeys.DoAddNotebookEN5
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Ten,
        [
            GamificationMilestoneKeys.DoCreate90Notes,
            GamificationMilestoneKeys.DoCreate160MultimediaNotes,
            GamificationMilestoneKeys.DoAdd50Tags,
            GamificationMilestoneKeys.DoAddNotebookEN6
        ]
    ],
]);
const organizerGamificaitonLevels = new Map([
    [GamificationGoalTypes_1.GamificaitonLevels.One,
        [
            GamificationMilestoneKeys.HowToTourNoteEditor,
            GamificationMilestoneKeys.DoCreate1Notes
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Two,
        [
            GamificationMilestoneKeys.HowToCreateTags,
            GamificationMilestoneKeys.DoCreate3Notes,
            GamificationMilestoneKeys.DoAddATag,
            GamificationMilestoneKeys.DoUseEvernote2Days
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Three,
        [
            GamificationMilestoneKeys.HowToCreateNotebooks,
            GamificationMilestoneKeys.DoCreate60Notes,
            GamificationMilestoneKeys.DoAddANotebook,
            GamificationMilestoneKeys.DoUseEvernote3Days
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Four,
        [
            GamificationMilestoneKeys.HowToSearch,
            GamificationMilestoneKeys.DoSaveSearch,
            GamificationMilestoneKeys.DoCreate10Notes,
            GamificationMilestoneKeys.HowToUseFiltersToSearch
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Five,
        [
            GamificationMilestoneKeys.DoCreate40Notes,
            GamificationMilestoneKeys.DoCreate10MultimediaNotes,
            GamificationMilestoneKeys.DoAdd2Tags,
            GamificationMilestoneKeys.DoAddNotebookEN1
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Six,
        [
            GamificationMilestoneKeys.DoCreate55Notes,
            GamificationMilestoneKeys.DoCreate20MultimediaNotes,
            GamificationMilestoneKeys.DoAdd5Tags,
            GamificationMilestoneKeys.DoAddNotebookEN2
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Seven,
        [GamificationMilestoneKeys.DoCreate60Notes,
            GamificationMilestoneKeys.DoCreate40MultimediaNotes,
            GamificationMilestoneKeys.DoAdd10Tags,
            GamificationMilestoneKeys.DoAddNotebookEN3
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Eight,
        [
            GamificationMilestoneKeys.DoCreate70Notes,
            GamificationMilestoneKeys.DoCreate80MultimediaNotes,
            GamificationMilestoneKeys.DoAdd15Tags,
            GamificationMilestoneKeys.DoAddNotebookEN4
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Nine,
        [
            GamificationMilestoneKeys.DoCreate80Notes,
            GamificationMilestoneKeys.DoCreate120MultimediaNotes,
            GamificationMilestoneKeys.DoAdd25Tags,
            GamificationMilestoneKeys.DoAddNotebookEN5
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Ten,
        [
            GamificationMilestoneKeys.DoCreate90Notes,
            GamificationMilestoneKeys.DoCreate160MultimediaNotes,
            GamificationMilestoneKeys.DoAdd50Tags,
            GamificationMilestoneKeys.DoAddNotebookEN6
        ]
    ],
]);
const creativeGamificaitonLevels = new Map([
    [GamificationGoalTypes_1.GamificaitonLevels.One,
        [
            GamificationMilestoneKeys.HowToTourNoteEditor,
            GamificationMilestoneKeys.DoCreate1Notes
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Two,
        [
            GamificationMilestoneKeys.Read5CreativeMinds,
            GamificationMilestoneKeys.ReadEvernotesBeginnerGuide,
            GamificationMilestoneKeys.HowToCaptureWebContent,
            GamificationMilestoneKeys.DoAttachAWebClip
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Three,
        [
            GamificationMilestoneKeys.Read38Things,
            GamificationMilestoneKeys.ReadScanDocuments,
            GamificationMilestoneKeys.DoAttachAFile,
            GamificationMilestoneKeys.DoAttachAnImage
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Four,
        [
            GamificationMilestoneKeys.ReadGettingThingsDone,
            GamificationMilestoneKeys.WatchEvernoteForGmail,
            GamificationMilestoneKeys.DoCreateProjectPlan,
            GamificationMilestoneKeys.HowToConnectIFTTT
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Five,
        [
            GamificationMilestoneKeys.DoCreate40Notes,
            GamificationMilestoneKeys.DoCreate10MultimediaNotes,
            GamificationMilestoneKeys.DoAdd2Tags,
            GamificationMilestoneKeys.DoAddNotebookEN1
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Six,
        [
            GamificationMilestoneKeys.DoCreate55Notes,
            GamificationMilestoneKeys.DoCreate20MultimediaNotes,
            GamificationMilestoneKeys.DoAdd5Tags,
            GamificationMilestoneKeys.DoAddNotebookEN2
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Seven,
        [
            GamificationMilestoneKeys.DoCreate60Notes,
            GamificationMilestoneKeys.DoCreate40MultimediaNotes,
            GamificationMilestoneKeys.DoAdd10Tags,
            GamificationMilestoneKeys.DoAddNotebookEN3
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Eight,
        [
            GamificationMilestoneKeys.DoCreate70Notes,
            GamificationMilestoneKeys.DoCreate80MultimediaNotes,
            GamificationMilestoneKeys.DoAdd15Tags,
            GamificationMilestoneKeys.DoAddNotebookEN4
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Nine,
        [
            GamificationMilestoneKeys.DoCreate80Notes,
            GamificationMilestoneKeys.DoCreate120MultimediaNotes,
            GamificationMilestoneKeys.DoAdd25Tags,
            GamificationMilestoneKeys.DoAddNotebookEN5
        ]
    ],
    [GamificationGoalTypes_1.GamificaitonLevels.Ten,
        [
            GamificationMilestoneKeys.DoCreate90Notes,
            GamificationMilestoneKeys.DoCreate160MultimediaNotes,
            GamificationMilestoneKeys.DoAdd50Tags,
            GamificationMilestoneKeys.DoAddNotebookEN6
        ]
    ],
]);
exports.GamificaitonLevelsMilestones = new Map([
    [GamificationGoalTypes_1.GamificationGoalTypes.NoteTaker, noteTakerGamificaitonLevels],
    [GamificationGoalTypes_1.GamificationGoalTypes.Organizer, organizerGamificaitonLevels],
    [GamificationGoalTypes_1.GamificationGoalTypes.Creative, creativeGamificaitonLevels],
]);
exports.milestoneData = {
    [GamificationMilestoneKeys.HowToTourNoteEditor]: {
        totalTokens: 10,
    },
    [GamificationMilestoneKeys.HowToScanWhiteboards]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.HowToCreateTags]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.HowToCaptureWebContent]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.HowToChangeViewOptions]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.HowToCreateNotebooks]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.HowToSetupShortcutNote]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.HowToSearch]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.HowToUseFiltersToSearch]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.DoCreateProjectPlan]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.HowToConnectIFTTT]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.DoCreate1Notes]: {
        totalTokens: 10,
    },
    [GamificationMilestoneKeys.DoCreate3Notes]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.DoCreate6Notes]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.DoCreate9Notes]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.DoCreate10Notes]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.DoCreate40Notes]: {
        totalTokens: 200,
    },
    [GamificationMilestoneKeys.DoCreate55Notes]: {
        totalTokens: 800,
    },
    [GamificationMilestoneKeys.DoCreate60Notes]: {
        totalTokens: 1600,
    },
    [GamificationMilestoneKeys.DoCreate70Notes]: {
        totalTokens: 2000,
    },
    [GamificationMilestoneKeys.DoCreate80Notes]: {
        totalTokens: 3200,
    },
    [GamificationMilestoneKeys.DoCreate90Notes]: {
        totalTokens: 6400,
    },
    [GamificationMilestoneKeys.DoCreate10MultimediaNotes]: {
        totalTokens: 200,
    },
    [GamificationMilestoneKeys.DoCreate20MultimediaNotes]: {
        totalTokens: 800,
    },
    [GamificationMilestoneKeys.DoCreate40MultimediaNotes]: {
        totalTokens: 1600,
    },
    [GamificationMilestoneKeys.DoCreate80MultimediaNotes]: {
        totalTokens: 2000,
    },
    [GamificationMilestoneKeys.DoCreate120MultimediaNotes]: {
        totalTokens: 3200,
    },
    [GamificationMilestoneKeys.DoCreate160MultimediaNotes]: {
        totalTokens: 6400,
    },
    [GamificationMilestoneKeys.DoAddATag]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.DoAdd2Tags]: {
        totalTokens: 100,
    },
    [GamificationMilestoneKeys.DoAdd5Tags]: {
        totalTokens: 400,
    },
    [GamificationMilestoneKeys.DoAdd10Tags]: {
        totalTokens: 800,
    },
    [GamificationMilestoneKeys.DoAdd15Tags]: {
        totalTokens: 1000,
    },
    [GamificationMilestoneKeys.DoAdd25Tags]: {
        totalTokens: 1600,
    },
    [GamificationMilestoneKeys.DoAdd50Tags]: {
        totalTokens: 3200,
    },
    [GamificationMilestoneKeys.DoAddANotebook]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.DoAddNotebookEN1]: {
        totalTokens: 100,
    },
    [GamificationMilestoneKeys.DoAddNotebookEN2]: {
        totalTokens: 400,
    },
    [GamificationMilestoneKeys.DoAddNotebookEN3]: {
        totalTokens: 800,
    },
    [GamificationMilestoneKeys.DoAddNotebookEN4]: {
        totalTokens: 1000,
    },
    [GamificationMilestoneKeys.DoAddNotebookEN5]: {
        totalTokens: 1600,
    },
    [GamificationMilestoneKeys.DoAddNotebookEN6]: {
        totalTokens: 3200,
    },
    [GamificationMilestoneKeys.DoAddAttachement]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.DoAttachAWebClip]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.DoAddSketchNote]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.DoUseEvernote2Days]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.DoUseEvernote3Days]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.DoAttachAFile]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.DoAttachAnImage]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.DoSetAReminder]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.DoRecordAudioNote]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.DoSaveSearch]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.Read5CreativeMinds]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.ReadEvernotesBeginnerGuide]: {
        totalTokens: 30,
    },
    [GamificationMilestoneKeys.Read38Things]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.ReadScanDocuments]: {
        totalTokens: 60,
    },
    [GamificationMilestoneKeys.ReadGettingThingsDone]: {
        totalTokens: 90,
    },
    [GamificationMilestoneKeys.WatchEvernoteForGmail]: {
        totalTokens: 90,
    },
};
//# sourceMappingURL=GamificationMilestoneKeys.js.map