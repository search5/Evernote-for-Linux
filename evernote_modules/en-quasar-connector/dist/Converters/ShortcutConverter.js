"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShortcutNodesAndEdges = void 0;
/*
export interface ShortcutList {
  nodes: Shortcut[];
  nodeMap: Stash<number>;
  edges?: GraphEdge[];
}

function convertGuidFromService(guid: string): NodeID {
  return `Shortcut:${guid}` as NodeID;
}

// All these copied from en-thrift-connectors ShortcutConverter and ShorcutHelpers
async function getCurrentShortcuts<SyncContextMetadata>(
  trc: TracingContext,
  tx: GraphTransactionContext<SyncContextMetadata>,
) {
  const nodes = await tx.getGraphNodesByType<Shortcut>(trc, null, CoreEntityTypes.Shortcut);
  const nodeMap: Stash<number> = {};

  nodes.sort((a, b) => {
    if (a.NodeFields.sortOrder === b.NodeFields.sortOrder) {
      return 0;
    } else if (a.NodeFields.sortOrder > b.NodeFields.sortOrder) {
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

function nodeFromShortcut(instance: ShortcutSyncEntity, parent: GraphNodeRef, sortOrder: string): Shortcut {
  const shortcut = convertNsyncEntityToNode<Shortcut>(instance, context);
  if (!shortcut) {
    logger.error('Missing initial values');
    throw new Error('Missing initial values for Shortcut');
  }
  shortcut.label = `Shortcut for ${parent.id}`;

  return node;
}

function getIncomingShortcuts(instance: ShortcutSyncEntity) {
  const prefs = instance.preferences as Stash<string[]>;
  const shortcuts = prefs[PREFERENCE_SHORTCUTS_KEY] || [];
  const nodeMap: Stash<number> = {};
  const nodes: Shortcut[] = [];
  const edges: GraphEdge[] = [];

  let lastWeight = LexoRankEndWeight;

  shortcuts.forEach(entry => {
    const sc = safeParse(entry);
    if (typeof sc === 'object' && sc.updated !== undefined) {
      // Just ignore this
    } else if (Array.isArray(sc) && sc.length === 2) {
      lastWeight = lexoRank(lastWeight, LexoRankEndWeight);
      try {
        const parentRef: GraphNodeRef = { type: sc[0], id: sc[1] };
        const incomingShortcut = nodeFromShortcut(instance, parentRef, lastWeight);

        const edge: GraphEdge = {
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
      } catch (e) {
        logger.error('Unable to create shortcut for entry', sc);
      }
    } else {
      logger.warn('Unknown data type for shortcut entry', sc);
    }
  });
  return { nodes, nodeMap, edges };
}

type ProcessShortcutFunction = (id: NodeID, shortcut?: Shortcut) => void;
type ProcessEdgeFunction = (edge: GraphEdge) => void;

// The currentShortcuts object will be modified in this function
export async function reconcileIncomingShortcuts(
  incomingShortcuts: ShortcutList,
  currentShortcuts: ShortcutList,
  process: ProcessShortcutFunction,
  processEdge: ProcessEdgeFunction,
) {
  let inserts: Shortcut[] = [];
  let deletes = 0;

  const existingIDs: string[] = [];
  const existingMap: Stash<number> = {};

  let incoming = 0;
  let existing = 0;
  let current = 0;
  let lastWeight = LexoRankEndWeight;

  function processInserts(lowWeight: string, highWeight?: string) {
    if (inserts.length === 0) {
      return;
    }

    for (const sc of inserts) {
      lowWeight = lexoRank(lowWeight, highWeight || LexoRankEndWeight);
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
    } else {
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
      } else if (existingPos === undefined)  {
        // This shouldn't happen, as it is handeled in the first loop above
        continue;
      } else {
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
        } else if (relCurPos < 0 || relExistingPos < relCurPos) {
          // The incoming element was moved
          inserts.push(incomingSC);
          incoming++;
          existing++;
        } else {
          current++;
        }
      }
    } else {
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
  const clean: Shortcut[] = [];
  const conflicts: Shortcut[] = [];

  for (let i = 1; i < currentShortcuts.nodes.length; i++) {
    const sc = currentShortcuts.nodes[i];
    const prevSc = currentShortcuts.nodes[i - 1];

    if (prevSc && sc.NodeFields.sortOrder === prevSc.NodeFields.sortOrder) {
      conflicts.push(sc);
    } else {
      clean.push(sc);
    }
  }

  for (let i = 0, j = 0; i < conflicts.length; i++) {
    const conflict = conflicts[i];

    while (clean[j] && clean[j].NodeFields.sortOrder <= conflict.NodeFields.sortOrder) {
      j++;
    }

    const low = clean[j - 1] && clean[j - 1].NodeFields.sortOrder || LexoRankEndWeight;
    const high = clean[j] && clean[j].NodeFields.sortOrder || LexoRankEndWeight;
    const newSc = { ...conflict, NodeFields: { ...conflict.NodeFields, weight: lexoRank(low, high)} };

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
*/
const getShortcutNodesAndEdges = async (trc, instance, context) => {
    throw new Error('Shortcut nsync conversion not yet supported');
};
exports.getShortcutNodesAndEdges = getShortcutNodesAndEdges;
//# sourceMappingURL=ShortcutConverter.js.map