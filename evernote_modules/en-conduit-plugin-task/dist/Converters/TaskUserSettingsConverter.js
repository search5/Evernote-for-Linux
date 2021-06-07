"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskUserSettingsNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getTaskUserSettingsNodeAndEdges = async (trc, instance, context) => {
    const taskUserSettings = en_nsync_connector_1.convertNsyncEntityToNode(instance, context);
    if (!taskUserSettings) {
        return null;
    }
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    nodesToUpsert.push(taskUserSettings);
    const existingTaskUserSettings = await context.tx.getNode(trc, null, { type: en_data_model_1.EntityTypes.TaskUserSettings, id: taskUserSettings.id });
    const existingDefaultTaskNoteEdge = conduit_utils_1.firstStashEntry(existingTaskUserSettings === null || existingTaskUserSettings === void 0 ? void 0 : existingTaskUserSettings.outputs.defaultTaskNote);
    const existingDefaultTaskNoteID = existingDefaultTaskNoteEdge === null || existingDefaultTaskNoteEdge === void 0 ? void 0 : existingDefaultTaskNoteEdge.dstID;
    if (existingDefaultTaskNoteID !== instance.defaultTaskNoteID) {
        if (existingDefaultTaskNoteID) {
            edgesToDelete.push({
                dstType: en_core_entity_types_1.CoreEntityTypes.Note, dstID: existingDefaultTaskNoteID, dstPort: 'taskUserSettingsForDefaultNote',
                srcType: en_data_model_1.EntityTypes.TaskUserSettings, srcID: taskUserSettings.id, srcPort: 'defaultTaskNote',
            });
        }
        if (instance.defaultTaskNoteID) {
            edgesToCreate.push({
                dstType: en_core_entity_types_1.CoreEntityTypes.Note,
                dstID: instance.defaultTaskNoteID,
                dstPort: 'taskUserSettingsForDefaultNote',
                srcType: en_data_model_1.EntityTypes.TaskUserSettings, srcID: taskUserSettings.id, srcPort: 'defaultTaskNote',
            });
        }
    }
    return { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
};
exports.getTaskUserSettingsNodeAndEdges = getTaskUserSettingsNodeAndEdges;
//# sourceMappingURL=TaskUserSettingsConverter.js.map