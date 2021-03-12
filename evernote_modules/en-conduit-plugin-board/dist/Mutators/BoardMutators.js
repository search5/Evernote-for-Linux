"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardMutators = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const BoardConstants_1 = require("../BoardConstants");
const BoardFeatureSchemaManager_1 = require("../Schema/BoardFeatureSchemaManager");
const emptyContentHash = conduit_utils_1.md5('');
const createBoardCreateHomeMutator = (di) => {
    const boardCreateHome = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        requiredParams: {
            serviceLevel: Object.values(en_core_entity_types_1.ServiceLevel),
        },
        optionalParams: {
            resetLayout: 'boolean',
            platform: Object.values(BoardConstants_1.FormFactor),
            features: 'string[]',
            featureVersions: 'number[]',
        },
        derivedParams: {
            features: 'string[]',
            featureVersions: 'number[]',
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
            if (resetLayout && !platform) {
                throw new conduit_utils_1.MissingParameterError('Missing platform to reset board');
            }
            if (featuresParam.length !== featureVersionsParam.length) {
                throw new conduit_utils_1.InvalidParameterError('Feature versions length must equal features length');
            }
            // Lazily initialization since this mutator is called very infrequently.
            const boardFeatureSchemaManager = new BoardFeatureSchemaManager_1.BoardFeatureSchemaManager(di);
            const boardGenID = await ctx.generateDeterministicID(trc, ctx.userID, BoardConstants_1.BoardEntityTypes.Board, BoardConstants_1.BoardDeterministicIdGenerator, BoardFeatureSchemaManager_1.BoardFeatureSchemaManager.formDeterministicBoardIdParts());
            const boardID = boardGenID[1];
            const boardRef = { type: BoardConstants_1.BoardEntityTypes.Board, id: boardID };
            const board = await ctx.fetchEntity(trc, boardRef);
            const isBasicLayout = serviceLevel === en_core_entity_types_1.ServiceLevel.BASIC || serviceLevel === en_core_entity_types_1.ServiceLevel.PLUS;
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
            /*
             * If board not exists, create the Board
             */
            if (!board) {
                boardCreateHomeStash.board.mutation = {
                    created: ctx.timestamp,
                    updated: ctx.timestamp,
                    boardType: BoardConstants_1.BoardType.Home,
                    desktop: {
                        layout: BoardConstants_1.DesktopLayout.ThreeColumnFlex,
                    },
                    mobile: {
                        layout: BoardConstants_1.MobileLayout.SingleColumnStack,
                    },
                };
            }
            else if (!resetLayout) { // If reset flag is false, only updates timestamp
                boardCreateHomeStash.board.mutation = {
                    updated: ctx.timestamp,
                };
            }
            else { // Reset board layout, only updates corresponding platform
                const layout = platform === BoardConstants_1.FormFactor.Desktop ? {
                    desktop: {
                        layout: BoardConstants_1.DesktopLayout.ThreeColumnFlex,
                    },
                } : platform === BoardConstants_1.FormFactor.Mobile ? {
                    mobile: {
                        layout: BoardConstants_1.MobileLayout.SingleColumnStack,
                    },
                } : {};
                boardCreateHomeStash.board.mutation = Object.assign(Object.assign({}, layout), { updated: ctx.timestamp, boardType: BoardConstants_1.BoardType.Home });
            }
            const widgetEdges = (await ctx.traverseGraph(trc, boardRef, [{ edge: ['outputs', 'children'], type: BoardConstants_1.BoardEntityTypes.Widget }])).filter(e => Boolean(e.edge));
            const boardLayoutSummary = await boardFeatureSchemaManager.generateDefaultLayout(trc, ctx, isBasicLayout, features, featureVersions);
            const widgetsFound = new Set();
            if (widgetEdges.length > 0) {
                // Fetch the widget entities here; note that we have already filtered for undefined edges, so the ! operator is safe.
                const existingWidgets = await ctx.fetchEntities(trc, BoardConstants_1.BoardEntityTypes.Widget, widgetEdges.map(we => we.edge.dstID));
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
                    const { widget, edge, } = await boardFeatureSchemaManager.createWidgetAndEdge(ctx, boardID, boardLayoutSummary, requiredWidget.idGen, requiredWidget.defaults);
                    boardCreateHomeStash.widgets.push({
                        original: null,
                        mutation: widget,
                        operation: 'CREATE',
                        idGen: requiredWidget.idGen,
                        nodeRef: {
                            type: BoardConstants_1.BoardEntityTypes.Widget,
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
                        feature,
                        featureVersion,
                        boardType: BoardConstants_1.BoardType.Home,
                        board,
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
                        node: ctx.assignFields(BoardConstants_1.BoardEntityTypes.Widget, widget.mutation),
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
                    node: ctx.assignFields(BoardConstants_1.BoardEntityTypes.Board, boardCreateHomeStash.board.mutation),
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
        requiredParams: {
            board: 'ID',
        },
        optionalParams: {
            durationInDays: 'number',
        },
        execute: async (trc, ctx, params) => {
            var _a;
            const nodeRef = { id: params.board, type: BoardConstants_1.BoardEntityTypes.Board };
            const board = await ctx.fetchEntity(trc, nodeRef);
            if (!board) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing Board to delete');
            }
            // Defaulting here instead of initParams, as TypeScript dings us on the interface unless initParams returns a stronger type.
            const durationInDays = (_a = params.durationInDays) !== null && _a !== void 0 ? _a : 14;
            if (durationInDays < 0 || durationInDays > 90) {
                throw new conduit_utils_1.InternalError('Free trial duration not in range');
            }
            if (board.NodeFields.boardType !== BoardConstants_1.BoardType.Home) {
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
                        node: ctx.assignFields(BoardConstants_1.BoardEntityTypes.Board, {
                            updated: ctx.timestamp,
                            freeTrialExpiration: ctx.timestamp + (conduit_utils_1.MILLIS_IN_ONE_DAY * durationInDays),
                        }),
                    }],
            };
        },
    };
    return boardStartFreeTrial;
};
async function createDeleteBoardImageExecutionPlan(trc, ctx, param, boardID) {
    return {
        results: {},
        ops: [
            {
                changeType: 'Node:UPDATE',
                nodeRef: {
                    type: BoardConstants_1.BoardEntityTypes.Board,
                    id: boardID,
                },
                node: ctx.assignFields(BoardConstants_1.BoardEntityTypes.Board, {
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
        requiredParams: {
            board: 'ID',
        },
        optionalParams: {},
        execute: async (trc, ctx, params) => {
            return await createDeleteBoardImageExecutionPlan(trc, ctx, 'headerBG', params.board);
        },
    };
    return boardDeleteHeaderBG;
};
const createBoardDeletePreviousHeaderBGMutator = () => {
    const boardDeletePreviousHeaderBG = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        requiredParams: {
            board: 'ID',
        },
        optionalParams: {},
        execute: async (trc, ctx, params) => {
            return await createDeleteBoardImageExecutionPlan(trc, ctx, 'headerBGPreviousUpload', params.board);
        },
    };
    return boardDeletePreviousHeaderBG;
};
const createBoardMutators = (di) => {
    return {
        boardCreateHome: createBoardCreateHomeMutator(di),
        boardStartFreeTrial: createBoardStartFreeTrialMutator(),
        boardDeleteHeaderBG: createBoardDeleteHeaderBGMutator(),
        boardDeletePreviousHeaderBG: createBoardDeletePreviousHeaderBGMutator(),
    };
};
exports.createBoardMutators = createBoardMutators;
//# sourceMappingURL=BoardMutators.js.map