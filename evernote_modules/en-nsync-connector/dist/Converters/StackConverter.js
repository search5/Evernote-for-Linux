"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStackEntity = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
function generateStackID(name) {
    return `Stack:${name}`;
}
function getStackLabel(stackID) {
    const length = 'Stack:'.length;
    if (stackID.length <= length) {
        throw new Error('Invalid stackID');
    }
    return stackID.slice(length);
}
function createNewStack(name) {
    // const timestamp = Date.now();
    const stack = {
        /* TODO v1+: add once we've added these fields
        creator: NullUserID,
        lastEditor: NullUserID,
        owner: ownerID || NullUserID,
        created: timestamp,
        updated: timestamp,
        deleted: null,
        shard: '',
        */
        localChangeTimestamp: 0,
        id: generateStackID(name),
        label: name,
        syncContexts: [],
        version: 0,
        type: en_data_model_1.CoreEntityTypes.Stack,
        NodeFields: {},
        inputs: {},
        outputs: {
            notebooks: {},
            shortcut: {},
        },
    };
    return stack;
}
async function getStackEntity(trc, stackName, notebook, tx) {
    const nodesToUpsert = [];
    const nodesToDelete = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const oldNotebook = await tx.getNode(trc, null, notebook);
    let oldStackName = null;
    if (oldNotebook) {
        const oldStackEdge = conduit_utils_1.firstStashEntry(oldNotebook.inputs.stack);
        if (oldStackEdge && oldStackEdge.srcID) {
            oldStackName = getStackLabel(oldStackEdge.srcID);
        }
    }
    if (stackName !== oldStackName) {
        let existingStack = null;
        if (oldStackName) {
            const oldStackID = generateStackID(oldStackName);
            const oldStack = await tx.getNode(trc, null, { id: oldStackID, type: en_data_model_1.CoreEntityTypes.Stack });
            if (!oldStack) {
                throw new Error('Old Stack does not exist');
            }
            if (Object.keys(oldStack.outputs.notebooks).length <= 1) {
                nodesToDelete.push({ id: oldStackID, type: en_data_model_1.CoreEntityTypes.Stack });
            }
            else {
                edgesToDelete.push({
                    dstID: notebook.id, dstType: en_data_model_1.CoreEntityTypes.Notebook, dstPort: 'stack',
                });
            }
        }
        if (stackName) {
            const stackID = generateStackID(stackName);
            existingStack = await tx.getNode(trc, null, { id: stackID, type: en_data_model_1.CoreEntityTypes.Stack });
            const stack = existingStack !== null && existingStack !== void 0 ? existingStack : createNewStack(stackName);
            if (!existingStack) {
                nodesToUpsert.push(stack);
            }
            edgesToCreate.push({
                srcID: stack.id, srcType: en_data_model_1.CoreEntityTypes.Stack, srcPort: 'notebooks',
                dstID: notebook.id, dstType: en_data_model_1.CoreEntityTypes.Notebook, dstPort: 'stack',
            });
        }
    }
    return { nodes: { nodesToDelete, nodesToUpsert }, edges: { edgesToDelete, edgesToCreate } };
}
exports.getStackEntity = getStackEntity;
//# sourceMappingURL=StackConverter.js.map