"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskUserSettings = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const TaskUtils_1 = require("./TaskUtils");
const Utilities_1 = require("./Utilities");
async function getTaskUserSettings(parent, args, context) {
    conduit_core_1.validateDB(context, 'Must be authenticated to work with tasks');
    const userNode = await Utilities_1.getCurrentUserNode(context);
    const taskUserSettingsId = TaskUtils_1.getTaskUserSettingsIdByUserId(userNode.NodeFields.internal_userID);
    const existingTaskUserSettings = await context.db.getNode(context, { id: taskUserSettingsId, type: en_data_model_1.EntityTypes.TaskUserSettings });
    if (!existingTaskUserSettings) {
        return null;
    }
    const defaultTaskNoteEdge = conduit_utils_1.firstStashEntry(existingTaskUserSettings.outputs.defaultTaskNote);
    let noteLabel = null;
    let isDefaultTaskNoteInTrash = null;
    if (defaultTaskNoteEdge && defaultTaskNoteEdge.dstID) {
        const note = await context.db.getNode(context, { id: defaultTaskNoteEdge.dstID, type: en_core_entity_types_1.CoreEntityTypes.Note });
        if (note) {
            noteLabel = note.label;
            isDefaultTaskNoteInTrash = Boolean(note.NodeFields.deleted);
        }
    }
    return {
        id: existingTaskUserSettings.id,
        type: existingTaskUserSettings.type,
        defaultTaskNoteId: defaultTaskNoteEdge ? defaultTaskNoteEdge.dstID : null,
        defaultTaskNoteLabel: noteLabel,
        isDefaultTaskNoteInTrash,
        defaultReminder: existingTaskUserSettings.NodeFields.defaultReminder || false,
        defaultRemindersOffsets: existingTaskUserSettings.NodeFields.defaultRemindersOffsets,
        pinDefaultTaskNote: existingTaskUserSettings.NodeFields.pinDefaultTaskNote || false,
        taskAssignDate: existingTaskUserSettings.NodeFields.taskAssignDate || null,
        taskAssignCount: existingTaskUserSettings.NodeFields.taskAssignCount || null,
    };
}
exports.getTaskUserSettings = getTaskUserSettings;
//# sourceMappingURL=GetTaskUserSettingsQuery.js.map