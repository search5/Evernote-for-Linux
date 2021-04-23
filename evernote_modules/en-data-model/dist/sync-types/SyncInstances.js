"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sharing = exports.ContentAccess = exports.Role = exports.SyncInstanceType = void 0;
var SyncInstanceType;
(function (SyncInstanceType) {
    SyncInstanceType[SyncInstanceType["AGENT"] = 0] = "AGENT";
    SyncInstanceType[SyncInstanceType["ENTITY"] = 1] = "ENTITY";
    SyncInstanceType[SyncInstanceType["MEMBERSHIP"] = 2] = "MEMBERSHIP";
    SyncInstanceType[SyncInstanceType["ASSOCIATION"] = 3] = "ASSOCIATION";
    SyncInstanceType[SyncInstanceType["CONNECTION"] = 4] = "CONNECTION";
})(SyncInstanceType = exports.SyncInstanceType || (exports.SyncInstanceType = {}));
var Role;
(function (Role) {
    Role[Role["NULL"] = 0] = "NULL";
    Role[Role["VIEWER"] = 1] = "VIEWER";
    Role[Role["COMMENTER"] = 2] = "COMMENTER";
    Role[Role["EDITOR"] = 3] = "EDITOR";
    Role[Role["EDITOR_SHARER"] = 4] = "EDITOR_SHARER";
    Role[Role["ADMIN"] = 5] = "ADMIN";
    Role[Role["OWNER"] = 6] = "OWNER";
    Role[Role["ACTIVITY_VIEWER"] = 7] = "ACTIVITY_VIEWER";
    Role[Role["COMPLETER"] = 8] = "COMPLETER";
})(Role = exports.Role || (exports.Role = {}));
var ContentAccess;
(function (ContentAccess) {
    ContentAccess[ContentAccess["NO_ACCESS"] = 0] = "NO_ACCESS";
    ContentAccess[ContentAccess["VIEW"] = 1] = "VIEW";
    ContentAccess[ContentAccess["VIEW_ACTIVITY"] = 2] = "VIEW_ACTIVITY";
    ContentAccess[ContentAccess["COMMENT"] = 4] = "COMMENT";
    ContentAccess[ContentAccess["EDIT"] = 8] = "EDIT";
    ContentAccess[ContentAccess["EXPUNGE"] = 16] = "EXPUNGE";
    ContentAccess[ContentAccess["ALL_ACCESS"] = 16777215] = "ALL_ACCESS";
})(ContentAccess = exports.ContentAccess || (exports.ContentAccess = {}));
var Sharing;
(function (Sharing) {
    Sharing[Sharing["NO_SHARING"] = 0] = "NO_SHARING";
    Sharing[Sharing["WITHIN_BUSINESS"] = 1] = "WITHIN_BUSINESS";
    Sharing[Sharing["WITHIN_EVERNOTE"] = 2] = "WITHIN_EVERNOTE";
    Sharing[Sharing["ALL_SHARING"] = 255] = "ALL_SHARING";
})(Sharing = exports.Sharing || (exports.Sharing = {}));
//# sourceMappingURL=SyncInstances.js.map