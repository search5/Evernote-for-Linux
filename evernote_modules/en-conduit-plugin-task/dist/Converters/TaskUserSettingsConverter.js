"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskUserSettingsNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const TaskConstants_1 = require("../TaskConstants");
const getTaskUserSettingsNodeAndEdges = async (trc, instance, context) => {
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return null;
    }
    let defaultRemindersOffsets = [];
    if (instance.defaultRemindersOffsets) {
        defaultRemindersOffsets = instance.defaultRemindersOffsets.map(offset => en_nsync_connector_1.convertLong(offset));
    }
    const taskUserSettings = Object.assign(Object.assign({}, initial), { type: TaskConstants_1.TaskEntityTypes.TaskUserSettings, NodeFields: {
            created: en_nsync_connector_1.convertLong(instance.created || 0),
            updated: en_nsync_connector_1.convertLong(instance.updated || 0),
            defaultReminder: instance.defaultReminder || false,
            defaultRemindersOffsets,
            pinDefaultTaskNote: instance.pinDefaultTaskNote || true,
        }, inputs: {}, outputs: {
            defaultTaskNote: {},
        } });
    nodesToUpsert.push(taskUserSettings);
    const existingTaskUserSettings = await context.tx.getNode(trc, null, { type: TaskConstants_1.TaskEntityTypes.TaskUserSettings, id: taskUserSettings.id });
    const existingDefaultTaskNoteEdge = conduit_utils_1.firstStashEntry(existingTaskUserSettings === null || existingTaskUserSettings === void 0 ? void 0 : existingTaskUserSettings.outputs.defaultTaskNote);
    const existingDefaultTaskNoteID = existingDefaultTaskNoteEdge === null || existingDefaultTaskNoteEdge === void 0 ? void 0 : existingDefaultTaskNoteEdge.dstID;
    if (existingDefaultTaskNoteID !== instance.defaultTaskNoteID) {
        if (existingDefaultTaskNoteID) {
            edgesToDelete.push({
                dstType: en_data_model_1.CoreEntityTypes.Note, dstID: existingDefaultTaskNoteID, dstPort: 'taskUserSettingsForDefaultNote',
                srcType: TaskConstants_1.TaskEntityTypes.TaskUserSettings, srcID: taskUserSettings.id, srcPort: 'defaultTaskNote',
            });
        }
        if (instance.defaultTaskNoteID) {
            edgesToCreate.push({
                dstType: en_data_model_1.CoreEntityTypes.Note,
                dstID: instance.defaultTaskNoteID,
                dstPort: 'taskUserSettingsForDefaultNote',
                srcType: TaskConstants_1.TaskEntityTypes.TaskUserSettings, srcID: taskUserSettings.id, srcPort: 'defaultTaskNote',
            });
        }
    }
    return { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
};
exports.getTaskUserSettingsNodeAndEdges = getTaskUserSettingsNodeAndEdges;
//# sourceMappingURL=TaskUserSettingsConverter.js.map