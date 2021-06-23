"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inNoteTaskApplyChanges = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const SyncInNoteTasks_1 = require("./SyncInNoteTasks");
async function resolver(parent, args, context) {
    if (!args) {
        throw new conduit_utils_1.MissingParameterError('Missing args for inNoteTaskApplyChanges');
    }
    // let's check if noteID is not an empty string
    if (!args.noteID) {
        throw new conduit_utils_1.MissingParameterError('Missing noteID from args in inNoteTaskApplyChanges');
    }
    if (!args.sourceOfChange) {
        conduit_utils_1.logger.warn('sourceOfChange needs to be passed on inNoteTaskApplyChanges');
    }
    if (!context) {
        conduit_utils_1.logger.warn('context needs to be passed on inNoteTaskApplyChanges');
    }
    await SyncInNoteTasks_1.syncInNoteTasks({
        noteID: args.noteID,
        taskGroupList: args.taskGroupList,
        loadedTaskGroupList: args.loadedTaskGroupList,
        sourceOfChange: args.sourceOfChange,
    }, context);
    return {
        success: true,
    };
}
const ReminderInputSchema = conduit_utils_1.Struct({
    noteLevelID: 'string',
    reminderDate: conduit_utils_1.NullableTimestamp,
    reminderDateUIOption: conduit_utils_1.NullableString,
    timeZone: conduit_utils_1.NullableString,
    dueDateOffset: conduit_utils_1.NullableTimestamp,
}, 'ReminderInput');
const TaskInputSchema = conduit_utils_1.Struct({
    noteLevelID: 'string',
    status: 'string',
    label: 'string',
    localChangeTimestamp: conduit_utils_1.NullableTimestamp,
    dueDate: conduit_utils_1.NullableTimestamp,
    dueDateUIOption: conduit_utils_1.NullableString,
    timeZone: conduit_utils_1.NullableString,
    flag: 'boolean',
    sortWeight: 'string',
    inNote: conduit_utils_1.NullableBoolean,
    reminders: conduit_utils_1.ListOf(ReminderInputSchema),
    assigneeID: conduit_utils_1.NullableString,
    assigneeEmail: conduit_utils_1.NullableString,
    creationEventLabel: conduit_utils_1.NullableString,
}, 'TaskInput');
const TaskGroupInputSchema = conduit_utils_1.Struct({
    noteLevelID: 'string',
    sortWeight: 'string',
    children: conduit_utils_1.ListOf(TaskInputSchema),
}, 'TaskGroupInput');
exports.inNoteTaskApplyChanges = {
    args: conduit_core_1.schemaToGraphQLArgs({
        noteID: 'ID',
        taskGroupList: conduit_utils_1.ListOf(TaskGroupInputSchema),
        loadedTaskGroupList: conduit_utils_1.ListOf(TaskGroupInputSchema),
        sourceOfChange: conduit_utils_1.NullableString,
    }),
    type: conduit_core_1.GenericMutationResult,
    resolve: resolver,
};
//# sourceMappingURL=index.js.map