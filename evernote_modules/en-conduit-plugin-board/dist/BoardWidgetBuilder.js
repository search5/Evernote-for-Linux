"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOpsPlanForUnpinNotes = exports.buildOpsPlanForUnpinNote = exports.buildOpsPlanForNotebookDelete = exports.buildOpsPlanForNoteDelete = void 0;
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("./BoardConstants");
const BoardFeatureSchemaManager_1 = require("./Schema/BoardFeatureSchemaManager");
async function buildOpsPlanForNoteDelete(trc, ctx, nodeRef) {
    const ops = await buildOpsPlanForUnpinNote(trc, ctx, nodeRef);
    ops.push({
        changeType: 'Custom',
        commandName: 'widgetUnpinNote',
        params: {
            note: nodeRef.id,
        },
    });
    return ops;
}
exports.buildOpsPlanForNoteDelete = buildOpsPlanForNoteDelete;
async function buildOpsPlanForNotebookDelete(trc, ctx, notes) {
    const ops = await buildOpsPlanForUnpinNotes(trc, ctx, notes);
    ops.push({
        changeType: 'Custom',
        commandName: 'widgetUnpinNote',
        params: {
            notes,
        },
    });
    return ops;
}
exports.buildOpsPlanForNotebookDelete = buildOpsPlanForNotebookDelete;
async function buildOpsPlanForUnpinNote(trc, ctx, nodeRef) {
    const ops = [];
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
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToDelete,
        });
    }
    return ops;
}
exports.buildOpsPlanForUnpinNote = buildOpsPlanForUnpinNote;
async function buildOpsPlanForUnpinNotes(trc, ctx, notes, noteToExclude) {
    const ops = [];
    /*
     * This is safe for now, but if we add multiple pinned notes, we may need to expand this some how.
     *  This route is chosen as it will reduce IO in Conduit.
     */
    const deterministicIdParts = BoardFeatureSchemaManager_1.BoardFeatureSchemaManager.formDeterministicBoardIdParts(BoardConstants_1.BoardType.Home, 0, BoardConstants_1.WidgetType.Pinned, 0);
    const [, pinnedNoteId] = await ctx.generateDeterministicID(trc, ctx.userID, BoardConstants_1.BoardEntityTypes.Widget, BoardConstants_1.BoardDeterministicIdGenerator, deterministicIdParts);
    const potentialEdgesToDelete = await ctx.traverseGraph(trc, { id: pinnedNoteId, type: BoardConstants_1.BoardEntityTypes.Widget }, [{ edge: ['outputs', 'contentProvider'], type: en_data_model_1.CoreEntityTypes.Note }]);
    const notesSet = new Set(notes);
    const edgesToDelete = potentialEdgesToDelete.filter(e => e.edge && notesSet.has(e.edge.dstID) && e.edge.dstID !== noteToExclude)
        .map(e => {
        return {
            dstID: e.edge.dstID,
            dstType: e.edge.dstType,
            dstPort: e.edge.dstPort,
            srcID: e.edge.srcID,
            srcType: e.edge.srcType,
            srcPort: e.edge.srcPort,
        };
    });
    if (edgesToDelete.length > 0) {
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToDelete,
        });
    }
    return ops;
}
exports.buildOpsPlanForUnpinNotes = buildOpsPlanForUnpinNotes;
//# sourceMappingURL=BoardWidgetBuilder.js.map