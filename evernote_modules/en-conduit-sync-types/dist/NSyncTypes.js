"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeTypeArrayToEntityFilterParam = exports.entityTypeAsNodeType = exports.PREFERENCE_SHORTCUTS_KEY = exports.NSyncAgentToRecipientMap = exports.NSyncPrivilegeMap = exports.NSyncWorkspaceTypeMap = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
// possibly redundant, but if we ever change names, and it allows for better typing and an
// error if new type not handled or misspelling
exports.NSyncWorkspaceTypeMap = {
    INVITE_ONLY: en_core_entity_types_1.WorkspaceType.INVITE_ONLY,
    DISCOVERABLE: en_core_entity_types_1.WorkspaceType.DISCOVERABLE,
    OPEN: en_core_entity_types_1.WorkspaceType.OPEN,
};
exports.NSyncPrivilegeMap = {
    [en_data_model_1.ClientNSyncTypes.Role.NULL]: en_core_entity_types_1.MembershipPrivilege.READ,
    [en_data_model_1.ClientNSyncTypes.Role.VIEWER]: en_core_entity_types_1.MembershipPrivilege.READ,
    [en_data_model_1.ClientNSyncTypes.Role.COMMENTER]: en_core_entity_types_1.MembershipPrivilege.READ,
    [en_data_model_1.ClientNSyncTypes.Role.EDITOR]: en_core_entity_types_1.MembershipPrivilege.EDIT,
    [en_data_model_1.ClientNSyncTypes.Role.EDITOR_SHARER]: en_core_entity_types_1.MembershipPrivilege.EDIT,
    [en_data_model_1.ClientNSyncTypes.Role.ADMIN]: en_core_entity_types_1.MembershipPrivilege.MANAGE,
    [en_data_model_1.ClientNSyncTypes.Role.OWNER]: en_core_entity_types_1.MembershipPrivilege.MANAGE,
    [en_data_model_1.ClientNSyncTypes.Role.ACTIVITY_VIEWER]: en_core_entity_types_1.MembershipPrivilege.READ,
    [en_data_model_1.ClientNSyncTypes.Role.COMPLETER]: en_core_entity_types_1.MembershipPrivilege.COMPLETE,
};
exports.NSyncAgentToRecipientMap = {
    [en_data_model_1.ClientNSyncTypes.AgentType.USER]: en_core_entity_types_1.MembershipRecipientType.USER,
    [en_data_model_1.ClientNSyncTypes.AgentType.IDENTITY]: en_core_entity_types_1.MembershipRecipientType.IDENTITY,
    [en_data_model_1.ClientNSyncTypes.AgentType.BUSINESS]: en_core_entity_types_1.MembershipRecipientType.BUSINESS,
};
exports.PREFERENCE_SHORTCUTS_KEY = 'evernote.shortcuts';
function entityTypeAsNodeType(dataModelProvider, entityType, defaultResult) {
    if (conduit_utils_1.isNullish(entityType)) {
        if (conduit_utils_1.isNullish(defaultResult)) {
            return null;
        }
        return defaultResult;
    }
    return dataModelProvider.convertNsyncTypeToNodeType(entityType);
}
exports.entityTypeAsNodeType = entityTypeAsNodeType;
function nodeTypeArrayToEntityFilterParam(eventManager, nodeTypes) {
    if (nodeTypes === null) {
        return '';
    }
    const entityFilterArray = [];
    for (const type of nodeTypes) {
        const nsyncType = eventManager.di.convertNodeTypeToNSyncType(type);
        if (!conduit_utils_1.isNullish(nsyncType)) {
            entityFilterArray.push(nsyncType);
        }
    }
    return '&entityFilter=' + conduit_utils_1.safeStringify(entityFilterArray);
}
exports.nodeTypeArrayToEntityFilterParam = nodeTypeArrayToEntityFilterParam;
//# sourceMappingURL=NSyncTypes.js.map