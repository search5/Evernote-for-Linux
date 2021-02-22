"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.highestPrivilege = exports.MembershipPrivilege = void 0;
var MembershipPrivilege;
(function (MembershipPrivilege) {
    MembershipPrivilege["READ"] = "READ";
    MembershipPrivilege["EDIT"] = "EDIT";
    MembershipPrivilege["MANAGE"] = "MANAGE";
})(MembershipPrivilege = exports.MembershipPrivilege || (exports.MembershipPrivilege = {}));
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
//# sourceMappingURL=MembershipPrivilege.js.map