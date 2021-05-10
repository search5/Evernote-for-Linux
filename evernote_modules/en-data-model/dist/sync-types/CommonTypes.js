"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipType = exports.ConnectionType = exports.AssociationType = exports.AgentType = void 0;
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
var MembershipType;
(function (MembershipType) {
    MembershipType[MembershipType["INVITATION"] = 0] = "INVITATION";
    MembershipType[MembershipType["SHARE"] = 1] = "SHARE";
})(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
//# sourceMappingURL=CommonTypes.js.map