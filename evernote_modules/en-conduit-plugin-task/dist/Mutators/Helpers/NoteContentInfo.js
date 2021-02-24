"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genTasksDataCreateOps = exports.taskGroupUpsertPlanFor = exports.taskGroupUpsertPlan = exports.getNoteContentInfoIDByNoteID = exports.getNoteContentInfoID = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const TaskConstants_1 = require("../../TaskConstants");
const Task_1 = require("./Task");
async function getNoteContentInfoID(trc, ctx, noteRef, copyOwnerRef) {
    // if the Note container is available, it will be used to resolve the actual ownerID
    const owner = copyOwnerRef || noteRef || ctx.vaultUserID || ctx.userID;
    const noteContentInfoIDGen = await ctx.generateDeterministicIDWithPrefix(trc, owner, TaskConstants_1.TaskEntityTypes.NoteContentInfo, noteRef.id, true);
    const noteContentInfoID = noteContentInfoIDGen[1];
    return { noteContentInfoIDGen, noteContentInfoID };
}
exports.getNoteContentInfoID = getNoteContentInfoID;
function getNoteContentInfoIDByNoteID(noteID) {
    return `${noteID}_NoteContentInfo`;
}
exports.getNoteContentInfoIDByNoteID = getNoteContentInfoIDByNoteID;
async function taskGroupUpsertPlan(trc, ctx, params, copyOwnerRef) {
    const containerRef = { id: params.noteID, type: en_data_model_1.CoreEntityTypes.Note };
    // Only check if working on an existing note, not for a soon to be created copy
    if (!copyOwnerRef) {
        const note = await ctx.fetchEntity(trc, containerRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.noteID, `Not found TaskGroup's Note ${params.noteID}`);
        }
        await Task_1.checkNoteEditPermissionByNoteId(trc, ctx, params.noteID);
    }
    const { noteContentInfoIDGen, noteContentInfoID } = await getNoteContentInfoID(trc, ctx, containerRef, copyOwnerRef);
    const noteContentInfoRef = { id: noteContentInfoID, type: TaskConstants_1.TaskEntityTypes.NoteContentInfo };
    const existingNoteContentInfo = await ctx.fetchEntity(trc, noteContentInfoRef);
    let plan;
    if (existingNoteContentInfo) {
        plan = {
            result: noteContentInfoRef,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: noteContentInfoRef,
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.NoteContentInfo, {
                        taskGroups: params.taskGroupNoteLevelIDs,
                        updated: ctx.timestamp,
                        sourceOfChange: params.sourceOfChange,
                    }),
                }],
        };
    }
    else {
        const noteContentInfoEntity = ctx.createEntity(noteContentInfoRef, {
            taskGroups: params.taskGroupNoteLevelIDs,
            created: ctx.timestamp,
            updated: ctx.timestamp,
            sourceOfChange: params.sourceOfChange,
        }, ctx.userID);
        plan = {
            result: noteContentInfoRef,
            ops: [{
                    changeType: 'Node:CREATE',
                    node: noteContentInfoEntity,
                    id: noteContentInfoIDGen,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: params.noteID, srcType: en_data_model_1.CoreEntityTypes.Note, srcPort: 'noteContentInfo',
                            dstID: noteContentInfoID, dstType: noteContentInfoEntity.type, dstPort: 'parent',
                        }],
                }],
        };
    }
    return plan;
}
exports.taskGroupUpsertPlan = taskGroupUpsertPlan;
async function taskGroupUpsertPlanFor(trc, ctx, noteID, taskGroupNoteLevelID, sourceOfChange, copyOwnerRef) {
    const taskGroupNoteLevelIDs = [];
    const noteContentInfoID = getNoteContentInfoIDByNoteID(noteID);
    const noteContentInfoRef = { id: noteContentInfoID, type: TaskConstants_1.TaskEntityTypes.NoteContentInfo };
    const noteContentInfo = await ctx.fetchEntity(trc, noteContentInfoRef);
    if (noteContentInfo) {
        const noteContentInfoTaskGroups = noteContentInfo.NodeFields.taskGroups;
        if (noteContentInfoTaskGroups) {
            if (noteContentInfoTaskGroups.includes(taskGroupNoteLevelID)) {
                return {
                    result: null,
                    ops: [],
                };
            }
            taskGroupNoteLevelIDs.push(...noteContentInfoTaskGroups);
        }
    }
    taskGroupNoteLevelIDs.push(taskGroupNoteLevelID);
    return taskGroupUpsertPlan(trc, ctx, {
        noteID: noteID,
        taskGroupNoteLevelIDs,
    }, copyOwnerRef);
}
exports.taskGroupUpsertPlanFor = taskGroupUpsertPlanFor;
async function genTasksDataCreateOps(trc, ctx, tasksExportData, noteID, plan, copyOwnerRef) {
    const groupParams = {
        noteID,
        taskGroupNoteLevelIDs: tasksExportData.taskGroupNoteLevelIDs,
    };
    const groupRes = await taskGroupUpsertPlan(trc, ctx, groupParams, copyOwnerRef);
    plan.ops.push(...groupRes.ops);
    plan.ops.push({
        changeType: 'Custom',
        commandName: 'taskGroupUpsertInNoteContentInfo',
        params: groupParams,
    });
    const taskKeys = [];
    for (let i = 0; i < tasksExportData.tasks.length; i++) {
        const taskParams = tasksExportData.tasks[i];
        const taskKey = taskParams.taskGroupNoteLevelID + '-' + i;
        const newTaskParams = Object.assign(Object.assign({}, taskParams), { container: noteID, copyOwnerRef, key: taskKey });
        const taskRes = await Task_1.taskCreatePlan(trc, ctx, newTaskParams);
        taskKeys.push(String(taskRes.result));
        plan.ops.push(...taskRes.ops);
    }
    const params = {
        container: noteID,
        label: [],
        taskGroupNoteLevelID: [],
        dueDate: [],
        timeZone: [],
        dueDateUIOption: [],
        flag: [],
        sortWeight: [],
        noteLevelID: [],
        status: [],
        key: [],
        ownerID: parseInt((ctx.vaultUserID || ctx.userID).toString(), 10),
    };
    let index = 0;
    for (const task of tasksExportData.tasks) {
        params.label.push(task.label);
        params.taskGroupNoteLevelID.push(task.taskGroupNoteLevelID);
        params.dueDate.push(task.dueDate);
        params.timeZone.push(task.timeZone);
        params.dueDateUIOption.push(task.dueDateUIOption);
        params.flag.push(task.flag);
        params.sortWeight.push(task.sortWeight);
        params.noteLevelID.push(task.noteLevelID);
        params.status.push(task.status);
        params.key.push(taskKeys[index]);
        index++;
    }
    plan.ops.push({
        changeType: 'Custom',
        commandName: 'taskCreateMultiple',
        params,
    });
}
exports.genTasksDataCreateOps = genTasksDataCreateOps;
//# sourceMappingURL=NoteContentInfo.js.map