"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = exports.boardTypeNumberMap = exports.widgetTypeNumberMap = exports.boardTypes = exports.BoardType = exports.mobileLayouts = exports.MobileLayout = exports.desktopLayouts = exports.DesktopLayout = exports.AllTabsValues = exports.CommonTabs = exports.ClippedTabs = exports.widgetTypes = exports.WidgetType = exports.FormFactor = exports.BoardDeterministicIdGenerator = exports.BoardEntityTypes = void 0;
const conduit_utils_1 = require("conduit-utils");
exports.BoardEntityTypes = {
    Board: 'Board',
    Widget: 'Widget',
    WidgetContentConflict: 'WidgetContentConflict',
};
exports.BoardDeterministicIdGenerator = (() => {
    const entityTypeMap = new Map();
    entityTypeMap.set(exports.BoardEntityTypes.Board, 12);
    entityTypeMap.set(exports.BoardEntityTypes.Widget, 13);
    return new conduit_utils_1.DeterministicIdGenerator(entityTypeMap);
})();
var FormFactor;
(function (FormFactor) {
    FormFactor["Mobile"] = "Mobile";
    FormFactor["Desktop"] = "Desktop";
})(FormFactor = exports.FormFactor || (exports.FormFactor = {}));
var WidgetType;
(function (WidgetType) {
    WidgetType["Clipped"] = "Clipped";
    WidgetType["Notebooks"] = "Notebooks";
    WidgetType["Notes"] = "Notes";
    WidgetType["OnboardingChecklist"] = "OnboardingChecklist";
    WidgetType["Pinned"] = "Pinned";
    WidgetType["ScratchPad"] = "ScratchPad";
    WidgetType["Shortcuts"] = "Shortcuts";
    WidgetType["Tags"] = "Tags";
    WidgetType["Calendar"] = "Calendar";
    WidgetType["Tasks"] = "Tasks";
})(WidgetType = exports.WidgetType || (exports.WidgetType = {}));
exports.widgetTypes = Object.values(WidgetType);
var ClippedTabs;
(function (ClippedTabs) {
    ClippedTabs["WebClips"] = "WebClips";
    ClippedTabs["Emails"] = "Emails";
    ClippedTabs["Images"] = "Images";
    ClippedTabs["Audio"] = "Audio";
    ClippedTabs["Documents"] = "Documents";
})(ClippedTabs = exports.ClippedTabs || (exports.ClippedTabs = {}));
var CommonTabs;
(function (CommonTabs) {
    CommonTabs["Recent"] = "Recent";
    CommonTabs["Suggested"] = "Suggested";
})(CommonTabs = exports.CommonTabs || (exports.CommonTabs = {}));
exports.AllTabsValues = [
    ...Object.values(CommonTabs),
    ...Object.values(ClippedTabs),
];
var DesktopLayout;
(function (DesktopLayout) {
    DesktopLayout["ThreeColumnFlex"] = "ThreeColumnFlex";
})(DesktopLayout = exports.DesktopLayout || (exports.DesktopLayout = {}));
exports.desktopLayouts = Object.values(DesktopLayout);
var MobileLayout;
(function (MobileLayout) {
    MobileLayout["SingleColumnStack"] = "SingleColumnStack";
})(MobileLayout = exports.MobileLayout || (exports.MobileLayout = {}));
exports.mobileLayouts = Object.values(MobileLayout);
/*
 * For index accept listing and forwards client compatibility.
 *   According to Product, other Board Types might include Workspace, Notebook, or ExtraHome.
 */
var BoardType;
(function (BoardType) {
    BoardType["Home"] = "Home";
})(BoardType = exports.BoardType || (exports.BoardType = {}));
exports.boardTypes = Object.values(BoardType);
exports.widgetTypeNumberMap = (() => {
    /*
     * IMPORTANT: These mappings can never change once they go into Production.
     *  However, you can add new mappings all you want.
     */
    const result = new Map();
    result.set(WidgetType.Clipped, 0);
    result.set(WidgetType.Notebooks, 1);
    result.set(WidgetType.Notes, 2);
    result.set(WidgetType.OnboardingChecklist, 3);
    result.set(WidgetType.Pinned, 4);
    result.set(WidgetType.ScratchPad, 5);
    result.set(WidgetType.Shortcuts, 6);
    result.set(WidgetType.Tags, 7);
    result.set(WidgetType.Calendar, 8);
    result.set(WidgetType.Tasks, 9);
    return result;
})();
exports.boardTypeNumberMap = (() => {
    /*
     * IMPORTANT: These mappings can never change once they go into Production.
     *  However, you can add new mappings all you want.
     */
    const result = new Map();
    result.set(BoardType.Home, 0);
    return result;
})();
var Feature;
(function (Feature) {
    Feature["Calendar"] = "calendar";
    Feature["Tasks"] = "tasks";
})(Feature = exports.Feature || (exports.Feature = {}));
//# sourceMappingURL=BoardConstants.js.map