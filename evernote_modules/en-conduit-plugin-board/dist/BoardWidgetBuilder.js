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
exports.createDisabledWidgetCustomizeV2Mutations = exports.createEnabledWidgetCustomizeV2Mutations = exports.buildOpsPlanForUnpinNotes = exports.buildOpsPlanForUnpinNote = exports.buildOpsPlanForNotebookDelete = exports.buildOpsPlanForNoteDelete = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const Utilities = __importStar(require("./Utilities"));
async function buildOpsPlanForNoteDelete(trc, ctx, nodeRef) {
    const { ops, idsToCommandService } = await buildOpsPlanForUnpinNote(trc, ctx, nodeRef);
    // The client says this note is pinned and we need to send the mutation server side.
    if (idsToCommandService.length > 0) {
        ops.push({
            changeType: 'Custom',
            commandName: 'widgetUnpinNote',
            params: {
                notes: idsToCommandService,
            },
        });
    }
    return ops;
}
exports.buildOpsPlanForNoteDelete = buildOpsPlanForNoteDelete;
async function buildOpsPlanForNotebookDelete(trc, ctx, notes) {
    const { ops, idsToCommandService } = await buildOpsPlanForUnpinNotes(trc, ctx, notes);
    // The client says this note is pinned and we need to send the mutation server side.
    if (idsToCommandService.length > 0) {
        ops.push({
            changeType: 'Custom',
            commandName: 'widgetUnpinNote',
            params: {
                notes: idsToCommandService,
            },
        });
    }
    return ops;
}
exports.buildOpsPlanForNotebookDelete = buildOpsPlanForNotebookDelete;
async function buildOpsPlanForUnpinNote(trc, ctx, nodeRef) {
    const ops = [];
    const idsToCommandService = [];
    const edgesToDelete = [];
    const widgetNodeRefsAndEdges = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['inputs', 'contentHandler'], type: en_data_model_1.EntityTypes.Widget }]);
    for (const widgetNodeRefAndEdge of widgetNodeRefsAndEdges) {
        const { edge, } = widgetNodeRefAndEdge;
        if (edge) {
            edgesToDelete.push({
                dstID: edge.dstID,
                dstType: edge.dstType,
                dstPort: edge.dstPort,
                srcID: edge.srcID,
                srcType: edge.srcType,
                srcPort: edge.srcPort,
            });
        }
    }
    if (edgesToDelete.length > 0) {
        idsToCommandService.push(nodeRef.id);
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToDelete,
        });
    }
    return {
        ops,
        idsToCommandService,
    };
}
exports.buildOpsPlanForUnpinNote = buildOpsPlanForUnpinNote;
async function buildOpsPlanForUnpinNotes(trc, ctx, notes, noteToExclude) {
    const ops = [];
    const idsToCommandService = [];
    /*
     * Currently this seems like the most stable/predictably performant way to do this.
     */
    const [, boardID] = await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.Board, en_data_model_1.DefaultDeterministicIdGenerator, en_home_data_model_1.BoardSchema.formDeterministicBoardIdParts(ctx.userID));
    // Max of 22
    const allWidgetNodeIDs = (await ctx.traverseGraph(trc, { id: boardID, type: en_data_model_1.EntityTypes.Board }, [{ edge: ['outputs', 'children'], type: en_data_model_1.EntityTypes.Widget }])).map(graphNodeRefAndEdge => graphNodeRefAndEdge.id);
    /*
     * Pinned and Extra can have notes pinned to them.
     * Need to filter by mutableWidgetType in-case an association to Notes is ever provided for another purpose because server does not
     *  emit association names.
     */
    const widgets = (await ctx.fetchEntities(trc, en_data_model_1.EntityTypes.Widget, allWidgetNodeIDs))
        .filter(w => !!w &&
        ((w.NodeFields.widgetType === en_home_data_model_1.WidgetType.Extra && w.NodeFields.mutableWidgetType === en_home_data_model_1.MutableWidgetType.Pinned) ||
            w.NodeFields.widgetType === en_home_data_model_1.WidgetType.Pinned));
    const pinnedNoteMap = new Map();
    for (const widget of widgets) {
        // widget! is safe here because of the !!w check in the above call to .filter
        for (const edge of Object.values(widget.outputs.contentProvider)) {
            if (edge.dstType === en_core_entity_types_1.CoreEntityTypes.Note) {
                let graphEdges = pinnedNoteMap.get(edge.dstID);
                if (!graphEdges) {
                    graphEdges = [];
                    pinnedNoteMap.set(edge.dstID, graphEdges);
                }
                graphEdges.push(edge);
            }
        }
    }
    if (pinnedNoteMap.size > 0) {
        const edgesToDelete = [];
        for (const noteID of notes) {
            if (noteID === noteToExclude) {
                continue;
            }
            const edgesFound = pinnedNoteMap.get(noteID);
            if (edgesFound) {
                edgesToDelete.push(...edgesFound);
            }
        }
        if (edgesToDelete.length > 0) {
            idsToCommandService.push(...edgesToDelete.map(e => e.dstID));
            ops.push({
                changeType: 'Edge:MODIFY',
                edgesToDelete,
            });
        }
    }
    return {
        ops,
        idsToCommandService,
    };
}
exports.buildOpsPlanForUnpinNotes = buildOpsPlanForUnpinNotes;
async function createEnabledWidgetCustomizeV2Mutations(trc, ctx, widget, associations, fields) {
    var _a, _b;
    const widgetRef = { type: widget.type, id: widget.id };
    const associationsToDelete = [];
    const associationsToCreate = [];
    const mutationAndRef = {
        ref: widgetRef,
        mutation: fields ? Object.assign({}, fields) : {},
    };
    const entitiesToDelete = [];
    if (fields === null || fields === void 0 ? void 0 : fields.mutableWidgetType) {
        if (widget.NodeFields.widgetType !== en_home_data_model_1.WidgetType.Extra) {
            throw new conduit_utils_1.InvalidParameterError(`Cannot set a mutable widget for a WidgetType of ${widget.NodeFields.widgetType}`);
        }
    }
    if (fields === null || fields === void 0 ? void 0 : fields.filteredNotesQuery) {
        Utilities.validateMutableWidgetTypes('filteredNotesQuery.query', en_home_data_model_1.WidgetType.FilteredNotes, en_home_data_model_1.MutableWidgetType.FilteredNotes, widget, fields.mutableWidgetType);
    }
    if ((((_a = fields === null || fields === void 0 ? void 0 : fields.desktop) === null || _a === void 0 ? void 0 : _a.width) !== null) && (((_b = fields === null || fields === void 0 ? void 0 : fields.desktop) === null || _b === void 0 ? void 0 : _b.width) !== undefined)) {
        /*
          * This sets up the width validation scenario.  Since we only have one, this is fairly simple now, but as implementation
          * grows, this could get very complex and may need its own file/components.
          */
        const parentAssociations = await ctx.traverseGraph(trc, widgetRef, [{ edge: ['inputs', 'parent'], type: en_data_model_1.EntityTypes.Board }]);
        if (parentAssociations.length !== 1 || !parentAssociations[0].edge) {
            throw new conduit_utils_1.NotFoundError(`Invalid number of parents: ${parentAssociations.length}`);
        }
        const [parentAssociation] = parentAssociations;
        const board = await ctx.fetchEntity(trc, { id: parentAssociation.edge.srcID, type: parentAssociation.edge.srcType });
        if (!board) {
            throw new conduit_utils_1.NotFoundError(parentAssociation.edge.srcID, 'Could not find parent board');
        }
        const widthIsOutOfRange = fields.desktop.width < 1 || fields.desktop.width > 3;
        if (widthIsOutOfRange) {
            throw new conduit_utils_1.InvalidParameterError('Parameter width is out of range');
        }
    }
    const alreadyUnpinned = new Set();
    if (associations === null || associations === void 0 ? void 0 : associations.noteToPin) {
        Utilities.validateMutableWidgetTypes('contentProvider', en_home_data_model_1.WidgetType.Pinned, en_home_data_model_1.MutableWidgetType.Pinned, widget, fields === null || fields === void 0 ? void 0 : fields.mutableWidgetType);
        // Currently, we only want to allow one note per widget, and this ensures we unpin all notes not included in the mutation.
        const noteAssociations = await ctx.traverseGraph(trc, widgetRef, [{ edge: ['outputs', 'contentProvider'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        ;
        if (noteAssociations.length > 0) {
            const filteredAssociations = noteAssociations.filter(e => !!e.edge).map(e => e.edge);
            associationsToDelete.push(...filteredAssociations);
            for (const assoc of filteredAssociations) {
                alreadyUnpinned.add(assoc.dstID);
            }
        }
        associationsToCreate.push({
            dstID: associations.noteToPin, dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstPort: 'contentHandler',
            srcID: widget.id, srcType: widget.type, srcPort: 'contentProvider',
        });
    }
    // Only unpin the note if the parameter is passed in and we aren't doing it already.
    if ((associations === null || associations === void 0 ? void 0 : associations.noteToUnpin) && !alreadyUnpinned.has(associations.noteToUnpin)) {
        Utilities.validateMutableWidgetTypes('contentProvider', en_home_data_model_1.WidgetType.Pinned, en_home_data_model_1.MutableWidgetType.Pinned, widget, fields === null || fields === void 0 ? void 0 : fields.mutableWidgetType);
        associationsToDelete.push({
            dstID: associations.noteToUnpin, dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstPort: 'contentHandler',
            srcID: widget.id, srcType: widget.type, srcPort: 'contentProvider',
        });
        alreadyUnpinned.add(associations.noteToUnpin);
    }
    return {
        mutationAndRef,
        associationsToCreate,
        associationsToDelete,
        entitiesToDelete,
    };
}
exports.createEnabledWidgetCustomizeV2Mutations = createEnabledWidgetCustomizeV2Mutations;
async function createDisabledWidgetCustomizeV2Mutations(trc, ctx, widget) {
    const widgetRef = { type: widget.type, id: widget.id };
    const entitiesToDelete = [];
    const associationsToDelete = [];
    const associationsToCreate = [];
    const mutationAndRef = {
        ref: widgetRef,
        mutation: {
            label: '',
            isEnabled: false,
            filteredNotesQuery: null,
            backgroundColor: null,
            mutableWidgetType: null,
            selectedTab: Utilities.getDefaultSelectedTabByWidgetType(widget.NodeFields.widgetType),
            content: {
                size: 0,
                content: '',
                hash: ctx.md5(''),
                path: '',
                localChangeTimestamp: 0,
            },
        },
    };
    if (widget.NodeFields.widgetType === en_home_data_model_1.WidgetType.Pinned || widget.NodeFields.mutableWidgetType === en_home_data_model_1.MutableWidgetType.Pinned) {
        const noteAssociations = await ctx.traverseGraph(trc, widgetRef, [{ edge: ['outputs', 'contentProvider'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        ;
        if (noteAssociations.length > 0) {
            const filteredAssociations = noteAssociations.filter(e => !!e.edge).map(e => e.edge);
            associationsToDelete.push(...filteredAssociations);
        }
    }
    if (widget.NodeFields.widgetType === en_home_data_model_1.WidgetType.ScratchPad || widget.NodeFields.mutableWidgetType === en_home_data_model_1.MutableWidgetType.ScratchPad) {
        ;
        const conflictAssociations = await ctx.traverseGraph(trc, widgetRef, [{ edge: ['outputs', 'conflicts'], type: en_data_model_1.EntityTypes.WidgetContentConflict }]);
        if (conflictAssociations.length > 0) {
            const filteredAssociations = conflictAssociations.filter(e => !!e.edge);
            entitiesToDelete.push(...filteredAssociations.map(a => { return { id: a.edge.dstID, type: a.edge.dstType }; }));
        }
    }
    return {
        mutationAndRef,
        associationsToCreate,
        associationsToDelete,
        entitiesToDelete,
    };
}
exports.createDisabledWidgetCustomizeV2Mutations = createDisabledWidgetCustomizeV2Mutations;
//# sourceMappingURL=BoardWidgetBuilder.js.map