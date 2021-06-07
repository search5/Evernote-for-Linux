"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipRole = exports.MembershipType = exports.AssociationTypeSchema = exports.AssociationType = exports.AgentRefSchema = exports.AgentTypeSchema = exports.AgentType = exports.agentFromUserID = exports.NullUserID = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.NullUserID = 0;
function agentFromUserID(userID) {
    return {
        id: userID.toString(),
        type: AgentType.USER,
    };
}
exports.agentFromUserID = agentFromUserID;
var AgentType;
(function (AgentType) {
    AgentType[AgentType["PUBLIC"] = 0] = "PUBLIC";
    AgentType[AgentType["IDENTITY"] = 1] = "IDENTITY";
    AgentType[AgentType["USER"] = 2] = "USER";
    AgentType[AgentType["BUSINESS"] = 3] = "BUSINESS";
    AgentType[AgentType["FAMILY"] = 4] = "FAMILY";
})(AgentType = exports.AgentType || (exports.AgentType = {}));
exports.AgentTypeSchema = en_ts_utils_1.EnumWithKeys(AgentType, 'AgentType');
exports.AgentRefSchema = en_ts_utils_1.Struct({
    type: exports.AgentTypeSchema,
    id: 'ID',
});
var AssociationType;
(function (AssociationType) {
    AssociationType[AssociationType["ANCESTRY"] = 0] = "ANCESTRY";
    AssociationType[AssociationType["LINK"] = 1] = "LINK";
    AssociationType[AssociationType["VIEW"] = 2] = "VIEW";
})(AssociationType = exports.AssociationType || (exports.AssociationType = {}));
exports.AssociationTypeSchema = en_ts_utils_1.EnumWithKeys(AssociationType, 'AssociationType');
var MembershipType;
(function (MembershipType) {
    MembershipType[MembershipType["INVITATION"] = 0] = "INVITATION";
    MembershipType[MembershipType["SHARE"] = 1] = "SHARE";
})(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
var MembershipRole;
(function (MembershipRole) {
    MembershipRole[MembershipRole["NULL"] = 0] = "NULL";
    MembershipRole[MembershipRole["VIEWER"] = 1] = "VIEWER";
    MembershipRole[MembershipRole["COMMENTER"] = 2] = "COMMENTER";
    MembershipRole[MembershipRole["EDITOR"] = 3] = "EDITOR";
    MembershipRole[MembershipRole["EDITOR_SHARER"] = 4] = "EDITOR_SHARER";
    MembershipRole[MembershipRole["ADMIN"] = 5] = "ADMIN";
    MembershipRole[MembershipRole["OWNER"] = 6] = "OWNER";
    MembershipRole[MembershipRole["ACTIVITY_VIEWER"] = 7] = "ACTIVITY_VIEWER";
    MembershipRole[MembershipRole["COMPLETER"] = 8] = "COMPLETER";
})(MembershipRole = exports.MembershipRole || (exports.MembershipRole = {}));
//# sourceMappingURL=CommonTypes.js.map