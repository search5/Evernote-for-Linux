"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskGroupCreateDefaultTaskNoteUpsert = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const NoteContentInfo_1 = require("../Mutators/Helpers/NoteContentInfo");
const TaskConstants_1 = require("../TaskConstants");
const TaskUtils_1 = require("../TaskUtils");
const Utilities_1 = require("../Utilities");
async function resolver(parent, argsIn, context) {
    const args = argsIn;
    if (!args) {
        throw new conduit_utils_1.MissingParameterError('Missing args for taskGroupCreateDefaultTaskNoteUpsert resolver');
    }
    if (args.noteContent && !args.noteContent.includes('</en-note>')) {
        throw new conduit_utils_1.InvalidParameterError('note content is not valid!');
    }
    conduit_core_1.validateDB(context);
    const userNode = await Utilities_1.getCurrentUserNode(context);
    const taskUserSettingsId = TaskUtils_1.getTaskUserSettingsIdByUserId(userNode.NodeFields.internal_userID);
    let defaultTaskNoteList = [];
    const existingTaskUserSettings = await context.db.getNode(context, { id: taskUserSettingsId, type: TaskConstants_1.TaskEntityTypes.TaskUserSettings });
    if (Boolean(existingTaskUserSettings)) {
        defaultTaskNoteList = await context.db.traverseGraph(context, { type: TaskConstants_1.TaskEntityTypes.TaskUserSettings, id: existingTaskUserSettings.id }, [{
                edge: ['outputs', 'defaultTaskNote'],
                type: en_core_entity_types_1.CoreEntityTypes.Note,
            }]);
    }
    let defaultTaskNoteID;
    let taskGroupNoteLevelID;
    if (existingTaskUserSettings && defaultTaskNoteList.length) {
        defaultTaskNoteID = defaultTaskNoteList[0].id;
    }
    const existingDefaultTaskNote = defaultTaskNoteID ? await context.db.getNode(context, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: defaultTaskNoteID }) : null;
    if (!existingDefaultTaskNote || existingDefaultTaskNote.NodeFields.deleted) {
        taskGroupNoteLevelID = conduit_utils_1.uuid();
        const taskGroupBlock = `<div style="--en-task-group:true; --en-id:${taskGroupNoteLevelID}; --en-n:1;-webkit-user-modify:read-only;-moz-user-modify:read-only;user-modify:read-only;border-radius:3px;border:1px solid rgba(182,182,182,0.09);background:rgba(174,174,174,0.09);overflow:hidden;color:#868686"><div style="background:rgba(182,182,182,0.09) no-repeat 6px 6px url(&quot;data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzg2ODY4NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE5LjcyNTEgMjBDMjAuMTgxIDIwIDIwLjYwMTEgMTkuNzU2IDIwLjgyOSAxOS4zNkMyMS4wNTcgMTguOTY0IDIxLjA1NyAxOC40NzYgMjAuODI5IDE4LjA4TDEzLjEwMzEgNC42Mzk5OUMxMi44NzYgNC4yNDM5OSAxMi40NTUxIDQgMTIgNEMxMS41NDQ5IDQgMTEuMTI0IDQuMjQzOTkgMTAuODk2MSA0LjYzOTk5TDMuMTcwOTggMTguMDhDMi45NDMwMSAxOC40NzYgMi45NDMwMSAxOC45NjQgMy4xNzA5OCAxOS4zNkMzLjM5ODEgMTkuNzU2IDMuODE4OTMgMjAgNC4yNzQwOCAyMEgxOS43MjUxWk00Ljg2NDg5IDE4LjRMMTIgNS45ODc5OEwxOS4xMzUxIDE4LjRINC44NjQ4OVoiLz4KPHBhdGggZD0iTTEyLjc1IDEwLjU3NTJDMTIuNzUgMTAuMTYxIDEyLjQxNDIgOS44MjUyMyAxMiA5LjgyNTIzQzExLjU4NTggOS44MjUyMyAxMS4yNSAxMC4xNjEgMTEuMjUgMTAuNTc1MlYxMy4yOTc5QzExLjI1IDEzLjcxMjEgMTEuNTg1OCAxNC4wNDc5IDEyIDE0LjA0NzlDMTIuNDE0MiAxNC4wNDc5IDEyLjc1IDEzLjcxMjEgMTIuNzUgMTMuMjk3OVYxMC41NzUyWiIvPgo8cGF0aCBkPSJNMTIuODc1IDE1Ljk1MTFDMTIuODc1IDE2LjQzNDQgMTIuNDgzMiAxNi44MjYxIDEyIDE2LjgyNjFDMTEuNTE2OCAxNi44MjYxIDExLjEyNSAxNi40MzQ0IDExLjEyNSAxNS45NTExQzExLjEyNSAxNS40Njc5IDExLjUxNjggMTUuMDc2MSAxMiAxNS4wNzYxQzEyLjQ4MzIgMTUuMDc2MSAxMi44NzUgMTUuNDY3OSAxMi44NzUgMTUuOTUxMVoiLz4KPC9zdmc+Cg==&quot;);padding:8px 38px;font-weight:600">Content not supported</div><div style="padding:2px 6px;margin: 1em">This block is a placeholder for a beta feature that isn\'t supported in the version of Evernote you\'re using. Deleting or moving this block may cause unexpected behavior in newer versions of Evernote.</div></div>`;
        const noteContent = args.noteContent ? args.noteContent.replace('</en-note>', `${taskGroupBlock}</en-note>`)
            : `<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">${taskGroupBlock}</en-note>`;
        const newNote = await context.db.runMutator(context.trc, 'noteCreate', {
            label: args.defaultTaskNoteLabel,
            noteContent,
            source: 'task',
        });
        defaultTaskNoteID = newNote.results.result;
        await context.db.runMutator(context.trc, 'taskUserSettingsSetDefaultTaskNote', {
            noteID: defaultTaskNoteID,
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
        if (!noteContentInfo || !noteContentInfo.NodeFields.taskGroupNoteLevelIDs) {
            taskGroupNoteLevelID = conduit_utils_1.uuid();
            await taskGroupUpdateForDefaultTaskNote(context, taskGroupNoteLevelID);
        }
        else {
            const { taskGroupNoteLevelIDs } = noteContentInfo.NodeFields;
            taskGroupNoteLevelID = taskGroupNoteLevelIDs[taskGroupNoteLevelIDs.length - 1]; // the last TaskGroup
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
    const { results } = await context.db.runMutator(context.trc, 'taskGroupUpsertInNoteContentInfo', { taskGroupNoteLevelIDs: [taskGroupNoteLevelID] });
    if (!results.result) {
        throw new conduit_utils_1.InternalError('Failed to run taskGroupUpdateForDefaultTaskNote');
    }
    return results.result;
}
exports.taskGroupCreateDefaultTaskNoteUpsert = {
    args: conduit_core_1.schemaToGraphQLArgs({
        defaultTaskNoteLabel: 'string',
        pinDefaultTaskNote: 'boolean?',
        noteContent: 'string?',
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