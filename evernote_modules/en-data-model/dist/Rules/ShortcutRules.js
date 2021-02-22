"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutRules = void 0;
const conduit_core_1 = require("conduit-core");
const EntityConstants_1 = require("../EntityConstants");
async function getExtraOpsForShortcutDelete(trc, ctx, op) {
    const ops = [];
    const shortcuts = await ctx.traverseGraph(trc, op.nodeRef, [{ edge: ['outputs', 'shortcut'], type: EntityConstants_1.CoreEntityTypes.Shortcut }]);
    for (const shortcut of shortcuts) {
        ops.push({
            changeType: 'Node:DELETE',
            nodeRef: shortcut,
        });
    }
    return ops;
}
exports.ShortcutRules = [{
        // Deleting notebooks
        on: 'Node:DELETE',
        where: { type: EntityConstants_1.CoreEntityTypes.Notebook },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: getExtraOpsForShortcutDelete,
    }, {
        // Deleting notes
        on: 'Node:DELETE',
        where: { type: EntityConstants_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: getExtraOpsForShortcutDelete,
    }, {
        // Note moved to trash
        on: 'Node:UPDATE',
        where: { type: EntityConstants_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            var _a;
            const deleted = (_a = op.node.NodeFields) === null || _a === void 0 ? void 0 : _a.deleted;
            if (!deleted) {
                return [];
            }
            return await getExtraOpsForShortcutDelete(trc, ctx, op);
        },
    }, {
        // Deleting tags
        on: 'Node:DELETE',
        where: { type: EntityConstants_1.CoreEntityTypes.Tag },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: getExtraOpsForShortcutDelete,
    }, {
        // Deleting Stacks
        on: 'Node:DELETE',
        where: { type: EntityConstants_1.CoreEntityTypes.Stack },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: getExtraOpsForShortcutDelete,
    }, {
        // Deleting Saved search
        on: 'Node:DELETE',
        where: { type: EntityConstants_1.CoreEntityTypes.SavedSearch },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: getExtraOpsForShortcutDelete,
    }];
//# sourceMappingURL=ShortcutRules.js.map