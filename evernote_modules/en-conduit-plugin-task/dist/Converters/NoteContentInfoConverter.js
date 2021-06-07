"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteContentInfoNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getNoteContentInfoNodeAndEdges = async (trc, instance, context) => {
    var _a, _b;
    const noteContentInfo = en_nsync_connector_1.convertNsyncEntityToNode(instance, context);
    if (!noteContentInfo) {
        return null;
    }
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    nodesToUpsert.push(noteContentInfo);
    if (instance.parentEntity) {
        const parentID = (_a = instance.parentEntity) === null || _a === void 0 ? void 0 : _a.id;
        const currentNoteContentInfo = await context.tx.getNode(trc, null, { type: en_data_model_1.EntityTypes.NoteContentInfo, id: noteContentInfo.id });
        const currentParentEdge = conduit_utils_1.firstStashEntry(currentNoteContentInfo === null || currentNoteContentInfo === void 0 ? void 0 : currentNoteContentInfo.inputs.parent);
        if (currentParentEdge) {
            const currentParentID = currentParentEdge.srcID;
            if (parentID !== currentParentID) {
                edgesToDelete.push({
                    dstID: noteContentInfo.id, dstType: en_data_model_1.EntityTypes.NoteContentInfo, dstPort: 'parent',
                });
            }
        }
        edgesToCreate.push({
            srcType: en_core_entity_types_1.CoreEntityTypes.Note,
            srcID: (_b = instance.parentEntity) === null || _b === void 0 ? void 0 : _b.id,
            srcPort: 'noteContentInfo',
            dstType: en_data_model_1.EntityTypes.NoteContentInfo,
            dstID: noteContentInfo.id,
            dstPort: 'parent',
        });
    }
    return { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
};
exports.getNoteContentInfoNodeAndEdges = getNoteContentInfoNodeAndEdges;
//# sourceMappingURL=NoteContentInfoConverter.js.map