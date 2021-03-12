"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutConverter = exports.updateShortcutsToService = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const ShortcutHelpers_1 = require("./ShortcutHelpers");
async function getCurrentShortcuts(trc, params) {
    const nodes = await params.graphTransaction.getGraphNodesByType(trc, null, en_core_entity_types_1.CoreEntityTypes.Shortcut);
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
function getIncomingShortcuts(prefs) {
    const shortcuts = prefs.preferences[en_conduit_sync_types_1.EDAM_PREFERENCE_SHORTCUTS] || [];
    const nodeMap = {};
    const nodes = [];
    let lastOrder = '';
    shortcuts.forEach(entry => {
        const sc = conduit_utils_1.safeParse(entry);
        if (typeof sc === 'object' && sc.updated !== undefined) {
            // Just ignore this
        }
        else if (Array.isArray(sc) && ShortcutHelpers_1.validateShortCutEntry(sc)) {
            lastOrder = conduit_utils_1.lexoRank(lastOrder, '');
            try {
                const incomingShortcut = nodeFromShortcut({ type: sc[0], id: Converters_1.convertGuidFromService(sc[1], sc[0]) }, lastOrder);
                nodeMap[incomingShortcut.id] = nodes.length;
                nodes.push(incomingShortcut);
            }
            catch (e) {
                conduit_utils_1.logger.error('Unable to create shortcut for entry', sc);
            }
        }
    });
    return { nodes, nodeMap };
}
function nodeFromShortcut(parent, sortOrder) {
    const node = {
        id: Converters_1.convertGuidFromService(parent.id, en_core_entity_types_1.CoreEntityTypes.Shortcut),
        version: 0,
        type: en_core_entity_types_1.CoreEntityTypes.Shortcut,
        syncContexts: [],
        label: `Shortcut for ${parent.id}`,
        localChangeTimestamp: 0,
        NodeFields: {
            sortOrder,
        },
        inputs: {
            source: {},
        },
        outputs: {},
    };
    conduit_storage_1.addInputEdgeToNode(node, 'source', {
        id: parent.id,
        type: parent.type,
        port: 'shortcut',
    });
    return node;
}
async function updateShortcutsToService(trc, params, added, deleted) {
    const shortcutData = [conduit_utils_1.safeStringify({ updated: Date.now() })];
    const noteStore = params.thriftComm.getNoteStore(params.personalAuth.urls.noteStoreUrl);
    const { nodes: shortcuts } = await getCurrentShortcuts(trc, params);
    for (const shortcut of added) {
        const curNodeIndex = shortcuts.findIndex(s => s.id === shortcut.id);
        const newOrder = shortcut.NodeFields.sortOrder;
        if (curNodeIndex >= 0) {
            shortcuts.splice(curNodeIndex, 1);
        }
        let newIndex = shortcuts.findIndex(s => {
            if (s.NodeFields.sortOrder > newOrder) {
                return true;
            }
            return false;
        });
        if (newIndex === -1) {
            newIndex = shortcuts.length;
        }
        shortcuts.splice(newIndex, 0, shortcut);
    }
    for (const id of deleted) {
        const curNodeIndex = shortcuts.findIndex(s => s.id === id);
        if (curNodeIndex >= 0) {
            shortcuts.splice(curNodeIndex, 1);
        }
    }
    shortcuts.forEach(node => {
        if (!node) {
            return;
        }
        if (node.inputs) {
            const edge = conduit_utils_1.firstStashEntry(node.inputs.source);
            edge && shortcutData.push(conduit_utils_1.safeStringify([edge.srcType, Converters_1.convertGuidToService(edge.srcID, edge.srcType)]));
        }
    });
    const preferences = {
        [en_conduit_sync_types_1.EDAM_PREFERENCE_SHORTCUTS]: shortcutData,
    };
    await noteStore.updatePreferences(trc, params.personalAuth.token, preferences);
}
exports.updateShortcutsToService = updateShortcutsToService;
class ShortcutConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Shortcut;
    }
    convertGuidFromService(guid) {
        return `Shortcut:${guid}`;
    }
    convertGuidToService(guid) {
        return guid.slice('Shortcut:'.length);
    }
    async convertFromService(trc, params, syncContext, serviceData) {
        const incomingShortcuts = getIncomingShortcuts(serviceData);
        const currentShortcuts = await getCurrentShortcuts(trc, params);
        let isReplace = false;
        async function updateNode(id, shortcut) {
            if (!shortcut) {
                await params.graphTransaction.deleteNode(trc, syncContext, { id, type: en_core_entity_types_1.CoreEntityTypes.Shortcut });
            }
            else {
                const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, shortcut);
                isReplace = isReplace || !!prevNode;
            }
        }
        await ShortcutHelpers_1.reconcileIncomingShortcuts(incomingShortcuts, currentShortcuts, updateNode);
        return !isReplace;
    }
    async createOnService() {
        // We must wait for the edge to be created, so the update happens in applyEdgeChangesToService
        return false;
    }
    async deleteFromService(trc, params, syncContext, ids) {
        await updateShortcutsToService(trc, params, [], ids);
        return false;
    }
    async updateToService(trc, params, syncContext, shortcutID, diff) {
        const curShortcut = await params.graphTransaction.getNode(trc, null, { id: shortcutID, type: en_core_entity_types_1.CoreEntityTypes.Shortcut });
        if (diff.NodeFields && diff.NodeFields.sortOrder && curShortcut && curShortcut.NodeFields.sortOrder !== diff.NodeFields.sortOrder) {
            await updateShortcutsToService(trc, params, [Object.assign(Object.assign({}, curShortcut), { NodeFields: {
                        sortOrder: diff.NodeFields.sortOrder,
                    } })], []);
        }
        return false;
    }
    async applyEdgeChangesToService(trc, params, syncContext, shortcutID, changes) {
        const curShortcut = await params.graphTransaction.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.Shortcut, id: shortcutID });
        if (!curShortcut) {
            return false;
        }
        const sourceChanges = changes['inputs:source'];
        if (sourceChanges && sourceChanges.creates.length) {
            const edge = sourceChanges.creates[0];
            const { id, type } = conduit_storage_1.getEdgeConnection(edge, shortcutID);
            await updateShortcutsToService(trc, params, [nodeFromShortcut({ id, type }, curShortcut.NodeFields.sortOrder)], []);
        }
        return false;
    }
}
exports.ShortcutConverter = new ShortcutConverterClass();
//# sourceMappingURL=ShortcutConverter.js.map