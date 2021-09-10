"use strict";
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
exports.createWidgetMutators = void 0;
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const BoardWidgetBuilder_1 = require("../BoardWidgetBuilder");
const types_1 = require("../Schema/types");
const Utilities = __importStar(require("../Utilities"));
/* Set ScratchPad content */
const createWidgetScratchPadSetContentMutator = (di) => {
    // Eagerly initializing as this code can conceivably be called a lot.
    const optimisticConflictDetectionEnabled = Utilities.getBoardPluginFeatures(di).optimisticConflictDetectionEnabled;
    const widgetScratchPadSetContent = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
            scratchPadContent: 'string',
            previousContentHash: conduit_utils_1.NullableString,
        },
        derivedParams: {
            hash: 'string',
            size: 'int',
        },
        initParams: async (trc, ctx, paramsIn, paramsOut) => {
            paramsOut.hash = ctx.md5(paramsIn.scratchPadContent);
            paramsOut.size = paramsIn.scratchPadContent.length;
        },
        buffering: {
            time: 1500,
        },
        rollupStrategy: {
            ifParamsMatch: [
                { prev: 'widget', next: 'widget' },
            ],
            combineParams: {
                previousContentHash: 'first',
                scratchPadContent: 'last',
                hash: 'last',
                size: 'last',
            },
        },
        execute: async (trc, ctx, params) => {
            const { widget: widgetID, size, hash, previousContentHash, scratchPadContent: content, } = params;
            const nodeRef = { id: widgetID, type: en_data_model_1.EntityTypes.Widget };
            const widget = await ctx.fetchEntity(trc, nodeRef);
            if (!widget) {
                throw new conduit_utils_1.NotFoundError(params.widget, 'missing widget in update');
            }
            Utilities.validateMutableWidgetTypes('content', en_home_data_model_1.WidgetType.ScratchPad, en_home_data_model_1.MutableWidgetType.ScratchPad, widget);
            const ops = [];
            const conflictDetected = (optimisticConflictDetectionEnabled && // Client/Conduit supports optimistic conflict detection.
                previousContentHash && // Conflict detection is enabled in the client.
                widget.NodeFields.content.content.length > 0 && // We have existing widget content (empty content cannot generate a conflict)
                previousContentHash !== widget.NodeFields.content.hash && // The stream is out of order
                content !== widget.NodeFields.content.content // Cannot have conflicts on equal content.
            );
            // We have a conflict and our size is greater than zero, we need to generate/update a conflict.
            if (conflictDetected && size > 0) {
                const conflictAssociations = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'conflicts'], type: en_data_model_1.EntityTypes.WidgetContentConflict }]);
                const conflicts = await ctx.fetchEntities(trc, en_data_model_1.EntityTypes.WidgetContentConflict, conflictAssociations.filter(a => a.edge).map(a => a.edge.dstID));
                // We cannot have a conflict on equal content.
                const conflictToUpdate = conflicts.find(c => (c === null || c === void 0 ? void 0 : c.NodeFields.content.content) === widget.NodeFields.content.content);
                // If we have a matching conflict, just update the data and let the client become consistent.
                if (conflictToUpdate) {
                    ops.push({
                        changeType: 'Node:UPDATE',
                        nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.WidgetContentConflict, {
                            updated: ctx.timestamp,
                        }),
                    });
                }
                else { // Here, we need to create a new conflict.
                    const conflictId = await ctx.generateID(trc, ctx.userID, en_data_model_1.EntityTypes.WidgetContentConflict);
                    const conflictEntityId = conflictId[1];
                    ops.push({
                        id: conflictId,
                        changeType: 'Node:CREATE',
                        node: ctx.createEntity({ id: conflictEntityId, type: en_data_model_1.EntityTypes.WidgetContentConflict }, {
                            created: ctx.timestamp,
                            updated: ctx.timestamp,
                            content: {
                                size: widget.NodeFields.content.size,
                                hash: widget.NodeFields.content.hash,
                                content: widget.NodeFields.content.content,
                                path: '',
                                localChangeTimestamp: 0,
                            },
                        }, ctx.userID),
                        remoteFields: {},
                    });
                    ops.push({
                        changeType: 'Edge:MODIFY',
                        edgesToCreate: [{
                                dstID: conflictEntityId,
                                dstType: en_data_model_1.EntityTypes.WidgetContentConflict,
                                dstPort: 'parent',
                                srcID: nodeRef.id,
                                srcType: nodeRef.type,
                                srcPort: 'conflicts',
                            }],
                    });
                }
            }
            // If we have a conflict detected, but our incoming content is empty, we just update the date and force the client to start from this POV
            if (conflictDetected && size === 0) {
                ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, {
                        updated: ctx.timestamp,
                    }),
                });
            }
            else { // We set our content in all other scenarios.
                ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, {
                        updated: ctx.timestamp,
                        content: {
                            size,
                            hash,
                            content,
                            path: '',
                            localChangeTimestamp: 0,
                        },
                    }),
                });
            }
            return {
                results: {},
                ops,
            };
        },
    };
    return widgetScratchPadSetContent;
};
/* Resolve widget conflict */
const createWidgetResolveConflictMutator = () => {
    const widgetResolveConflict = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            conflict: 'ID',
            conflictHash: 'string',
        },
        execute: async (trc, ctx, params) => {
            const { conflict: conflictID, conflictHash, } = params;
            const nodeRef = { id: conflictID, type: en_data_model_1.EntityTypes.WidgetContentConflict };
            const conflict = await ctx.fetchEntity(trc, nodeRef);
            if (!conflict) {
                throw new conduit_utils_1.NotFoundError(conflictID, 'missing conflict in update');
            }
            if (conflict.NodeFields.content.hash !== conflictHash) {
                throw new conduit_utils_1.NotFoundError(`Conflict hash of ${conflictHash} is out of date for conflict ${conflictID}`);
            }
            return {
                results: {},
                ops: [{
                        changeType: 'Node:DELETE',
                        nodeRef,
                    }],
            };
        },
    };
    return widgetResolveConflict;
};
/* Set selected tab on Widget */
const createWidgetSetSelectedTabMutator = () => {
    const widgetSetSelectedTab = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
            tabToSelect: en_home_data_model_1.WidgetSelectedTabsSchema,
        },
        buffering: {
            time: 1500,
        },
        rollupStrategy: {
            ifParamsMatch: [
                { prev: 'widget', next: 'widget' },
            ],
            combineParams: {
                tabToSelect: 'last',
            },
        },
        execute: async (trc, ctx, params) => {
            const nodeRef = { id: params.widget, type: en_data_model_1.EntityTypes.Widget };
            const widget = await ctx.fetchEntity(trc, nodeRef);
            if (!widget) {
                throw new conduit_utils_1.NotFoundError(params.widget, 'missing widget in update');
            }
            const plan = {
                results: {},
                ops: [
                    {
                        changeType: 'Node:UPDATE',
                        nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, {
                            selectedTab: params.tabToSelect,
                            updated: ctx.timestamp,
                        }),
                    },
                ],
            };
            return plan;
        },
    };
    return widgetSetSelectedTab;
};
// TODO: Remove from Conduit after both clients are migrated to the V2 definition.
const createWidgetCustomizeMutator = () => {
    const widgetCustomize = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
            isEnabled: conduit_utils_1.NullableBoolean,
            desktopSortWeight: conduit_utils_1.NullableString,
            desktopWidth: conduit_utils_1.NullableNumber,
            mobileSortWeight: conduit_utils_1.NullableString,
            noteToUnpin: conduit_utils_1.NullableID,
            noteToPin: conduit_utils_1.NullableID,
            mutableWidgetType: conduit_utils_1.Nullable(en_home_data_model_1.MutableWidgetTypeSchema),
            filteredNotesQueryString: conduit_utils_1.NullableString,
            label: conduit_utils_1.NullableString,
            lightBGColor: conduit_utils_1.NullableString,
            darkBGColor: conduit_utils_1.NullableString,
        },
        execute: async (trc, ctx, params) => {
            const nodeRef = { id: params.widget, type: en_data_model_1.EntityTypes.Widget };
            const widget = await ctx.fetchEntity(trc, nodeRef);
            if (!widget) {
                throw new conduit_utils_1.NotFoundError(params.widget, 'missing widget in widgetCustomize');
            }
            const plan = {
                results: {},
                ops: [],
            };
            const alreadyUnpinned = new Set();
            if (params.noteToPin) {
                Utilities.validateMutableWidgetTypes('contentProvider', en_home_data_model_1.WidgetType.Pinned, en_home_data_model_1.MutableWidgetType.Pinned, widget, params.mutableWidgetType);
                // Currently, we only want to allow one note per widget, and this ensures we unpin all notes not included in the mutation.
                const notes = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'contentProvider'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
                if (notes.length) {
                    plan.ops.push({
                        changeType: 'Edge:MODIFY',
                        edgesToDelete: notes.map(note => {
                            alreadyUnpinned.add(note.id);
                            return {
                                dstID: note.id, dstType: note.type, dstPort: 'contentHandler',
                                srcID: widget.id, srcType: widget.type, srcPort: 'contentProvider',
                            };
                        }),
                    });
                }
                plan.ops.push({
                    changeType: 'Edge:MODIFY',
                    remoteFields: {},
                    edgesToCreate: [{
                            dstID: params.noteToPin, dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstPort: 'contentHandler',
                            srcID: widget.id, srcType: widget.type, srcPort: 'contentProvider',
                        }],
                });
            }
            // Only unpin the note if the parameter is passed in and we aren't doing it already.
            if ((params.noteToUnpin) && (!alreadyUnpinned.has(params.noteToUnpin))) {
                Utilities.validateMutableWidgetTypes('contentProvider', en_home_data_model_1.WidgetType.Pinned, en_home_data_model_1.MutableWidgetType.Pinned, widget, params.mutableWidgetType);
                plan.ops.push({
                    changeType: 'Edge:MODIFY',
                    remoteFields: {},
                    edgesToDelete: [{
                            dstID: params.noteToUnpin, dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstPort: 'contentHandler',
                            srcID: widget.id, srcType: widget.type, srcPort: 'contentProvider',
                        }],
                });
            }
            const fields = {};
            if (params.mutableWidgetType) {
                if (widget.NodeFields.widgetType !== en_home_data_model_1.WidgetType.Extra) {
                    throw new conduit_utils_1.InvalidParameterError(`Cannot set a mutable widget for a WidgetType of ${widget.NodeFields.widgetType}`);
                }
                fields.mutableWidgetType = params.mutableWidgetType;
            }
            if (params.filteredNotesQueryString) {
                Utilities.validateMutableWidgetTypes('filteredNotesQuery.query', en_home_data_model_1.WidgetType.FilteredNotes, en_home_data_model_1.MutableWidgetType.FilteredNotes, widget, params.mutableWidgetType);
                fields.filteredNotesQuery = {
                    query: params.filteredNotesQueryString,
                    resultSpec: {
                        type: en_home_data_model_1.WidgetSearchType.NOTE,
                    },
                };
            }
            if (params.isEnabled === true || params.isEnabled === false) {
                fields.isEnabled = params.isEnabled;
            }
            if (params.desktopSortWeight) {
                fields['desktop.sortWeight'] = params.desktopSortWeight;
            }
            if ((params.desktopWidth !== null) && (params.desktopWidth !== undefined)) {
                /*
                 * This sets up the width validation scenario.  Since we only have one, this is fairly simple now, but as implementation
                 * grows, this could get very complex and may need its own file/components.
                 */
                const parentNodeRefs = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['inputs', 'parent'], type: en_data_model_1.EntityTypes.Board }]);
                if (parentNodeRefs.length !== 1) {
                    throw new conduit_utils_1.GraphNodeError(nodeRef.id, nodeRef.type, `Invalid number of parents: ${parentNodeRefs.length}`);
                }
                const board = await ctx.fetchEntity(trc, { id: parentNodeRefs[0].id, type: en_data_model_1.EntityTypes.Board });
                if (!board) {
                    throw new conduit_utils_1.NotFoundError(parentNodeRefs[0].id, 'Could not find parent board');
                }
                if (board.NodeFields.desktop.layout !== en_home_data_model_1.BoardDesktopLayout.ThreeColumnFlex) {
                    throw new Error(`Invalid layout: ${board.NodeFields.desktop.layout}`);
                }
                const widthIsOutOfRange = params.desktopWidth < 1 || params.desktopWidth > 3;
                if (widthIsOutOfRange) {
                    throw new Error('Parameter width is out of range');
                }
                fields['desktop.width'] = params.desktopWidth;
            }
            if (params.mobileSortWeight) {
                fields['mobile.sortWeight'] = params.mobileSortWeight;
            }
            if (params.label) {
                // eslint-disable-next-line @typescript-eslint/dot-notation
                fields[`label`] = params.label;
            }
            if (params.lightBGColor && params.darkBGColor) {
                // eslint-disable-next-line @typescript-eslint/dot-notation
                fields[`backgroundColor`] = {
                    light: params.lightBGColor,
                    dark: params.darkBGColor,
                };
            }
            else if (params.lightBGColor || params.darkBGColor) {
                throw new Error(`Missing param ${params.lightBGColor ? 'darkBGColor' : 'lightBGColor'}. Both lightBGColor and darkBGColor fields are required.`);
            }
            /*
             * Only update updated once if the Widget is customized
             * Also, only apply field updates once in case we can ensure transaction atomicty
            */
            if (plan.ops.length || Object.keys(fields).length) {
                fields.updated = ctx.timestamp;
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, fields),
                });
            }
            return plan;
        },
    };
    return widgetCustomize;
};
/* Unpin Mutator with Widget Prefix for correct Server Side Routing */
const createWidgetUnpinNoteMutator = () => {
    const widgetUnpinNote = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        clientAlias: 'noteUnpin',
        params: {
            note: conduit_utils_1.NullableID,
            notes: conduit_utils_1.NullableListOf('ID'),
        },
        execute: async (trc, ctx, params) => {
            const { notes, note, } = params;
            const plan = {
                results: {},
                ops: [],
            };
            if (!notes && !note) {
                return plan;
            }
            if (note) {
                const nodeRef = { id: note, type: en_core_entity_types_1.CoreEntityTypes.Note };
                const { ops } = await BoardWidgetBuilder_1.buildOpsPlanForUnpinNote(trc, ctx, nodeRef);
                plan.ops = [...plan.ops, ...ops];
            }
            if (notes) {
                const { ops } = await BoardWidgetBuilder_1.buildOpsPlanForUnpinNotes(trc, ctx, notes, note);
                if (ops.length > 0) {
                    plan.ops = [...plan.ops, ...ops];
                }
            }
            return plan;
        },
    };
    return widgetUnpinNote;
};
const createWidgetDeleteMutator = () => {
    const widgetDelete = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
        },
        execute: async (trc, ctx, params) => {
            const { widget: widgetID, } = params;
            const nodeRef = { id: widgetID, type: en_data_model_1.EntityTypes.Widget };
            const widget = await ctx.fetchEntity(trc, nodeRef);
            if (!widget) {
                throw new conduit_utils_1.NotFoundError(widgetID, 'Missing Widget to Update');
            }
            if (en_data_model_1.DefaultDeterministicIdGenerator.isDeterministicId(widgetID)) {
                return {
                    results: {},
                    ops: [{
                            changeType: 'Node:UPDATE',
                            nodeRef,
                            node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, {
                                updated: ctx.timestamp,
                                softDelete: true,
                            }),
                        }],
                };
            }
            /*
             * A safe gaurd against our isDeterministicID check.
             * This might need to be removed later once we are battle tested and have non-deterministic widgets on Home.
             */
            if (widget.NodeFields.boardType === en_home_data_model_1.BoardType.Home) {
                throw new conduit_utils_1.InvalidOperationError(`Cannot hard delete Home widget with id ${widget.id} and boardtType ${widget.NodeFields.boardType}`);
            }
            return {
                results: {},
                ops: [{
                        changeType: 'Node:DELETE',
                        nodeRef,
                    }],
            };
        },
    };
    return widgetDelete;
};
const createWidgetRestoreMutator = () => {
    const widgetRestore = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
        },
        execute: async (trc, ctx, params) => {
            const { widget: widgetID, } = params;
            if (!en_data_model_1.DefaultDeterministicIdGenerator.isDeterministicId(widgetID)) {
                throw new conduit_utils_1.InvalidOperationError(`Non-deterministic Widget with id '${widgetID}' cannot be restored.`);
            }
            const nodeRef = { id: widgetID, type: en_data_model_1.EntityTypes.Widget };
            const widget = await ctx.fetchEntity(trc, nodeRef);
            if (!widget) {
                throw new conduit_utils_1.NotFoundError(widgetID, 'Missing Widget to Update');
            }
            return {
                results: {},
                ops: [{
                        changeType: 'Node:UPDATE',
                        nodeRef,
                        node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, {
                            updated: ctx.timestamp,
                            softDelete: false,
                        }),
                    }],
            };
        },
    };
    return widgetRestore;
};
const createWidgetFeatureTrialEnableMutator = () => {
    const widgetFeatureTrialEnable = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
            bi: types_1.WidgetBiCustomizeFieldsInput,
        },
        execute: async (trc, ctx, params) => {
            const { widget, } = params;
            const widgetToEnableRef = { id: widget, type: en_data_model_1.EntityTypes.Widget };
            const widgetToEnable = await ctx.fetchEntity(trc, widgetToEnableRef);
            if (!widgetToEnable) {
                throw new conduit_utils_1.NotFoundError(widget, 'Missing Widget to Update');
            }
            // Traverse the graph to get the parent board so we can traverse back down.
            const boardEdge = (await ctx.traverseGraph(trc, widgetToEnableRef, [{ edge: ['inputs', 'parent'], type: en_data_model_1.EntityTypes.Board }]));
            if (boardEdge.length === 0) {
                throw new conduit_utils_1.NotFoundError(widget, 'Missing Widget Parent Board Association');
            }
            const [parentBoardEdge] = boardEdge;
            if (!parentBoardEdge.edge) {
                throw new conduit_utils_1.NotFoundError(widget, 'Missing Widget Parent Board Association');
            }
            // Get all the widgets and filter by the correct values.
            const widgetEdges = (await ctx.traverseGraph(trc, { id: parentBoardEdge.edge.srcID, type: parentBoardEdge.type }, [{ edge: ['outputs', 'children'], type: en_data_model_1.EntityTypes.Widget }]));
            const allEnabledOtherWidgets = (await ctx.fetchEntities(trc, en_data_model_1.EntityTypes.Widget, widgetEdges.filter(we => !!we.edge && we.edge.dstID !== widget).map(we => we.edge.dstID))).filter(w => !!w);
            const lexoRankHandler = new conduit_utils_1.LexoRankHandler(50);
            // The widget coming into the mutation will be enabled with a desktop width of 1.
            const widgetMutations = new Map([
                [widget, {
                        isEnabled: true,
                    }],
            ]);
            const mergeCustomizeParams = (id, mergeValues) => {
                const valuesToUpdate = widgetMutations.get(id);
                if (valuesToUpdate) {
                    widgetMutations.set(id, Object.assign(Object.assign(Object.assign({}, valuesToUpdate), mergeValues), { updated: ctx.timestamp }));
                }
                else {
                    widgetMutations.set(id, Object.assign(Object.assign({}, mergeValues), { updated: ctx.timestamp }));
                }
            };
            try {
                // Place the widget at the end of the board for desktop.
                allEnabledOtherWidgets.sort(Utilities.widgetSortComparerFactory(en_home_data_model_1.DeviceFormFactor.Desktop));
                const lastWidget = allEnabledOtherWidgets[allEnabledOtherWidgets.length - 1];
                const sortWeight = lexoRankHandler.between(lastWidget.NodeFields.desktop.sortWeight, conduit_utils_1.LexoRankEndWeight);
                mergeCustomizeParams(widget, { desktop: { sortWeight, width: 1, height: 1, panelKey: undefined } });
            }
            catch (_a) {
                // We have a collision and need to redistribute all desktop weights.
                const distribute = lexoRankHandler.distribute(allEnabledOtherWidgets.length + 1);
                for (let i = 0; i < distribute.length; i++) {
                    if (i < allEnabledOtherWidgets.length) {
                        const widgetToUse = allEnabledOtherWidgets[i];
                        mergeCustomizeParams(widgetToUse.id, { desktop: {
                                sortWeight: distribute[i],
                                width: widgetToUse.NodeFields.desktop.width,
                                height: widgetToUse.NodeFields.desktop.height,
                                panelKey: widgetToUse.NodeFields.desktop.panelKey,
                            } });
                    }
                    else {
                        mergeCustomizeParams(widgetToEnable.id, { desktop: { sortWeight: distribute[i], width: 1, height: 1, panelKey: undefined } });
                    }
                }
            }
            try {
                // Place the widget at the end of the board for mobile
                allEnabledOtherWidgets.sort(Utilities.widgetSortComparerFactory(en_home_data_model_1.DeviceFormFactor.Mobile));
                const lastWidget = allEnabledOtherWidgets[allEnabledOtherWidgets.length - 1];
                const sortWeight = lexoRankHandler.between(lastWidget.NodeFields.mobile.sortWeight, conduit_utils_1.LexoRankEndWeight);
                mergeCustomizeParams(widget, { mobile: { sortWeight, width: 1, height: 1, panelKey: undefined } });
            }
            catch (_b) {
                // We have a collision and need to redistribute all mobile weights.
                const distribute = lexoRankHandler.distribute(allEnabledOtherWidgets.length + 1);
                for (let i = 0; i < distribute.length; i++) {
                    if (i < allEnabledOtherWidgets.length) {
                        const widgetToUse = allEnabledOtherWidgets[i];
                        mergeCustomizeParams(widgetToUse.id, { mobile: {
                                sortWeight: distribute[i],
                                width: widgetToUse.NodeFields.mobile.width,
                                height: widgetToUse.NodeFields.mobile.height,
                                panelKey: widgetToUse.NodeFields.mobile.panelKey,
                            } });
                    }
                    else {
                        mergeCustomizeParams(widgetToEnable.id, { mobile: { sortWeight: distribute[i], width: 1, height: 1, panelKey: undefined } });
                    }
                }
            }
            const plan = {
                results: {},
                ops: [],
            };
            for (const [id, mutation] of widgetMutations) {
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef: { id, type: en_data_model_1.EntityTypes.Widget },
                    node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, mutation),
                });
            }
            return plan;
        },
    };
    return widgetFeatureTrialEnable;
};
const createWidgetCustomizeVerIIMutator = () => {
    const widgetCustomizeVerII = {
        type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
        params: {
            widget: 'ID',
            associations: types_1.WidgetCustomizeAssociationsInput,
            fields: types_1.WidgetCustomizeFieldsInput,
            bi: types_1.WidgetBiCustomizeFieldsInput,
        },
        execute: async (trc, ctx, params) => {
            const { widget: widgetID, fields: fieldParams, associations: associationParams, } = params;
            const widgetRef = { id: widgetID, type: en_data_model_1.EntityTypes.Widget };
            const widget = await ctx.fetchEntity(trc, widgetRef);
            if (!widget) {
                throw new conduit_utils_1.NotFoundError(params.widget, 'Missing Widget to Update');
            }
            const plan = {
                results: {},
                ops: [],
            };
            let widgetCustomizeV2Mutations;
            if ((fieldParams === null || fieldParams === void 0 ? void 0 : fieldParams.isEnabled) === false) {
                widgetCustomizeV2Mutations = await BoardWidgetBuilder_1.createDisabledWidgetCustomizeV2Mutations(trc, ctx, widget);
            }
            else {
                widgetCustomizeV2Mutations = await BoardWidgetBuilder_1.createEnabledWidgetCustomizeV2Mutations(trc, ctx, widget, associationParams, fieldParams);
            }
            const fields = widgetCustomizeV2Mutations.mutationAndRef.mutation;
            if (fields && Object.keys(fields).length) {
                /*
                * Only update updated once if the Widget is customized
                * Also, only apply field updates once in case we can ensure transaction atomicty
                */
                fields.updated = ctx.timestamp;
                // These particular fields are only partials in the mutator definition, and Conduit expects a full definition to succeed.
                if (fields.desktop) {
                    const newValues = fields.desktop;
                    fields.desktop = Object.assign(Object.assign({}, widget.NodeFields.desktop), newValues);
                }
                if (fields.mobile) {
                    const newValues = fields.mobile;
                    fields.mobile = Object.assign(Object.assign({}, widget.NodeFields.mobile), newValues);
                }
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef: widgetRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.Widget, fields),
                });
            }
            if (widgetCustomizeV2Mutations.entitiesToDelete.length > 0) {
                plan.ops.push({
                    changeType: 'Node:DELETE_MULTI',
                    nodes: widgetCustomizeV2Mutations.entitiesToDelete,
                });
            }
            if (widgetCustomizeV2Mutations.associationsToCreate.length > 0 || widgetCustomizeV2Mutations.associationsToDelete.length > 0) {
                plan.ops.push({
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: widgetCustomizeV2Mutations.associationsToDelete,
                    edgesToCreate: widgetCustomizeV2Mutations.associationsToCreate,
                });
            }
            return plan;
        },
    };
    return widgetCustomizeVerII;
};
const createWidgetMutators = (di) => {
    return {
        widgetUnpinNote: createWidgetUnpinNoteMutator(),
        widgetCustomize: createWidgetCustomizeMutator(),
        widgetCustomizeVerII: createWidgetCustomizeVerIIMutator(),
        widgetSetSelectedTab: createWidgetSetSelectedTabMutator(),
        widgetResolveConflict: createWidgetResolveConflictMutator(),
        widgetScratchPadSetContent: createWidgetScratchPadSetContentMutator(di),
        widgetDelete: createWidgetDeleteMutator(),
        widgetRestore: createWidgetRestoreMutator(),
        widgetFeatureTrialEnable: createWidgetFeatureTrialEnableMutator(),
    };
};
exports.createWidgetMutators = createWidgetMutators;
//# sourceMappingURL=WidgetMutators.js.map