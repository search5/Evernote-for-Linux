"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 * TODO(optimization) kill the implementation and update time on write.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
function FolderResolver() {
    async function parentChildFold(context, id, type, childType, init, f) {
        conduit_core_1.validateDB(context);
        const nodeRef = { id, type };
        const nodeAndContext = await context.db.getNodeWithContext(context, nodeRef);
        if (!nodeAndContext.node) {
            throw new conduit_utils_1.NotFoundError(id, `Unable to find ${type}`);
        }
        let acc = init(nodeAndContext.node);
        const childNodeRefAndEdges = await context.db.traverseGraph(context, nodeRef, [{ edge: ['outputs', 'children'], type: childType }]);
        const childNodes = await conduit_utils_1.allSettled(childNodeRefAndEdges.map(child => context.db.getNode(context, child)));
        for (const childNode of childNodes) {
            if (childNode) {
                acc = await f(acc, childNode);
            }
        }
        return acc;
    }
    function noteLastEditorId(note) {
        const edge = conduit_utils_1.firstStashEntry(note.outputs.lastEditor) || conduit_utils_1.firstStashEntry(note.outputs.creator);
        if (edge) {
            return edge.dstID;
        }
        return null;
    }
    const resolvers = {
        'Notebook.lastUpdated': {
            type: conduit_core_1.schemaToGraphQLType('timestamp'),
            resolve: async (nodeRef, _, context) => {
                return await parentChildFold(context, nodeRef.id, en_data_model_1.CoreEntityTypes.Notebook, en_data_model_1.CoreEntityTypes.Note, (nb) => nb.NodeFields.updated, async (acc, curr) => Math.max(acc, curr.NodeFields.updated));
            },
        },
        'Notebook.lastEditor': autoResolverData => {
            return {
                type: autoResolverData.NodeGraphQLTypes.Profile,
                resolve: async (nodeRef, _, context, info) => {
                    const updatedAndLastEditorId = await parentChildFold(context, nodeRef.id, en_data_model_1.CoreEntityTypes.Notebook, en_data_model_1.CoreEntityTypes.Note, () => [0, null], async (acc, curr) => {
                        const currNote = curr;
                        if (acc[0] < currNote.NodeFields.updated) {
                            acc[0] = currNote.NodeFields.updated;
                            acc[1] = noteLastEditorId(currNote);
                        }
                        return acc;
                    });
                    if (updatedAndLastEditorId && updatedAndLastEditorId[1]) {
                        return conduit_core_1.resolveNode({ type: en_data_model_1.CoreEntityTypes.Profile, id: updatedAndLastEditorId[1] }, context, info);
                    }
                },
            };
        },
        'Workspace.lastUpdated': {
            type: conduit_core_1.schemaToGraphQLType('timestamp'),
            resolve: async (nodeRef, _, context) => {
                // last updated time of notes in space's notebooks.
                const lastUpdatedNoteInNotebook = await parentChildFold(context, nodeRef.id, en_data_model_1.CoreEntityTypes.Workspace, en_data_model_1.CoreEntityTypes.Notebook, (s) => s.NodeFields.updated, async (acc, currNb) => {
                    const lastUpdateInCurrNb = await parentChildFold(context, currNb.id, en_data_model_1.CoreEntityTypes.Notebook, en_data_model_1.CoreEntityTypes.Note, (nb) => Math.max(acc, nb.NodeFields.updated), async (iacc, note) => Math.max(iacc, note.NodeFields.updated));
                    return lastUpdateInCurrNb || acc;
                });
                // compare above time to all notes directly in space.
                return await parentChildFold(context, nodeRef.id, en_data_model_1.CoreEntityTypes.Workspace, en_data_model_1.CoreEntityTypes.Note, () => lastUpdatedNoteInNotebook || 0, async (acc, note) => Math.max(acc, note.NodeFields.updated));
            },
        },
        'Workspace.lastEditor': autoResolverData => {
            return {
                type: autoResolverData.NodeGraphQLTypes.Profile,
                resolve: async (nodeRef, _, context, info) => {
                    // find last editor ID of notes inside space's notebooks.
                    const nestedNoteUpdatedAndLastEditorID = await parentChildFold(context, nodeRef.id, en_data_model_1.CoreEntityTypes.Workspace, en_data_model_1.CoreEntityTypes.Notebook, () => [0, null], async (acc, nb) => {
                        const parentAndLastEditorId = await parentChildFold(context, nb.id, en_data_model_1.CoreEntityTypes.Notebook, en_data_model_1.CoreEntityTypes.Note, () => [acc[0], acc[1]], async (iacc, n) => {
                            if (iacc[0] < n.NodeFields.updated) {
                                iacc[0] = n.NodeFields.updated;
                                iacc[1] = noteLastEditorId(n);
                            }
                            return iacc;
                        });
                        if (parentAndLastEditorId && parentAndLastEditorId[0] > acc[0]) {
                            return parentAndLastEditorId;
                        }
                        return acc;
                    });
                    // compare above last editor ID to all notes directly in space.
                    const updatedAndLastEditorID = await parentChildFold(context, nodeRef.id, en_data_model_1.CoreEntityTypes.Workspace, en_data_model_1.CoreEntityTypes.Note, () => nestedNoteUpdatedAndLastEditorID || [0, null], async (acc, n) => {
                        if (acc[0] < n.NodeFields.updated) {
                            acc[0] = n.NodeFields.updated;
                            acc[1] = noteLastEditorId(n);
                        }
                        return acc;
                    });
                    if (updatedAndLastEditorID && updatedAndLastEditorID[1]) {
                        return conduit_core_1.resolveNode({ type: en_data_model_1.CoreEntityTypes.Profile, id: updatedAndLastEditorID[1] }, context, info);
                    }
                },
            };
        },
    };
    return resolvers;
}
exports.FolderResolver = FolderResolver;
//# sourceMappingURL=FolderResolver.js.map