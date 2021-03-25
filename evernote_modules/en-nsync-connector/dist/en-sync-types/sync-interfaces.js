"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOperation = exports.ErrorType = exports.ConnectionType = exports.AssociationType = exports.Sharing = exports.ContentAccess = exports.Role = exports.MembershipType = exports.EntityType = exports.AgentType = exports.EnType = void 0;
/** EnType enum. */
var EnType;
(function (EnType) {
    EnType[EnType["AGENT"] = 0] = "AGENT";
    EnType[EnType["ENTITY"] = 1] = "ENTITY";
    EnType[EnType["MEMBERSHIP"] = 2] = "MEMBERSHIP";
    EnType[EnType["ASSOCIATION"] = 3] = "ASSOCIATION";
    EnType[EnType["CONNECTION"] = 4] = "CONNECTION";
})(EnType = exports.EnType || (exports.EnType = {}));
/** AgentType enum. */
var AgentType;
(function (AgentType) {
    AgentType[AgentType["PUBLIC"] = 0] = "PUBLIC";
    AgentType[AgentType["IDENTITY"] = 1] = "IDENTITY";
    AgentType[AgentType["USER"] = 2] = "USER";
    AgentType[AgentType["BUSINESS"] = 3] = "BUSINESS";
})(AgentType = exports.AgentType || (exports.AgentType = {}));
/** EntityType enum. */
var EntityType;
(function (EntityType) {
    EntityType[EntityType["NOTE"] = 0] = "NOTE";
    EntityType[EntityType["NOTEBOOK"] = 1] = "NOTEBOOK";
    EntityType[EntityType["WORKSPACE"] = 2] = "WORKSPACE";
    EntityType[EntityType["ATTACHMENT"] = 3] = "ATTACHMENT";
    EntityType[EntityType["TAG"] = 4] = "TAG";
    EntityType[EntityType["SAVED_SEARCH"] = 5] = "SAVED_SEARCH";
    EntityType[EntityType["SHORTCUT"] = 6] = "SHORTCUT";
    EntityType[EntityType["RECIPIENT_SETTINGS"] = 7] = "RECIPIENT_SETTINGS";
    EntityType[EntityType["NOTE_TAGS"] = 8] = "NOTE_TAGS";
    EntityType[EntityType["NOTE_ATTACHMENTS"] = 9] = "NOTE_ATTACHMENTS";
    EntityType[EntityType["ACCESS_INFO"] = 10] = "ACCESS_INFO";
    EntityType[EntityType["MUTATION_TRACKER"] = 11] = "MUTATION_TRACKER";
    EntityType[EntityType["BOARD"] = 12] = "BOARD";
    EntityType[EntityType["WIDGET"] = 13] = "WIDGET";
    EntityType[EntityType["NOTE_CONTENT_INFO"] = 14] = "NOTE_CONTENT_INFO";
    EntityType[EntityType["TASK"] = 15] = "TASK";
    EntityType[EntityType["REMINDER"] = 16] = "REMINDER";
    EntityType[EntityType["TASK_USER_SETTINGS"] = 17] = "TASK_USER_SETTINGS";
    EntityType[EntityType["WIDGET_CONTENT_CONFLICT"] = 18] = "WIDGET_CONTENT_CONFLICT";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
/** MembershipType enum. */
var MembershipType;
(function (MembershipType) {
    MembershipType[MembershipType["INVITATION"] = 0] = "INVITATION";
    MembershipType[MembershipType["SHARE"] = 1] = "SHARE";
})(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
/** Role enum. */
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
})(Role = exports.Role || (exports.Role = {}));
/** ContentAccess enum. */
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
/** Sharing enum. */
var Sharing;
(function (Sharing) {
    Sharing[Sharing["NO_SHARING"] = 0] = "NO_SHARING";
    Sharing[Sharing["WITHIN_BUSINESS"] = 1] = "WITHIN_BUSINESS";
    Sharing[Sharing["WITHIN_EVERNOTE"] = 2] = "WITHIN_EVERNOTE";
    Sharing[Sharing["ALL_SHARING"] = 255] = "ALL_SHARING";
})(Sharing = exports.Sharing || (exports.Sharing = {}));
/** AssociationType enum. */
var AssociationType;
(function (AssociationType) {
    AssociationType[AssociationType["ANCESTRY"] = 0] = "ANCESTRY";
    AssociationType[AssociationType["LINK"] = 1] = "LINK";
})(AssociationType = exports.AssociationType || (exports.AssociationType = {}));
/** ConnectionType enum. */
var ConnectionType;
(function (ConnectionType) {
    ConnectionType[ConnectionType["CONSTITUENT"] = 0] = "CONSTITUENT";
    ConnectionType[ConnectionType["AUTHORITY"] = 1] = "AUTHORITY";
    ConnectionType[ConnectionType["CHAT"] = 2] = "CHAT";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
/** ErrorType enum. */
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["UNKNOWN"] = 0] = "UNKNOWN";
    ErrorType[ErrorType["INVALID_INPUT"] = 1] = "INVALID_INPUT";
    ErrorType[ErrorType["UNAUTHORIZED"] = 2] = "UNAUTHORIZED";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
/** SyncOperation enum. */
var SyncOperation;
(function (SyncOperation) {
    SyncOperation[SyncOperation["ACCESS_FANOUT"] = 0] = "ACCESS_FANOUT";
    SyncOperation[SyncOperation["CREATE"] = 1] = "CREATE";
    SyncOperation[SyncOperation["UPDATE"] = 2] = "UPDATE";
    SyncOperation[SyncOperation["DELETE"] = 3] = "DELETE";
    SyncOperation[SyncOperation["EXPUNGE"] = 4] = "EXPUNGE";
    SyncOperation[SyncOperation["MIGRATE"] = 5] = "MIGRATE";
    SyncOperation[SyncOperation["WITH_ENTITY_CREATE"] = 6] = "WITH_ENTITY_CREATE";
})(SyncOperation = exports.SyncOperation || (exports.SyncOperation = {}));
//# sourceMappingURL=sync-interfaces.js.map