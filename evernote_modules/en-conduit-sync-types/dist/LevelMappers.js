"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toServiceLevelV2 = exports.toServiceLevelArray = exports.toServiceLevelV1 = exports.toPrivilegeLevel = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const MembershipTypes_1 = require("./MembershipTypes");
const ThriftTypes_1 = require("./ThriftTypes");
function toPrivilegeLevel(t) {
    switch (t) {
        case ThriftTypes_1.TPrivilegeLevel.NORMAL:
            return MembershipTypes_1.PrivilegeLevel.NORMAL;
        case ThriftTypes_1.TPrivilegeLevel.PREMIUM:
            return MembershipTypes_1.PrivilegeLevel.PREMIUM;
        case ThriftTypes_1.TPrivilegeLevel.VIP:
            return MembershipTypes_1.PrivilegeLevel.VIP;
        case ThriftTypes_1.TPrivilegeLevel.MANAGER:
            return MembershipTypes_1.PrivilegeLevel.MANAGER;
        case ThriftTypes_1.TPrivilegeLevel.SUPPORT:
            return MembershipTypes_1.PrivilegeLevel.SUPPORT;
        case ThriftTypes_1.TPrivilegeLevel.ADMIN:
            return MembershipTypes_1.PrivilegeLevel.ADMIN;
        default:
            throw conduit_utils_1.absurd(t, 'Unknown service privilege level');
    }
}
exports.toPrivilegeLevel = toPrivilegeLevel;
function toServiceLevelV1(t) {
    switch (t) {
        case ThriftTypes_1.TServiceLevel.BASIC:
            return MembershipTypes_1.ServiceLevel.BASIC;
        case ThriftTypes_1.TServiceLevel.PLUS:
            return MembershipTypes_1.ServiceLevel.PLUS;
        case ThriftTypes_1.TServiceLevel.PREMIUM:
            return MembershipTypes_1.ServiceLevel.PREMIUM;
        case ThriftTypes_1.TServiceLevel.BUSINESS:
            return MembershipTypes_1.ServiceLevel.BUSINESS;
        default:
            throw new Error('Looking at possible v2 serviceLevel field');
    }
}
exports.toServiceLevelV1 = toServiceLevelV1;
function toServiceLevelArray(t) {
    return t.map(serviceLevel => toServiceLevelV1(serviceLevel));
}
exports.toServiceLevelArray = toServiceLevelArray;
function toServiceLevelV2(t) {
    // TODO: Change en-data-model to give a better type and get rid of this hackish cast
    const supportedLevel = t;
    const ret = en_data_model_1.getServiceLevelV2Summary(supportedLevel);
    return ret.serviceLevel;
}
exports.toServiceLevelV2 = toServiceLevelV2;
//# sourceMappingURL=LevelMappers.js.map