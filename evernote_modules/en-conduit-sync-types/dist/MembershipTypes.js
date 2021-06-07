"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.highestPrivilege = exports.MembershipPrivilegeSchema = exports.MembershipRecipientType = exports.MembershipPrivilege = exports.WorkspaceTypeSchema = exports.WorkspaceType = exports.BusinessUserRoleSchema = exports.BusinessUserRole = exports.ServiceLevelV2Schema = exports.ServiceLevelV2 = exports.ServiceLevelSchema = exports.ServiceLevel = exports.PrivilegeLevelSchema = exports.PrivilegeLevel = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
var PrivilegeLevel;
(function (PrivilegeLevel) {
    PrivilegeLevel["NORMAL"] = "NORMAL";
    PrivilegeLevel["PREMIUM"] = "PREMIUM";
    PrivilegeLevel["VIP"] = "VIP";
    PrivilegeLevel["MANAGER"] = "MANAGER";
    PrivilegeLevel["SUPPORT"] = "SUPPORT";
    PrivilegeLevel["ADMIN"] = "ADMIN";
})(PrivilegeLevel = exports.PrivilegeLevel || (exports.PrivilegeLevel = {}));
exports.PrivilegeLevelSchema = conduit_utils_1.Enum(PrivilegeLevel, 'UserPrivilegeLevel');
var ServiceLevel;
(function (ServiceLevel) {
    ServiceLevel["BASIC"] = "BASIC";
    ServiceLevel["PLUS"] = "PLUS";
    ServiceLevel["PREMIUM"] = "PREMIUM";
    ServiceLevel["BUSINESS"] = "BUSINESS";
})(ServiceLevel = exports.ServiceLevel || (exports.ServiceLevel = {}));
exports.ServiceLevelSchema = conduit_utils_1.Enum(ServiceLevel, 'UserServiceLevel');
var en_data_model_2 = require("en-data-model");
Object.defineProperty(exports, "ServiceLevelV2", { enumerable: true, get: function () { return en_data_model_2.ServiceLevelV2; } });
exports.ServiceLevelV2Schema = conduit_utils_1.Enum(en_data_model_1.ServiceLevelV2, 'UserServiceLevelV2');
var BusinessUserRole;
(function (BusinessUserRole) {
    BusinessUserRole["ADMIN"] = "ADMIN";
    BusinessUserRole["NORMAL"] = "NORMAL";
})(BusinessUserRole = exports.BusinessUserRole || (exports.BusinessUserRole = {}));
exports.BusinessUserRoleSchema = conduit_utils_1.Enum(BusinessUserRole, 'BusinessUserRole');
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["INVITE_ONLY"] = "INVITE_ONLY";
    WorkspaceType["DISCOVERABLE"] = "DISCOVERABLE";
    WorkspaceType["OPEN"] = "OPEN";
})(WorkspaceType = exports.WorkspaceType || (exports.WorkspaceType = {}));
exports.WorkspaceTypeSchema = conduit_utils_1.Enum(WorkspaceType, 'WorkspaceType');
var MembershipPrivilege;
(function (MembershipPrivilege) {
    MembershipPrivilege["READ"] = "READ";
    MembershipPrivilege["COMPLETE"] = "COMPLETE";
    MembershipPrivilege["EDIT"] = "EDIT";
    MembershipPrivilege["MANAGE"] = "MANAGE";
})(MembershipPrivilege = exports.MembershipPrivilege || (exports.MembershipPrivilege = {}));
var MembershipRecipientType;
(function (MembershipRecipientType) {
    MembershipRecipientType["USER"] = "USER";
    MembershipRecipientType["IDENTITY"] = "IDENTITY";
    MembershipRecipientType["EMAIL"] = "EMAIL";
    MembershipRecipientType["BUSINESS"] = "BUSINESS";
})(MembershipRecipientType = exports.MembershipRecipientType || (exports.MembershipRecipientType = {}));
exports.MembershipPrivilegeSchema = conduit_utils_1.Enum(MembershipPrivilege, 'MembershipPrivilege');
const PRIVILEGE_ORDER = Object.values(MembershipPrivilege);
function highestPrivilege(a, b) {
    const numericalPrivilegeA = PRIVILEGE_ORDER.indexOf(a);
    const numericalPrivilegeB = PRIVILEGE_ORDER.indexOf(b);
    if (numericalPrivilegeA === -1 || numericalPrivilegeB === -1) {
        throw new Error('Unknown privilege');
    }
    if (numericalPrivilegeA >= numericalPrivilegeB) {
        return a;
    }
    else {
        return b;
    }
}
exports.highestPrivilege = highestPrivilege;
//# sourceMappingURL=MembershipTypes.js.map