"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskMove = exports.taskAssign = exports.taskUpdate = exports.taskDelete = exports.taskCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const ReminderStatusContainmentRules_1 = require("../Rules/ReminderStatusContainmentRules");
const TaskConstants_1 = require("../TaskConstants");
const NoteContentInfo_1 = require("./Helpers/NoteContentInfo");
const Permission_1 = require("./Helpers/Permission");
const Task_1 = require("./Helpers/Task");
async function genericUpdateExecutionPlan(trc, ctx, taskID, fields) {
    const nodeRef = { id: taskID, type: TaskConstants_1.TaskEntityTypes.Task };
    const task = await ctx.fetchEntity(trc, nodeRef);
    if (!task) {
        throw new conduit_utils_1.NotFoundError(taskID, 'missing task in update');
    }
    return {
        results: {},
        ops: await taskUpdateOps(trc, ctx, nodeRef, fields),
    };
}
async function taskUpdateOps(trc, ctx, taskRef, fields) {
    fields.updated = ctx.timestamp;
    if (fields.status) {
        fields.statusUpdated = ctx.timestamp;
    }
    const ops = [
        {
            changeType: 'Node:UPDATE',
            nodeRef: taskRef,
            node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.Task, fields),
        },
    ];
    const profile = await en_core_entity_types_1.getAccountProfileRef(trc, ctx);
    if (profile) {
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: taskRef.id, srcType: taskRef.type, srcPort: 'lastEditor',
                    dstID: profile.id, dstType: profile.type, dstPort: null,
                }],
        });
    }
    return ops;
}
exports.taskCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        container: 'ID',
        label: 'string',
        taskGroupNoteLevelID: 'string',
        dueDate: conduit_utils_1.NullableTimestamp,
        timeZone: conduit_utils_1.NullableString,
        dueDateUIOption: conduit_utils_1.Nullable(TaskConstants_1.DueDateUIOptionSchema),
        flag: conduit_utils_1.NullableBoolean,
        sortWeight: conduit_utils_1.NullableString,
        status: conduit_utils_1.NullableString,
        noteLevelID: conduit_utils_1.NullableString,
        sourceOfChange: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a, _b;
        paramsOut.noteLevelID = (_a = paramsIn.noteLevelID) !== null && _a !== void 0 ? _a : conduit_utils_1.uuid();
        paramsOut.sourceOfChange = (_b = paramsIn.sourceOfChange) !== null && _b !== void 0 ? _b : '';
    },
    execute: async (trc, ctx, params) => {
        const taskCreateParams = {
            container: params.container,
            dueDate: params.dueDate,
            dueDateUIOption: params.dueDateUIOption,
            flag: params.flag,
            label: params.label,
            noteLevelID: params.noteLevelID,
            sortWeight: params.sortWeight,
            status: params.status,
            timeZone: params.timeZone,
            taskGroupNoteLevelID: params.taskGroupNoteLevelID,
            sourceOfChange: params.sourceOfChange,
        };
        return await Task_1.taskCreatePlan(trc, ctx, taskCreateParams);
    },
};
/* Delete Task */
exports.taskDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        task: 'ID',
        sourceOfChange: conduit_utils_1.NullableString,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.task, type: TaskConstants_1.TaskEntityTypes.Task };
        const task = await ctx.fetchEntity(trc, nodeRef);
        if (!task) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing task in taskDelete');
        }
        await Permission_1.checkNoteEditPermissionByTask(trc, ctx, task);
        const parentNodeEdge = conduit_utils_1.firstStashEntry(task.inputs.parent);
        if (!parentNodeEdge) {
            throw new conduit_utils_1.NotFoundError(params.task, `Task's parent not found in taskMove`);
        }
        const { srcID: parentNoteId } = parentNodeEdge;
        const { noteContentInfoID } = await NoteContentInfo_1.getNoteContentInfoID(trc, ctx, { id: parentNoteId, type: en_core_entity_types_1.CoreEntityTypes.Note });
        return {
            results: {},
            ops: [
                {
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: noteContentInfoID, type: TaskConstants_1.TaskEntityTypes.NoteContentInfo },
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.NoteContentInfo, { sourceOfChange: params.sourceOfChange }),
                },
                {
                    changeType: 'Node:DELETE',
                    nodeRef,
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [
                        { dstID: params.task, dstType: TaskConstants_1.TaskEntityTypes.Task, dstPort: 'parent' },
                    ],
                },
            ],
        };
    },
};
/* Update Task */
exports.taskUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        task: 'ID',
        label: conduit_utils_1.NullableString,
        dueDate: conduit_utils_1.NullableTimestamp,
        timeZone: conduit_utils_1.NullableString,
        dueDateUIOption: conduit_utils_1.Nullable(TaskConstants_1.DueDateUIOptionSchema),
        flag: conduit_utils_1.NullableBoolean,
        sortWeight: conduit_utils_1.NullableString,
        status: conduit_utils_1.Nullable(TaskConstants_1.TaskStatusSchema),
        sourceOfChange: conduit_utils_1.NullableString,
        taskGroupNoteLevelID: conduit_utils_1.NullableString,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
    },
    buffering: {
        time: 1500,
    },
    rollupStrategy: {
        ifParamsMatch: [
            { prev: 'task', next: 'task' },
        ],
        combineParams: {
            label: 'or',
            dueDate: 'or',
            timeZone: 'or',
            dueDateUIOption: 'or',
            flag: 'or',
            sortWeight: 'or',
            status: 'or',
            sourceOfChange: 'or',
            taskGroupNoteLevelID: 'or',
        },
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            label: params.label,
            dueDate: params.dueDate,
            timeZone: params.dueDate === null ? null : params.timeZone,
            dueDateUIOption: params.dueDate === null ? null : params.dueDateUIOption,
            flag: params.flag,
            sortWeight: (params.sortWeight === null) ? conduit_utils_1.LexoRankSafeMinChar : params.sortWeight,
            updated: ctx.timestamp,
            status: params.status,
            sourceOfChange: params.sourceOfChange,
            taskGroupNoteLevelID: params.taskGroupNoteLevelID,
        };
        const taskRef = { id: params.task, type: TaskConstants_1.TaskEntityTypes.Task };
        const noteID = await Task_1.getParentNoteId(trc, ctx, params.task);
        const plan = await genericUpdateExecutionPlan(trc, ctx, params.task, fields);
        if (params.taskGroupNoteLevelID) {
            const taskGroupUpsertPlan = await NoteContentInfo_1.taskGroupUpsertPlanFor(trc, ctx, noteID, params.taskGroupNoteLevelID, params.sourceOfChange);
            if (taskGroupUpsertPlan.ops.length) {
                plan.ops.push(...taskGroupUpsertPlan.ops);
            }
        }
        const existingTask = await ctx.fetchEntity(trc, taskRef);
        if (!existingTask) {
            throw new conduit_utils_1.NotFoundError(params.task, 'missing task in update');
        }
        if (params.taskGroupNoteLevelID) {
            const taskGroupUpsertPlan = await NoteContentInfo_1.taskGroupUpsertPlanFor(trc, ctx, noteID, params.taskGroupNoteLevelID, params.sourceOfChange);
            if (taskGroupUpsertPlan.ops.length) {
                plan.ops.push(...taskGroupUpsertPlan.ops);
            }
        }
        await Permission_1.checkTaskEditPermission(trc, ctx, existingTask);
        const reminderRefs = await ctx.traverseGraph(trc, taskRef, [{ edge: ['outputs', 'reminders'], type: TaskConstants_1.TaskEntityTypes.Reminder }]);
        const reminderIds = reminderRefs.map(reminder => {
            return reminder.id;
        });
        const reminders = await ctx.fetchEntities(trc, TaskConstants_1.TaskEntityTypes.Reminder, reminderIds);
        const deletedReminders = {};
        let ops = [];
        // update reminders date on dueDate change
        if (!!params.dueDate) {
            ops = reminders
                .filter(reminder => {
                if (!reminder) {
                    return false;
                }
                return reminder.NodeFields.reminderDateUIOption === TaskConstants_1.ReminderDateUIOption.relative_to_due;
            })
                .map(reminder => {
                const reminderFields = {
                    reminderDate: 0,
                    updated: ctx.timestamp,
                };
                if (reminder.NodeFields.reminderDate && existingTask && existingTask.NodeFields && existingTask.NodeFields.dueDate && fields.dueDate) {
                    reminderFields.reminderDate = reminder.NodeFields.reminderDate - existingTask.NodeFields.dueDate + fields.dueDate;
                }
                return {
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: reminder.id, type: TaskConstants_1.TaskEntityTypes.Reminder },
                    node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.Reminder, reminderFields),
                };
            });
            // delete relative reminders on deleting dueDate
        }
        else if (params.dueDate === null) {
            ops = reminders
                .filter(reminder => {
                if (!reminder) {
                    return false;
                }
                return reminder.NodeFields.reminderDateUIOption === TaskConstants_1.ReminderDateUIOption.relative_to_due;
            })
                .map(reminder => {
                deletedReminders[reminder.id] = true;
                return {
                    changeType: 'Node:DELETE',
                    nodeRef: { id: reminder.id, type: TaskConstants_1.TaskEntityTypes.Reminder },
                };
            });
        }
        if (params.status) {
            const reminderStatus = params.status === TaskConstants_1.TaskStatus.completed ? TaskConstants_1.ReminderStatus.muted : TaskConstants_1.ReminderStatus.active;
            await ReminderStatusContainmentRules_1.updateReminderStatus(ctx, trc, taskRef.id, ops, reminderStatus, reminders.filter(r => r && !deletedReminders[r.id]));
        }
        // let's remove the associations
        ops.forEach(op => {
            if (op.changeType === 'Node:DELETE') {
                ops.push({
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [
                        { dstID: op.nodeRef.id, dstType: TaskConstants_1.TaskEntityTypes.Reminder, dstPort: 'source' },
                    ],
                });
            }
        });
        plan.ops.push(...ops);
        return plan;
    },
};
/* Assign Task */
exports.taskAssign = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        task: 'ID',
        assigneeID: conduit_utils_1.NullableID,
        sourceOfChange: conduit_utils_1.NullableString,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            sourceOfChange: params.sourceOfChange,
        };
        const noteID = await Task_1.getParentNoteId(trc, ctx, params.task);
        const taskRef = { id: params.task, type: TaskConstants_1.TaskEntityTypes.Task };
        const existingTask = await ctx.fetchEntity(trc, taskRef);
        if (!existingTask) {
            throw new conduit_utils_1.NotFoundError(params.task, 'Task not found in taskAssign');
        }
        await Permission_1.checkTaskEditPermission(trc, ctx, existingTask);
        // update assignee
        const existingAssigneeEdge = conduit_utils_1.firstStashEntry(existingTask === null || existingTask === void 0 ? void 0 : existingTask.outputs.assignee);
        const existingAssigneeId = existingAssigneeEdge ? existingAssigneeEdge.dstID : null;
        const plan = {
            results: {},
            ops: [],
        };
        if (existingAssigneeId === params.assigneeID || (!existingAssigneeId && !params.assigneeID)) {
            return plan;
        }
        // delete the existing edge
        const edgeModifyOps = {
            changeType: 'Edge:MODIFY',
            edgesToDelete: [
                { srcID: params.task, srcType: TaskConstants_1.TaskEntityTypes.Task, srcPort: 'assignee' },
                { srcID: params.task, srcType: TaskConstants_1.TaskEntityTypes.Task, srcPort: 'assignedBy' },
                { srcID: params.task, srcType: TaskConstants_1.TaskEntityTypes.Task, srcPort: 'memberships' },
            ],
        };
        plan.ops.push(edgeModifyOps);
        if (params.assigneeID) {
            edgeModifyOps.edgesToCreate = [{
                    srcID: params.task,
                    srcType: TaskConstants_1.TaskEntityTypes.Task,
                    srcPort: 'assignee',
                    dstID: params.assigneeID,
                    dstType: en_core_entity_types_1.CoreEntityTypes.Profile,
                    dstPort: null,
                }];
            const profile = await en_core_entity_types_1.getAccountProfileRef(trc, ctx);
            if (profile) {
                edgeModifyOps.edgesToCreate.push({
                    srcID: taskRef.id, srcType: taskRef.type, srcPort: 'assignedBy',
                    dstID: profile.id, dstType: profile.type, dstPort: null,
                }, {
                    srcID: taskRef.id, srcType: taskRef.type, srcPort: 'lastEditor',
                    dstID: profile.id, dstType: profile.type, dstPort: null,
                });
                // create membership
                const owner = { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note } || ctx.vaultUserID || ctx.userID;
                const membershipOps = await en_core_entity_types_1.createMembershipOps(trc, ctx, owner, {
                    privilege: en_core_entity_types_1.MembershipPrivilege.COMPLETE,
                    recipientIsMe: profile.id === params.assigneeID,
                    parentRef: { id: taskRef.id, type: taskRef.type },
                    profileEdgeMap: {
                        recipient: params.assigneeID,
                        sharer: profile.id,
                        owner: profile.id,
                    },
                });
                plan.ops.push(...membershipOps);
            }
        }
        plan.ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: taskRef,
            node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.Task, fields),
        });
        return plan;
    },
};
/* Move Task */
exports.taskMove = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        task: 'ID',
        destTaskGroupNoteLevelID: 'string',
        destNoteID: 'ID',
        destNoteOwnerID: conduit_utils_1.NullableNumber,
        sourceOfChange: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
        const { destNoteID, destNoteOwnerID } = paramsIn;
        if (!conduit_utils_1.isNullish(destNoteOwnerID)) {
            return;
        }
        const destNote = await ctx.fetchEntity(trc, { id: destNoteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
        if (!destNote) {
            throw new conduit_utils_1.NotFoundError(destNoteID, 'Target note not found in taskMove');
        }
        const owner = destNote || ctx.vaultUserID || ctx.userID;
        paramsOut.destNoteOwnerID = await ctx.resolveOwnerRef(trc, owner);
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.task, type: TaskConstants_1.TaskEntityTypes.Task };
        const task = await ctx.fetchEntity(trc, nodeRef);
        if (!task) {
            throw new conduit_utils_1.NotFoundError(params.task, 'Task not found in taskMove');
        }
        const destNote = await ctx.fetchEntity(trc, { id: params.destNoteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
        if (!destNote) {
            throw new conduit_utils_1.NotFoundError(params.destNoteID, 'Target note not found in taskMove');
        }
        // we need to check permission on both source and target note
        await Permission_1.checkNoteEditPermissionByTask(trc, ctx, task);
        await Permission_1.checkNoteEditPermissionByNoteId(trc, ctx, params.destNoteID);
        const parentNodeEdge = conduit_utils_1.firstStashEntry(task.inputs.parent);
        if (!parentNodeEdge) {
            throw new conduit_utils_1.NotFoundError(params.task, `Task's parent not found in taskMove`);
        }
        const { srcID: srcNoteID } = parentNodeEdge;
        if (srcNoteID === destNote.id
            && task.NodeFields.taskGroupNoteLevelID === params.destTaskGroupNoteLevelID) {
            return {
                results: {},
                ops: [],
            };
        }
        const taskUpdateFields = {
            inNote: true,
            taskGroupNoteLevelID: params.destTaskGroupNoteLevelID,
            sourceOfChange: params.sourceOfChange,
        };
        const ops = await taskUpdateOps(trc, ctx, nodeRef, taskUpdateFields);
        if (srcNoteID === destNote.id) {
            const sameNotePlan = await NoteContentInfo_1.taskGroupUpsertPlanFor(trc, ctx, srcNoteID, params.destTaskGroupNoteLevelID, params.sourceOfChange);
            sameNotePlan.ops.push(...ops);
            return sameNotePlan;
        }
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: destNote.id, srcType: destNote.type, srcPort: 'tasks',
                    dstID: task.id, dstType: task.type, dstPort: 'parent',
                }],
            edgesToDelete: [{
                    srcID: srcNoteID, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'tasks',
                    dstID: task.id, dstType: task.type, dstPort: 'parent',
                }],
        });
        const destTaskGroupUpsertPlan = await NoteContentInfo_1.taskGroupUpsertPlanFor(trc, ctx, destNote.id, params.destTaskGroupNoteLevelID, params.sourceOfChange);
        if (destTaskGroupUpsertPlan.ops.length) {
            ops.push(...destTaskGroupUpsertPlan.ops);
        }
        ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: { id: NoteContentInfo_1.getNoteContentInfoIDByNoteID(srcNoteID), type: TaskConstants_1.TaskEntityTypes.NoteContentInfo },
            node: ctx.assignFields(TaskConstants_1.TaskEntityTypes.NoteContentInfo, {
                sourceOfChange: params.sourceOfChange,
            }),
        });
        return {
            results: {},
            ops,
        };
    },
};
//# sourceMappingURL=TaskMutators.js.map