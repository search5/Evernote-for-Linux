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
exports.CoreEntitySchemas = void 0;
const en_data_model_1 = require("en-data-model");
const AttachmentEntity_1 = require("./AttachmentEntity");
const NotebookEntity_1 = require("./NotebookEntity");
const NoteEntity_1 = require("./NoteEntity");
const SavedSearchEntity_1 = require("./SavedSearchEntity");
const ShortcutEntity_1 = require("./ShortcutEntity");
const TagEntity_1 = require("./TagEntity");
const WorkspaceEntity_1 = require("./WorkspaceEntity");
__exportStar(require("./AttachmentEntity"), exports);
__exportStar(require("./NoteEntity"), exports);
__exportStar(require("./NotebookEntity"), exports);
__exportStar(require("./SavedSearchEntity"), exports);
__exportStar(require("./ShortcutEntity"), exports);
__exportStar(require("./TagEntity"), exports);
__exportStar(require("./WorkspaceEntity"), exports);
exports.CoreEntitySchemas = {
    [en_data_model_1.EntityTypes.Attachment]: AttachmentEntity_1.AttachmentEntitySchema,
    [en_data_model_1.EntityTypes.Note]: NoteEntity_1.NoteEntitySchema,
    [en_data_model_1.EntityTypes.Notebook]: NotebookEntity_1.NotebookEntitySchema,
    [en_data_model_1.EntityTypes.SavedSearch]: SavedSearchEntity_1.SavedSearchEntitySchema,
    [en_data_model_1.EntityTypes.Shortcut]: ShortcutEntity_1.ShortcutEntitySchema,
    [en_data_model_1.EntityTypes.Tag]: TagEntity_1.TagEntitySchema,
    [en_data_model_1.EntityTypes.Workspace]: WorkspaceEntity_1.WorkspaceEntitySchema,
};
//# sourceMappingURL=index.js.map