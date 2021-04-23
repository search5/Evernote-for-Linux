"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardColorSchemeSchema = exports.BoardBackgroundModeSchema = exports.BoardMobileLayoutSchema = exports.BoardDesktopLayoutSchema = exports.BoardTypeSchema = exports.BoardServiceLevelSchema = exports.WidgetSelectedTabsSchema = exports.DeviceFormFactorSchema = exports.MutableWidgetTypeSchema = exports.BoardEntityTypes = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
exports.BoardEntityTypes = {
    Board: 'Board',
    Widget: 'Widget',
    WidgetContentConflict: 'WidgetContentConflict',
};
exports.MutableWidgetTypeSchema = conduit_utils_1.Enum(en_data_model_1.MutableWidgetType, 'BoardMutableWidgetTypes');
exports.DeviceFormFactorSchema = conduit_utils_1.Enum(en_data_model_1.DeviceFormFactor, 'BoardFormFactor');
exports.WidgetSelectedTabsSchema = conduit_utils_1.Enum(en_data_model_1.WidgetSelectedTab, 'WidgetTabs');
exports.BoardServiceLevelSchema = conduit_utils_1.Enum(Object.assign(Object.assign({}, en_data_model_1.ServiceLevelV2), en_data_model_1.DeprecatedServiceLevel), 'BoardServiceLevels');
exports.BoardTypeSchema = conduit_utils_1.Enum(en_data_model_1.BoardType, 'BoardType');
exports.BoardDesktopLayoutSchema = conduit_utils_1.Enum(en_data_model_1.BoardDesktopLayout, 'BoardDesktopLayout');
exports.BoardMobileLayoutSchema = conduit_utils_1.Enum(en_data_model_1.BoardMobileLayout, 'BoardMobileLayout');
exports.BoardBackgroundModeSchema = conduit_utils_1.Enum(en_data_model_1.BoardBackgroundMode, 'BoardBackgroundMode');
exports.BoardColorSchemeSchema = conduit_utils_1.Struct({
    light: 'string',
    dark: 'string',
}, 'BoardColorScheme');
//# sourceMappingURL=BoardConstants.js.map