"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.milestoneData = exports.levelMilestones = exports.MilestoneKey = void 0;
const constants_1 = require("./constants");
var MilestoneKey;
(function (MilestoneKey) {
    MilestoneKey[MilestoneKey["HowToTourNoteEditor"] = 0] = "HowToTourNoteEditor";
    MilestoneKey[MilestoneKey["HowToScanWhiteboards"] = 1] = "HowToScanWhiteboards";
    MilestoneKey[MilestoneKey["HowToCreateTags"] = 2] = "HowToCreateTags";
    MilestoneKey[MilestoneKey["HowToCaptureWebContent"] = 3] = "HowToCaptureWebContent";
    MilestoneKey[MilestoneKey["HowToChangeViewOptions"] = 4] = "HowToChangeViewOptions";
    MilestoneKey[MilestoneKey["HowToCreateNotebooks"] = 5] = "HowToCreateNotebooks";
    MilestoneKey[MilestoneKey["HowToSetupShortcutNote"] = 6] = "HowToSetupShortcutNote";
    MilestoneKey[MilestoneKey["HowToSearch"] = 7] = "HowToSearch";
    MilestoneKey[MilestoneKey["HowToUseFiltersToSearch"] = 8] = "HowToUseFiltersToSearch";
    MilestoneKey[MilestoneKey["DoCreateProjectPlan"] = 9] = "DoCreateProjectPlan";
    MilestoneKey[MilestoneKey["HowToConnectIFTTT"] = 10] = "HowToConnectIFTTT";
    MilestoneKey[MilestoneKey["DoCreate1Notes"] = 11] = "DoCreate1Notes";
    MilestoneKey[MilestoneKey["DoCreate3Notes"] = 12] = "DoCreate3Notes";
    MilestoneKey[MilestoneKey["DoCreate6Notes"] = 13] = "DoCreate6Notes";
    MilestoneKey[MilestoneKey["DoCreate9Notes"] = 14] = "DoCreate9Notes";
    MilestoneKey[MilestoneKey["DoCreate10Notes"] = 15] = "DoCreate10Notes";
    MilestoneKey[MilestoneKey["DoCreate40Notes"] = 16] = "DoCreate40Notes";
    MilestoneKey[MilestoneKey["DoCreate55Notes"] = 17] = "DoCreate55Notes";
    MilestoneKey[MilestoneKey["DoCreate60Notes"] = 18] = "DoCreate60Notes";
    MilestoneKey[MilestoneKey["DoCreate70Notes"] = 19] = "DoCreate70Notes";
    MilestoneKey[MilestoneKey["DoCreate80Notes"] = 20] = "DoCreate80Notes";
    MilestoneKey[MilestoneKey["DoCreate90Notes"] = 21] = "DoCreate90Notes";
    MilestoneKey[MilestoneKey["DoCreate10MultimediaNotes"] = 22] = "DoCreate10MultimediaNotes";
    MilestoneKey[MilestoneKey["DoCreate20MultimediaNotes"] = 23] = "DoCreate20MultimediaNotes";
    MilestoneKey[MilestoneKey["DoCreate40MultimediaNotes"] = 24] = "DoCreate40MultimediaNotes";
    MilestoneKey[MilestoneKey["DoCreate80MultimediaNotes"] = 25] = "DoCreate80MultimediaNotes";
    MilestoneKey[MilestoneKey["DoCreate120MultimediaNotes"] = 26] = "DoCreate120MultimediaNotes";
    MilestoneKey[MilestoneKey["DoCreate160MultimediaNotes"] = 27] = "DoCreate160MultimediaNotes";
    MilestoneKey[MilestoneKey["DoAddATag"] = 28] = "DoAddATag";
    MilestoneKey[MilestoneKey["DoAdd2Tags"] = 29] = "DoAdd2Tags";
    MilestoneKey[MilestoneKey["DoAdd5Tags"] = 30] = "DoAdd5Tags";
    MilestoneKey[MilestoneKey["DoAdd10Tags"] = 31] = "DoAdd10Tags";
    MilestoneKey[MilestoneKey["DoAdd15Tags"] = 32] = "DoAdd15Tags";
    MilestoneKey[MilestoneKey["DoAdd25Tags"] = 33] = "DoAdd25Tags";
    MilestoneKey[MilestoneKey["DoAdd50Tags"] = 34] = "DoAdd50Tags";
    MilestoneKey[MilestoneKey["DoAddANotebook"] = 35] = "DoAddANotebook";
    MilestoneKey[MilestoneKey["DoAddNotebookEN1"] = 36] = "DoAddNotebookEN1";
    MilestoneKey[MilestoneKey["DoAddNotebookEN2"] = 37] = "DoAddNotebookEN2";
    MilestoneKey[MilestoneKey["DoAddNotebookEN3"] = 38] = "DoAddNotebookEN3";
    MilestoneKey[MilestoneKey["DoAddNotebookEN4"] = 39] = "DoAddNotebookEN4";
    MilestoneKey[MilestoneKey["DoAddNotebookEN5"] = 40] = "DoAddNotebookEN5";
    MilestoneKey[MilestoneKey["DoAddNotebookEN6"] = 41] = "DoAddNotebookEN6";
    MilestoneKey[MilestoneKey["DoAddAttachement"] = 42] = "DoAddAttachement";
    MilestoneKey[MilestoneKey["DoAttachAWebClip"] = 43] = "DoAttachAWebClip";
    MilestoneKey[MilestoneKey["DoAddSketchNote"] = 44] = "DoAddSketchNote";
    MilestoneKey[MilestoneKey["DoUseEvernote2Days"] = 45] = "DoUseEvernote2Days";
    MilestoneKey[MilestoneKey["DoUseEvernote3Days"] = 46] = "DoUseEvernote3Days";
    MilestoneKey[MilestoneKey["DoAttachAFile"] = 47] = "DoAttachAFile";
    MilestoneKey[MilestoneKey["DoAttachAnImage"] = 48] = "DoAttachAnImage";
    MilestoneKey[MilestoneKey["DoSetAReminder"] = 49] = "DoSetAReminder";
    MilestoneKey[MilestoneKey["DoRecordAudioNote"] = 50] = "DoRecordAudioNote";
    MilestoneKey[MilestoneKey["DoSaveSearch"] = 51] = "DoSaveSearch";
    MilestoneKey[MilestoneKey["Read5CreativeMinds"] = 52] = "Read5CreativeMinds";
    MilestoneKey[MilestoneKey["ReadEvernotesBeginnerGuide"] = 53] = "ReadEvernotesBeginnerGuide";
    MilestoneKey[MilestoneKey["Read38Things"] = 54] = "Read38Things";
    MilestoneKey[MilestoneKey["ReadScanDocuments"] = 55] = "ReadScanDocuments";
    MilestoneKey[MilestoneKey["ReadGettingThingsDone"] = 56] = "ReadGettingThingsDone";
    MilestoneKey[MilestoneKey["WatchEvernoteForGmail"] = 57] = "WatchEvernoteForGmail";
})(MilestoneKey = exports.MilestoneKey || (exports.MilestoneKey = {}));
exports.levelMilestones = {
    [constants_1.Goal.NoteTaker]: {
        1: [MilestoneKey.HowToTourNoteEditor, MilestoneKey.DoCreate1Notes],
        2: [MilestoneKey.HowToScanWhiteboards, MilestoneKey.DoCreate3Notes, MilestoneKey.DoAddAttachement, MilestoneKey.DoUseEvernote2Days],
        3: [MilestoneKey.HowToChangeViewOptions, MilestoneKey.DoCreate6Notes, MilestoneKey.DoAddSketchNote, MilestoneKey.DoUseEvernote3Days],
        4: [MilestoneKey.HowToSetupShortcutNote, MilestoneKey.DoCreate9Notes, MilestoneKey.DoSetAReminder, MilestoneKey.DoRecordAudioNote],
        5: [MilestoneKey.DoCreate40Notes, MilestoneKey.DoCreate10MultimediaNotes, MilestoneKey.DoAdd2Tags, MilestoneKey.DoAddNotebookEN1],
        6: [MilestoneKey.DoCreate55Notes, MilestoneKey.DoCreate20MultimediaNotes, MilestoneKey.DoAdd5Tags, MilestoneKey.DoAddNotebookEN2],
        7: [MilestoneKey.DoCreate60Notes, MilestoneKey.DoCreate40MultimediaNotes, MilestoneKey.DoAdd10Tags, MilestoneKey.DoAddNotebookEN3],
        8: [MilestoneKey.DoCreate70Notes, MilestoneKey.DoCreate80MultimediaNotes, MilestoneKey.DoAdd15Tags, MilestoneKey.DoAddNotebookEN4],
        9: [MilestoneKey.DoCreate80Notes, MilestoneKey.DoCreate120MultimediaNotes, MilestoneKey.DoAdd25Tags, MilestoneKey.DoAddNotebookEN5],
        10: [MilestoneKey.DoCreate90Notes, MilestoneKey.DoCreate160MultimediaNotes, MilestoneKey.DoAdd50Tags, MilestoneKey.DoAddNotebookEN6],
    },
    [constants_1.Goal.Organizer]: {
        1: [MilestoneKey.HowToTourNoteEditor, MilestoneKey.DoCreate1Notes],
        2: [MilestoneKey.HowToCreateTags, MilestoneKey.DoCreate3Notes, MilestoneKey.DoAddATag, MilestoneKey.DoUseEvernote2Days],
        3: [MilestoneKey.HowToCreateNotebooks, MilestoneKey.DoCreate60Notes, MilestoneKey.DoAddANotebook, MilestoneKey.DoUseEvernote3Days],
        4: [MilestoneKey.HowToSearch, MilestoneKey.DoSaveSearch, MilestoneKey.DoCreate10Notes, MilestoneKey.HowToUseFiltersToSearch],
        5: [MilestoneKey.DoCreate40Notes, MilestoneKey.DoCreate10MultimediaNotes, MilestoneKey.DoAdd2Tags, MilestoneKey.DoAddNotebookEN1],
        6: [MilestoneKey.DoCreate55Notes, MilestoneKey.DoCreate20MultimediaNotes, MilestoneKey.DoAdd5Tags, MilestoneKey.DoAddNotebookEN2],
        7: [MilestoneKey.DoCreate60Notes, MilestoneKey.DoCreate40MultimediaNotes, MilestoneKey.DoAdd10Tags, MilestoneKey.DoAddNotebookEN3],
        8: [MilestoneKey.DoCreate70Notes, MilestoneKey.DoCreate80MultimediaNotes, MilestoneKey.DoAdd15Tags, MilestoneKey.DoAddNotebookEN4],
        9: [MilestoneKey.DoCreate80Notes, MilestoneKey.DoCreate120MultimediaNotes, MilestoneKey.DoAdd25Tags, MilestoneKey.DoAddNotebookEN5],
        10: [MilestoneKey.DoCreate90Notes, MilestoneKey.DoCreate160MultimediaNotes, MilestoneKey.DoAdd50Tags, MilestoneKey.DoAddNotebookEN6],
    },
    [constants_1.Goal.Creative]: {
        1: [MilestoneKey.HowToTourNoteEditor, MilestoneKey.DoCreate1Notes],
        2: [MilestoneKey.Read5CreativeMinds, MilestoneKey.ReadEvernotesBeginnerGuide, MilestoneKey.HowToCaptureWebContent, MilestoneKey.DoAttachAWebClip],
        3: [MilestoneKey.Read38Things, MilestoneKey.ReadScanDocuments, MilestoneKey.DoAttachAFile, MilestoneKey.DoAttachAnImage],
        4: [MilestoneKey.ReadGettingThingsDone, MilestoneKey.WatchEvernoteForGmail, MilestoneKey.DoCreateProjectPlan, MilestoneKey.HowToConnectIFTTT],
        5: [MilestoneKey.DoCreate40Notes, MilestoneKey.DoCreate10MultimediaNotes, MilestoneKey.DoAdd2Tags, MilestoneKey.DoAddNotebookEN1],
        6: [MilestoneKey.DoCreate55Notes, MilestoneKey.DoCreate20MultimediaNotes, MilestoneKey.DoAdd5Tags, MilestoneKey.DoAddNotebookEN2],
        7: [MilestoneKey.DoCreate60Notes, MilestoneKey.DoCreate40MultimediaNotes, MilestoneKey.DoAdd10Tags, MilestoneKey.DoAddNotebookEN3],
        8: [MilestoneKey.DoCreate70Notes, MilestoneKey.DoCreate80MultimediaNotes, MilestoneKey.DoAdd15Tags, MilestoneKey.DoAddNotebookEN4],
        9: [MilestoneKey.DoCreate80Notes, MilestoneKey.DoCreate120MultimediaNotes, MilestoneKey.DoAdd25Tags, MilestoneKey.DoAddNotebookEN5],
        10: [MilestoneKey.DoCreate90Notes, MilestoneKey.DoCreate160MultimediaNotes, MilestoneKey.DoAdd50Tags, MilestoneKey.DoAddNotebookEN6],
    },
};
exports.milestoneData = {
    [MilestoneKey.HowToTourNoteEditor]: {
        totalTokens: 10,
    },
    [MilestoneKey.HowToScanWhiteboards]: {
        totalTokens: 30,
    },
    [MilestoneKey.HowToCreateTags]: {
        totalTokens: 30,
    },
    [MilestoneKey.HowToCaptureWebContent]: {
        totalTokens: 30,
    },
    [MilestoneKey.HowToChangeViewOptions]: {
        totalTokens: 60,
    },
    [MilestoneKey.HowToCreateNotebooks]: {
        totalTokens: 60,
    },
    [MilestoneKey.HowToSetupShortcutNote]: {
        totalTokens: 90,
    },
    [MilestoneKey.HowToSearch]: {
        totalTokens: 90,
    },
    [MilestoneKey.HowToUseFiltersToSearch]: {
        totalTokens: 90,
    },
    [MilestoneKey.DoCreateProjectPlan]: {
        totalTokens: 90,
    },
    [MilestoneKey.HowToConnectIFTTT]: {
        totalTokens: 90,
    },
    [MilestoneKey.DoCreate1Notes]: {
        totalTokens: 10,
    },
    [MilestoneKey.DoCreate3Notes]: {
        totalTokens: 30,
    },
    [MilestoneKey.DoCreate6Notes]: {
        totalTokens: 60,
    },
    [MilestoneKey.DoCreate9Notes]: {
        totalTokens: 90,
    },
    [MilestoneKey.DoCreate10Notes]: {
        totalTokens: 90,
    },
    [MilestoneKey.DoCreate40Notes]: {
        totalTokens: 200,
    },
    [MilestoneKey.DoCreate55Notes]: {
        totalTokens: 800,
    },
    [MilestoneKey.DoCreate60Notes]: {
        totalTokens: 1600,
    },
    [MilestoneKey.DoCreate70Notes]: {
        totalTokens: 2000,
    },
    [MilestoneKey.DoCreate80Notes]: {
        totalTokens: 3200,
    },
    [MilestoneKey.DoCreate90Notes]: {
        totalTokens: 6400,
    },
    [MilestoneKey.DoCreate10MultimediaNotes]: {
        totalTokens: 200,
    },
    [MilestoneKey.DoCreate20MultimediaNotes]: {
        totalTokens: 800,
    },
    [MilestoneKey.DoCreate40MultimediaNotes]: {
        totalTokens: 1600,
    },
    [MilestoneKey.DoCreate80MultimediaNotes]: {
        totalTokens: 2000,
    },
    [MilestoneKey.DoCreate120MultimediaNotes]: {
        totalTokens: 3200,
    },
    [MilestoneKey.DoCreate160MultimediaNotes]: {
        totalTokens: 6400,
    },
    [MilestoneKey.DoAddATag]: {
        totalTokens: 30,
    },
    [MilestoneKey.DoAdd2Tags]: {
        totalTokens: 100,
    },
    [MilestoneKey.DoAdd5Tags]: {
        totalTokens: 400,
    },
    [MilestoneKey.DoAdd10Tags]: {
        totalTokens: 800,
    },
    [MilestoneKey.DoAdd15Tags]: {
        totalTokens: 1000,
    },
    [MilestoneKey.DoAdd25Tags]: {
        totalTokens: 1600,
    },
    [MilestoneKey.DoAdd50Tags]: {
        totalTokens: 3200,
    },
    [MilestoneKey.DoAddANotebook]: {
        totalTokens: 60,
    },
    [MilestoneKey.DoAddNotebookEN1]: {
        totalTokens: 100,
    },
    [MilestoneKey.DoAddNotebookEN2]: {
        totalTokens: 400,
    },
    [MilestoneKey.DoAddNotebookEN3]: {
        totalTokens: 800,
    },
    [MilestoneKey.DoAddNotebookEN4]: {
        totalTokens: 1000,
    },
    [MilestoneKey.DoAddNotebookEN5]: {
        totalTokens: 1600,
    },
    [MilestoneKey.DoAddNotebookEN6]: {
        totalTokens: 3200,
    },
    [MilestoneKey.DoAddAttachement]: {
        totalTokens: 30,
    },
    [MilestoneKey.DoAttachAWebClip]: {
        totalTokens: 30,
    },
    [MilestoneKey.DoAddSketchNote]: {
        totalTokens: 60,
    },
    [MilestoneKey.DoUseEvernote2Days]: {
        totalTokens: 30,
    },
    [MilestoneKey.DoUseEvernote3Days]: {
        totalTokens: 60,
    },
    [MilestoneKey.DoAttachAFile]: {
        totalTokens: 60,
    },
    [MilestoneKey.DoAttachAnImage]: {
        totalTokens: 60,
    },
    [MilestoneKey.DoSetAReminder]: {
        totalTokens: 90,
    },
    [MilestoneKey.DoRecordAudioNote]: {
        totalTokens: 90,
    },
    [MilestoneKey.DoSaveSearch]: {
        totalTokens: 90,
    },
    [MilestoneKey.Read5CreativeMinds]: {
        totalTokens: 30,
    },
    [MilestoneKey.ReadEvernotesBeginnerGuide]: {
        totalTokens: 30,
    },
    [MilestoneKey.Read38Things]: {
        totalTokens: 60,
    },
    [MilestoneKey.ReadScanDocuments]: {
        totalTokens: 60,
    },
    [MilestoneKey.ReadGettingThingsDone]: {
        totalTokens: 90,
    },
    [MilestoneKey.WatchEvernoteForGmail]: {
        totalTokens: 90,
    },
};
//# sourceMappingURL=milestoneData.js.map