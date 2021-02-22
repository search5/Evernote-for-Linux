"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialNode = exports.mergeNodesAndEdges = exports.toBlobV2WithContentFields = exports.toBlobV2Fields = void 0;
const conduit_utils_1 = require("conduit-utils");
const index_1 = require("../index");
const NSyncTypes_1 = require("../NSyncTypes");
const toBlobV2Fields = (nsyncBlobv2Ref) => {
    return {
        localChangeTimestamp: 0,
        url: null,
        hash: nsyncBlobv2Ref.hash,
        size: NSyncTypes_1.convertLong(nsyncBlobv2Ref.size) || 0,
        path: nsyncBlobv2Ref.path,
    };
};
exports.toBlobV2Fields = toBlobV2Fields;
const toBlobV2WithContentFields = (nsyncBlobv2Ref) => {
    return {
        localChangeTimestamp: 0,
        url: null,
        hash: nsyncBlobv2Ref.hash,
        size: NSyncTypes_1.convertLong(nsyncBlobv2Ref.size) || 0,
        path: nsyncBlobv2Ref.path,
        content: nsyncBlobv2Ref.content,
    };
};
exports.toBlobV2WithContentFields = toBlobV2WithContentFields;
function mergeNodesAndEdges(object1, object2) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const nodesToUpsert = [...(((_a = object1.nodes) === null || _a === void 0 ? void 0 : _a.nodesToUpsert) || []), ...(((_b = object2.nodes) === null || _b === void 0 ? void 0 : _b.nodesToUpsert) || [])];
    const nodesToDelete = [...(((_c = object1.nodes) === null || _c === void 0 ? void 0 : _c.nodesToDelete) || []), ...(((_d = object2.nodes) === null || _d === void 0 ? void 0 : _d.nodesToDelete) || [])];
    const edgesToCreate = [...(((_e = object1.edges) === null || _e === void 0 ? void 0 : _e.edgesToCreate) || []), ...(((_f = object2.edges) === null || _f === void 0 ? void 0 : _f.edgesToCreate) || [])];
    const edgesToDelete = [...(((_g = object1.edges) === null || _g === void 0 ? void 0 : _g.edgesToDelete) || []), ...(((_h = object2.edges) === null || _h === void 0 ? void 0 : _h.edgesToDelete) || [])];
    return { nodes: { nodesToDelete, nodesToUpsert }, edges: { edgesToDelete, edgesToCreate } };
}
exports.mergeNodesAndEdges = mergeNodesAndEdges;
function createInitialNode(instance) {
    if (instance.version === undefined || instance.version === null) {
        return null;
    }
    const ref = instance.ref;
    if (!ref) {
        return null;
    }
    const node = {
        /* TODO v1+: use if/when flattened
        shard: instance.shardId,
        owner: convertLong(instance.ownerId) as UserID,
    
        created: convertLong(instance.created),
        updated: convertLong(instance.updated),
        deleted: instance.deleted === null ? null : convertLong(instance.deleted) || null, // convertLong might equal 0
        */
        id: ref.id,
        version: NSyncTypes_1.convertLong(instance.version) || 0,
        // creator: convertLong(instanceAttr.creator) as UserID,
        // lastEditor: convertLong(instanceAttr.lastEditor) as UserID,
        label: instance.label || 'Untitled',
        localChangeTimestamp: 0,
        NodeFields: {},
        syncContexts: [index_1.NSYNC_CONTEXT],
        inputs: {},
        outputs: {},
        owner: instance.ownerId ? NSyncTypes_1.convertLong(instance.ownerId) : conduit_utils_1.NullUserID,
    };
    return node;
}
exports.createInitialNode = createInitialNode;
//# sourceMappingURL=BaseConverter.js.map