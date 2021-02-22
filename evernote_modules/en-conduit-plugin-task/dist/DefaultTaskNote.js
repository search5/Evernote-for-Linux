"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskGroupCreateDefaultTaskNoteUpsert = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const NoteContentInfo_1 = require("./Mutators/Helpers/NoteContentInfo");
const TaskConstants_1 = require("./TaskConstants");
const TaskUtils_1 = require("./TaskUtils");
const Utilities_1 = require("./Utilities");
async function resolver(parent, argsIn, context) {
    const args = argsIn;
    if (!args) {
        throw new conduit_utils_1.MissingParameterError('Missing args for taskGroupCreateDefaultTaskNoteUpsert resolver');
    }
    conduit_core_1.validateDB(context);
    const userNode = await Utilities_1.getCurrentUserNode(context);
    const taskUserSettingsId = TaskUtils_1.getTaskUserSettingsIdByUserId(userNode.NodeFields.internal_userID);
    let defaultTaskNoteList = [];
    const existingTaskUserSettings = await context.db.getNode(context, { id: taskUserSettingsId, type: TaskConstants_1.TaskEntityTypes.TaskUserSettings });
    if (Boolean(existingTaskUserSettings)) {
        defaultTaskNoteList = await context.db.traverseGraph(context, { type: TaskConstants_1.TaskEntityTypes.TaskUserSettings, id: existingTaskUserSettings.id }, [{
                edge: ['outputs', 'defaultTaskNote'],
                type: en_data_model_1.CoreEntityTypes.Note,
            }]);
    }
    let defaultTaskNoteID;
    let taskGroupNoteLevelID;
    if (existingTaskUserSettings && defaultTaskNoteList.length) {
        defaultTaskNoteID = defaultTaskNoteList[0].id;
    }
    const existingDefaultTaskNote = defaultTaskNoteID ? await context.db.getNode(context, { type: en_data_model_1.CoreEntityTypes.Note, id: defaultTaskNoteID }) : null;
    if (!existingDefaultTaskNote || existingDefaultTaskNote.NodeFields.deleted) {
        taskGroupNoteLevelID = conduit_utils_1.uuid();
        const noteContent = `<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\"><en-note><div style=\"--en-taskgroup:true; --en-note-level-id:${taskGroupNoteLevelID}\"></div></en-note>`;
        const newNote = await context.db.runMutator(context.trc, 'noteCreate', {
            label: args.defaultTaskNoteLabel,
            noteContent,
        });
        defaultTaskNoteID = newNote.result;
        await context.db.runMutator(context.trc, 'taskUserSettingsSetDefaultTaskNote', {
            noteID: newNote.result,
            pinDefaultTaskNote: args.pinDefaultTaskNote,
        });
        await taskGroupUpdateForDefaultTaskNote(context, taskGroupNoteLevelID);
    }
    else {
        const noteContentInfoID = NoteContentInfo_1.getNoteContentInfoIDByNoteID(existingDefaultTaskNote.id);
        const noteContentInfo = await context.db.getNode(context, {
            type: TaskConstants_1.TaskEntityTypes.NoteContentInfo,
            id: noteContentInfoID,
        });
        if (!noteContentInfo || !noteContentInfo.NodeFields.taskGroups) {
            taskGroupNoteLevelID = conduit_utils_1.uuid();
            await taskGroupUpdateForDefaultTaskNote(context, taskGroupNoteLevelID);
        }
        else {
            const { taskGroups } = noteContentInfo.NodeFields;
            taskGroupNoteLevelID = taskGroups[taskGroups.length - 1]; // the last TaskGroup
        }
    }
    if (!taskGroupNoteLevelID) {
        throw new conduit_utils_1.NotFoundError('created taskGroup is not in noteContentInfo in taskGroupCreateForDefaultTaskNote');
    }
    return {
        success: true,
        result: {
            taskGroupID: taskGroupNoteLevelID,
            defaultTaskNoteID,
        },
    };
}
async function taskGroupUpdateForDefaultTaskNote(context, taskGroupNoteLevelID) {
    conduit_core_1.validateDB(context);
    const { result } = await context.db.runMutator(context.trc, 'taskGroupUpsertInNoteContentInfo', { taskGroupNoteLevelIDs: [taskGroupNoteLevelID] });
    if (!result) {
        throw new conduit_utils_1.InternalError('Failed to run taskGroupUpdateForDefaultTaskNote');
    }
    return result;
}
exports.taskGroupCreateDefaultTaskNoteUpsert = {
    args: conduit_core_1.schemaToGraphQLArgs({
        defaultTaskNoteLabel: 'string',
        pinDefaultTaskNote: 'boolean?',
    }),
    type: conduit_core_1.schemaToGraphQLType({
        success: 'boolean',
        result: {
            taskGroupID: 'string',
            defaultTaskNoteID: 'string',
        },
    }, 'TaskGroupCreateDefaultTaskNoteUpsertResult', false),
    resolve: resolver,
};
//# sourceMappingURL=DefaultTaskNote.js.map