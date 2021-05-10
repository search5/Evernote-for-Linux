"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.createBoardMutators = exports.BoardHeaderFieldsSchema = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const BoardFeatureSchemaManager_1 = require("../Schema/BoardFeatureSchemaManager");
const Utilities = __importStar(require("../Utilities"));
const emptyContentHash = conduit_utils_1.md5('');
exports.BoardHeaderFieldsSchema = conduit_utils_1.NullableStruct({
    headerBGMode: conduit_utils_1.Nullable(en_home_data_model_1.BoardBackgroundModeSchema),
    headerBGColor: conduit_utils_1.Nullable(conduit_utils_1.ExtendStruct(en_home_data_model_1.BoardColorSchemeSchema, {}, 'BoardColorSchemeInput')),
    greetingText: conduit_utils_1.NullableString,
}, 'BoardHeaderFields');
const createBoardCreateHomeMutator = (di) => {
    const boardCreateHome = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            serviceLevel: en_home_data_model_1.BoardServiceLevelSchema,
            resetLayout: conduit_utils_1.NullableBoolean,
            platform: conduit_utils_1.Nullable(en_home_data_model_1.DeviceFormFactorSchema),
            features: conduit_utils_1.NullableListOf('string'),
            featureVersions: conduit_utils_1.NullableListOf('number'),
        },
        derivedParams: {
            features: conduit_utils_1.ListOf('string'),
            featureVersions: conduit_utils_1.ListOf('number'),
        },
        resultTypes: conduit_core_1.GenericMutatorResultsSchema,
        initParams: async (trc, ctx, paramsIn, paramsOut) => {
            var _a, _b;
            // Lazily initialization since this mutator is called very infrequently.
            const boardFeatureSchemaManager = new BoardFeatureSchemaManager_1.BoardFeatureSchemaManager(di);
            /*
             * This is very important: The filter here generates the parameters sent to the server, minimizing leak impact.
             */
            const { features, featureVersions, } = boardFeatureSchemaManager.filterFeaturesRequested((_a = paramsIn.features) !== null && _a !== void 0 ? _a : [], (_b = paramsIn.featureVersions) !== null && _b !== void 0 ? _b : []);
            paramsOut.featureVersions = featureVersions;
            paramsOut.features = features;
        },
        execute: async (trc, ctx, params) => {
            const { serviceLevel, resetLayout, platform, features: featuresParam, featureVersions: featureVersionsParam, } = params;
            if (featuresParam.length !== featureVersionsParam.length) {
                throw new conduit_utils_1.InvalidParameterError('Feature versions length must equal features length');
            }
            // Lazily initialization since this mutator is called very infrequently.
            const boardFeatureSchemaManager = new BoardFeatureSchemaManager_1.BoardFeatureSchemaManager(di);
            const boardGenID = await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.Board, en_data_model_1.DefaultDeterministicIdGenerator, en_home_data_model_1.BoardSchema.formDeterministicBoardIdParts(ctx.userID));
            const boardID = boardGenID[1];
            const boardRef = { type: en_data_model_1.EntityTypes.Board, id: boardID };
            const board = await ctx.fetchEntity(trc, boardRef);
            const userFeatureLevel = en_home_data_model_1.BoardSchema.calculateUserAdjustedServiceLevel(serviceLevel);
            const { features, featureVersions, } = boardFeatureSchemaManager.mergeToMinimumFeatureVersions(featuresParam, featureVersionsParam, board);
            const boardCreateHomeStash = {
                board: {
                    original: board,
                    mutation: {},
                    operation: board ? 'UPDATE' : 'CREATE',
                    idGen: boardGenID,
                    nodeRef: boardRef,
                },
                widgets: [],
                edgesToCreate: [],
            };
            const requiredBoardUpdateFields = {
                internalID: 0,
                serviceLevel,
                updated: ctx.timestamp,
                boardType: en_home_data_model_1.BoardType.Home,
            };
            /*
             * If board not exists, create the Board
             */
            if (!board) {
                boardCreateHomeStash.board.mutation = Object.assign(Object.assign({}, requiredBoardUpdateFields), { created: ctx.timestamp, isCustomized: false, desktop: {
                        layout: en_home_data_model_1.BoardDesktopLayout.ThreeColumnFlex,
                    }, mobile: {
                        layout: en_home_data_model_1.BoardMobileLayout.SingleColumnStack,
                    } });
            }
            else if (!resetLayout) {
                boardCreateHomeStash.board.mutation = requiredBoardUpdateFields;
            }
            else { // Reset board layout, only updates corresponding platform
                const desktopDefault = {
                    layout: en_home_data_model_1.BoardDesktopLayout.ThreeColumnFlex,
                };
                const mobileDefault = {
                    layout: en_home_data_model_1.BoardMobileLayout.SingleColumnStack,
                };
                const layout = {};
                if (platform === en_home_data_model_1.DeviceFormFactor.Desktop) {
                    layout.desktop = desktopDefault;
                }
                else if (platform === en_home_data_model_1.DeviceFormFactor.Mobile) {
                    layout.mobile = mobileDefault;
                }
                else {
                    layout.desktop = desktopDefault;
                    layout.mobile = mobileDefault;
                }
                boardCreateHomeStash.board.mutation = Object.assign(Object.assign({}, requiredBoardUpdateFields), layout);
            }
            const boardPluginFeatures = Utilities.getBoardPluginFeatures(di);
            const widgetEdges = (await ctx.traverseGraph(trc, boardRef, [{ edge: ['outputs', 'children'], type: en_data_model_1.EntityTypes.Widget }])).filter(e => Boolean(e.edge));
            const boardLayoutSummary = await boardFeatureSchemaManager.generateDefaultLayout(trc, ctx, userFeatureLevel, features, featureVersions, en_home_data_model_1.BoardType.Home, 0, Boolean(boardPluginFeatures.useServiceLevelV2Layouts));
            const widgetsFound = new Set();
            let existingWidgets;
            if (widgetEdges.length > 0) {
                // Fetch the widget entities here; note that we have already filtered for undefined edges, so the ! operator is safe.
                existingWidgets = await ctx.fetchEntities(trc, en_data_model_1.EntityTypes.Widget, widgetEdges.map(we => we.edge.dstID));
                for (const widget of existingWidgets) {
                    if (widget) {
                        widgetsFound.add(widget.id);
                        // If the deterministric Widget Id exists, keep at as part of the stash for later feature upgrades.
                        if (!resetLayout) { // No default values to apply for a reset
                            // When we are not resetting, we need to adjust the summary values for new widgets appended to the end of the list.
                            boardFeatureSchemaManager.adjustBoardLayoutSummary(boardLayoutSummary, widget);
                            boardCreateHomeStash.widgets.push({
                                original: widget,
                                mutation: {
                                    updated: ctx.timestamp,
                                },
                                operation: 'UPDATE',
                                nodeRef: {
                                    type: widget.type,
                                    id: widget.id,
                                },
                            });
                        }
                        else { // Must apply default values for a reset.
                            const defaultsAndID = boardLayoutSummary.widgetDefaultsById.get(widget.id);
                            if (defaultsAndID) {
                                const mutation = {
                                    updated: ctx.timestamp,
                                };
                                boardFeatureSchemaManager.applyWidgetDefaults(mutation, defaultsAndID.defaults, platform);
                                boardCreateHomeStash.widgets.push({
                                    original: widget,
                                    mutation,
                                    operation: 'UPDATE',
                                    nodeRef: {
                                        type: widget.type,
                                        id: widget.id,
                                    },
                                });
                            }
                        }
                    }
                }
            }
            for (const requiredWidget of boardLayoutSummary.widgetDefaultsById.values()) {
                const widgetID = requiredWidget.idGen[1];
                // If the deterministric Widget Id does not exist, create it using the generated template
                if (!widgetsFound.has(widgetID)) {
                    const { widget, edge, } = await boardFeatureSchemaManager.createWidgetAndEdge(ctx, boardID, boardLayoutSummary, requiredWidget.idGen, requiredWidget.defaults, board === null || board === void 0 ? void 0 : board.NodeFields.isCustomized);
                    boardCreateHomeStash.widgets.push({
                        original: null,
                        mutation: widget,
                        operation: 'CREATE',
                        idGen: requiredWidget.idGen,
                        nodeRef: {
                            type: en_data_model_1.EntityTypes.Widget,
                            id: widgetID,
                        },
                    });
                    boardCreateHomeStash.edgesToCreate.push(edge);
                }
            }
            if (features.length > 0) {
                const widgetsForUpgrade = new Map();
                for (const widgetMutation of boardCreateHomeStash.widgets) {
                    widgetsForUpgrade.set(widgetMutation.nodeRef.id, widgetMutation.mutation);
                }
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    const featureVersion = featureVersions[i];
                    await boardFeatureSchemaManager.upgradeSchema({
                        trc,
                        ctx,
                        owner: ctx.userID,
                        serviceLevel,
                        feature,
                        featureVersion,
                        boardType: en_home_data_model_1.BoardType.Home,
                        board,
                        boardRef,
                        boardLayoutSummary,
                        widgets: existingWidgets,
                        boardMutation: boardCreateHomeStash.board.mutation,
                        widgetMutations: widgetsForUpgrade,
                    });
                }
            }
            const plan = {
                results: {
                    result: boardID,
                },
                ops: [],
            };
            for (const widget of boardCreateHomeStash.widgets) {
                if (widget.operation === 'UPDATE') {
                    plan.ops.push({
                        changeType: 'Node:UPDATE',
                        nodeRef: widget.nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, widget.mutation),
                    });
                }
                else if (widget.idGen) {
                    plan.ops.push({
                        id: widget.idGen,
                        changeType: 'Node:CREATE',
                        node: ctx.createEntity(widget.nodeRef, widget.mutation, ctx.userID),
                    });
                }
            }
            // Board has to come after widgets to ensure schema consistency.
            if (boardCreateHomeStash.board.operation === 'UPDATE') {
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef: boardCreateHomeStash.board.nodeRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.Board, boardCreateHomeStash.board.mutation),
                });
            }
            else if (boardCreateHomeStash.board.idGen) {
                plan.ops.push({
                    id: boardCreateHomeStash.board.idGen,
                    changeType: 'Node:CREATE',
                    node: ctx.createEntity(boardCreateHomeStash.board.nodeRef, boardCreateHomeStash.board.mutation, ctx.userID),
                });
            }
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: boardCreateHomeStash.edgesToCreate,
            });
            return plan;
        },
    };
    return boardCreateHome;
};
/* Start Free Trial */
const createBoardStartFreeTrialMutator = () => {
    const boardStartFreeTrial = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            board: 'ID',
            durationInDays: conduit_utils_1.NullableNumber,
        },
        execute: async (trc, ctx, params) => {
            var _a;
            const nodeRef = { id: params.board, type: en_data_model_1.EntityTypes.Board };
            const board = await ctx.fetchEntity(trc, nodeRef);
            if (!board) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing Board to update');
            }
            // Defaulting here instead of initParams, as TypeScript dings us on the interface unless initParams returns a stronger type.
            const durationInDays = (_a = params.durationInDays) !== null && _a !== void 0 ? _a : 14;
            if (durationInDays < 0 || durationInDays > 90) {
                throw new conduit_utils_1.InternalError('Free trial duration not in range');
            }
            if (board.NodeFields.boardType !== en_home_data_model_1.BoardType.Home) {
                throw new conduit_utils_1.InternalError('Cannot do a free trial for a board that is not a Home board');
            }
            if (board.NodeFields.freeTrialExpiration) {
                throw new conduit_utils_1.InternalError('Cannot do more than one free trial');
            }
            return {
                results: {},
                ops: [{
                        changeType: 'Node:UPDATE',
                        nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.Board, {
                            updated: ctx.timestamp,
                            freeTrialExpiration: ctx.timestamp + (conduit_utils_1.MILLIS_IN_ONE_DAY * durationInDays),
                        }),
                    }],
            };
        },
    };
    return boardStartFreeTrial;
};
/* Set Is Customized for Tighter Repackaging Logic Through Tiers */
const createBoardSetIsCustomized = () => {
    const boardSetIsCustomized = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            board: 'ID',
            isCustomized: 'boolean',
        },
        execute: async (trc, ctx, params) => {
            const nodeRef = { id: params.board, type: en_data_model_1.EntityTypes.Board };
            const board = await ctx.fetchEntity(trc, nodeRef);
            if (!board) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing Board to update');
            }
            return {
                results: {},
                ops: [{
                        changeType: 'Node:UPDATE',
                        nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.Board, {
                            updated: ctx.timestamp,
                            isCustomized: params.isCustomized,
                        }),
                    }],
            };
        },
    };
    return boardSetIsCustomized;
};
async function createDeleteBoardImageExecutionPlan(trc, ctx, param, boardID) {
    return {
        results: {},
        ops: [
            {
                changeType: 'Node:UPDATE',
                nodeRef: {
                    type: en_data_model_1.EntityTypes.Board,
                    id: boardID,
                },
                node: ctx.assignFields(en_data_model_1.EntityTypes.Board, {
                    updated: ctx.timestamp,
                    [`${param}Mime`]: null,
                    [`${param}FileName`]: null,
                    [`${param}`]: {
                        localChangeTimestamp: ctx.timestamp,
                        hash: emptyContentHash,
                        path: '',
                        size: 0,
                    },
                }),
            },
        ],
    };
}
const createBoardDeleteHeaderBGMutator = () => {
    const boardDeleteHeaderBG = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            board: 'ID',
        },
        execute: async (trc, ctx, params) => {
            return await createDeleteBoardImageExecutionPlan(trc, ctx, 'headerBG', params.board);
        },
    };
    return boardDeleteHeaderBG;
};
const createBoardDeletePreviousHeaderBGMutator = () => {
    const boardDeletePreviousHeaderBG = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            board: 'ID',
        },
        execute: async (trc, ctx, params) => {
            return await createDeleteBoardImageExecutionPlan(trc, ctx, 'headerBGPreviousUpload', params.board);
        },
    };
    return boardDeletePreviousHeaderBG;
};
const createBoardHeaderCustomizeMutator = () => {
    const boardHeaderCustomize = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            board: 'ID',
            fields: exports.BoardHeaderFieldsSchema,
        },
        execute: async (trc, ctx, params) => {
            const nodeRef = { id: params.board, type: en_data_model_1.EntityTypes.Board };
            const board = await ctx.fetchEntity(trc, nodeRef);
            if (!board) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing Board to update');
            }
            if (!params.fields || Object.keys(params.fields).length === 0) {
                throw new conduit_utils_1.InvalidParameterError('Missing fields to customize');
            }
            if (params.fields && params.fields.headerBGMode === en_home_data_model_1.BoardBackgroundMode.Color && (!params.fields.headerBGColor && !board.NodeFields.headerBGColor)) {
                throw new conduit_utils_1.InvalidParameterError('Cannot set color mode without color');
            }
            return {
                results: {},
                ops: [{
                        changeType: 'Node:UPDATE',
                        nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.Board, Object.assign({ updated: ctx.timestamp }, params.fields)),
                    }],
            };
        },
    };
    return boardHeaderCustomize;
};
const createBoardMutators = (di) => {
    return {
        boardCreateHome: createBoardCreateHomeMutator(di),
        boardStartFreeTrial: createBoardStartFreeTrialMutator(),
        boardDeleteHeaderBG: createBoardDeleteHeaderBGMutator(),
        boardDeletePreviousHeaderBG: createBoardDeletePreviousHeaderBGMutator(),
        boardSetIsCustomized: createBoardSetIsCustomized(),
        boardHeaderCustomize: createBoardHeaderCustomizeMutator(),
    };
};
exports.createBoardMutators = createBoardMutators;
//# sourceMappingURL=BoardMutators.js.map