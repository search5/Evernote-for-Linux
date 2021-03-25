"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMutationTrackerNodesAndEdges = exports.createTrackerNode = void 0;
const en_data_model_1 = require("en-data-model");
const NSyncTypes_1 = require("../NSyncTypes");
function createTrackerNode(updated, ownerID) {
    const tracker = {
        id: en_data_model_1.MUTATION_TRACKER_REF.id,
        type: en_data_model_1.InternalEntityTypes.MutationTracker,
        label: 'MutationTracker',
        localChangeTimestamp: 0,
        syncContexts: [],
        NodeFields: {
            updated,
        },
        version: 0,
        inputs: {},
        outputs: {},
        owner: ownerID,
    };
    return tracker;
}
exports.createTrackerNode = createTrackerNode;
const getMutationTrackerNodesAndEdges = async (trc, instance, context) => {
    var _a;
    // skip if this is for a different client
    let curClientID = (_a = instance.clientID) !== null && _a !== void 0 ? _a : '';
    if (curClientID === 'null') {
        curClientID = '';
    }
    if (curClientID !== context.eventManager.getClientID()) {
        return null;
    }
    const tracker = createTrackerNode(NSyncTypes_1.convertLong(instance.updated || 0), NSyncTypes_1.convertLong(instance.ownerId || 0));
    const nodesToUpsert = [tracker];
    return { nodes: { nodesToUpsert, nodesToDelete: [] } };
};
exports.getMutationTrackerNodesAndEdges = getMutationTrackerNodesAndEdges;
//# sourceMappingURL=MutationTrackerConverter.js.map