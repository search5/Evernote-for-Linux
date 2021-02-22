"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeTypeArrayToEntityFilterParam = exports.entityTypeAsNodeType = exports.convertLong = exports.isLong = exports.PREFERENCE_SHORTCUTS_KEY = exports.NSyncAgentToRecipientMap = exports.NSyncPrivilegeMap = exports.NSyncWorkspaceTypeMap = exports.NSyncTypes = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Long = __importStar(require("long"));
const NSyncTypes = __importStar(require("./en-sync-types/client-types"));
exports.NSyncTypes = __importStar(require("./en-sync-types/client-types"));
// possibly redundant, but if we ever change names, and it allows for better typing and an
// error if new type not handled or misspelling
exports.NSyncWorkspaceTypeMap = {
    INVITE_ONLY: en_data_model_1.WorkspaceType.INVITE_ONLY,
    DISCOVERABLE: en_data_model_1.WorkspaceType.DISCOVERABLE,
    OPEN: en_data_model_1.WorkspaceType.OPEN,
};
exports.NSyncPrivilegeMap = {
    [NSyncTypes.Role.NULL]: en_data_model_1.MembershipPrivilege.READ,
    [NSyncTypes.Role.VIEWER]: en_data_model_1.MembershipPrivilege.READ,
    [NSyncTypes.Role.COMMENTER]: en_data_model_1.MembershipPrivilege.READ,
    [NSyncTypes.Role.EDITOR]: en_data_model_1.MembershipPrivilege.EDIT,
    [NSyncTypes.Role.EDITOR_SHARER]: en_data_model_1.MembershipPrivilege.EDIT,
    [NSyncTypes.Role.ADMIN]: en_data_model_1.MembershipPrivilege.MANAGE,
    [NSyncTypes.Role.OWNER]: en_data_model_1.MembershipPrivilege.MANAGE,
    [NSyncTypes.Role.ACTIVITY_VIEWER]: en_data_model_1.MembershipPrivilege.READ,
};
exports.NSyncAgentToRecipientMap = {
    [NSyncTypes.AgentType.USER]: en_data_model_1.MembershipRecipientType.USER,
    [NSyncTypes.AgentType.IDENTITY]: en_data_model_1.MembershipRecipientType.IDENTITY,
    [NSyncTypes.AgentType.BUSINESS]: en_data_model_1.MembershipRecipientType.BUSINESS,
};
exports.PREFERENCE_SHORTCUTS_KEY = 'evernote.shortcuts';
function isLong(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    if (obj.high !== undefined && obj.high !== null &&
        obj.low !== undefined && obj.low !== null) {
        return true;
    }
    return false;
}
exports.isLong = isLong;
function convertLong(longNum) {
    return isLong(longNum) ?
        Long.fromValue(longNum).toNumber() :
        typeof longNum === 'string' ?
            Number(longNum) :
            longNum;
}
exports.convertLong = convertLong;
function entityTypeAsNodeType(eventManager, entityType, defaultResult) {
    if (conduit_utils_1.isNullish(entityType)) {
        if (conduit_utils_1.isNullish(defaultResult)) {
            return null;
        }
        return defaultResult;
    }
    return eventManager.di.convertNsyncTypeToNodeType(entityType);
}
exports.entityTypeAsNodeType = entityTypeAsNodeType;
function nodeTypeArrayToEntityFilterParam(eventManager, nodeTypes) {
    if (nodeTypes === null) {
        return '';
    }
    const entityFilterArray = [];
    for (const type of nodeTypes) {
        const nsyncType = eventManager.di.convertNodeTypeToNSyncType(type);
        if (nsyncType) {
            entityFilterArray.push(nsyncType);
        }
    }
    return '&entityFilter=' + conduit_utils_1.safeStringify(entityFilterArray);
}
exports.nodeTypeArrayToEntityFilterParam = nodeTypeArrayToEntityFilterParam;
//# sourceMappingURL=NSyncTypes.js.map