"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackRemoveNotebook = exports.stackAddNotebook = exports.stackRename = exports.stackDelete = exports.stackCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
async function createShortcutOpsForRenameStack(trc, ctx, sourceID, sortOrder) {
    const shortcutGenID = await ctx.generateCustomID(trc, ctx.userID, EntityConstants_1.CoreEntityTypes.Shortcut, null, { id: sourceID, type: EntityConstants_1.CoreEntityTypes.Stack });
    if (!shortcutGenID) {
        throw new conduit_utils_1.InternalError('Failed to generate Shortcut ID. Probably ID generator is missing.');
    }
    const shortcutID = shortcutGenID[1];
    const shortcutEntity = ctx.createEntity({ id: shortcutID, type: EntityConstants_1.CoreEntityTypes.Shortcut }, {
        label: `Shortcut for ${sourceID}`,
        sortOrder,
    });
    return [{
            changeType: 'Node:CREATE',
            node: shortcutEntity,
            id: shortcutGenID,
        }, {
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: sourceID, srcType: EntityConstants_1.CoreEntityTypes.Stack, srcPort: 'shortcut',
                    dstID: shortcutID, dstType: EntityConstants_1.CoreEntityTypes.Shortcut, dstPort: 'source',
                }],
        }];
}
exports.stackCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        name: 'string',
        notebook: 'ID',
        eventLabel: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const notebook = await ctx.fetchEntity(trc, { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook });
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(params.notebook, `Not found Notebook ${params.notebook}`);
        }
        const fields = { label: params.name };
        const stackGenID = await ctx.generateCustomID(trc, ctx.userID, EntityConstants_1.CoreEntityTypes.Stack, fields);
        if (!stackGenID) {
            throw new conduit_utils_1.InternalError('Failed to generate Stack ID. Probably ID generator is missing.');
        }
        const stackID = stackGenID[1];
        const stackEntity = ctx.createEntity({ id: stackID, type: EntityConstants_1.CoreEntityTypes.Stack }, fields);
        ctx.updateAnalytics({
            stackCreate: {
                action: 'add-to-new-stack',
                category: 'notebook',
                label: params.eventLabel,
            },
        });
        const plan = {
            results: {
                result: stackID,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: stackEntity,
                    id: stackGenID,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [{
                            // remove edge to any existing stack
                            dstID: notebook.id, dstType: EntityConstants_1.CoreEntityTypes.Notebook, dstPort: 'stack',
                        }],
                    edgesToCreate: [
                        {
                            srcID: stackID,
                            srcType: EntityConstants_1.CoreEntityTypes.Stack,
                            srcPort: 'notebooks',
                            dstID: notebook.id,
                            dstType: EntityConstants_1.CoreEntityTypes.Notebook,
                            dstPort: 'stack',
                        },
                    ],
                }],
        };
        return plan;
    },
};
exports.stackDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        stack: 'ID',
        eventLabel: conduit_utils_1.NullableString,
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.stack, type: EntityConstants_1.CoreEntityTypes.Stack };
        const stackEntity = await ctx.fetchEntity(trc, nodeRef);
        if (!stackEntity) {
            throw new conduit_utils_1.NotFoundError(params.stack, `Failed to find Stack ${params.stack}`);
        }
        ctx.updateAnalytics({
            stackDelete: {
                action: 'ungroup',
                category: 'notebook',
                label: params.eventLabel,
            },
        });
        const notebookNodeRefAndEdges = await ctx.traverseGraph(trc, stackEntity, [{
                edge: ['outputs', 'notebooks'],
                type: EntityConstants_1.CoreEntityTypes.Notebook,
            }]);
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: notebookNodeRefAndEdges.map(re => re.edge).filter(conduit_utils_1.isNotNullish),
                }, {
                    // stack will autoDelete, but include the op here anyway to clean up any shortcuts pointing at it
                    changeType: 'Node:DELETE',
                    nodeRef,
                }],
        };
        return plan;
    },
};
exports.stackRename = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        stack: 'ID',
        name: 'string',
    },
    derivedParams: {
        shortcutSortOrder: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        const shortcutRef = (await ctx.traverseGraph(trc, { type: EntityConstants_1.CoreEntityTypes.Stack, id: paramsIn.stack }, [{
                edge: ['outputs', 'shortcut'],
                type: EntityConstants_1.CoreEntityTypes.Shortcut,
            }]))[0];
        paramsOut.shortcutSortOrder = null;
        if (shortcutRef) {
            const shortcut = await ctx.fetchEntity(trc, shortcutRef);
            paramsOut.shortcutSortOrder = (_a = shortcut === null || shortcut === void 0 ? void 0 : shortcut.NodeFields.sortOrder) !== null && _a !== void 0 ? _a : null;
        }
    },
    execute: async (trc, ctx, params) => {
        const oldStackEntity = await ctx.fetchEntity(trc, { id: params.stack, type: EntityConstants_1.CoreEntityTypes.Stack });
        if (!oldStackEntity) {
            throw new conduit_utils_1.NotFoundError(params.stack, `Not found Stack ${params.stack}`);
        }
        const fields = { label: params.name };
        const newStackGenID = await ctx.generateCustomID(trc, ctx.userID, EntityConstants_1.CoreEntityTypes.Stack, fields);
        if (!newStackGenID) {
            throw new conduit_utils_1.InternalError('Failed to generate Stack ID. Probably ID generator is missing.');
        }
        const newStackID = newStackGenID[1];
        const newStackEntity = ctx.createEntity({ id: newStackID, type: EntityConstants_1.CoreEntityTypes.Stack }, fields);
        const notebookNodeRefAndEdges = await ctx.traverseGraph(trc, oldStackEntity, [{
                edge: ['outputs', 'notebooks'],
                type: EntityConstants_1.CoreEntityTypes.Notebook,
            }]);
        const stackEdges = notebookNodeRefAndEdges.map(re => re.edge).filter(conduit_utils_1.isNotNullish);
        const shortcutOps = params.shortcutSortOrder
            ? await createShortcutOpsForRenameStack(trc, ctx, newStackID, params.shortcutSortOrder)
            : [];
        const plan = {
            results: {
                result: newStackID,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: newStackEntity,
                    id: newStackGenID,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: stackEdges,
                    edgesToCreate: stackEdges.map(edge => {
                        return Object.assign(Object.assign({}, edge), { srcID: newStackID });
                    }),
                }, {
                    // stack will autoDelete, but include the op here anyway to clean up any shortcuts pointing at it
                    changeType: 'Node:DELETE',
                    nodeRef: oldStackEntity,
                },
                ...shortcutOps,],
        };
        return plan;
    },
};
exports.stackAddNotebook = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        stack: 'ID',
        notebook: 'ID',
        eventLabel: conduit_utils_1.NullableString,
    },
    execute: async (trc, ctx, params) => {
        const stackEntity = await ctx.fetchEntity(trc, { id: params.stack, type: EntityConstants_1.CoreEntityTypes.Stack });
        const notebookEntity = await ctx.fetchEntity(trc, { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook });
        if (!stackEntity) {
            throw new conduit_utils_1.NotFoundError(params.stack, `Not found Stack ${params.stack}`);
        }
        if (!notebookEntity) {
            throw new conduit_utils_1.NotFoundError(params.notebook, `Not found Notebook ${params.notebook}`);
        }
        ctx.updateAnalytics({
            stackAddNotebook: {
                action: 'add-to-existing-stack',
                category: 'notebook',
                label: params.eventLabel,
            },
        });
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [{
                            dstID: params.notebook, dstType: EntityConstants_1.CoreEntityTypes.Notebook, dstPort: 'stack',
                        }],
                    edgesToCreate: [{
                            srcID: params.stack, srcType: EntityConstants_1.CoreEntityTypes.Stack, srcPort: 'notebooks',
                            dstID: params.notebook, dstType: EntityConstants_1.CoreEntityTypes.Notebook, dstPort: 'stack',
                        }],
                }],
        };
        return plan;
    },
};
// NOTE: there is a lingering stack-shortcut bug here:
// if you remove the last notebook from a stack, the stack is not
// deleted (fixable with edge changes) and the shortcut is not
// deleted (harder to solve, because the delete needs to be upsynced)
exports.stackRemoveNotebook = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        stack: conduit_utils_1.NullableID,
        eventLabel: conduit_utils_1.NullableString,
    },
    derivedParams: {
        stack: conduit_utils_1.NullableID,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        const stackRef = (await ctx.traverseGraph(trc, { type: EntityConstants_1.CoreEntityTypes.Notebook, id: paramsIn.notebook }, [{
                edge: ['inputs', 'stack'],
                type: EntityConstants_1.CoreEntityTypes.Stack,
            }]))[0];
        paramsOut.stack = (_a = stackRef === null || stackRef === void 0 ? void 0 : stackRef.id) !== null && _a !== void 0 ? _a : null;
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        if (!params.stack) {
            // not an error if there is no stack, this mutator just becomes a noop
            return plan;
        }
        const notebookEntity = await ctx.fetchEntity(trc, { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook });
        if (!notebookEntity) {
            return plan;
        }
        const stackEntity = await ctx.fetchEntity(trc, { id: params.stack, type: EntityConstants_1.CoreEntityTypes.Stack });
        if (!stackEntity) {
            return plan;
        }
        ctx.updateAnalytics({
            stackRemoveNotebook: {
                action: 'remove-from-stack',
                category: 'notebook',
                label: params.eventLabel,
            },
        });
        plan.ops.push({
            changeType: 'Edge:MODIFY',
            edgesToDelete: [{
                    srcID: params.stack, srcType: EntityConstants_1.CoreEntityTypes.Stack, srcPort: 'notebooks',
                    dstID: params.notebook, dstType: EntityConstants_1.CoreEntityTypes.Notebook, dstPort: 'stack',
                }],
        });
        return plan;
    },
};
//# sourceMappingURL=StackMutators.js.map