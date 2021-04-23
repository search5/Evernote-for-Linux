"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOpsPlanForUnpinNotes = exports.buildOpsPlanForUnpinNote = exports.buildOpsPlanForNotebookDelete = exports.buildOpsPlanForNoteDelete = void 0;
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("./BoardConstants");
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
    const widgetNodeRefsAndEdges = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['inputs', 'contentHandler'], type: BoardConstants_1.BoardEntityTypes.Widget }]);
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
    const [, boardID] = await ctx.generateDeterministicID(trc, ctx.userID, BoardConstants_1.BoardEntityTypes.Board, en_data_model_1.DefaultDeterministicIdGenerator, en_data_model_1.BoardSchema.formDeterministicBoardIdParts(ctx.userID));
    // Max of 22
    const allWidgetNodeIDs = (await ctx.traverseGraph(trc, { id: boardID, type: BoardConstants_1.BoardEntityTypes.Board }, [{ edge: ['outputs', 'children'], type: BoardConstants_1.BoardEntityTypes.Widget }])).map(graphNodeRefAndEdge => graphNodeRefAndEdge.id);
    /*
     * Pinned and Extra can have notes pinned to them.
     * Need to filter by mutableWidgetType in-case an association to Notes is ever provided for another purpose because server does not
     *  emit association names.
     */
    const widgets = (await ctx.fetchEntities(trc, BoardConstants_1.BoardEntityTypes.Widget, allWidgetNodeIDs))
        .filter(w => !!w &&
        ((w.NodeFields.widgetType === en_data_model_1.WidgetType.Extra && w.NodeFields.mutableWidgetType === en_data_model_1.MutableWidgetType.Pinned) ||
            w.NodeFields.widgetType === en_data_model_1.WidgetType.Pinned));
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
//# sourceMappingURL=BoardWidgetBuilder.js.map