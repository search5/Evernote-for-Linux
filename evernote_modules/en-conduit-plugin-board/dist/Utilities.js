"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMutableWidgetTypes = exports.compare = exports.safeMutableWidgetType = exports.isWidgetSupported = exports.getBoardPluginFeatures = exports.getCurrentUserNode = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
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
function isWidgetSupported(schemaFeatures, boardType, widgetType) {
    if (widgetType === en_data_model_1.WidgetType.Calendar && !schemaFeatures.calendar) {
        return false;
    }
    else if (widgetType === en_data_model_1.WidgetType.Tasks && !schemaFeatures.tasks) {
        return false;
    }
    else if (widgetType === en_data_model_1.WidgetType.FilteredNotes && !schemaFeatures.filteredNotes) {
        return false;
    }
    else if (widgetType === en_data_model_1.WidgetType.Extra && !schemaFeatures.extra) {
        return false;
    }
    return Boolean(en_data_model_1.WidgetType[widgetType]) && Boolean(en_data_model_1.BoardType[boardType]);
}
exports.isWidgetSupported = isWidgetSupported;
function safeMutableWidgetType(schemaFeatures, boardType, widgetType) {
    if (!widgetType) {
        return null;
    }
    return isWidgetSupported(schemaFeatures, boardType, widgetType) ? widgetType : null;
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
function validateMutableWidgetTypes(property, expectedWidgetType, expectedMutableWidgetType, widget, changeToWidgetType) {
    const { NodeFields: { widgetType, }, } = widget;
    const mutableWidgetType = changeToWidgetType !== null && changeToWidgetType !== void 0 ? changeToWidgetType : widget.NodeFields.mutableWidgetType;
    if ((widgetType !== expectedWidgetType && widgetType !== en_data_model_1.WidgetType.Extra) ||
        (widgetType === en_data_model_1.WidgetType.Extra && mutableWidgetType !== expectedMutableWidgetType)) {
        if (widgetType === en_data_model_1.WidgetType.Extra) {
            throw new conduit_utils_1.InvalidParameterError(`Cannot set property of '${property}' to a WidgetType of '${mutableWidgetType}'`);
        }
        throw new conduit_utils_1.InvalidParameterError(`Cannot set property of '${property}' to a WidgetType of ${widgetType}`);
    }
}
exports.validateMutableWidgetTypes = validateMutableWidgetTypes;
//# sourceMappingURL=Utilities.js.map