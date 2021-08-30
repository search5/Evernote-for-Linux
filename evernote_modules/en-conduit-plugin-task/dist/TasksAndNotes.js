"use strict";
/*
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
exports.tasksAndNotesPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const graphql_1 = require("graphql");
const NoteContentInfo_1 = require("./EntityTypes/NoteContentInfo");
var NotesSort;
(function (NotesSort) {
    NotesSort["label"] = "label";
    NotesSort["labelCompletedAtBottom"] = "labelCompletedAtBottom";
    NotesSort["labelDTNPinned"] = "labelDTNPinned";
    NotesSort["labelDTNPinnedCompletedAtBottom"] = "labelDTNPinnedCompletedAtBottom";
    NotesSort["created"] = "created";
    NotesSort["createdCompletedAtBottom"] = "createdCompletedAtBottom";
    NotesSort["createdDTNPinned"] = "createdDTNPinned";
    NotesSort["createdDTNPinnedCompletedAtBottom"] = "createdDTNPinnedCompletedAtBottom";
    NotesSort["updated"] = "updated";
    NotesSort["updatedCompletedAtBottom"] = "updatedCompletedAtBottom";
    NotesSort["updatedDTNPinned"] = "updatedDTNPinned";
    NotesSort["updatedDTNPinnedCompletedAtBottom"] = "updatedDTNPinnedCompletedAtBottom";
})(NotesSort || (NotesSort = {}));
var TasksSort;
(function (TasksSort) {
    TasksSort["sortWeight"] = "sortWeight";
    TasksSort["sortWeightCompletedAtBottom"] = "sortWeightCompletedAtBottom";
})(TasksSort || (TasksSort = {}));
function getNoteSort(base, showCompletedAtBottom, pinDefaultNoteToTop) {
    switch (base) {
        case 'created':
            if (showCompletedAtBottom || pinDefaultNoteToTop) {
                if (showCompletedAtBottom && pinDefaultNoteToTop) {
                    return NotesSort.createdDTNPinnedCompletedAtBottom;
                }
                else {
                    return showCompletedAtBottom ? NotesSort.createdCompletedAtBottom : NotesSort.createdDTNPinned;
                }
            }
            else {
                return NotesSort.created;
            }
        case 'label':
            if (showCompletedAtBottom || pinDefaultNoteToTop) {
                if (showCompletedAtBottom && pinDefaultNoteToTop) {
                    return NotesSort.labelDTNPinnedCompletedAtBottom;
                }
                else {
                    return showCompletedAtBottom ? NotesSort.labelCompletedAtBottom : NotesSort.labelDTNPinned;
                }
            }
            else {
                return NotesSort.label;
            }
        case 'updated':
            if (showCompletedAtBottom || pinDefaultNoteToTop) {
                if (showCompletedAtBottom && pinDefaultNoteToTop) {
                    return NotesSort.updatedDTNPinnedCompletedAtBottom;
                }
                else {
                    return showCompletedAtBottom ? NotesSort.updatedCompletedAtBottom : NotesSort.updatedDTNPinned;
                }
            }
            else {
                return NotesSort.updated;
            }
        default:
            throw conduit_utils_1.absurd(base, 'Unhandled TasksAndNotesSort option');
    }
}
function getSortsForParams(params) {
    const note = getNoteSort(params.orderBy, params.showCompletedAtBottom, params.pinDefaultNoteToTop);
    let task = TasksSort.sortWeight;
    if (params.showCompletedAtBottom) {
        task = TasksSort.sortWeightCompletedAtBottom;
    }
    return { note, task };
}
function getFiltersForNotes(params) {
    const res = {
        hasTaskGroup: true,
        inTrash: false,
    };
    if (!params.includeNotesWithAllCompleted) {
        res.hasCompletedAllTasks = false;
    }
    if (!params.includeSharedNotes) {
        res.isShared = false;
    }
    return res;
}
function getFiltersForTasks(params) {
    var _a, _b;
    // First parent filter just used to get the right index
    const res = {
        parent: 'anything',
    };
    if ((_a = params.filter) === null || _a === void 0 ? void 0 : _a.creator) {
        res.creator = params.filter.creator;
    }
    if ((_b = params.filter) === null || _b === void 0 ? void 0 : _b.dueDate) {
        res.dueDate = {
            max: {
                int: params.filter.dueDate.max,
            },
            min: {
                int: params.filter.dueDate.min,
            },
        };
    }
    if (!params.includeCompletedTasks) {
        res.status = 'open';
    }
    return res;
}
function getFiltersForParams(params) {
    const note = getFiltersForNotes(params);
    const task = getFiltersForTasks(params);
    return { note, task };
}
function unflattenEdges(task) {
    const parent = task.parent;
    const assignee = task.assignee;
    const assignedBy = task.assignedBy;
    task.parent = [{
            srcID: parent,
            srcType: 'Note',
        }];
    if (assignee) {
        task.assignee = [{
                dstID: assignee,
                dstType: 'Profile',
            }];
    }
    if (assignedBy) {
        task.assignedBy = [{
                dstID: assignedBy,
                dstType: 'Profile',
            }];
    }
}
async function getNextTasks(taskIterator, fieldStripper) {
    var e_1, _a;
    const res = {}; // taskGroupNoteLevelID : Task[]
    try {
        for (var taskIterator_1 = __asyncValues(taskIterator), taskIterator_1_1; taskIterator_1_1 = await taskIterator_1.next(), !taskIterator_1_1.done;) {
            const taskKey = taskIterator_1_1.value;
            if (taskKey) {
                const task = fieldStripper(taskKey);
                unflattenEdges(task);
                task.type = 'Task';
                const groupID = task.taskGroupNoteLevelID;
                if (res[groupID]) {
                    res[groupID].push(task);
                }
                else {
                    res[groupID] = [task];
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (taskIterator_1_1 && !taskIterator_1_1.done && (_a = taskIterator_1.return)) await _a.call(taskIterator_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return res;
}
async function fillInTasks(context, resLookup, contentInfoIDs, taskTree, taskParams) {
    const contentInfos = await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.NoteContentInfo, contentInfoIDs);
    const fieldStripper = context.indexer.indexedValuesFromKeyFactory(en_data_model_1.EntityTypes.Task, taskParams.indexUsed, false);
    for (const contentInfo of contentInfos) {
        if (contentInfo) {
            // Get a map of task groups to their tasks
            const noteID = contentInfo.id.slice(0, -16);
            const parentFilterIndex = taskParams.indexedFilters.findIndex(e => e.field === 'parent');
            taskParams.indexedFilters[parentFilterIndex].match.string = noteID;
            // TODO: Potential optimization possible here if needed,
            // Alter the iterator instance to accept new filters and iterate the leaf it already has for the next set
            // This would work because the keys have been sorted. The keys being sorted already has some perf benefit,
            // as we may be traversing to cached tree nodes in order, but it could be even faster if needed.
            const taskIterator = await context.indexer.getIterator(context.trc, context.watcher, taskTree, en_data_model_1.EntityTypes.Task, taskParams.indexUsed, taskParams.indexedFilters, taskParams.indexedSorts, false, taskParams.pageInfo);
            const tasksForGroup = await getNextTasks(taskIterator, fieldStripper);
            // Add the tasks to the result in the order of their task groups in the content info
            for (const taskGroupNoteLevelID of contentInfo.NodeFields.taskGroupNoteLevelIDs) {
                const tasks = tasksForGroup[taskGroupNoteLevelID];
                if (tasks) {
                    resLookup[noteID].push(...tasks);
                }
            }
        }
    }
}
async function getTasksAndNotes(context, noteIterator, noteIndex, taskTree, taskParams) {
    var e_2, _a;
    const res = [];
    const resLookup = {};
    const contentInfoIDs = [];
    const noteFieldStripper = context.indexer.indexedValuesFromKeyFactory(en_data_model_1.EntityTypes.Note, noteIndex, false);
    try {
        for (var noteIterator_1 = __asyncValues(noteIterator), noteIterator_1_1; noteIterator_1_1 = await noteIterator_1.next(), !noteIterator_1_1.done;) {
            const noteKey = noteIterator_1_1.value;
            if (noteKey) {
                // Build the note result
                const fields = noteFieldStripper(noteKey);
                fields.type = 'Note';
                // Note goes in lookup first, tasks to follow
                // Relying on the fact that keys are inserted in order
                // to preserve note sort when building the final result later
                resLookup[fields.id] = [fields];
                if (fields.tasksCount > 0) {
                    // These are used to traverse to a note's tasks, only do the traversal if it has tasks
                    contentInfoIDs.push(NoteContentInfo_1.getContentInfoID(fields.id));
                }
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (noteIterator_1_1 && !noteIterator_1_1.done && (_a = noteIterator_1.return)) await _a.call(noteIterator_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    // Sorted for more efficient task tree traversals
    contentInfoIDs.sort();
    await fillInTasks(context, resLookup, contentInfoIDs, taskTree, taskParams);
    // Fill the result list
    for (const noteID in resLookup) {
        const noteAndTasks = resLookup[noteID];
        res.push(...noteAndTasks);
    }
    return res;
}
async function tasksAndNotes(parent, args, context, info) {
    conduit_core_1.validateDB(context);
    const sorts = getSortsForParams(args);
    const filters = getFiltersForParams(args);
    const noteQuery = context.indexer.config[en_data_model_1.EntityTypes.Note].queries.TaskNotesNotInTrash;
    const taskQuery = context.indexer.config[en_data_model_1.EntityTypes.Task].queries.TasksInNote;
    const noteParams = conduit_storage_1.getIndexParamsForQueryArgs(noteQuery, Object.assign({ orderBy: sorts.note }, filters.note), context.indexer);
    const taskParams = conduit_storage_1.getIndexParamsForQueryArgs(taskQuery, Object.assign({ orderBy: sorts.task }, filters.task), context.indexer);
    const noteTree = await context.db.readonlyIndexingTreeForTypeAndIndex(context.trc, en_data_model_1.EntityTypes.Note, noteParams.indexUsed);
    const taskTree = await context.db.readonlyIndexingTreeForTypeAndIndex(context.trc, en_data_model_1.EntityTypes.Task, taskParams.indexUsed);
    const noteIterator = await context.indexer.getIterator(context.trc, context.watcher, noteTree, en_data_model_1.EntityTypes.Note, noteParams.indexUsed, noteParams.indexedFilters, noteParams.indexedSorts, false, noteParams.pageInfo);
    const list = await getTasksAndNotes(context, noteIterator, noteParams.indexUsed, taskTree, taskParams);
    return {
        count: list.length,
        list,
    };
}
const tasksAndNotesPlugin = (autoResolverData) => {
    return {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
            name: 'TasksAndNotes',
            fields: {
                count: { type: graphql_1.GraphQLInt },
                list: {
                    type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(conduit_core_1.getEntityUnionType(autoResolverData, [en_data_model_1.EntityTypes.Note, en_data_model_1.EntityTypes.Task]))),
                },
            },
        })),
        resolve: tasksAndNotes,
        args: conduit_core_1.schemaToGraphQLArgs({
            includeNotesWithAllCompleted: 'boolean',
            includeCompletedTasks: 'boolean',
            includeSharedNotes: 'boolean',
            pinDefaultNoteToTop: conduit_utils_1.NullableBoolean,
            showCompletedAtBottom: conduit_utils_1.NullableBoolean,
            filter: conduit_utils_1.NullableStruct({
                creator: conduit_utils_1.NullableID,
                dueDate: conduit_utils_1.NullableStruct({
                    max: 'timestamp',
                    min: 'timestamp',
                }),
            }),
            orderBy: conduit_utils_1.Enum(['label', 'updated', 'created'], 'TaskNotesSort'),
            pageInfo: conduit_utils_1.Nullable(conduit_core_1.PageInfoSchema),
        }),
    };
};
exports.tasksAndNotesPlugin = tasksAndNotesPlugin;
//# sourceMappingURL=TasksAndNotes.js.map