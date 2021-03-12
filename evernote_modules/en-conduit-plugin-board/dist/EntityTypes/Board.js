"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardIndexConfig = exports.boardTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_core_entity_types_1 = require("en-core-entity-types");
const BoardConstants_1 = require("../BoardConstants");
const DesktopFormFactor = {
    layout: BoardConstants_1.desktopLayouts,
};
const MobileFormFactor = {
    layout: BoardConstants_1.mobileLayouts,
};
exports.boardTypeDef = {
    name: BoardConstants_1.BoardEntityTypes.Board,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Home',
    schema: {
        boardType: BoardConstants_1.boardTypes,
        headerBG: en_core_entity_types_1.BlobV2Schema,
        headerBGMime: 'string?',
        headerBGFileName: 'string?',
        headerBGPreviousUpload: en_core_entity_types_1.BlobV2Schema,
        headerBGPreviousUploadMime: 'string?',
        headerBGPreviousUploadFileName: 'string?',
        desktop: DesktopFormFactor,
        mobile: MobileFormFactor,
        freeTrialExpiration: 'timestamp?',
        created: 'timestamp',
        updated: 'timestamp',
        tasksVersion: 'number?',
        calendarVersion: 'number?',
    },
};
exports.boardIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.boardTypeDef, {
    indexResolvers: {
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.boardTypeDef, ['NodeFields', 'created']),
        isSupported: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [Boolean(BoardConstants_1.BoardType[node.NodeFields.boardType])];
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