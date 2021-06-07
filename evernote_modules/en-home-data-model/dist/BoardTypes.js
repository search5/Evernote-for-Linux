"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetFormFactorSchema = exports.WidgetTypeSchema = exports.WidgetType = exports.WidgetSelectedTabsSchema = exports.WidgetSelectedTab = exports.WidgetSearchQuerySchema = exports.WidgetSearchResultSpecSchema = exports.WidgetSearchTextFieldSchema = exports.WidgetSearchTextField = exports.WidgetSearchTypeSchema = exports.WidgetSearchType = exports.WidgetSortFieldSchema = exports.WidgetSortField = exports.MutableWidgetTypeSchema = exports.MutableWidgetType = exports.DeviceFormFactorSchema = exports.DeviceFormFactor = exports.BoardColorSchemeSchema = exports.BoardTypeSchema = exports.BoardType = exports.BoardMobileLayoutSchema = exports.BoardMobileLayout = exports.BoardMimeTypeSchema = exports.BoardMimeType = exports.BoardFeatureSchema = exports.BoardFeature = exports.BoardDesktopLayoutSchema = exports.BoardDesktopLayout = exports.BoardBackgroundModeSchema = exports.BoardBackgroundMode = exports.BoardServiceLevelSchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
exports.BoardServiceLevelSchema = en_ts_utils_1.Enum({
    ...en_data_model_1.ServiceLevelV2,
    ...en_data_model_1.DeprecatedServiceLevel,
}, 'BoardServiceLevels');
var BoardBackgroundMode;
(function (BoardBackgroundMode) {
    BoardBackgroundMode["None"] = "None";
    BoardBackgroundMode["Image"] = "Image";
    BoardBackgroundMode["Color"] = "Color";
})(BoardBackgroundMode = exports.BoardBackgroundMode || (exports.BoardBackgroundMode = {}));
exports.BoardBackgroundModeSchema = en_ts_utils_1.Enum(BoardBackgroundMode, 'BoardBackgroundMode');
var BoardDesktopLayout;
(function (BoardDesktopLayout) {
    BoardDesktopLayout["ThreeColumnFlex"] = "ThreeColumnFlex";
})(BoardDesktopLayout = exports.BoardDesktopLayout || (exports.BoardDesktopLayout = {}));
exports.BoardDesktopLayoutSchema = en_ts_utils_1.Enum(BoardDesktopLayout, 'BoardDesktopLayout');
var BoardFeature;
(function (BoardFeature) {
    BoardFeature["Calendar"] = "calendar";
    BoardFeature["Core"] = "core";
    BoardFeature["Extra"] = "extra";
    BoardFeature["FilteredNotes"] = "filteredNotes";
    BoardFeature["Tasks"] = "tasks";
})(BoardFeature = exports.BoardFeature || (exports.BoardFeature = {}));
exports.BoardFeatureSchema = en_ts_utils_1.EnumWithKeys(BoardFeature, 'BoardFeature');
var BoardMimeType;
(function (BoardMimeType) {
    BoardMimeType["Jpeg"] = "image/jpeg";
    BoardMimeType["Png"] = "image/png";
    BoardMimeType["Webp"] = "image/webp";
})(BoardMimeType = exports.BoardMimeType || (exports.BoardMimeType = {}));
exports.BoardMimeTypeSchema = en_ts_utils_1.EnumWithKeys(BoardMimeType, 'BoardMimeType');
var BoardMobileLayout;
(function (BoardMobileLayout) {
    BoardMobileLayout["SingleColumnStack"] = "SingleColumnStack";
})(BoardMobileLayout = exports.BoardMobileLayout || (exports.BoardMobileLayout = {}));
exports.BoardMobileLayoutSchema = en_ts_utils_1.Enum(BoardMobileLayout, 'BoardMobileLayout');
var BoardType;
(function (BoardType) {
    BoardType["Home"] = "Home";
})(BoardType = exports.BoardType || (exports.BoardType = {}));
exports.BoardTypeSchema = en_ts_utils_1.Enum(BoardType, 'BoardType');
exports.BoardColorSchemeSchema = en_ts_utils_1.Struct({
    light: 'string',
    dark: 'string',
});
var DeviceFormFactor;
(function (DeviceFormFactor) {
    DeviceFormFactor["Desktop"] = "Desktop";
    DeviceFormFactor["Mobile"] = "Mobile";
})(DeviceFormFactor = exports.DeviceFormFactor || (exports.DeviceFormFactor = {}));
exports.DeviceFormFactorSchema = en_ts_utils_1.Enum(DeviceFormFactor, 'BoardFormFactor');
var MutableWidgetType;
(function (MutableWidgetType) {
    MutableWidgetType["Pinned"] = "Pinned";
    MutableWidgetType["ScratchPad"] = "ScratchPad";
    MutableWidgetType["FilteredNotes"] = "FilteredNotes";
})(MutableWidgetType = exports.MutableWidgetType || (exports.MutableWidgetType = {}));
exports.MutableWidgetTypeSchema = en_ts_utils_1.Enum(MutableWidgetType, 'BoardMutableWidgetTypes');
var WidgetSortField;
(function (WidgetSortField) {
    WidgetSortField["TITLE"] = "TITLE";
    WidgetSortField["CREATED"] = "CREATED";
    WidgetSortField["UPDATED"] = "UPDATED";
    WidgetSortField["RELEVANCE"] = "RELEVANCE";
    WidgetSortField["REMINDER_ORDER"] = "REMINDER_ORDER";
    WidgetSortField["REMINDER_TIME"] = "REMINDER_TIME";
    WidgetSortField["REMINDER_DONE_TIME"] = "REMINDER_DONE_TIME";
})(WidgetSortField = exports.WidgetSortField || (exports.WidgetSortField = {}));
exports.WidgetSortFieldSchema = en_ts_utils_1.Enum(WidgetSortField, 'WidgetSortFields');
var WidgetSearchType;
(function (WidgetSearchType) {
    WidgetSearchType["HISTORY"] = "HISTORY";
    WidgetSearchType["TEXT"] = "TEXT";
    WidgetSearchType["NOTE"] = "NOTE";
    WidgetSearchType["NOTEBOOK"] = "NOTEBOOK";
    WidgetSearchType["WORKSPACE"] = "WORKSPACE";
    WidgetSearchType["TAG"] = "TAG";
    WidgetSearchType["AUTHOR"] = "AUTHOR";
    WidgetSearchType["CONTAINS"] = "CONTAINS";
    WidgetSearchType["MESSAGE"] = "MESSAGE";
    WidgetSearchType["STACK"] = "STACK";
})(WidgetSearchType = exports.WidgetSearchType || (exports.WidgetSearchType = {}));
exports.WidgetSearchTypeSchema = en_ts_utils_1.Enum(WidgetSearchType, 'WidgetSearchTypes');
var WidgetSearchTextField;
(function (WidgetSearchTextField) {
    WidgetSearchTextField["ALL"] = "ALL";
    WidgetSearchTextField["NAME"] = "NAME";
})(WidgetSearchTextField = exports.WidgetSearchTextField || (exports.WidgetSearchTextField = {}));
exports.WidgetSearchTextFieldSchema = en_ts_utils_1.Enum(WidgetSearchTextField, 'WidgetSearchTextFields');
exports.WidgetSearchResultSpecSchema = en_ts_utils_1.Struct({
    type: exports.WidgetSearchTypeSchema,
    textSearchField: en_ts_utils_1.Nullable(exports.WidgetSearchTextFieldSchema),
    sort: en_ts_utils_1.Nullable(exports.WidgetSortFieldSchema),
    ascending: en_ts_utils_1.NullableBoolean,
    startIndex: en_ts_utils_1.NullableInt,
    maxResults: en_ts_utils_1.NullableInt,
}, 'WidgetSearchResultSpec');
exports.WidgetSearchQuerySchema = en_ts_utils_1.Struct({
    query: 'string',
    resultSpec: exports.WidgetSearchResultSpecSchema,
}, 'WidgetSearchQuery');
var WidgetSelectedTab;
(function (WidgetSelectedTab) {
    WidgetSelectedTab["WebClips"] = "WebClips";
    WidgetSelectedTab["Audio"] = "Audio";
    WidgetSelectedTab["Emails"] = "Emails";
    WidgetSelectedTab["Images"] = "Images";
    WidgetSelectedTab["Documents"] = "Documents";
    WidgetSelectedTab["Recent"] = "Recent";
    WidgetSelectedTab["Suggested"] = "Suggested";
})(WidgetSelectedTab = exports.WidgetSelectedTab || (exports.WidgetSelectedTab = {}));
exports.WidgetSelectedTabsSchema = en_ts_utils_1.Enum(WidgetSelectedTab, 'WidgetTabs');
var WidgetType;
(function (WidgetType) {
    WidgetType["Tags"] = "Tags";
    WidgetType["Shortcuts"] = "Shortcuts";
    WidgetType["Pinned"] = "Pinned";
    WidgetType["OnboardingChecklist"] = "OnboardingChecklist";
    WidgetType["ScratchPad"] = "ScratchPad";
    WidgetType["Notes"] = "Notes";
    WidgetType["Notebooks"] = "Notebooks";
    WidgetType["Clipped"] = "Clipped";
    WidgetType["Calendar"] = "Calendar";
    WidgetType["Tasks"] = "Tasks";
    WidgetType["FilteredNotes"] = "FilteredNotes";
    WidgetType["Extra"] = "Extra";
})(WidgetType = exports.WidgetType || (exports.WidgetType = {}));
exports.WidgetTypeSchema = en_ts_utils_1.Enum(WidgetType, 'WidgetType');
exports.WidgetFormFactorSchema = en_ts_utils_1.Struct({
    sortWeight: 'string',
    width: 'number',
    height: 'number',
    panelKey: en_ts_utils_1.NullableString,
}, 'WidgetFormFactor');
//# sourceMappingURL=BoardTypes.js.map