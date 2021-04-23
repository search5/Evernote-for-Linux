"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentNoteId = exports.taskCreatePlan = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const TaskConstants_1 = require("../../TaskConstants");
const NoteContentInfo_1 = require("./NoteContentInfo");
const Permission_1 = require("./Permission");
async function taskCreatePlan(trc, ctx, params) {
    const containerRef = { id: params.container, type: en_core_entity_types_1.CoreEntityTypes.Note };
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
        await Permission_1.checkNoteEditPermissionByNoteId(trc, ctx, containerRef.id);
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
        results: {
            result: taskID,
        },
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
                srcID: params.container, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'tasks',
                dstID: taskID, dstType: taskEntity.type, dstPort: 'parent',
            }],
    });
    const taskGroupUpsertPlan = await NoteContentInfo_1.taskGroupUpsertPlanFor(trc, ctx, noteContainerRef.id, params.taskGroupNoteLevelID, params.sourceOfChange, params.copyOwnerRef);
    if (taskGroupUpsertPlan.ops.length) {
        plan.ops.push(...taskGroupUpsertPlan.ops);
    }
    if (ctx.isOptimistic) {
        const profile = await en_core_entity_types_1.getAccountProfileRef(trc, ctx);
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
async function getParentNoteId(trc, ctx, taskID) {
    const taskRef = { id: taskID, type: TaskConstants_1.TaskEntityTypes.Task };
    const noteEdge = await ctx.traverseGraph(trc, taskRef, [{ edge: ['inputs', 'parent'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
    if (!noteEdge || !noteEdge.length || !noteEdge[0].edge) {
        throw new conduit_utils_1.NotFoundError('The task does not have parent Note');
    }
    return noteEdge[0].edge.srcID;
}
exports.getParentNoteId = getParentNoteId;
//# sourceMappingURL=Task.js.map