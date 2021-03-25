"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipType = exports.EntityType = exports.ConnectionType = exports.AssociationType = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType[AgentType["PUBLIC"] = 0] = "PUBLIC";
    AgentType[AgentType["IDENTITY"] = 1] = "IDENTITY";
    AgentType[AgentType["USER"] = 2] = "USER";
    AgentType[AgentType["BUSINESS"] = 3] = "BUSINESS";
})(AgentType = exports.AgentType || (exports.AgentType = {}));
var AssociationType;
(function (AssociationType) {
    AssociationType[AssociationType["ANCESTRY"] = 0] = "ANCESTRY";
    AssociationType[AssociationType["LINK"] = 1] = "LINK";
})(AssociationType = exports.AssociationType || (exports.AssociationType = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType[ConnectionType["CONSTITUENT"] = 0] = "CONSTITUENT";
    ConnectionType[ConnectionType["AUTHORITY"] = 1] = "AUTHORITY";
    ConnectionType[ConnectionType["CHAT"] = 2] = "CHAT";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
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
    EntityType[EntityType["SCHEDULED_NOTIFICATION"] = 19] = "SCHEDULED_NOTIFICATION";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
var MembershipType;
(function (MembershipType) {
    MembershipType[MembershipType["INVITATION"] = 0] = "INVITATION";
    MembershipType[MembershipType["SHARE"] = 1] = "SHARE";
})(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
//# sourceMappingURL=CommonTypes.js.map