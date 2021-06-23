"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeSelectedTab = exports.getDefaultSelectedTabByWidgetType = exports.validateMutableWidgetTypes = exports.widgetSortComparerFactory = exports.compare = exports.safeMutableWidgetType = exports.isWidgetSupported = exports.getBoardPluginFeatures = exports.getCurrentUserNode = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_home_data_model_1 = require("en-home-data-model");
async function getCurrentUserNode(context) {
    conduit_core_1.validateDB(context);
    const userNode = await context.db.getUserNode(context);
    if (!userNode) {
        throw new conduit_utils_1.NotFoundError('Current User');
    }
    return userNode;
}
exports.getCurrentUserNode = getCurrentUserNode;
function getBoardPluginFeatures(di) {
    var _a, _b;
    return (_b = (_a = di.featureFlags) === null || _a === void 0 ? void 0 : _a.boardPluginFeatures) !== null && _b !== void 0 ? _b : { schema: {} };
}
exports.getBoardPluginFeatures = getBoardPluginFeatures;
function isWidgetSupported(boardType) {
    return Boolean(en_home_data_model_1.BoardType[boardType]);
}
exports.isWidgetSupported = isWidgetSupported;
function safeMutableWidgetType(boardType, widgetType) {
    if (!widgetType) {
        return null;
    }
    return isWidgetSupported(boardType) ? widgetType : null;
}
exports.safeMutableWidgetType = safeMutableWidgetType;
function compare(a, b) {
    if (a < b) {
        return -1;
    }
    else if (b > a) {
        return 1;
    }
    return 0;
}
exports.compare = compare;
function widgetSortComparerFactory(formFactor) {
    const formFactorLower = formFactor.toLowerCase();
    return (a, b) => {
        const platformA = a.NodeFields[formFactorLower];
        const platformB = b.NodeFields[formFactorLower];
        if (platformA.sortWeight < platformB.sortWeight) {
            return -1;
        }
        if (platformA.sortWeight > platformB.sortWeight) {
            return 1;
        }
        if (a.NodeFields.created < b.NodeFields.created) {
            return -1;
        }
        if (a.NodeFields.created > b.NodeFields.created) {
            return 1;
        }
        if (a.id < b.id) {
            return -1;
        }
        if (a.id > b.id) {
            return 1;
        }
        return 0;
    };
}
exports.widgetSortComparerFactory = widgetSortComparerFactory;
function validateMutableWidgetTypes(property, expectedWidgetType, expectedMutableWidgetType, widget, changeToWidgetType) {
    const { NodeFields: { widgetType, }, } = widget;
    const mutableWidgetType = changeToWidgetType !== null && changeToWidgetType !== void 0 ? changeToWidgetType : widget.NodeFields.mutableWidgetType;
    if ((widgetType !== expectedWidgetType && widgetType !== en_home_data_model_1.WidgetType.Extra) ||
        (widgetType === en_home_data_model_1.WidgetType.Extra && mutableWidgetType !== expectedMutableWidgetType)) {
        if (widgetType === en_home_data_model_1.WidgetType.Extra) {
            throw new conduit_utils_1.InvalidParameterError(`Cannot set property of '${property}' to a WidgetType of '${mutableWidgetType}'`);
        }
        throw new conduit_utils_1.InvalidParameterError(`Cannot set property of '${property}' to a WidgetType of ${widgetType}`);
    }
}
exports.validateMutableWidgetTypes = validateMutableWidgetTypes;
function getDefaultSelectedTabByWidgetType(widgetType) {
    if (widgetType === en_home_data_model_1.WidgetType.Notebooks || widgetType === en_home_data_model_1.WidgetType.Notes) {
        return en_home_data_model_1.WidgetSelectedTab.Recent;
    }
    else if (widgetType === en_home_data_model_1.WidgetType.Clipped) {
        return en_home_data_model_1.WidgetSelectedTab.WebClips;
    }
    return null;
}
exports.getDefaultSelectedTabByWidgetType = getDefaultSelectedTabByWidgetType;
function safeSelectedTab(selectedTab, widgetType) {
    let result = selectedTab;
    if (widgetType === en_home_data_model_1.WidgetType.Clipped) {
        // Fall back to a supported tab for forwards compatibility.
        result = !conduit_utils_1.isNullish(selectedTab) && en_home_data_model_1.BoardSchema.ClippedTabsSet.has(selectedTab)
            ? selectedTab
            : getDefaultSelectedTabByWidgetType(widgetType);
    }
    else if (widgetType === en_home_data_model_1.WidgetType.Notebooks || widgetType === en_home_data_model_1.WidgetType.Notes) {
        // Fall back to a supported tab for forwards compatibility.
        result = !conduit_utils_1.isNullish(selectedTab) && en_home_data_model_1.BoardSchema.CommonTabsSet.has(selectedTab)
            ? selectedTab
            : getDefaultSelectedTabByWidgetType(widgetType);
    }
    return result;
}
exports.safeSelectedTab = safeSelectedTab;
//# sourceMappingURL=Utilities.js.map