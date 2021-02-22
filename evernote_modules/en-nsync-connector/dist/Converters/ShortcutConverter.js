"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShortcutNodesAndEdges = exports.reconcileIncomingShortcuts = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const NSyncTypes_1 = require("../NSyncTypes");
const BaseConverter_1 = require("./BaseConverter");
function convertGuidFromService(guid) {
    return `Shortcut:${guid}`;
}
// All these copied from en-thrift-connectors ShortcutConverter and ShorcutHelpers
async function getCurrentShortcuts(trc, tx) {
    const nodes = await tx.getGraphNodesByType(trc, null, en_data_model_1.CoreEntityTypes.Shortcut);
    const nodeMap = {};
    nodes.sort((a, b) => {
        if (a.NodeFields.sortOrder === b.NodeFields.sortOrder) {
            return 0;
        }
        else if (a.NodeFields.sortOrder > b.NodeFields.sortOrder) {
            return 1;
        }
        return -1;
    });
    nodes.forEach((n, i) => {
        if (!n) {
            return;
        }
        nodeMap[n.id] = i;
    });
    return {
        nodes,
        nodeMap,
    };
}
function nodeFromShortcut(instance, parent, sortOrder) {
    const initial = BaseConverter_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        throw new Error('Missing initial values for Shortcut');
    }
    const node = Object.assign(Object.assign({}, initial), { version: 0, syncContexts: [], localChangeTimestamp: 0, id: convertGuidFromService(parent.id), type: en_data_model_1.CoreEntityTypes.Shortcut, label: `Shortcut for ${parent.id}`, NodeFields: {
            sortOrder,
        }, inputs: {
            source: {},
        }, outputs: {} });
    return node;
}
function getIncomingShortcuts(instance) {
    const prefs = instance.preferences;
    const shortcuts = prefs[NSyncTypes_1.PREFERENCE_SHORTCUTS_KEY] || [];
    const nodeMap = {};
    const nodes = [];
    const edges = [];
    let lastWeight = conduit_utils_1.LexoRankEndWeight;
    shortcuts.forEach(entry => {
        const sc = conduit_utils_1.safeParse(entry);
        if (typeof sc === 'object' && sc.updated !== undefined) {
            // Just ignore this
        }
        else if (Array.isArray(sc) && sc.length === 2) {
            lastWeight = conduit_utils_1.lexoRank(lastWeight, conduit_utils_1.LexoRankEndWeight);
            try {
                const parentRef = { type: sc[0], id: sc[1] };
                const incomingShortcut = nodeFromShortcut(instance, parentRef, lastWeight);
                const edge = {
                    srcID: parentRef.id,
                    srcType: parentRef.type,
                    srcPort: 'shortcut',
                    dstID: incomingShortcut.id,
                    dstType: incomingShortcut.type,
                    dstPort: 'target',
                };
                edges.push(edge);
                nodeMap[incomingShortcut.id] = nodes.length;
                nodes.push(incomingShortcut);
            }
            catch (e) {
                conduit_utils_1.logger.error('Unable to create shortcut for entry', sc);
            }
        }
        else {
            conduit_utils_1.logger.warn('Unknown data type for shortcut entry', sc);
        }
    });
    return { nodes, nodeMap, edges };
}
// The currentShortcuts object will be modified in this function
async function reconcileIncomingShortcuts(incomingShortcuts, currentShortcuts, process, processEdge) {
    let inserts = [];
    let deletes = 0;
    const existingIDs = [];
    const existingMap = {};
    let incoming = 0;
    let existing = 0;
    let current = 0;
    let lastWeight = conduit_utils_1.LexoRankEndWeight;
    function processInserts(lowWeight, highWeight) {
        if (inserts.length === 0) {
            return;
        }
        for (const sc of inserts) {
            lowWeight = conduit_utils_1.lexoRank(lowWeight, highWeight || conduit_utils_1.LexoRankEndWeight);
            sc.NodeFields.sortOrder = lowWeight;
            process(sc.id, sc);
        }
        inserts = [];
    }
    // Pre processing *THIS MODIFIES THE currentShortcuts OBJECT*
    for (let i = 0; i < currentShortcuts.nodes.length; i++) {
        const currID = currentShortcuts.nodes[i].id;
        if (incomingShortcuts.nodeMap[currentShortcuts.nodes[i].id] === undefined) {
            process(currID);
            currentShortcuts.nodes.splice(i, 1);
            delete currentShortcuts.nodeMap[currID];
            deletes++;
            i--;
        }
        else {
            currentShortcuts.nodeMap[currID] -= deletes;
        }
    }
    incomingShortcuts.nodes.forEach(incSC => {
        if (currentShortcuts.nodeMap[incSC.id] !== undefined) {
            existingMap[incSC.id] = existingIDs.length;
            existingIDs.push(incSC.id);
        }
    });
    while (incoming < incomingShortcuts.nodes.length && current < currentShortcuts.nodes.length) {
        const currID = currentShortcuts.nodes[current].id;
        const incomingSC = incomingShortcuts.nodes[incoming];
        const incomingID = incomingSC.id;
        if (currID !== incomingID) {
            const currPos = currentShortcuts.nodeMap[incomingID];
            const existingPos = existingMap[currID];
            // Deletes are handled above, so no need to take care of that here
            if (currPos === undefined) {
                // Handle the incoming ID being a new shortcut
                inserts.push(incomingSC);
                incoming++;
                continue;
            }
            else if (existingPos === undefined) {
                // This shouldn't happen, as it is handeled in the first loop above
                continue;
            }
            else {
                // Both elements are found, now it gets complicated
                const relCurPos = currPos - current;
                const relExistingPos = existingPos - existing;
                if (relCurPos - relExistingPos === 0) {
                    // Both elements were found at a relative distance from eachother, this is a swap
                    // Update only the incoming node (current node will get updated when second mismatch is found)
                    const setWeight = currentShortcuts.nodes[current].NodeFields.sortOrder;
                    processInserts(lastWeight, setWeight);
                    incomingSC.NodeFields.sortOrder = setWeight;
                    process(incomingID, incomingSC);
                    lastWeight = setWeight;
                    current++;
                    incoming++;
                    existing++;
                }
                else if (relCurPos < 0 || relExistingPos < relCurPos) {
                    // The incoming element was moved
                    inserts.push(incomingSC);
                    incoming++;
                    existing++;
                }
                else {
                    current++;
                }
            }
        }
        else {
            processInserts(lastWeight, currentShortcuts.nodes[current].NodeFields.sortOrder);
            lastWeight = currentShortcuts.nodes[current].NodeFields.sortOrder;
            current++;
            incoming++;
            existing++;
        }
    }
    while (incoming < incomingShortcuts.nodes.length) {
        inserts.push(incomingShortcuts.nodes[incoming]);
        incoming++;
    }
    processInserts(lastWeight);
    // Correct for weight conflicts - should probably split this into a sperate function?
    const clean = [];
    const conflicts = [];
    for (let i = 1; i < currentShortcuts.nodes.length; i++) {
        const sc = currentShortcuts.nodes[i];
        const prevSc = currentShortcuts.nodes[i - 1];
        if (prevSc && sc.NodeFields.sortOrder === prevSc.NodeFields.sortOrder) {
            conflicts.push(sc);
        }
        else {
            clean.push(sc);
        }
    }
    for (let i = 0, j = 0; i < conflicts.length; i++) {
        const conflict = conflicts[i];
        while (clean[j] && clean[j].NodeFields.sortOrder <= conflict.NodeFields.sortOrder) {
            j++;
        }
        const low = clean[j - 1] && clean[j - 1].NodeFields.sortOrder || conduit_utils_1.LexoRankEndWeight;
        const high = clean[j] && clean[j].NodeFields.sortOrder || conduit_utils_1.LexoRankEndWeight;
        const newSc = Object.assign(Object.assign({}, conflict), { NodeFields: Object.assign(Object.assign({}, conflict.NodeFields), { weight: conduit_utils_1.lexoRank(low, high) }) });
        process(newSc.id, newSc);
        clean.splice(j, 0, newSc);
        j--;
    }
    if (incomingShortcuts.edges) {
        for (const edge of incomingShortcuts.edges) {
            processEdge(edge);
        }
    }
}
exports.reconcileIncomingShortcuts = reconcileIncomingShortcuts;
const getShortcutNodesAndEdges = async (trc, instance, context) => {
    const nodesAndEdges = {
        nodes: { nodesToUpsert: [], nodesToDelete: [] },
        edges: { edgesToCreate: [], edgesToDelete: [] },
    };
    const incomingShortcuts = getIncomingShortcuts(instance);
    const currentShortcuts = await getCurrentShortcuts(trc, context.tx);
    function processNode(id, shortcut) {
        if (!shortcut) {
            nodesAndEdges.nodes.nodesToDelete.push({ id, type: en_data_model_1.CoreEntityTypes.Shortcut });
        }
        else {
            nodesAndEdges.nodes.nodesToUpsert.push(shortcut);
        }
    }
    function processEdge(edge) {
        nodesAndEdges.edges.edgesToCreate.push(edge);
    }
    await reconcileIncomingShortcuts(incomingShortcuts, currentShortcuts, processNode, processEdge);
    return nodesAndEdges;
};
exports.getShortcutNodesAndEdges = getShortcutNodesAndEdges;
//# sourceMappingURL=ShortcutConverter.js.map