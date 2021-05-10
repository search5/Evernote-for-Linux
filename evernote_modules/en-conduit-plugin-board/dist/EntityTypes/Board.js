"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardIndexConfig = exports.boardTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
exports.boardTypeDef = {
    name: en_data_model_1.EntityTypes.Board,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Home',
    schema: Object.assign(Object.assign({}, en_home_data_model_1.BoardEntitySchema.fields), { created: 'timestamp', updated: 'timestamp', headerBG: en_core_entity_types_1.BlobV2Schema, headerBGPreviousUpload: en_core_entity_types_1.BlobV2Schema }),
};
exports.boardIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.boardTypeDef, {
    indexResolvers: {
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.boardTypeDef, ['NodeFields', 'created']),
        isSupported: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [Boolean(en_home_data_model_1.BoardType[node.NodeFields.boardType])];
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