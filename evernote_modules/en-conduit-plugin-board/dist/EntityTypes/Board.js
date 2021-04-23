"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardIndexConfig = exports.boardTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("../BoardConstants");
const DesktopFormFactor = conduit_utils_1.Struct({
    layout: BoardConstants_1.BoardDesktopLayoutSchema,
});
const MobileFormFactor = conduit_utils_1.Struct({
    layout: BoardConstants_1.BoardMobileLayoutSchema,
});
exports.boardTypeDef = {
    name: BoardConstants_1.BoardEntityTypes.Board,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Home',
    schema: {
        boardType: BoardConstants_1.BoardTypeSchema,
        internalID: conduit_utils_1.NullableNumber,
        isCustomized: conduit_utils_1.NullableBoolean,
        serviceLevel: conduit_utils_1.Nullable(BoardConstants_1.BoardServiceLevelSchema),
        headerBG: en_core_entity_types_1.BlobV2Schema,
        headerBGMime: conduit_utils_1.NullableString,
        headerBGFileName: conduit_utils_1.NullableString,
        headerBGPreviousUpload: en_core_entity_types_1.BlobV2Schema,
        headerBGPreviousUploadMime: conduit_utils_1.NullableString,
        headerBGPreviousUploadFileName: conduit_utils_1.NullableString,
        headerBGMode: conduit_utils_1.Nullable(BoardConstants_1.BoardBackgroundModeSchema),
        headerBGColor: conduit_utils_1.Nullable(BoardConstants_1.BoardColorSchemeSchema),
        greetingText: conduit_utils_1.NullableString,
        desktop: DesktopFormFactor,
        mobile: MobileFormFactor,
        freeTrialExpiration: conduit_utils_1.NullableTimestamp,
        created: 'timestamp',
        updated: 'timestamp',
        tasksVersion: conduit_utils_1.NullableNumber,
        calendarVersion: conduit_utils_1.NullableNumber,
        filteredNotesVersion: conduit_utils_1.NullableNumber,
        extraVersion: conduit_utils_1.NullableNumber,
        coreVersion: conduit_utils_1.NullableNumber,
    },
};
exports.boardIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.boardTypeDef, {
    indexResolvers: {
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.boardTypeDef, ['NodeFields', 'created']),
        isSupported: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [Boolean(en_data_model_1.BoardType[node.NodeFields.boardType])];
            },
            graphqlPath: ['isSupported'],
            isUnSyncedField: true,
        },
    },
    queries: {
        HomeBoards: {
            sort: [{ field: 'created', order: 'DESC' }],
            filter: [{
                    field: 'isSupported',
                    value: true,
                }],
            params: {},
        },
    },
});
//# sourceMappingURL=Board.js.map