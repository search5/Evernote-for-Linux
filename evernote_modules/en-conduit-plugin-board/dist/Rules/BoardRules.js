"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardRules = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const BoardWidgetBuilder_1 = require("../BoardWidgetBuilder");
exports.BoardRules = [{
        on: 'Node:UPDATE',
        where: { type: en_data_model_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await onNoteUpdate(ctx, trc, op.nodeRef, [], op);
        },
    }, {
        on: 'Node:DELETE',
        where: { type: en_data_model_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await onNoteDelete(ctx, trc, op.nodeRef, []);
        },
    }, {
        on: 'Node:DELETE',
        where: { type: en_data_model_1.CoreEntityTypes.Notebook },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await onNotebookDelete(ctx, trc, op.nodeRef, []);
        },
    }];
async function onNoteUpdate(ctx, trc, nodeRef, ops, op) {
    var _a;
    const deleted = (_a = op.node.NodeFields) === null || _a === void 0 ? void 0 : _a.deleted;
    if (!deleted) {
        return ops;
    }
    const widgetOps = await BoardWidgetBuilder_1.buildOpsPlanForNoteDelete(trc, ctx, nodeRef);
    for (const widgetOp of widgetOps) {
        ops.push(widgetOp);
    }
    return ops;
}
async function onNoteDelete(ctx, trc, nodeRef, ops) {
    // delete pinned note edges
    const widgetOps = await BoardWidgetBuilder_1.buildOpsPlanForNoteDelete(trc, ctx, nodeRef);
    for (const widgetOp of widgetOps) {
        ops.push(widgetOp);
    }
    return ops;
}
async function onNotebookDelete(ctx, trc, nodeRef, ops) {
    /*
     * Gather potential notes that need to be deleted
     *  This is the best possible solution for service structure until Notebooks can be traversed in Command Service+Feature Services
     */
    const potentialEdgesToDelete = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'children'], type: en_data_model_1.CoreEntityTypes.Note }]);
    // ! operator safe here as we filter by the existing edges.
    const chunks = conduit_utils_1.chunkArray(potentialEdgesToDelete.filter(e => Boolean(e.edge)).map(e => e.edge.dstID), 200);
    for (const chunk of chunks) {
        const deleteOps = await BoardWidgetBuilder_1.buildOpsPlanForNotebookDelete(trc, ctx, chunk);
        for (const op of deleteOps) {
            ops.push(op);
        }
    }
    return ops;
}
//# sourceMappingURL=BoardRules.js.map