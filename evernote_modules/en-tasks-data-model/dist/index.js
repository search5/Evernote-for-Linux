"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksEntitySchemas = void 0;
const en_data_model_1 = require("en-data-model");
const NoteContentInfoEntity_1 = require("./NoteContentInfoEntity");
const ReminderEntity_1 = require("./ReminderEntity");
const TaskEntity_1 = require("./TaskEntity");
const TaskUserSettingsEntity_1 = require("./TaskUserSettingsEntity");
__exportStar(require("./NoteContentInfoEntity"), exports);
__exportStar(require("./ReminderEntity"), exports);
__exportStar(require("./TaskEntity"), exports);
__exportStar(require("./TaskTypes"), exports);
__exportStar(require("./TaskUserSettingsEntity"), exports);
exports.TasksEntitySchemas = {
    [en_data_model_1.EntityTypes.NoteContentInfo]: NoteContentInfoEntity_1.NoteContentInfoEntitySchema,
    [en_data_model_1.EntityTypes.Reminder]: ReminderEntity_1.ReminderEntitySchema,
    [en_data_model_1.EntityTypes.Task]: TaskEntity_1.TaskEntitySchema,
    [en_data_model_1.EntityTypes.TaskUserSettings]: TaskUserSettingsEntity_1.TaskUserSettingsEntitySchema,
};
//# sourceMappingURL=index.js.map