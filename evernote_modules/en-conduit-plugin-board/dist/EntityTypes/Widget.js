"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWidgetIndexConfig = exports.widgetTypeDef = exports.ColorSchemeSchema = exports.SearchQuerySchema = exports.WidgetFormFactorSchema = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("../BoardConstants");
const Utilities = __importStar(require("../Utilities"));
exports.WidgetFormFactorSchema = conduit_utils_1.Struct({
    panelKey: conduit_utils_1.NullableString,
    sortWeight: 'string',
    width: 'number',
    height: 'number',
});
exports.SearchQuerySchema = conduit_utils_1.Struct({
    query: 'string',
});
exports.ColorSchemeSchema = conduit_utils_1.Struct({
    light: 'string',
    dark: 'string',
});
exports.widgetTypeDef = {
    name: BoardConstants_1.BoardEntityTypes.Widget,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Home',
    schema: {
        boardType: BoardConstants_1.BoardTypeSchema,
        isEnabled: 'boolean',
        softDelete: conduit_utils_1.NullableBoolean,
        widgetType: conduit_utils_1.Enum(en_data_model_1.WidgetType, 'WidgetType'),
        mutableWidgetType: conduit_utils_1.Nullable(BoardConstants_1.MutableWidgetTypeSchema),
        internalID: conduit_utils_1.NullableNumber,
        mobile: exports.WidgetFormFactorSchema,
        desktop: exports.WidgetFormFactorSchema,
        selectedTab: conduit_utils_1.Nullable(BoardConstants_1.WidgetSelectedTabsSchema),
        content: en_core_entity_types_1.BlobV2WithContentSchema,
        created: 'timestamp',
        updated: 'timestamp',
        filteredNotesQuery: conduit_utils_1.Nullable(exports.SearchQuerySchema),
        backgroundColor: conduit_utils_1.Nullable(exports.ColorSchemeSchema),
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY_LINK,
            from: {
                type: BoardConstants_1.BoardEntityTypes.Board,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'children',
            },
        },
        contentProvider: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: {
                type: en_core_entity_types_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'contentHandler',
            },
        },
    },
};
const createWidgetIndexConfig = (di) => {
    // Eagerly initializing as this code can conceivably be called a lot.
    const schemaFeatures = Utilities.getBoardPluginFeatures(di).schema;
    return conduit_storage_1.buildNodeIndexConfiguration(exports.widgetTypeDef, {
        indexResolvers: {
            parent: conduit_storage_1.getIndexByResolverForEdge(exports.widgetTypeDef, ['edges', 'parent']),
            contentProvider: conduit_storage_1.getIndexByResolverForEdge(exports.widgetTypeDef, ['edges', 'contentProvider']),
            mobile_sortWeight: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'mobile', 'sortWeight']),
            created: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'created']),
            widgetType: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'widgetType']),
            isEnabled: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'isEnabled']),
            selectedTab: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'selectedTab']),
            mutableWidgetType: {
                schemaType: conduit_utils_1.Nullable(BoardConstants_1.MutableWidgetTypeSchema),
                resolver: async (trc, node, _) => {
                    const { boardType, mutableWidgetType, } = node.NodeFields;
                    return [Utilities.safeMutableWidgetType(schemaFeatures, boardType, mutableWidgetType)];
                },
                graphqlPath: ['mutableWidgetType'],
                isUnSyncedField: true,
            },
            isSupportedV3: {
                schemaType: 'boolean',
                resolver: async (trc, node, _) => {
                    const { boardType, widgetType, } = node.NodeFields;
                    let visibleToClients = Utilities.isWidgetSupported(schemaFeatures, boardType, widgetType);
                    /*
                     * We could add a second index for this; however, the overall ideay is the same.
                     *  Show this widget to the clients?
                     *  This seems more perfomant in the end.
                     *  Only run this logic if the supported calculation above results in true, otherwise we will inappropriately override it.
                     */
                    if (visibleToClients) {
                        visibleToClients = !node.NodeFields.softDelete;
                    }
                    return [visibleToClients];
                },
                graphqlPath: ['isSupported'],
                isUnSyncedField: true,
            },
        },
        queries: {
            WidgetsInBoard: {
                traversalName: 'platformWidgets',
                filter: [{
                        field: 'isSupportedV3',
                        value: true,
                    }],
                params: {
                    board: {
                        match: { field: 'parent' },
                    },
                    platform: {
                        sort: {
                            mobile: [{ field: 'mobile_sortWeight', order: 'ASC' }, { field: 'created', order: 'DESC' }],
                            desktop: [{ field: 'created', order: 'DESC' }],
                        },
                    },
                },
                includeFields: ['widgetType', 'mutableWidgetType', 'isEnabled', 'selectedTab', 'contentProvider', 'mobile_sortWeight'],
            },
        },
    });
};
exports.createWidgetIndexConfig = createWidgetIndexConfig;
//# sourceMappingURL=Widget.js.map