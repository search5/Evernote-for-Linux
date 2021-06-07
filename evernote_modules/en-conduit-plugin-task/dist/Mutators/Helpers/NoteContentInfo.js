"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeletedOnTaskByNote = exports.genTasksDataCreateOps = exports.taskGroupUpsertPlanFor = exports.taskGroupUpsertPlan = exports.getNoteContentInfoIDByNoteID = exports.getNoteContentInfoID = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const Permission_1 = require("./Permission");
const Task_1 = require("./Task");
async function getNoteContentInfoID(trc, ctx, noteRef, copyOwnerRef) {
    // if the Note container is available, it will be used to resolve the actual ownerID
    const owner = copyOwnerRef || noteRef || ctx.vaultUserID || ctx.userID;
    const noteContentInfoIDGen = await ctx.generateDeterministicIDWithPrefix(trc, owner, en_data_model_1.EntityTypes.NoteContentInfo, noteRef.id, true);
    const noteContentInfoID = noteContentInfoIDGen[1];
    return { noteContentInfoIDGen, noteContentInfoID };
}
exports.getNoteContentInfoID = getNoteContentInfoID;
function getNoteContentInfoIDByNoteID(noteID) {
    return `${noteID}_NoteContentInfo`;
}
exports.getNoteContentInfoIDByNoteID = getNoteContentInfoIDByNoteID;
async function taskGroupUpsertPlan(trc, ctx, params, copyOwnerRef) {
    const taskGroupNoteLevelIDs = params.taskGroupNoteLevelIDs.slice();
    const containerRef = { id: params.noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
    // Only check if working on an existing note, not for a soon to be created copy
    if (!copyOwnerRef) {
        const note = await ctx.fetchEntity(trc, containerRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.noteID, `Not found TaskGroup's Note ${params.noteID}`);
        }
        await Permission_1.checkNoteEditPermissionByNoteId(trc, ctx, params.noteID);
    }
    const { noteContentInfoIDGen, noteContentInfoID } = await getNoteContentInfoID(trc, ctx, containerRef, copyOwnerRef);
    const noteContentInfoRef = { id: noteContentInfoID, type: en_data_model_1.EntityTypes.NoteContentInfo };
    const existingNoteContentInfo = await ctx.fetchEntity(trc, noteContentInfoRef);
    let plan;
    if (existingNoteContentInfo) {
        const parentEdge = conduit_utils_1.firstStashEntry(existingNoteContentInfo.inputs.parent);
        if (parentEdge) {
            const parentNoteRef = { type: parentEdge.srcType, id: parentEdge.srcID };
            const parentNote = await ctx.fetchEntity(trc, parentNoteRef);
            if (parentNote) {
                const taskRefs = await ctx.traverseGraph(trc, { type: parentNote.type, id: parentNote.id }, [{ edge: ['outputs', 'tasks'], type: en_data_model_1.EntityTypes.Task }]);
                const existingTasks = await ctx.fetchEntities(trc, en_data_model_1.EntityTypes.Task, taskRefs.map(t => t.edge.dstID));
                for (const task of existingTasks) {
                    if (!task) {
                        continue;
                    }
                    if (!taskGroupNoteLevelIDs.includes(task.NodeFields.taskGroupNoteLevelID)) {
                        taskGroupNoteLevelIDs.push(task.NodeFields.taskGroupNoteLevelID);
                    }
                }
            }
        }
        plan = {
            results: {
                result: noteContentInfoRef.id,
            },
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: noteContentInfoRef,
                    node: ctx.assignFields(en_data_model_1.EntityTypes.NoteContentInfo, {
                        taskGroupNoteLevelIDs,
                        updated: ctx.timestamp,
                        sourceOfChange: params.sourceOfChange,
                    }),
                }],
        };
    }
    else {
        const noteContentInfoEntity = ctx.createEntity(noteContentInfoRef, {
            taskGroupNoteLevelIDs,
            created: ctx.timestamp,
            updated: ctx.timestamp,
            sourceOfChange: params.sourceOfChange,
        }, ctx.userID);
        plan = {
            results: {
                result: noteContentInfoRef.id,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: noteContentInfoEntity,
                    id: noteContentInfoIDGen,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: params.noteID, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'noteContentInfo',
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
    const noteContentInfoRef = { id: noteContentInfoID, type: en_data_model_1.EntityTypes.NoteContentInfo };
    const noteContentInfo = await ctx.fetchEntity(trc, noteContentInfoRef);
    if (noteContentInfo) {
        const noteContentInfoTaskGroups = noteContentInfo.NodeFields.taskGroupNoteLevelIDs;
        if (noteContentInfoTaskGroups) {
            if (noteContentInfoTaskGroups.includes(taskGroupNoteLevelID)) {
                return {
                    results: {},
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
        sourceOfChange,
    }, copyOwnerRef);
}
exports.taskGroupUpsertPlanFor = taskGroupUpsertPlanFor;
async function genTasksDataCreateOps(trc, ctx, tasksExportData, noteID, plan, copyOwnerRef) {
    if (!tasksExportData.taskGroupNoteLevelIDs || !tasksExportData.taskGroupNoteLevelIDs.length) {
        return;
    }
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
    if (!tasksExportData.tasks || !tasksExportData.tasks.length) {
        return;
    }
    const taskKeys = [];
    for (let i = 0; i < tasksExportData.tasks.length; i++) {
        const taskParams = tasksExportData.tasks[i];
        const taskKey = taskParams.taskGroupNoteLevelID + '-' + i;
        const newTaskParams = Object.assign(Object.assign({}, taskParams), { container: noteID, copyOwnerRef, key: taskKey });
        const taskRes = await Task_1.taskCreatePlan(trc, ctx, newTaskParams);
        taskKeys.push(taskRes.results.result);
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
async function updateDeletedOnTaskByNote(ctx, trc, noteID, ops, markAsDeleted) {
    const note = await ctx.fetchEntity(trc, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
    if (!note) {
        throw new conduit_utils_1.NotFoundError(noteID, `Note not found in taskNoteMoveToTrash ${noteID}`);
    }
    const taskRefs = await ctx.traverseGraph(trc, { type: note.type, id: note.id }, [{ edge: ['outputs', 'tasks'], type: en_data_model_1.EntityTypes.Task }]);
    for (const taskRef of taskRefs) {
        ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: taskRef,
            node: ctx.assignFields(en_data_model_1.EntityTypes.Task, {
                deleted: markAsDeleted ? ctx.timestamp : null,
            }),
        });
    }
}
exports.updateDeletedOnTaskByNote = updateDeletedOnTaskByNote;
//# sourceMappingURL=NoteContentInfo.js.map