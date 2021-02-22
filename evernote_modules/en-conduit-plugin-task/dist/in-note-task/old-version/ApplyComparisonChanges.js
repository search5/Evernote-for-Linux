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
exports.applyReminderComparisonChanges = exports.applyTaskComparisonChanges = void 0;
const TaskConstants_1 = require("../../TaskConstants");
const Types_1 = require("./Types");
async function applyTaskComparisonChanges(context, comparisonResult, sourceOfChange) {
    var e_1, _a;
    try {
        for (var comparisonResult_1 = __asyncValues(comparisonResult), comparisonResult_1_1; comparisonResult_1_1 = await comparisonResult_1.next(), !comparisonResult_1_1.done;) {
            const result = comparisonResult_1_1.value;
            switch (result.status) {
                case Types_1.ComparisonStatus.deleted: {
                    await context.db.runMutator(context.trc, 'taskDelete', { task: result.originalNode.id });
                    break;
                }
                case Types_1.ComparisonStatus.added: {
                    const { label, dueDate, timeZone, dueDateUIOption, flag, sortWeight, noteLevelID, status, taskGroupNoteLevelID, } = result.inputNode;
                    const mutation = await context.db.runMutator(context.trc, 'taskCreate', {
                        container: result.parent.id,
                        taskGroupNoteLevelID,
                        label,
                        dueDate,
                        timeZone,
                        dueDateUIOption,
                        flag,
                        sortWeight,
                        noteLevelID,
                        status,
                        sourceOfChange,
                    });
                    const newTask = await context.db.getNode(context, { id: mutation.result.toString(), type: TaskConstants_1.TaskEntityTypes.Task });
                    result.originalNode = newTask;
                    break;
                }
                case Types_1.ComparisonStatus.modified: {
                    const { label, dueDate, timeZone, dueDateUIOption, flag, sortWeight, status, } = result.inputNode;
                    await context.db.runMutator(context.trc, 'taskUpdate', {
                        task: result.originalNode.id,
                        label,
                        dueDate,
                        timeZone,
                        dueDateUIOption,
                        flag,
                        sortWeight,
                        status,
                        sourceOfChange,
                        taskGroupNoteLevelID: result.inputNode.taskGroupNoteLevelID,
                    });
                }
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
}
exports.applyTaskComparisonChanges = applyTaskComparisonChanges;
async function applyReminderComparisonChanges(context, comparisonResult, sourceOfChange) {
    var e_2, _a;
    try {
        for (var comparisonResult_2 = __asyncValues(comparisonResult), comparisonResult_2_1; comparisonResult_2_1 = await comparisonResult_2.next(), !comparisonResult_2_1.done;) {
            const result = comparisonResult_2_1.value;
            switch (result.status) {
                case Types_1.ComparisonStatus.deleted: {
                    await context.db.runMutator(context.trc, 'reminderDelete', { reminder: result.originalNode.id });
                    break;
                }
                case Types_1.ComparisonStatus.added: {
                    const { reminderDate, reminderDateUIOption, timeZone, dueDateOffset, noteLevelID, } = result.inputNode;
                    await context.db.runMutator(context.trc, 'reminderCreate', {
                        source: result.parent.id,
                        reminderDate,
                        reminderDateUIOption,
                        timeZone,
                        dueDateOffset,
                        noteLevelID,
                        sourceOfChange,
                    });
                    break;
                }
                case Types_1.ComparisonStatus.modified: {
                    const { reminderDate, reminderDateUIOption, timeZone, dueDateOffset, } = result.inputNode;
                    await context.db.runMutator(context.trc, 'reminderUpdate', {
                        reminder: result.originalNode.id,
                        reminderDate,
                        reminderDateUIOption,
                        timeZone,
                        dueDateOffset,
                        sourceOfChange,
                    });
                }
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (comparisonResult_2_1 && !comparisonResult_2_1.done && (_a = comparisonResult_2.return)) await _a.call(comparisonResult_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
exports.applyReminderComparisonChanges = applyReminderComparisonChanges;
//# sourceMappingURL=ApplyComparisonChanges.js.map