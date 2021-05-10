"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardEntitySchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
const BoardTypes_1 = require("./BoardTypes");
const DesktopFormFactor = en_ts_utils_1.Struct({
    layout: BoardTypes_1.BoardDesktopLayoutSchema, // Future proof
});
const MobileFormFactor = en_ts_utils_1.Struct({
    layout: BoardTypes_1.BoardMobileLayoutSchema, // Future proof
});
exports.BoardEntitySchema = {
    fields: {
        boardType: BoardTypes_1.BoardTypeSchema,
        internalID: en_ts_utils_1.NullableNumber,
        headerBG: en_data_model_1.BlobV2RefSchema,
        headerBGMime: en_ts_utils_1.NullableString,
        headerBGFileName: en_ts_utils_1.NullableString,
        headerBGPreviousUpload: en_data_model_1.BlobV2RefSchema,
        headerBGPreviousUploadMime: en_ts_utils_1.NullableString,
        headerBGPreviousUploadFileName: en_ts_utils_1.NullableString,
        headerBGMode: en_ts_utils_1.Nullable(BoardTypes_1.BoardBackgroundModeSchema),
        headerBGColor: en_ts_utils_1.Nullable(BoardTypes_1.BoardColorSchemeSchema),
        greetingText: en_ts_utils_1.NullableString,
        desktop: DesktopFormFactor,
        mobile: MobileFormFactor,
        freeTrialExpiration: en_ts_utils_1.NullableTimestamp,
        tasksVersion: en_ts_utils_1.NullableNumber,
        calendarVersion: en_ts_utils_1.NullableNumber,
        filteredNotesVersion: en_ts_utils_1.NullableNumber,
        extraVersion: en_ts_utils_1.NullableNumber,
        coreVersion: en_ts_utils_1.NullableNumber,
        serviceLevel: en_ts_utils_1.Nullable(BoardTypes_1.BoardServiceLevelSchema),
        isCustomized: en_ts_utils_1.NullableBoolean,
    },
};
//# sourceMappingURL=BoardEntity.js.map