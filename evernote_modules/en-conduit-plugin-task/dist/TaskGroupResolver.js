"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGroupResolver = exports.NoteContentInfoTaskGroupsResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const graphql_1 = require("graphql");
const NoteContentInfo_1 = require("./Mutators/Helpers/NoteContentInfo");
const TaskConstants_1 = require("./TaskConstants");
function NoteContentInfoTaskGroupsResolver(autoResolverData) {
    return {
        type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableListOf('string')),
        resolve: async (node) => node.taskGroupNoteLevelIDs,
        deprecationReason: 'Use taskGroupNoteLevelIDs',
    };
}
exports.NoteContentInfoTaskGroupsResolver = NoteContentInfoTaskGroupsResolver;
function TaskGroupResolver(autoResolverData) {
    return {
        type: new graphql_1.GraphQLList(new graphql_1.GraphQLObjectType({
            name: 'TaskGroupResult',
            fields: {
                noteLevelID: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                sortWeight: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                sourceOfChange: { type: graphql_1.GraphQLString },
                tasks: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(autoResolverData.NodeGraphQLTypes.Task)), resolve: resolveTasksForTaskGroup },
            },
        })),
        resolve: async (nodeRef, _, context) => {
            return await getNoteTaskGroups(nodeRef.id, context);
        },
    };
}
exports.TaskGroupResolver = TaskGroupResolver;
async function getNoteTaskGroups(noteID, context) {
    conduit_core_1.validateDB(context, 'Must be authenticated to work with tasks');
    const note = await context.db.getNode(context, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
    if (!note) {
        throw new conduit_utils_1.NotFoundError(noteID, 'Missing note in getNoteTaskGroups');
    }
    let taskGroupOutputs = null;
    const noteContentInfoID = NoteContentInfo_1.getNoteContentInfoIDByNoteID(noteID);
    const noteContentInfoRef = { id: noteContentInfoID, type: TaskConstants_1.TaskEntityTypes.NoteContentInfo };
    const noteContentInfo = await context.db.getNode(context, noteContentInfoRef);
    if (noteContentInfo === null || noteContentInfo === void 0 ? void 0 : noteContentInfo.NodeFields.taskGroupNoteLevelIDs) {
        // we sort based on this int, assuming we won't have more than 1000000 taskGroupNoteLevelIDs in a note we should be good
        let fakeSortWeightCounter = 1000000;
        taskGroupOutputs = noteContentInfo.NodeFields.taskGroupNoteLevelIDs.map(taskGroup => {
            fakeSortWeightCounter++;
            return {
                noteLevelID: taskGroup,
                sortWeight: fakeSortWeightCounter.toString(),
                sourceOfChange: noteContentInfo.NodeFields.sourceOfChange || undefined,
            };
        });
    }
    if (taskGroupOutputs && note.outputs.tasks) {
        const taskIDs = Object.values(note.outputs.tasks).map(edge => edge.dstID);
        const tasks = await context.db.batchGetNodes(context, TaskConstants_1.TaskEntityTypes.Task, taskIDs);
        taskGroupOutputs.forEach(taskGroup => {
            taskGroup.tasks = tasks.filter((task) => task.NodeFields.taskGroupNoteLevelID === taskGroup.noteLevelID).map((task) => {
                return task.id;
            });
        });
    }
    return taskGroupOutputs;
}
async function resolveTasksForTaskGroup(nodeRef, _, context, info) {
    if (nodeRef && nodeRef.tasks) {
        return await conduit_utils_1.allSettled(nodeRef.tasks.map(async (taskID) => {
            return await conduit_core_1.resolveNode({ type: TaskConstants_1.TaskEntityTypes.Task, id: taskID }, context, info);
        }));
    }
}
//# sourceMappingURL=TaskGroupResolver.js.map