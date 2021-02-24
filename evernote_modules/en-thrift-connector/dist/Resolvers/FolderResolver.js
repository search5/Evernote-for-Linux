"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
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
exports.LastUpdatedResolver = exports.getLastUpdatedNoteFilters = exports.containerLastUpdated = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const SimplyImmutable = __importStar(require("simply-immutable"));
const BATCH_SIZE = 100;
function noteLastEditorID(note) {
    const edge = conduit_utils_1.firstStashEntry(note.outputs.lastEditor) || conduit_utils_1.firstStashEntry(note.outputs.creator);
    if (edge) {
        return edge.dstID;
    }
    return null;
}
async function getLastEditor(context, node) {
    const profileID = noteLastEditorID(node);
    if (profileID) {
        return conduit_core_1.resolveNode({ id: profileID, type: en_data_model_1.CoreEntityTypes.Profile }, context);
    }
    return null;
}
async function containerLastUpdated(context, tree, index, noteFilters, updatedIndexPos, defaultResult) {
    const res = defaultResult ? SimplyImmutable.cloneMutable(defaultResult) : [0, null];
    const key = context.indexer.keyForQuery(en_data_model_1.CoreEntityTypes.Note, 'ASC', index.index, noteFilters);
    if (!key) {
        return res;
    }
    const found = await tree.find(context.trc, context.watcher, key);
    if (!found) {
        return res;
    }
    const noteMaxUpdated = found[updatedIndexPos];
    if (noteMaxUpdated > res[0]) {
        res[0] = noteMaxUpdated;
        res[1] = { type: en_data_model_1.CoreEntityTypes.Note, id: found[found.length - 1] }; // id is always last in the index
    }
    return res;
}
exports.containerLastUpdated = containerLastUpdated;
function getLastUpdatedNoteFilters(parent) {
    return [{
            field: 'inTrash',
            match: {
                boolean: false,
            },
        }, {
            field: 'parent',
            match: {
                node: {
                    id: parent.id,
                    type: parent.type,
                },
            },
        }];
}
exports.getLastUpdatedNoteFilters = getLastUpdatedNoteFilters;
async function getLastUpdatedNoteParams(context, noteFilters) {
    var _a;
    const sorts = [{
            field: 'updated',
            order: 'DESC',
        }];
    const index = context.indexer.indexForQuery(en_data_model_1.CoreEntityTypes.Note, noteFilters, sorts, [], []);
    const updatedIndexPos = index.index.findIndex(e => e.field === 'updated');
    if (updatedIndexPos < 0) {
        throw new conduit_utils_1.InternalError(`lastUpdated selected the wrong index! Chose: ${conduit_utils_1.safeStringify(index)}`);
    }
    const tree = await ((_a = context.db) === null || _a === void 0 ? void 0 : _a.readonlyIndexingTreeForTypeAndIndex(context.trc, en_data_model_1.CoreEntityTypes.Note, index));
    if (!tree) {
        throw new conduit_utils_1.InternalError(`Failed to get the note tree for lastUpdated! Index: ${conduit_utils_1.safeStringify(index)}`);
    }
    return {
        index,
        updatedIndexPos,
        tree,
    };
}
async function multiNotebookLastUpdated(context, nbs, defaultResult) {
    var _a;
    let res = defaultResult ? SimplyImmutable.cloneMutable(defaultResult) : [0, null];
    if (!nbs.length) {
        conduit_utils_1.logger.warn(`Oddly have no notebooks in resolving lastUpdated`);
        return res;
    }
    const filters = getLastUpdatedNoteFilters({ id: nbs[0], type: en_data_model_1.CoreEntityTypes.Notebook });
    // Index selection doesn't care about the values in the filters, just the fields, so just pass an arbitrary parent
    const { index, updatedIndexPos, tree } = await getLastUpdatedNoteParams(context, filters);
    const chunks = conduit_utils_1.chunkArray(nbs, BATCH_SIZE);
    for (const chunk of chunks) {
        const notebooks = await ((_a = context.db) === null || _a === void 0 ? void 0 : _a.batchGetNodes(context, en_data_model_1.CoreEntityTypes.Notebook, chunk));
        if (!notebooks) {
            continue;
        }
        const ps = [];
        for (const notebook of notebooks) {
            if (!notebook) {
                continue;
            }
            const noteFilters = getLastUpdatedNoteFilters(notebook);
            const notebookRes = [notebook.NodeFields.updated, { id: notebook.id, type: notebook.type }];
            ps.push(containerLastUpdated(context, tree, index, noteFilters, updatedIndexPos, notebookRes));
        }
        const results = await conduit_utils_1.allSettled(ps);
        res = results.reduce((prev, curr) => {
            return curr[0] > prev[0] ? curr : prev;
        }, res);
    }
    return res;
}
async function resolveNotebookLastUpdated(nodeRef, _, context) {
    conduit_utils_1.logger.debug(`Querying lastUpdated on Notebook, very expensive, use with caution`);
    conduit_core_1.validateDB(context);
    const filters = getLastUpdatedNoteFilters(nodeRef);
    const { index, updatedIndexPos, tree } = await getLastUpdatedNoteParams(context, filters);
    const notebook = await context.db.getNode(context, nodeRef);
    if (!notebook) {
        throw new conduit_utils_1.NotFoundError(nodeRef.id, `Failed to get notebook for lastUpdated!`);
    }
    const notebookRes = [notebook.NodeFields.updated, nodeRef];
    const res = await containerLastUpdated(context, tree, index, filters, updatedIndexPos, notebookRes);
    return res[0];
}
async function resolveStackLastUpdated(nodeRef, _, context) {
    conduit_utils_1.logger.debug(`Querying lastUpdated on Stack, very expensive, use with caution`);
    conduit_core_1.validateDB(context);
    const nbs = (await context.db.traverseGraph(context, nodeRef, [{
            edge: ['outputs', 'notebooks'],
            type: en_data_model_1.CoreEntityTypes.Notebook,
        }])).map(e => e.id);
    const res = await multiNotebookLastUpdated(context, nbs);
    return res[0];
}
async function resolveWorkspaceLastUpdated(nodeRef, _, context) {
    conduit_utils_1.logger.debug(`Querying lastUpdated on Workspace, very expensive, use with caution`);
    conduit_core_1.validateDB(context);
    const workspace = await context.db.getNode(context, nodeRef);
    if (!workspace) {
        throw new conduit_utils_1.NotFoundError(nodeRef.id, `Failed to get Workspace for lastUpdated!`);
    }
    const workspaceRes = [workspace.NodeFields.updated, nodeRef];
    const nbs = (await context.db.traverseGraph(context, workspace, [{
            edge: ['outputs', 'children'],
            type: en_data_model_1.CoreEntityTypes.Notebook,
        }])).map(e => e.id);
    let res = await multiNotebookLastUpdated(context, nbs, workspaceRes);
    const filters = getLastUpdatedNoteFilters(workspace);
    const { index, updatedIndexPos, tree } = await getLastUpdatedNoteParams(context, filters);
    res = await containerLastUpdated(context, tree, index, filters, updatedIndexPos, res);
    return res[0];
}
async function resolveNotebookLastEditor(nodeRef, _, context) {
    conduit_utils_1.logger.debug(`Querying lastEditor on Notebook, very expensive, use with caution`);
    conduit_core_1.validateDB(context);
    const filters = getLastUpdatedNoteFilters(nodeRef);
    const { index, updatedIndexPos, tree } = await getLastUpdatedNoteParams(context, filters);
    const res = await containerLastUpdated(context, tree, index, filters, updatedIndexPos);
    if (!res[1]) {
        throw new conduit_utils_1.InternalError(`Was unable to retrieve the associated node with lastUpdated when resolving lastEditor`);
    }
    const lastUpdatedNode = await context.db.getNode(context, res[1]);
    if (!lastUpdatedNode) {
        throw new conduit_utils_1.NotFoundError(res[1].id, `Failed to get node for lastEditor`);
    }
    return getLastEditor(context, lastUpdatedNode);
}
async function resolveWorkspaceLastEditor(nodeRef, _, context) {
    conduit_utils_1.logger.debug(`Querying lastEditor on Workspace, very expensive, use with caution`);
    conduit_core_1.validateDB(context);
    const filters = getLastUpdatedNoteFilters(nodeRef);
    const { index, updatedIndexPos, tree } = await getLastUpdatedNoteParams(context, filters);
    const res = await containerLastUpdated(context, tree, index, filters, updatedIndexPos);
    if (!res[1]) {
        throw new conduit_utils_1.InternalError(`Was unable to retrieve the associated node with lastUpdated when resolving lastEditor`);
    }
    const lastUpdatedNode = await context.db.getNode(context, res[1]);
    if (!lastUpdatedNode) {
        throw new conduit_utils_1.NotFoundError(res[1].id, `Failed to get node for lastEditor`);
    }
    return getLastEditor(context, lastUpdatedNode);
}
function LastUpdatedResolver() {
    return {
        'Workspace.lastUpdated': {
            type: conduit_core_1.schemaToGraphQLType('timestamp'),
            description: `[WARNING: EXPENSIVE] The max updated value between all Notes and Notebooks in the Workspace and the Workspace's own updated value.`,
            resolve: resolveWorkspaceLastUpdated,
        },
        'Workspace.lastEditor': autoResolverData => {
            return {
                type: autoResolverData.NodeGraphQLTypes.Profile,
                description: `[WARNING: EXPENSIVE] The last Profile to edit a Note, Notebook, or any Workspace fields in the given Workspace.`,
                resolve: resolveWorkspaceLastEditor,
            };
        },
        'Stack.lastUpdated': {
            type: conduit_core_1.schemaToGraphQLType('timestamp'),
            description: `[WARNING: EXPENSIVE] The max lastUpdated value of Notebooks in the Stack.`,
            resolve: resolveStackLastUpdated,
        },
        'Notebook.lastUpdated': {
            type: conduit_core_1.schemaToGraphQLType('timestamp'),
            description: `[WARNING: EXPENSIVE] The max updated value between all Notes in the Notebook and the Notebook's own updated value`,
            resolve: resolveNotebookLastUpdated,
        },
        'Notebook.lastEditor': autoResolverData => {
            return {
                type: autoResolverData.NodeGraphQLTypes.Profile,
                description: `[WARNING: EXPENSIVE] The last Profile to edit a Note or any Notebooks fields in the given Notebook.`,
                resolve: resolveNotebookLastEditor,
            };
        },
    };
}
exports.LastUpdatedResolver = LastUpdatedResolver;
//# sourceMappingURL=FolderResolver.js.map