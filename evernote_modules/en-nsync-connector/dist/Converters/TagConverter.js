"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTagNodesAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const BaseConverter_1 = require("./BaseConverter");
const getTagNodesAndEdges = async (trc, instance, context) => {
    var _a;
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const initial = BaseConverter_1.createInitialNode(instance);
    if (!initial) {
        return null;
    }
    const tag = Object.assign(Object.assign({}, initial), { type: en_core_entity_types_1.CoreEntityTypes.Tag, NodeFields: {}, inputs: {
            refs: {},
            parent: {},
        }, outputs: {
            children: {},
            shortcut: {},
        } });
    nodesToUpsert.push(tag);
    const currentTag = await context.tx.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.Tag, id: tag.id });
    const parentEdge = conduit_utils_1.firstStashEntry(currentTag === null || currentTag === void 0 ? void 0 : currentTag.inputs.parent);
    const currentParentID = parentEdge === null || parentEdge === void 0 ? void 0 : parentEdge.srcID;
    if (((_a = instance.parentEntity) === null || _a === void 0 ? void 0 : _a.id) !== currentParentID) {
        // remove existing parent
        edgesToDelete.push({
            // srcID: currentTag.inputs.parent.id, srcType: CoreEntityTypes.Tag, srcPort: 'children',
            dstID: tag.id, dstType: en_core_entity_types_1.CoreEntityTypes.Tag, dstPort: 'parent',
        });
    }
    // const ownerID: UserID = isNullish(instance.ownerId) ? context.currentUserID : instance.ownerId as UserID;
    // edgesToCreate.push({
    //   srcID: generateProfileID(PROFILE_SOURCE.User, ownerID), srcType: CoreEntityTypes.Profile, srcPort: 'tags',
    //   dstID: tag.id, dstType: CoreEntityTypes.Tag, dstPort: 'owner',
    // });
    if (instance.parentEntity) {
        // create new edge if parentGuid is present
        edgesToCreate.push({
            srcID: instance.parentEntity.id, srcType: en_core_entity_types_1.CoreEntityTypes.Tag, srcPort: 'children',
            dstID: tag.id, dstType: en_core_entity_types_1.CoreEntityTypes.Tag, dstPort: 'parent',
        });
    }
    conduit_utils_1.logger.debug(tag.id);
    conduit_utils_1.logger.debug(tag.label || '');
    return { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
};
exports.getTagNodesAndEdges = getTagNodesAndEdges;
//# sourceMappingURL=TagConverter.js.map