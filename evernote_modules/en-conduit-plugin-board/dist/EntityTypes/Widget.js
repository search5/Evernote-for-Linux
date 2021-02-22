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
exports.createWidgetIndexConfig = exports.widgetTypeDef = exports.WidgetFormFactorSchema = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("../BoardConstants");
const Utilities = __importStar(require("../Utilities"));
exports.WidgetFormFactorSchema = {
    panelKey: 'string?',
    sortWeight: 'string',
    width: 'number',
    height: 'number',
};
exports.widgetTypeDef = {
    name: BoardConstants_1.BoardEntityTypes.Widget,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Home',
    schema: {
        boardType: BoardConstants_1.boardTypes,
        isEnabled: 'boolean',
        widgetType: BoardConstants_1.widgetTypes,
        mobile: exports.WidgetFormFactorSchema,
        desktop: exports.WidgetFormFactorSchema,
        selectedTab: [...BoardConstants_1.AllTabsValues, '?'],
        content: en_data_model_1.BlobV2SchemaWithContent,
        created: 'timestamp',
        updated: 'timestamp',
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
                type: en_data_model_1.CoreEntityTypes.Note,
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
            mobile_sortWeight: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'mobile', 'sortWeight']),
            desktop_sortWeight: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'desktop', 'sortWeight']),
            created: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'created']),
            widgetType: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetTypeDef, ['NodeFields', 'widgetType']),
            isSupportedV2: {
                schemaType: 'boolean',
                resolver: async (trc, node, _) => {
                    const widgetType = node.NodeFields.widgetType;
                    let isSupported = Boolean(BoardConstants_1.WidgetType[widgetType]) && Boolean(BoardConstants_1.BoardType[node.NodeFields.boardType]);
                    if (widgetType === BoardConstants_1.WidgetType.Calendar && !schemaFeatures.calendar) {
                        isSupported = false;
                    }
                    else if (widgetType === BoardConstants_1.WidgetType.Tasks && !schemaFeatures.tasks) {
                        isSupported = false;
                    }
                    return [isSupported];
                },
                graphqlPath: ['isSupported'],
                isUnSyncedField: true,
            },
        },
        queries: {
            WidgetsInBoard: {
                traversalName: 'platformWidgets',
                filter: [{
                        field: 'isSupportedV2',
                        value: true,
                    }],
                params: {
                    board: {
                        match: { field: 'parent' },
                    },
                    platform: {
                        sort: {
                            mobile: [{ field: 'mobile_sortWeight', order: 'ASC' }, { field: 'created', order: 'DESC' }],
                            desktop: [{ field: 'desktop_sortWeight', order: 'ASC' }, { field: 'created', order: 'DESC' }],
                        },
                    },
                },
                includeFields: ['widgetType'],
            },
        },
    });
};
exports.createWidgetIndexConfig = createWidgetIndexConfig;
//# sourceMappingURL=Widget.js.map