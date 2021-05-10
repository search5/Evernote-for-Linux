"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENTaskPlugin = exports.genScheduledNotificationId = exports.TasksExportDataSchema = exports.parseAndValidateTasksExportData = exports.getTaskUserSettingsIdByUserId = exports.getTasksExportData = exports.genTasksDataCreateOps = exports.getNoteContentInfoIDByNoteID = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const NoteContentInfoConverter_1 = require("./Converters/NoteContentInfoConverter");
const ReminderConverter_1 = require("./Converters/ReminderConverter");
const TaskConverter_1 = require("./Converters/TaskConverter");
const TaskUserSettingsConverter_1 = require("./Converters/TaskUserSettingsConverter");
const NoteContentInfoDataResolver_1 = require("./DataResolvers/NoteContentInfoDataResolver");
const NoteContentInfo_1 = require("./EntityTypes/NoteContentInfo");
const Reminder_1 = require("./EntityTypes/Reminder");
const Task_1 = require("./EntityTypes/Task");
const TaskUserSettings_1 = require("./EntityTypes/TaskUserSettings");
const GetTaskUserSettingsQuery_1 = require("./GetTaskUserSettingsQuery");
const NoteContentInfoMutators = __importStar(require("./Mutators/NoteContentInfoMutators"));
const ReminderMutators = __importStar(require("./Mutators/ReminderMutators"));
const TaskMutators = __importStar(require("./Mutators/TaskMutators"));
const TaskUserSettingsMutators = __importStar(require("./Mutators/TaskUserSettingsMutators"));
const DefaultTaskNote_1 = require("./PluginMutators/DefaultTaskNote");
const index_1 = require("./PluginMutators/in-note-task/index");
const ReminderStatusContainmentRules_1 = require("./Rules/ReminderStatusContainmentRules");
const ScheduledNotificationRules_1 = require("./Rules/ScheduledNotificationRules");
const TaskDeleteContainmentRules_1 = require("./Rules/TaskDeleteContainmentRules");
const TaskGroupResolver_1 = require("./TaskGroupResolver");
var NoteContentInfo_2 = require("./Mutators/Helpers/NoteContentInfo");
Object.defineProperty(exports, "getNoteContentInfoIDByNoteID", { enumerable: true, get: function () { return NoteContentInfo_2.getNoteContentInfoIDByNoteID; } });
var NoteContentInfo_3 = require("./Mutators/Helpers/NoteContentInfo");
Object.defineProperty(exports, "genTasksDataCreateOps", { enumerable: true, get: function () { return NoteContentInfo_3.genTasksDataCreateOps; } });
var TaskUtils_1 = require("./TaskUtils");
Object.defineProperty(exports, "getTasksExportData", { enumerable: true, get: function () { return TaskUtils_1.getTasksExportData; } });
Object.defineProperty(exports, "getTaskUserSettingsIdByUserId", { enumerable: true, get: function () { return TaskUtils_1.getTaskUserSettingsIdByUserId; } });
Object.defineProperty(exports, "parseAndValidateTasksExportData", { enumerable: true, get: function () { return TaskUtils_1.parseAndValidateTasksExportData; } });
Object.defineProperty(exports, "TasksExportDataSchema", { enumerable: true, get: function () { return TaskUtils_1.TasksExportDataSchema; } });
var ScheduledNotificationUtils_1 = require("./ScheduledNotifications/ScheduledNotificationUtils");
Object.defineProperty(exports, "genScheduledNotificationId", { enumerable: true, get: function () { return ScheduledNotificationUtils_1.genScheduledNotificationId; } });
function getENTaskPlugin() {
    return {
        name: 'ENTask',
        defineMutators: () => {
            const mutators = {
                taskGroupCreateDefaultTaskNoteUpsert: DefaultTaskNote_1.taskGroupCreateDefaultTaskNoteUpsert,
                inNoteTaskApplyChanges: index_1.inNoteTaskApplyChanges,
            };
            return mutators;
        },
        defineQueries: () => {
            const queries = {
                getTaskUserSettings: {
                    args: {},
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableStruct({
                        id: 'ID',
                        type: 'string',
                        defaultTaskNoteId: conduit_utils_1.NullableID,
                        defaultTaskNoteLabel: conduit_utils_1.NullableString,
                        isDefaultTaskNoteInTrash: conduit_utils_1.NullableBoolean,
                        defaultReminder: conduit_utils_1.NullableBoolean,
                        defaultRemindersOffsets: conduit_utils_1.NullableListOf('number'),
                        pinDefaultTaskNote: conduit_utils_1.NullableBoolean,
                    }, 'getTaskUserSettingsResult')),
                    resolve: GetTaskUserSettingsQuery_1.getTaskUserSettings,
                    description: 'Getting the TaskUserSetting for the current user.',
                },
                ['Note.taskGroups']: TaskGroupResolver_1.TaskGroupResolver,
                ['NoteContentInfo.taskGroups']: TaskGroupResolver_1.NoteContentInfoTaskGroupsResolver,
            };
            return queries;
        },
        entityTypes: () => {
            const entityTypes = {
                [en_data_model_1.EntityTypes.NoteContentInfo]: {
                    typeDef: NoteContentInfo_1.noteContentInfoTypeDef,
                    indexConfig: NoteContentInfo_1.noteContentInfoIndexConfig,
                    dataResolver: NoteContentInfoDataResolver_1.NoteContentInfoDataResolver,
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.NOTE_CONTENT_INFO]: NoteContentInfoConverter_1.getNoteContentInfoNodeAndEdges },
                },
                [en_data_model_1.EntityTypes.Reminder]: {
                    typeDef: Reminder_1.reminderTypeDef,
                    indexConfig: Reminder_1.reminderIndexConfig,
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.REMINDER]: ReminderConverter_1.getReminderNodeAndEdges },
                },
                [en_data_model_1.EntityTypes.Task]: {
                    typeDef: Task_1.taskTypeDef,
                    indexConfig: Task_1.taskIndexConfig,
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.TASK]: TaskConverter_1.getTaskNodeAndEdges },
                },
                [en_data_model_1.EntityTypes.TaskUserSettings]: {
                    typeDef: TaskUserSettings_1.taskUserSettingsDef,
                    indexConfig: TaskUserSettings_1.taskUserSettingsIndexConfig,
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.TASK_USER_SETTINGS]: TaskUserSettingsConverter_1.getTaskUserSettingsNodeAndEdges },
                },
            };
            return entityTypes;
        },
        mutatorDefs: () => {
            return Object.assign(Object.assign(Object.assign(Object.assign({}, NoteContentInfoMutators), ReminderMutators), TaskMutators), TaskUserSettingsMutators);
        },
        mutationRules: () => {
            return [
                ...ReminderStatusContainmentRules_1.ReminderStatusContainmentRules,
                ...ScheduledNotificationRules_1.ScheduledNotificationRules,
                ...TaskDeleteContainmentRules_1.TaskDeleteContainmentRules,
            ];
        },
    };
}
exports.getENTaskPlugin = getENTaskPlugin;
//# sourceMappingURL=index.js.map