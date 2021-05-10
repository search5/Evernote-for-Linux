"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetEntitySchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
const BoardTypes_1 = require("./BoardTypes");
exports.WidgetEntitySchema = {
    fields: {
        parentID: en_ts_utils_1.NullableID,
        boardType: BoardTypes_1.BoardTypeSchema,
        isEnabled: 'boolean',
        softDelete: en_ts_utils_1.NullableBoolean,
        widgetType: BoardTypes_1.WidgetTypeSchema,
        mutableWidgetType: en_ts_utils_1.Nullable(BoardTypes_1.MutableWidgetTypeSchema),
        internalID: en_ts_utils_1.NullableNumber,
        mobile: BoardTypes_1.WidgetFormFactorSchema,
        desktop: BoardTypes_1.WidgetFormFactorSchema,
        selectedTab: en_ts_utils_1.Nullable(BoardTypes_1.WidgetSelectedTabsSchema),
        content: en_data_model_1.BlobV2WithContentSchema,
        backgroundColor: en_ts_utils_1.Nullable(BoardTypes_1.BoardColorSchemeSchema),
        filteredNotesQuery: en_ts_utils_1.Nullable(BoardTypes_1.WidgetSearchQuerySchema),
    },
    embeddedAssociations: {
        parentID: {
            targetIsSrc: true,
            targetType: en_data_model_1.EntityTypes.Board,
            isNsyncParent: true,
        },
    },
};
//# sourceMappingURL=WidgetEntity.js.map