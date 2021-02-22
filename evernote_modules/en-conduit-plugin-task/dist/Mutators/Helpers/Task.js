"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNoteEditPermissionByNoteId = exports.checkNoteEditPermissionByTask = exports.taskCreatePlan = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const TaskConstants_1 = require("../../TaskConstants");
const NoteContentInfo_1 = require("./NoteContentInfo");
async function taskCreatePlan(trc, ctx, params) {
    const containerRef = { id: params.container, type: en_data_model_1.CoreEntityTypes.Note };
    const noteContainerRef = containerRef; // assuming var exists because tasks may go elsewhere in the future
    if (!params.copyOwnerRef) {
        const container = await ctx.fetchEntity(trc, containerRef);
        if (!container) {
            throw new conduit_utils_1.NotFoundError(params.container, `Not found Task's container ${params.container}`);
        }
        const noteContainer = await ctx.fetchEntity(trc, containerRef);
        if (!noteContainer) {
            throw new conduit_utils_1.NotFoundError(containerRef.id, `Not found Note ${containerRef.id}`);
        }
        await checkNoteEditPermissionByNoteId(trc, ctx, containerRef.id);
    }
    // if the Note container is available, it will be used to resolve the actual ownerID
    const owner = params.copyOwnerRef || containerRef || ctx.vaultUserID || ctx.userID;
    const taskGenID = await ctx.generateID(trc, owner, TaskConstants_1.TaskEntityTypes.Task, params.key);
    const taskID = taskGenID[1];
    const taskEntity = ctx.createEntity({ id: taskID, type: TaskConstants_1.TaskEntityTypes.Task }, {
        label: params.label,
        dueDate: params.dueDate,
        timeZone: params.timeZone,
        dueDateUIOption: params.dueDateUIOption,
        status: params.status || TaskConstants_1.TaskStatus.open,
        flag: params.flag,
        created: ctx.timestamp,
        updated: ctx.timestamp,
        inNote: Boolean(containerRef),
        sortWeight: (params.sortWeight === null) ? conduit_utils_1.LexoRankSafeMinChar : params.sortWeight,
        noteLevelID: params.noteLevelID || conduit_utils_1.uuid(),
        statusUpdated: ctx.timestamp,
        taskGroupNoteLevelID: params.taskGroupNoteLevelID,
        sourceOfChange: params.sourceOfChange,
    }, ctx.userID);
    const plan = {
        result: taskID,
        ops: [{
                changeType: 'Node:CREATE',
                node: taskEntity,
                id: taskGenID,
            },
        ],
    };
    plan.ops.push({
        changeType: 'Edge:MODIFY',
        edgesToCreate: [{
                srcID: params.container, srcType: en_data_model_1.CoreEntityTypes.Note, srcPort: 'tasks',
                dstID: taskID, dstType: taskEntity.type, dstPort: 'parent',
            }],
    });
    const taskGroupUpsertPlan = await NoteContentInfo_1.taskGroupUpsertPlanFor(trc, ctx, noteContainerRef.id, params.taskGroupNoteLevelID, params.sourceOfChange, params.copyOwnerRef);
    if (taskGroupUpsertPlan.ops.length) {
        plan.ops.push(...taskGroupUpsertPlan.ops);
    }
    if (ctx.isOptimistic) {
        const profile = await en_data_model_1.getAccountProfileRef(trc, ctx);
        if (profile) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: taskID, srcType: TaskConstants_1.TaskEntityTypes.Task, srcPort: 'creator',
                        dstID: profile.id, dstType: profile.type, dstPort: null,
                    }, {
                        srcID: taskID, srcType: TaskConstants_1.TaskEntityTypes.Task, srcPort: 'lastEditor',
                        dstID: profile.id, dstType: profile.type, dstPort: null,
                    }],
            });
        }
    }
    return plan;
}
exports.taskCreatePlan = taskCreatePlan;
async function checkNoteEditPermissionByTask(trc, ctx, task) {
    const edge = conduit_utils_1.firstStashEntry(task.inputs.parent);
    if (!edge) {
        throw new conduit_utils_1.InvalidParameterError(`Task ${task.id} does not have parent note`);
    }
    await checkNoteEditPermissionByNoteId(trc, ctx, edge.srcID);
}
exports.checkNoteEditPermissionByTask = checkNoteEditPermissionByTask;
async function checkNoteEditPermissionByNoteId(trc, ctx, noteId) {
    const permContext = new en_data_model_1.MutationPermissionContext(trc, ctx);
    const policy = await en_data_model_1.commandPolicyOfNote(noteId, permContext);
    if (!policy.canEditContent) {
        throw new conduit_utils_1.PermissionError('Permission Denied');
    }
}
exports.checkNoteEditPermissionByNoteId = checkNoteEditPermissionByNoteId;
//# sourceMappingURL=Task.js.map