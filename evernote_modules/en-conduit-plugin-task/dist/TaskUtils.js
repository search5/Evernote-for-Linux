"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndValidateTasksExportData = exports.getTasksExportData = exports.getTaskUserSettingsIdByUserId = exports.getTaskUserSettingsByMutationContext = exports.TasksExportDataSchema = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
const NoteContentInfo_1 = require("./Mutators/Helpers/NoteContentInfo");
const TaskCreateDataSchema = {
    label: 'string',
    dueDate: conduit_utils_1.NullableNumber,
    timeZone: conduit_utils_1.NullableString,
    dueDateUIOption: conduit_utils_1.Nullable(en_tasks_data_model_1.DueDateUIOptionSchema),
    flag: conduit_utils_1.NullableBoolean,
    sortWeight: conduit_utils_1.NullableString,
    noteLevelID: conduit_utils_1.NullableString,
    status: conduit_utils_1.NullableString,
    sourceOfChange: 'string',
};
exports.TasksExportDataSchema = conduit_utils_1.Struct({
    tasks: conduit_utils_1.ListOfStructs({
        label: 'string',
        taskGroupNoteLevelID: 'string',
        dueDate: conduit_utils_1.NullableNumber,
        timeZone: conduit_utils_1.NullableString,
        dueDateUIOption: conduit_utils_1.NullableString,
        flag: conduit_utils_1.NullableBoolean,
        sortWeight: conduit_utils_1.NullableString,
        noteLevelID: conduit_utils_1.NullableString,
        status: conduit_utils_1.NullableString,
        sourceOfChange: 'string',
    }),
    taskGroupNoteLevelIDs: conduit_utils_1.ListOf('string'),
}, 'TasksExportData');
function getTaskUserSettingsByMutationContext(ctx) {
    return getTaskUserSettingsIdByUserId(ctx.userID);
}
exports.getTaskUserSettingsByMutationContext = getTaskUserSettingsByMutationContext;
function getTaskUserSettingsIdByUserId(userID) {
    return en_data_model_1.DefaultDeterministicIdGenerator.createId({
        entityType: en_data_model_1.EntityTypes.TaskUserSettings,
        userID,
    });
}
exports.getTaskUserSettingsIdByUserId = getTaskUserSettingsIdByUserId;
async function getTasksExportData(context, note) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    conduit_core_1.validateDB(context);
    const tasks = [];
    let taskGroupNoteLevelIDs = [];
    const noteContentInfoID = NoteContentInfo_1.getNoteContentInfoIDByNoteID(note.id);
    const info = await context.db.getNode(context, { id: noteContentInfoID, type: en_data_model_1.EntityTypes.NoteContentInfo });
    if (info) {
        taskGroupNoteLevelIDs = info.NodeFields.taskGroupNoteLevelIDs || [];
        const taskIDs = Object.values(note.outputs.tasks).map(edge => edge.dstID);
        const taskNodes = await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.Task, taskIDs);
        for (const task of taskNodes) {
            if (!task) {
                continue;
            }
            const taskParams = {
                label: (_a = task.label) !== null && _a !== void 0 ? _a : '',
                taskGroupNoteLevelID: task.NodeFields.taskGroupNoteLevelID,
                dueDate: (_b = task.NodeFields.dueDate) !== null && _b !== void 0 ? _b : undefined,
                dueDateUIOption: (_c = task.NodeFields.dueDateUIOption) !== null && _c !== void 0 ? _c : undefined,
                flag: (_d = task.NodeFields.flag) !== null && _d !== void 0 ? _d : undefined,
                noteLevelID: (_e = task.NodeFields.noteLevelID) !== null && _e !== void 0 ? _e : undefined,
                sortWeight: (_f = task.NodeFields.sortWeight) !== null && _f !== void 0 ? _f : undefined,
                sourceOfChange: (_g = task.NodeFields.sourceOfChange) !== null && _g !== void 0 ? _g : '',
                status: (_h = task.NodeFields.status) !== null && _h !== void 0 ? _h : undefined,
                timeZone: (_j = task.NodeFields.timeZone) !== null && _j !== void 0 ? _j : undefined,
            };
            tasks.push(taskParams);
        }
    }
    return {
        taskGroupNoteLevelIDs,
        tasks,
    };
}
exports.getTasksExportData = getTasksExportData;
function parseAndValidateTasksExportData(jsonStr) {
    if (!jsonStr) {
        return null;
    }
    const res = conduit_utils_1.safeParse(jsonStr);
    if (!res) {
        return null;
    }
    const taskGroups = new Set();
    for (const id of res.taskGroupNoteLevelIDs) {
        taskGroups.add(id);
    }
    for (const task of res.tasks) {
        for (const key in TaskCreateDataSchema) {
            conduit_utils_1.validateSchemaType(TaskCreateDataSchema[key], key, task[key]);
        }
        if (!taskGroups.has(task.taskGroupNoteLevelID)) {
            throw new Error('A Task\'s taskGroup is not in the list of taskGroups IDs');
        }
    }
    return res;
}
exports.parseAndValidateTasksExportData = parseAndValidateTasksExportData;
//# sourceMappingURL=TaskUtils.js.map