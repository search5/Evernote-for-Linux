"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldSyncInNoteTasksResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const NoteContentInfo_1 = require("../../Mutators/Helpers/NoteContentInfo");
const TaskConstants_1 = require("../../TaskConstants");
const ApplyComparisonChanges_1 = require("./ApplyComparisonChanges");
const Comparison_1 = require("./Comparison");
const Types_1 = require("./Types");
async function oldSyncInNoteTasksResolver(parent, args, context) {
    var _a;
    if (!args) {
        throw new conduit_utils_1.MissingParameterError('Missing args for inNoteTaskApplyChanges');
    }
    if (!args.noteID) {
        throw new conduit_utils_1.MissingParameterError('Missing noteID from args in inNoteTaskApplyChanges');
    }
    if (!args.taskGroupList) {
        throw new conduit_utils_1.MissingParameterError('Missing taskGroupList from args in inNoteTaskApplyChanges');
    }
    if (!args.sourceOfChange) {
        conduit_utils_1.logger.warn('sourceOfChange needs to be passed on inNoteTaskApplyChanges');
    }
    const sourceOfChange = (_a = args.sourceOfChange) !== null && _a !== void 0 ? _a : '';
    validateNoteLevelIDUniqueness(args);
    conduit_core_1.validateDB(context);
    const note = await context.db.getNode(context, { id: args.noteID, type: en_data_model_1.CoreEntityTypes.Note });
    if (!note) {
        throw new conduit_utils_1.NotFoundError(args.noteID, 'The parent note does not exists');
    }
    const taskGroupNoteLevelIDs = args.taskGroupList
        .sort((a, b) => a.sortWeight.localeCompare(b.sortWeight))
        .map(group => group.noteLevelID);
    const existingNoteContentInfo = await context.db.getNode(context, { type: TaskConstants_1.TaskEntityTypes.NoteContentInfo, id: NoteContentInfo_1.getNoteContentInfoIDByNoteID(args.noteID) });
    if (args.taskGroupList.length || existingNoteContentInfo) {
        await context.db.runMutator(context.trc, 'taskGroupUpsertInNoteContentInfo', {
            noteID: note.id,
            taskGroupNoteLevelIDs,
            sourceOfChange: args.sourceOfChange,
        });
    }
    const originalTasks = await context.db.batchGetNodes(context, TaskConstants_1.TaskEntityTypes.Task, await getChildrenIDs(context, en_data_model_1.CoreEntityTypes.Note, note.id));
    const inputTasks = [];
    args.taskGroupList.forEach(group => {
        if (group.children) {
            group.children.forEach(c => {
                inputTasks.push(Object.assign(Object.assign({}, c), { taskGroupNoteLevelID: group.noteLevelID }));
            });
        }
    });
    const taskComparisonResult = Comparison_1.compareList(originalTasks, inputTasks, note);
    await ApplyComparisonChanges_1.applyTaskComparisonChanges(context, taskComparisonResult, sourceOfChange);
    const reminderComparisonResult = await getChildrenChanges(context, taskComparisonResult, TaskConstants_1.TaskEntityTypes.Reminder, TaskConstants_1.TaskEntityTypes.Task);
    await ApplyComparisonChanges_1.applyReminderComparisonChanges(context, reminderComparisonResult, sourceOfChange);
    return {
        success: true,
    };
}
exports.oldSyncInNoteTasksResolver = oldSyncInNoteTasksResolver;
async function getChildrenChanges(context, comparisonResult, childType, parentType) {
    var e_1, _a;
    const taskComparisonResult = [];
    try {
        for (var comparisonResult_1 = __asyncValues(comparisonResult), comparisonResult_1_1; comparisonResult_1_1 = await comparisonResult_1.next(), !comparisonResult_1_1.done;) {
            const resultItem = comparisonResult_1_1.value;
            let inputChildren;
            switch (resultItem.status) {
                case Types_1.ComparisonStatus.same:
                case Types_1.ComparisonStatus.modified:
                    const childrenIDs = await getChildrenIDs(context, parentType, resultItem.originalNode.id);
                    inputChildren = getInputChildren(resultItem.inputNode);
                    const originalChildren = await context.db.batchGetNodes(context, childType, childrenIDs);
                    const taskComparison = Comparison_1.compareList(originalChildren, inputChildren, resultItem.originalNode);
                    taskComparisonResult.push.apply(taskComparisonResult, taskComparison);
                    break;
                case Types_1.ComparisonStatus.added:
                    inputChildren = getInputChildren(resultItem.inputNode);
                    taskComparisonResult.push.apply(taskComparisonResult, inputChildren.map(inputNode => ({ status: Types_1.ComparisonStatus.added, inputNode, parent: resultItem.originalNode })));
                    break;
                case Types_1.ComparisonStatus.deleted:
                    // deleting parent will delete children anyway, we don't need to add them to the comparison result.
                    break;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (comparisonResult_1_1 && !comparisonResult_1_1.done && (_a = comparisonResult_1.return)) await _a.call(comparisonResult_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return taskComparisonResult;
}
async function getChildrenIDs(context, nodeType, nodeID) {
    let childIDs = [];
    const nodeRef = { id: nodeID, type: nodeType };
    const node = await context.db.getNode(context, nodeRef);
    if (!node) {
        return childIDs;
    }
    let childPropertyName;
    let childType;
    switch (nodeType) {
        case en_data_model_1.CoreEntityTypes.Note:
            childPropertyName = 'tasks';
            childType = TaskConstants_1.TaskEntityTypes.Task;
            break;
        case TaskConstants_1.TaskEntityTypes.Task:
            childPropertyName = 'reminders';
            childType = TaskConstants_1.TaskEntityTypes.Reminder;
            break;
        default:
            throw new Error('Invalid Type');
    }
    const childrenRefs = await context.db.traverseGraph(context, nodeRef, [{ edge: ['outputs', childPropertyName], type: childType }]);
    childIDs = childrenRefs.map(ref => ref.id);
    return childIDs;
}
function getInputChildren(input) {
    let inputChildren = input.children || input.reminders;
    inputChildren = inputChildren || [];
    return inputChildren;
}
function validateNoteLevelIDUniqueness(args) {
    var _a;
    const noteLevelIDs = [];
    (_a = args.taskGroupList) === null || _a === void 0 ? void 0 : _a.forEach((taskGroup) => {
        validateAndPushNoteLevelId(noteLevelIDs, taskGroup.noteLevelID);
        taskGroup.children.forEach((task) => {
            validateAndPushNoteLevelId(noteLevelIDs, task.noteLevelID);
            task.reminders.forEach((reminder) => {
                validateAndPushNoteLevelId(noteLevelIDs, reminder.noteLevelID);
            });
        });
    });
}
function validateAndPushNoteLevelId(noteLevelIDs, noteLevelID) {
    if (noteLevelIDs.includes(noteLevelID)) {
        throw new Error(`noteLevelID ${noteLevelID} is duplicate.`);
    }
    noteLevelIDs.push(noteLevelID);
}
//# sourceMappingURL=SyncInNoteTasks.js.map