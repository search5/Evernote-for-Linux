"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inNoteTaskApplyChanges = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
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
const ReminderInput = new graphql_1.GraphQLInputObjectType({
    name: 'ReminderInput',
    fields: {
        noteLevelID: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        reminderDate: { type: graphql_1.GraphQLFloat },
        reminderDateUIOption: { type: graphql_1.GraphQLString },
        timeZone: { type: graphql_1.GraphQLString },
        dueDateOffset: { type: graphql_1.GraphQLFloat },
    },
});
const TaskInput = new graphql_1.GraphQLInputObjectType({
    name: 'TaskInput',
    fields: {
        noteLevelID: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        status: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        label: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        localChangeTimestamp: { type: graphql_1.GraphQLFloat },
        dueDate: { type: graphql_1.GraphQLFloat },
        dueDateUIOption: { type: graphql_1.GraphQLString },
        timeZone: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        flag: { type: graphql_1.GraphQLBoolean },
        sortWeight: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        reminders: { type: new graphql_1.GraphQLList(ReminderInput) },
    },
});
const TaskGroupInput = new graphql_1.GraphQLInputObjectType({
    name: 'TaskGroupInput',
    fields: {
        noteLevelID: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        sortWeight: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        children: { type: new graphql_1.GraphQLList(TaskInput) },
    },
});
exports.inNoteTaskApplyChanges = {
    args: {
        noteID: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        taskGroupList: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(TaskGroupInput)) },
        loadedTaskGroupList: { type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(TaskGroupInput)) },
        sourceOfChange: { type: graphql_1.GraphQLString },
    },
    type: conduit_core_1.GenericMutationResult,
    resolve: resolver,
};
//# sourceMappingURL=index.js.map