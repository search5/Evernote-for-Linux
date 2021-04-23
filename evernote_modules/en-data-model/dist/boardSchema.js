"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardBackgroundModes = exports.BoardServiceLevels = exports.WidgetSelectedTabs = exports.BoardTypes = exports.MutableWidgetTypes = exports.WidgetTypes = exports.DeviceFormFactors = exports.BoardDesktopLayouts = exports.BoardMobileLayouts = exports.ClippedTabsSet = exports.CommonTabsSet = exports.calculateUserAdjustedServiceLevel = exports.doesUserHaveWidgetSupport = exports.calculateWidgetAdjustedServiceLevel = exports.formDeterministicBoardIdParts = exports.maskLeadingWidgetSegment = exports.boardTypeNumberMap = exports.widgetTypeNumberMap = exports.BoardTypeNumber = exports.WidgetTypeNumber = exports.DefaultAdjustedServiceLevelV2 = exports.MaxExtraWidgets = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const serviceLevelV2Schema_1 = require("./serviceLevelV2Schema");
const ts_types_1 = require("./ts-types");
exports.MaxExtraWidgets = 11;
var DefaultAdjustedServiceLevelV2;
(function (DefaultAdjustedServiceLevelV2) {
    DefaultAdjustedServiceLevelV2[DefaultAdjustedServiceLevelV2["UKNNOWN"] = Number.MAX_SAFE_INTEGER] = "UKNNOWN";
})(DefaultAdjustedServiceLevelV2 = exports.DefaultAdjustedServiceLevelV2 || (exports.DefaultAdjustedServiceLevelV2 = {}));
/*
 * IMPORTANT: These mappings can never change once they go into Production.
 *  However, you can add new mappings all you want.
 */
var WidgetTypeNumber;
(function (WidgetTypeNumber) {
    WidgetTypeNumber[WidgetTypeNumber["Clipped"] = 0] = "Clipped";
    WidgetTypeNumber[WidgetTypeNumber["Notebooks"] = 1] = "Notebooks";
    WidgetTypeNumber[WidgetTypeNumber["Notes"] = 2] = "Notes";
    WidgetTypeNumber[WidgetTypeNumber["OnboardingChecklist"] = 3] = "OnboardingChecklist";
    WidgetTypeNumber[WidgetTypeNumber["Pinned"] = 4] = "Pinned";
    WidgetTypeNumber[WidgetTypeNumber["ScratchPad"] = 5] = "ScratchPad";
    WidgetTypeNumber[WidgetTypeNumber["Shortcuts"] = 6] = "Shortcuts";
    WidgetTypeNumber[WidgetTypeNumber["Tags"] = 7] = "Tags";
    WidgetTypeNumber[WidgetTypeNumber["Calendar"] = 8] = "Calendar";
    WidgetTypeNumber[WidgetTypeNumber["Tasks"] = 9] = "Tasks";
    WidgetTypeNumber[WidgetTypeNumber["FilteredNotes"] = 10] = "FilteredNotes";
    /*
     * Extra is set to a high number (hopefully high enough to avoid collision with new standard types),
     *  in order to increase spread on the Deterministic Id by adding the internalID to the leading segment.
     *  With 11 total Widgets for this type, the current reserved Id values are in an inclusive range of 100032-105565
     */
    WidgetTypeNumber[WidgetTypeNumber["Extra"] = 100032] = "Extra";
})(WidgetTypeNumber = exports.WidgetTypeNumber || (exports.WidgetTypeNumber = {}));
/*
 * IMPORTANT: These mappings can never change once they go into Production.
 *  However, you can add new mappings all you want.
 */
var BoardTypeNumber;
(function (BoardTypeNumber) {
    BoardTypeNumber[BoardTypeNumber["Home"] = 0] = "Home";
})(BoardTypeNumber = exports.BoardTypeNumber || (exports.BoardTypeNumber = {}));
exports.widgetTypeNumberMap = (() => {
    const result = new Map();
    for (const key of Object.keys(ts_types_1.WidgetType)) {
        const widgetType = ts_types_1.WidgetType[key];
        const internalID = WidgetTypeNumber[key];
        result.set(widgetType, internalID);
    }
    return result;
})();
exports.boardTypeNumberMap = (() => {
    const result = new Map();
    for (const key of Object.keys(ts_types_1.BoardType)) {
        const boardType = ts_types_1.BoardType[key];
        const internalID = BoardTypeNumber[key];
        result.set(boardType, internalID);
    }
    return result;
})();
const maskLeadingWidgetSegment = (userID, widgetTypeNumber, widgetInternalID) => {
    /*
     * The idea here, is to create a pseudo-random set values within a predefined range for certain Widgets, will be added in multiples.
     * Specifically, the Extra WidgetType, which will have a value of 11, and doubles the size of the Board for a user.
     *
     * Magic Numbers:
     *    63 has a bit representation of 0b111111, which is guaranteed to mask values up to 36, which works well for base36.
     *    546 creates a relatively even spread from 0-Z in this formula.
     *    For the Extra WidgetType, creates a range of (100032 + 0 + 0 + 0 = 100032) to (100032 + 63 + 10 + 5460 = 105565)
     */
    return widgetTypeNumber + ((63 & userID) + widgetInternalID) + (widgetInternalID * 546);
};
exports.maskLeadingWidgetSegment = maskLeadingWidgetSegment;
const formDeterministicBoardIdParts = (userID, boardType = ts_types_1.BoardType.Home, boardInternalID = 0, widgetType, widgetInternalID = 0) => {
    const boardNumber = exports.boardTypeNumberMap.get(boardType);
    if (boardNumber === undefined) {
        throw new en_ts_utils_1.InvalidParameterError('BoardType not mapped to number');
    }
    const boardParts = { parts: [boardNumber, boardInternalID] };
    if (!widgetType) {
        return [boardParts];
    }
    const widgetNumberSeed = exports.widgetTypeNumberMap.get(widgetType);
    if (widgetNumberSeed === undefined) {
        throw new en_ts_utils_1.InvalidParameterError('WidgetType not mapped to number');
    }
    const widgetNumber = widgetType === ts_types_1.WidgetType.Extra
        ? exports.maskLeadingWidgetSegment(userID, widgetNumberSeed, widgetInternalID !== null && widgetInternalID !== void 0 ? widgetInternalID : 0)
        : widgetNumberSeed;
    return [
        {
            parts: [widgetNumber, widgetInternalID],
        },
        boardParts,
    ];
};
exports.formDeterministicBoardIdParts = formDeterministicBoardIdParts;
const adjustedServiceLevelMap = (() => {
    /*
     * Currently, the mapping for feature available is directly to the WidgetType, in the future, this may need to include the internalID.
     */
    const result = new Map();
    result.set(ts_types_1.WidgetType.Clipped, ts_types_1.AdjustedServiceLevelV2.FREE);
    result.set(ts_types_1.WidgetType.Notebooks, ts_types_1.AdjustedServiceLevelV2.PREMIUM);
    result.set(ts_types_1.WidgetType.Notes, ts_types_1.AdjustedServiceLevelV2.FREE);
    result.set(ts_types_1.WidgetType.OnboardingChecklist, ts_types_1.AdjustedServiceLevelV2.FREE);
    result.set(ts_types_1.WidgetType.Pinned, ts_types_1.AdjustedServiceLevelV2.PREMIUM);
    result.set(ts_types_1.WidgetType.ScratchPad, ts_types_1.AdjustedServiceLevelV2.FREE);
    result.set(ts_types_1.WidgetType.Shortcuts, ts_types_1.AdjustedServiceLevelV2.PREMIUM);
    result.set(ts_types_1.WidgetType.Tags, ts_types_1.AdjustedServiceLevelV2.PREMIUM);
    result.set(ts_types_1.WidgetType.Calendar, ts_types_1.AdjustedServiceLevelV2.PERSONAL);
    result.set(ts_types_1.WidgetType.Tasks, ts_types_1.AdjustedServiceLevelV2.PERSONAL);
    result.set(ts_types_1.WidgetType.FilteredNotes, ts_types_1.AdjustedServiceLevelV2.PERSONAL);
    result.set(ts_types_1.WidgetType.Extra, ts_types_1.AdjustedServiceLevelV2.PROFESSIONAL);
    return result;
})();
const calculateWidgetAdjustedServiceLevel = (widgetType) => {
    var _a;
    return (_a = adjustedServiceLevelMap.get(widgetType)) !== null && _a !== void 0 ? _a : DefaultAdjustedServiceLevelV2.UKNNOWN;
};
exports.calculateWidgetAdjustedServiceLevel = calculateWidgetAdjustedServiceLevel;
const doesUserHaveWidgetSupport = (userFeatureLevel, widgetType) => {
    return exports.calculateWidgetAdjustedServiceLevel(widgetType) <= userFeatureLevel;
};
exports.doesUserHaveWidgetSupport = doesUserHaveWidgetSupport;
const calculateUserAdjustedServiceLevel = (serviceLevel) => {
    /*
     * While a bit counter-intuitive, a fallback of FREE here to satisfy TypeScript is safer for our
     *  less than or equals to comparison logic on what is supported by a tier.  When comparing in the UI,
     *  code will simply have to do a <= or equals to comparison from this mapping to the Widget mapping (or other)
     *  to determine actual feature availability.
     */
    try {
        return serviceLevelV2Schema_1.getServiceLevelV2Summary(serviceLevel).adjustedServiceLevel;
    }
    catch {
        return ts_types_1.AdjustedServiceLevelV2.FREE;
    }
};
exports.calculateUserAdjustedServiceLevel = calculateUserAdjustedServiceLevel;
exports.CommonTabsSet = new Set([ts_types_1.WidgetSelectedTab.Recent, ts_types_1.WidgetSelectedTab.Suggested]);
exports.ClippedTabsSet = new Set([
    ts_types_1.WidgetSelectedTab.WebClips,
    ts_types_1.WidgetSelectedTab.Audio,
    ts_types_1.WidgetSelectedTab.Documents,
    ts_types_1.WidgetSelectedTab.Emails,
    ts_types_1.WidgetSelectedTab.Images,
]);
exports.BoardMobileLayouts = Object.values(ts_types_1.BoardMobileLayout);
exports.BoardDesktopLayouts = Object.values(ts_types_1.BoardDesktopLayout);
exports.DeviceFormFactors = Object.values(ts_types_1.DeviceFormFactor);
exports.WidgetTypes = Object.values(ts_types_1.WidgetType);
exports.MutableWidgetTypes = Object.values(ts_types_1.MutableWidgetType);
exports.BoardTypes = Object.values(ts_types_1.BoardType);
exports.WidgetSelectedTabs = Object.values(ts_types_1.WidgetSelectedTab);
exports.BoardServiceLevels = [...Object.values(ts_types_1.ServiceLevelV2), ...Object.values(ts_types_1.DeprecatedServiceLevel)];
exports.BoardBackgroundModes = Object.values(ts_types_1.BoardBackgroundMode);
//# sourceMappingURL=boardSchema.js.map