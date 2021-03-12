"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcutCreate = exports.shortcutRemove = exports.shortcutSetSortOrder = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
const SHORTCUT_SOURCE_TYPES = [
    EntityConstants_1.CoreEntityTypes.Workspace,
    EntityConstants_1.CoreEntityTypes.Notebook,
    EntityConstants_1.CoreEntityTypes.Note,
    EntityConstants_1.CoreEntityTypes.Stack,
    EntityConstants_1.CoreEntityTypes.Tag,
    EntityConstants_1.CoreEntityTypes.SavedSearch,
];
async function getSourceNodeForCreateShortcut(trc, ctx, nodeID) {
    for (const type of SHORTCUT_SOURCE_TYPES) {
        const node = await ctx.fetchEntity(trc, { id: nodeID, type });
        if (node) {
            return node;
        }
    }
    return null;
}
exports.shortcutSetSortOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        shortcut: 'ID',
        sortOrder: 'string',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.shortcut, type: EntityConstants_1.CoreEntityTypes.Shortcut };
        const shortcutEntity = await ctx.fetchEntity(trc, nodeRef);
        if (!shortcutEntity) {
            throw new conduit_utils_1.NotFoundError(params.shortcut, 'Not found Shortcut node in a message creation process');
        }
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Shortcut, { sortOrder: params.sortOrder }),
                }],
        };
        return plan;
    },
};
exports.shortcutRemove = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        shortcut: 'ID',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    derivedParams: {
        tag: 'ID?',
        search: 'ID?',
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        const source = (await ctx.traverseGraph(trc, { type: EntityConstants_1.CoreEntityTypes.Shortcut, id: paramsIn.shortcut }, [{
                edge: ['inputs', 'source'],
                type: EntityConstants_1.CoreEntityTypes.Tag,
            }]))[0];
        if (source && source.type === EntityConstants_1.CoreEntityTypes.Tag) {
            paramsOut.tag = source.id;
        }
        if (source && source.type === EntityConstants_1.CoreEntityTypes.SavedSearch) {
            paramsOut.search = source.id;
        }
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.shortcut, type: EntityConstants_1.CoreEntityTypes.Shortcut };
        const shortcutEntity = await ctx.fetchEntity(trc, nodeRef);
        if (!shortcutEntity) {
            throw new conduit_utils_1.NotFoundError(params.shortcut, 'Not found Shortcut node in a message creation process');
        }
        const analytics = {};
        if (params.tag) {
            analytics.shortcutRemoveTag = {
                category: 'tag',
                action: 'remove-shortcut',
                label: params.eventLabel,
                dimensions: {
                    ['tag-guid']: { param: 'tag' },
                },
            };
        }
        if (params.search) {
            analytics.shortcutRemoveSearch = {
                category: 'search',
                action: 'remove-shortcut',
                label: params.eventLabel,
                dimensions: {
                    ['search-session-id']: { param: 'search' },
                },
            };
        }
        ctx.updateAnalytics(analytics);
        const plan = {
            results: {},
            ops: [
                {
                    changeType: 'Node:DELETE',
                    nodeRef,
                },
                {
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [
                        { dstID: params.shortcut, dstType: EntityConstants_1.CoreEntityTypes.Shortcut, dstPort: 'source' },
                    ],
                },
            ],
        };
        return plan;
    },
};
exports.shortcutCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        source: 'ID',
        sortOrder: 'string',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const source = await getSourceNodeForCreateShortcut(trc, ctx, params.source);
        if (!source) {
            throw new conduit_utils_1.NotFoundError(params.source, `Not found Shortcut source ${params.source}`);
        }
        if (source.type === EntityConstants_1.CoreEntityTypes.Notebook && source.NodeFields.isPartialNotebook) {
            throw new Error('Shortcut cannot be created for partial notebooks');
        }
        const shortcutGenID = await ctx.generateCustomID(trc, ctx.userID, EntityConstants_1.CoreEntityTypes.Shortcut, null, source);
        if (!shortcutGenID) {
            throw new conduit_utils_1.InternalError('Failed to generate Shortcut ID. Probably ID generator is missing.');
        }
        const shortcutID = shortcutGenID[1];
        const shortcutEntity = ctx.createEntity({ id: shortcutID, type: EntityConstants_1.CoreEntityTypes.Shortcut }, {
            label: `Shortcut for ${source.id}`,
            sortOrder: params.sortOrder,
        });
        const analytics = {};
        if (source.type === EntityConstants_1.CoreEntityTypes.Tag) {
            analytics.addTagShortcut = {
                category: 'tag',
                action: 'add-shortcut',
                label: params.eventLabel,
                dimensions: {
                    ['tag-guid']: params.source,
                },
            };
        }
        if (source.type === EntityConstants_1.CoreEntityTypes.SavedSearch) {
            analytics.addSavedSearchShortcut = {
                category: 'search',
                action: 'add-shortcut',
                label: params.eventLabel,
                dimensions: {
                    ['search-session-id']: params.source,
                },
            };
        }
        ctx.updateAnalytics(analytics);
        const plan = {
            results: {
                result: shortcutID,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: shortcutEntity,
                    id: shortcutGenID,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: source.id, srcType: source.type, srcPort: 'shortcut',
                            dstID: shortcutID, dstType: EntityConstants_1.CoreEntityTypes.Shortcut, dstPort: 'source',
                        }],
                }],
        };
        return plan;
    },
};
//# sourceMappingURL=ShortcutMutators.js.map