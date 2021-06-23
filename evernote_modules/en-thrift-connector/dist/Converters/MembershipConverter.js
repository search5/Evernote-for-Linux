"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipConverter = exports.deleteMembershipHelper = exports.convertSharedNoteMembershipGuidFromService = exports.membershipFromWorkspace = exports.membershipPrivilegeToSharedNotePrivilegeLevel = exports.membershipPrivilegeToWorkspacePrivilege = exports.membershipPrivilegeToSharedNotebookPrivilege = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
const MessageAttachmentConverter_1 = require("./MessageAttachmentConverter");
const NotebookConverter_1 = require("./NotebookConverter");
const ProfileConverter_1 = require("./ProfileConverter");
function membershipPrivilegeToShareRelationship(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.MembershipPrivilege.READ:
        case en_conduit_sync_types_1.MembershipPrivilege.COMPLETE:
            return en_conduit_sync_types_1.TShareRelationshipPrivilegeLevel.READ_NOTEBOOK_PLUS_ACTIVITY;
        case en_conduit_sync_types_1.MembershipPrivilege.EDIT:
            return en_conduit_sync_types_1.TShareRelationshipPrivilegeLevel.MODIFY_NOTEBOOK_PLUS_ACTIVITY;
        case en_conduit_sync_types_1.MembershipPrivilege.MANAGE:
            return en_conduit_sync_types_1.TShareRelationshipPrivilegeLevel.FULL_ACCESS;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
function membershipPrivilegeToSharedNotebookPrivilege(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.MembershipPrivilege.READ:
        case en_conduit_sync_types_1.MembershipPrivilege.COMPLETE:
            return en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.READ_NOTEBOOK_PLUS_ACTIVITY;
        case en_conduit_sync_types_1.MembershipPrivilege.EDIT:
            return en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.MODIFY_NOTEBOOK_PLUS_ACTIVITY;
        case en_conduit_sync_types_1.MembershipPrivilege.MANAGE:
            return en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.FULL_ACCESS;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
exports.membershipPrivilegeToSharedNotebookPrivilege = membershipPrivilegeToSharedNotebookPrivilege;
function membershipPrivilegeFromSharedNotebookPrivilege(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.READ_NOTEBOOK:
        case en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.READ_NOTEBOOK_PLUS_ACTIVITY:
            return en_conduit_sync_types_1.MembershipPrivilege.READ;
        case en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.MODIFY_NOTEBOOK_PLUS_ACTIVITY:
        case en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.GROUP:
            return en_conduit_sync_types_1.MembershipPrivilege.EDIT;
        case en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.FULL_ACCESS:
        case en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.BUSINESS_FULL_ACCESS:
            return en_conduit_sync_types_1.MembershipPrivilege.MANAGE;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
function membershipPrivilegeToWorkspacePrivilege(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.MembershipPrivilege.READ:
        case en_conduit_sync_types_1.MembershipPrivilege.COMPLETE:
            return en_conduit_sync_types_1.TWorkspacePrivilegeLevel.READ;
        case en_conduit_sync_types_1.MembershipPrivilege.EDIT:
            return en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT;
        case en_conduit_sync_types_1.MembershipPrivilege.MANAGE:
            return en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT_AND_MANAGE;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
exports.membershipPrivilegeToWorkspacePrivilege = membershipPrivilegeToWorkspacePrivilege;
function membershipPrivilegeFromWorkspacePrivilege(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.TWorkspacePrivilegeLevel.READ:
            return en_conduit_sync_types_1.MembershipPrivilege.READ;
        case en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT:
            return en_conduit_sync_types_1.MembershipPrivilege.EDIT;
        case en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT_AND_MANAGE:
            return en_conduit_sync_types_1.MembershipPrivilege.MANAGE;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
function membershipPrivilegeToSharedNotePrivilegeLevel(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.MembershipPrivilege.READ:
        case en_conduit_sync_types_1.MembershipPrivilege.COMPLETE:
            return en_conduit_sync_types_1.TSharedNotePrivilegeLevel.READ_NOTE;
        case en_conduit_sync_types_1.MembershipPrivilege.EDIT:
            return en_conduit_sync_types_1.TSharedNotePrivilegeLevel.MODIFY_NOTE;
        case en_conduit_sync_types_1.MembershipPrivilege.MANAGE:
            return en_conduit_sync_types_1.TSharedNotePrivilegeLevel.FULL_ACCESS;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
exports.membershipPrivilegeToSharedNotePrivilegeLevel = membershipPrivilegeToSharedNotePrivilegeLevel;
// Workspace membership:
function membershipFromWorkspace(serviceData, parentNode, personalUserID, vaultUserID) {
    if (!serviceData.common) {
        throw new Error('Unable to create membership node without a common structure in service data');
    }
    const recipientType = serviceData.common.recipientType === en_conduit_sync_types_1.TRecipientType.BUSINESS ? en_conduit_sync_types_1.MembershipRecipientType.BUSINESS : en_conduit_sync_types_1.MembershipRecipientType.USER;
    const node = {
        type: en_core_entity_types_1.CoreEntityTypes.Membership,
        id: Converters_1.convertGuidFromService(serviceData.common.guid, en_core_entity_types_1.CoreEntityTypes.Membership),
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: parentNode.label,
        NodeFields: {
            privilege: membershipPrivilegeFromWorkspacePrivilege(serviceData.privilege || 1),
            recipientType,
            recipientIsMe: recipientType === en_conduit_sync_types_1.MembershipRecipientType.USER && serviceData.common.recipientId === personalUserID,
            created: serviceData.common.serviceCreated || 0,
            updated: serviceData.common.serviceUpdated || 0,
            invitedTime: null,
            internal_sharedNotebookID: null,
        },
        inputs: {
            parent: {},
        },
        outputs: {
            owner: {},
            recipient: {},
            sharer: {},
        },
    };
    conduit_storage_1.addOutputEdgeToNode(node, 'sharer', {
        id: Converters_1.convertGuidFromService(serviceData.common.sharerUserId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
        type: en_core_entity_types_1.CoreEntityTypes.Profile,
        port: null,
    });
    const ownerID = Converters_1.convertGuidFromService(serviceData.common.entityOwnerId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
    if (serviceData.common.entityOwnerId !== vaultUserID) {
        // don't count vault user in share count
        updateMembershipParentShareProfiles(parentNode, ownerID);
    }
    const recipientID = Converters_1.convertGuidFromService(serviceData.common.recipientId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
    updateMembershipParentShareProfiles(parentNode, recipientID);
    conduit_storage_1.addOutputEdgeToNode(node, 'owner', {
        id: ownerID,
        type: en_core_entity_types_1.CoreEntityTypes.Profile,
        port: null,
    });
    conduit_storage_1.addOutputEdgeToNode(node, 'recipient', {
        id: recipientID,
        type: en_core_entity_types_1.CoreEntityTypes.Profile,
        port: null,
    });
    return node;
}
exports.membershipFromWorkspace = membershipFromWorkspace;
async function updateWorkspaceMembershipPrivilege(trc, params, auth, membershipID, workspaceID, privilege) {
    const inviteRequest = {
        workspaceGuid: Converters_1.convertGuidToService(workspaceID, en_core_entity_types_1.CoreEntityTypes.Workspace),
        membershipsToUpdate: [{
                common: { guid: Converters_1.convertGuidToService(membershipID, en_core_entity_types_1.CoreEntityTypes.Membership) },
                privilege: membershipPrivilegeToWorkspacePrivilege(privilege),
            }],
    };
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    await noteStore.manageWorkspaceSharing(trc, auth.token, inviteRequest);
}
async function removeMembershipFromWorkspace(trc, params, auth, workspaceID, membership) {
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const inviteRequest = {
        workspaceGuid: Converters_1.convertGuidToService(workspaceID, en_core_entity_types_1.CoreEntityTypes.Workspace),
        membershipsToRemove: [Converters_1.convertGuidToService(membership.id, en_core_entity_types_1.CoreEntityTypes.Membership)],
    };
    await noteStore.manageWorkspaceSharing(trc, auth.token, inviteRequest);
    return null;
}
function membershipPrivilegeFromSharedNotePrivilege(privilege) {
    switch (privilege) {
        case en_conduit_sync_types_1.TSharedNotePrivilegeLevel.READ_NOTE:
            return en_conduit_sync_types_1.MembershipPrivilege.READ;
        case en_conduit_sync_types_1.TSharedNotePrivilegeLevel.MODIFY_NOTE:
            return en_conduit_sync_types_1.MembershipPrivilege.EDIT;
        case en_conduit_sync_types_1.TSharedNotePrivilegeLevel.FULL_ACCESS:
            return en_conduit_sync_types_1.MembershipPrivilege.MANAGE;
        default:
            throw conduit_utils_1.absurd(privilege, `Unknown privilege ${privilege}`);
    }
}
function convertSharedNoteMembershipGuidFromService(noteID, identity) {
    let id = '';
    let type = en_conduit_sync_types_1.MembershipRecipientType.USER;
    if (identity) {
        if (identity.userId) {
            id = conduit_utils_1.keyStringForUserID(identity.userId);
            type = en_conduit_sync_types_1.MembershipRecipientType.USER;
        }
        else if (identity.id) {
            id = MessageAttachmentConverter_1.convertIdentityGuidFromService(identity.id);
            type = en_conduit_sync_types_1.MembershipRecipientType.IDENTITY;
        }
        else {
            throw new Error('Shared note with no supported recipient found');
        }
    }
    return {
        type,
        id: Converters_1.convertGuidFromService(`${noteID};${id}`, en_core_entity_types_1.CoreEntityTypes.Membership),
    };
}
exports.convertSharedNoteMembershipGuidFromService = convertSharedNoteMembershipGuidFromService;
function updateMembershipParentShareProfiles(node, id) {
    const shareProfiles = node.NodeFields.internal_shareCountProfiles;
    shareProfiles[id] = shareProfiles[id] ? shareProfiles[id] + 1 : 1;
}
async function deleteMembershipHelper(trc, params, syncContext, membershipID) {
    await params.graphTransaction.deleteNode(trc, syncContext, { id: membershipID, type: en_core_entity_types_1.CoreEntityTypes.Membership });
}
exports.deleteMembershipHelper = deleteMembershipHelper;
// Note membership:
async function membershipFromSharedNote(trc, params, noteID, serviceData, parentNode) {
    var _a;
    let recipientIsMe = false;
    if (serviceData.recipientIdentity) {
        if (serviceData.recipientIdentity.userId) {
            recipientIsMe = serviceData.recipientIdentity.userId === params.personalUserId;
        }
        else if (serviceData.recipientIdentity.id) {
            const { personalProfile } = params;
            if (personalProfile) {
                for (const identityID in personalProfile.outputs.relatedIdentities) {
                    const recipientIdentityId = Converters_1.convertGuidFromService(serviceData.recipientIdentity.id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity);
                    if (recipientIdentityId === personalProfile.outputs.relatedIdentities[identityID].dstID) {
                        recipientIsMe = true;
                        break;
                    }
                }
            }
        }
        else {
            throw new Error('Shared note with no supported recipient found');
        }
    }
    let invitation = null;
    if (recipientIsMe && serviceData.sharerUserID && serviceData.sharerUserID !== params.personalUserId) {
        const noteServiceID = Converters_1.convertGuidToService(noteID, 'Note');
        const invitationID = Converters_1.convertGuidFromService(noteServiceID, 'Invitation');
        invitation = await params.graphTransaction.getNode(trc, null, { id: invitationID, type: en_core_entity_types_1.CoreEntityTypes.Invitation });
        if (!invitation) { // this should not happen
            conduit_utils_1.logger.warn('can not find invitation for memberhip');
        }
    }
    const { id: recipientId, type: recipientType } = convertSharedNoteMembershipGuidFromService(noteID, serviceData.recipientIdentity);
    const node = {
        id: recipientId,
        type: en_core_entity_types_1.CoreEntityTypes.Membership,
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: parentNode.label,
        NodeFields: {
            privilege: membershipPrivilegeFromSharedNotePrivilege(serviceData.privilege || 0),
            recipientType,
            recipientIsMe,
            created: serviceData.serviceCreated || 0,
            updated: serviceData.serviceUpdated || 0,
            invitedTime: (_a = invitation === null || invitation === void 0 ? void 0 : invitation.NodeFields.created) !== null && _a !== void 0 ? _a : null,
            internal_sharedNotebookID: 0,
        },
        inputs: {
            parent: {},
        },
        outputs: {
            owner: {},
            recipient: {},
            sharer: {},
        },
    };
    if (serviceData.sharerUserID) {
        conduit_storage_1.addOutputEdgeToNode(node, 'sharer', {
            id: Converters_1.convertGuidFromService(serviceData.sharerUserID, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
    }
    let recipientProfileID = null;
    if (recipientType === en_conduit_sync_types_1.MembershipRecipientType.USER && recipientId !== '') {
        recipientProfileID = Converters_1.convertGuidFromService(serviceData.recipientIdentity.userId.toString(), en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
    }
    else if (recipientType === en_conduit_sync_types_1.MembershipRecipientType.IDENTITY) {
        recipientProfileID = Converters_1.convertGuidFromService(serviceData.recipientIdentity.id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity);
    }
    if (recipientProfileID) {
        conduit_storage_1.addOutputEdgeToNode(node, 'recipient', {
            id: recipientProfileID,
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
        updateMembershipParentShareProfiles(parentNode, recipientProfileID);
    }
    return node;
}
function buildProfileFromServerForSharedNote(identityId, userId) {
    return ProfileConverter_1.profileFromIdentity({
        id: identityId,
        userId,
        contact: {},
    }, ProfileConverter_1.ProfileSourceConfidence.SharedNoteMembership);
}
// Notebook membership:
function profileFromSharedNotebook(serviceData) {
    if (serviceData.recipientIdentityId) {
        return ProfileConverter_1.profileFromIdentity({
            id: serviceData.recipientIdentityId,
            userId: serviceData.recipientUserId,
            contact: {
                type: en_conduit_sync_types_1.TContactType.EMAIL,
                name: serviceData.email,
            },
        }, ProfileConverter_1.ProfileSourceConfidence.SharedNoteMembership);
    }
    else if (serviceData.recipientUserId) {
        return ProfileConverter_1.profileFromUser({
            id: serviceData.recipientUserId,
            username: serviceData.recipientUsername,
            email: serviceData.email,
        }, ProfileConverter_1.ProfileSourceConfidence.SharedNoteMembership);
    }
    return null;
}
async function membershipFromSharedNotebook(trc, params, serviceData, parentNode) {
    var _a;
    let recipientType = en_conduit_sync_types_1.MembershipRecipientType.USER;
    let recipientIsMe = false;
    if (serviceData.recipientUserId) {
        recipientType = en_conduit_sync_types_1.MembershipRecipientType.USER;
        recipientIsMe = serviceData.recipientUserId === params.personalUserId;
    }
    else if (serviceData.recipientIdentityId) {
        recipientType = en_conduit_sync_types_1.MembershipRecipientType.IDENTITY;
    }
    else if (serviceData.email) {
        recipientType = en_conduit_sync_types_1.MembershipRecipientType.EMAIL;
    }
    else {
        throw new Error('Shared notebook with no supported recipient found');
    }
    let invitation = null;
    if (recipientIsMe && serviceData.notebookGuid && serviceData.sharerUserId && serviceData.sharerUserId !== params.personalUserId) {
        const invitationID = Converters_1.convertGuidFromService(serviceData.notebookGuid, 'Invitation');
        invitation = await params.graphTransaction.getNode(trc, null, { id: invitationID, type: en_core_entity_types_1.CoreEntityTypes.Invitation });
        if (!invitation) { // should not happen
            conduit_utils_1.logger.warn('can not find invitation for memberhip');
        }
    }
    const node = {
        id: Converters_1.convertGuidFromService(serviceData.globalId, en_core_entity_types_1.CoreEntityTypes.Membership),
        type: en_core_entity_types_1.CoreEntityTypes.Membership,
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: parentNode.label,
        NodeFields: {
            privilege: membershipPrivilegeFromSharedNotebookPrivilege(serviceData.privilege || 0),
            recipientType,
            recipientIsMe,
            created: serviceData.serviceCreated || 0,
            updated: serviceData.serviceUpdated || 0,
            invitedTime: (_a = invitation === null || invitation === void 0 ? void 0 : invitation.NodeFields.created) !== null && _a !== void 0 ? _a : null,
            internal_sharedNotebookID: serviceData.id || 0,
        },
        inputs: {
            parent: {},
        },
        outputs: {
            owner: {},
            recipient: {},
            sharer: {},
        },
    };
    if (serviceData.sharerUserId) {
        conduit_storage_1.addOutputEdgeToNode(node, 'sharer', {
            id: Converters_1.convertGuidFromService(serviceData.sharerUserId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
    }
    const ownerProfileID = Converters_1.convertGuidFromService(serviceData.userId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
    if (serviceData.userId !== params.vaultUserId) {
        // don't count vault user in share count
        updateMembershipParentShareProfiles(parentNode, ownerProfileID);
    }
    if (serviceData.userId) {
        conduit_storage_1.addOutputEdgeToNode(node, 'owner', {
            id: ownerProfileID,
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
    }
    let recipientID = null;
    if (serviceData.recipientUserId) {
        recipientID = Converters_1.convertGuidFromService(serviceData.recipientUserId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
    }
    else if (serviceData.recipientIdentityId) {
        recipientID = Converters_1.convertGuidFromService(serviceData.recipientIdentityId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity);
    }
    else if (recipientType === en_conduit_sync_types_1.MembershipRecipientType.EMAIL && serviceData.email) {
        recipientID = Converters_1.convertGuidFromService(serviceData.email, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity);
    }
    if (recipientID) {
        conduit_storage_1.addOutputEdgeToNode(node, 'recipient', {
            id: recipientID,
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
        updateMembershipParentShareProfiles(parentNode, recipientID);
    }
    return node;
}
async function updateSharedNotebookMembershipPrivilege(trc, params, auth, notebookID, privilege, membership) {
    const isRecipientUser = membership.NodeFields.recipientType === en_conduit_sync_types_1.MembershipRecipientType.USER;
    const isRecipientBusiness = membership.NodeFields.recipientType === en_conduit_sync_types_1.MembershipRecipientType.BUSINESS;
    const isRecipientIdentity = membership.NodeFields.recipientType === en_conduit_sync_types_1.MembershipRecipientType.IDENTITY;
    if (!isRecipientUser && !isRecipientBusiness && !isRecipientIdentity) {
        throw new Error('Cannot update share to email');
    }
    const recipientEdge = conduit_utils_1.firstStashEntry(membership.outputs.recipient);
    if (!recipientEdge) {
        throw new Error('No recipient edge found');
    }
    const recipientId = Number(Converters_1.convertGuidToService(recipientEdge.dstID, en_core_entity_types_1.CoreEntityTypes.Profile));
    const tPrivilege = membershipPrivilegeToShareRelationship(privilege);
    const managedShares = {
        notebookGuid: Converters_1.convertGuidToService(notebookID, en_core_entity_types_1.CoreEntityTypes.Notebook),
        membershipsToUpdate: isRecipientUser || isRecipientBusiness ?
            [{
                    recipientUserId: recipientId,
                    individualPrivilege: tPrivilege,
                }] : undefined,
        invitationsToCreateOrUpdate: isRecipientIdentity ?
            [{
                    recipientUserIdentity: {
                        type: en_conduit_sync_types_1.TUserIdentityType.IDENTITYID,
                        longIdentifier: recipientId,
                    },
                    privilege: tPrivilege,
                }] : undefined,
    };
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const result = await noteStore.manageNotebookShares(trc, auth.token, managedShares);
    if (result.errors) {
        throw new Error('Unable to manage notebook shares');
    }
}
async function updateSharedNoteMembershipPrivilege(trc, params, auth, noteID, privilege, membership) {
    if (membership.NodeFields.recipientType !== en_conduit_sync_types_1.MembershipRecipientType.USER && membership.NodeFields.recipientType !== en_conduit_sync_types_1.MembershipRecipientType.IDENTITY) {
        throw new Error('Only updates to users and identity privileges are allowed');
    }
    const recipientId = Number(Converters_1.convertGuidToService(conduit_utils_1.firstStashEntry(membership.outputs.recipient).dstID, en_core_entity_types_1.CoreEntityTypes.Profile));
    let privilegeOut;
    switch (privilege) {
        case en_conduit_sync_types_1.MembershipPrivilege.MANAGE:
            privilegeOut = en_conduit_sync_types_1.TSharedNotePrivilegeLevel.FULL_ACCESS;
            break;
        case en_conduit_sync_types_1.MembershipPrivilege.EDIT:
            privilegeOut = en_conduit_sync_types_1.TSharedNotePrivilegeLevel.MODIFY_NOTE;
            break;
        case en_conduit_sync_types_1.MembershipPrivilege.READ:
        default:
            privilegeOut = en_conduit_sync_types_1.TSharedNotePrivilegeLevel.READ_NOTE;
            break;
    }
    const managedShares = {
        noteGuid: noteID,
        membershipsToUpdate: membership.NodeFields.recipientType === en_conduit_sync_types_1.MembershipRecipientType.USER ? [
            { recipientUserId: recipientId, privilege: privilegeOut }
        ] : undefined,
        invitationsToUpdate: membership.NodeFields.recipientType === en_conduit_sync_types_1.MembershipRecipientType.IDENTITY ? [
            { recipientIdentityId: recipientId, privilege: privilegeOut }
        ] : undefined,
    };
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const result = await noteStore.manageNoteShares(trc, auth.token, managedShares);
    if (result.errors) {
        throw new Error('Unable to manage note shares');
    }
}
async function removeMembershipFromNotebook(trc, params, auth, notebookID, membership) {
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    let unshare;
    const recipientEdge = conduit_utils_1.firstStashEntry(membership.outputs.recipient);
    if (!recipientEdge) {
        throw new Error('No recipient edge found');
    }
    switch (membership.NodeFields.recipientType) {
        case en_conduit_sync_types_1.MembershipRecipientType.USER:
        case en_conduit_sync_types_1.MembershipRecipientType.BUSINESS:
            unshare = {
                type: en_conduit_sync_types_1.TUserIdentityType.EVERNOTE_USERID,
                longIdentifier: Number(Converters_1.convertGuidToService(recipientEdge.dstID, en_core_entity_types_1.CoreEntityTypes.Profile)),
            };
            break;
        case en_conduit_sync_types_1.MembershipRecipientType.IDENTITY:
            unshare = {
                type: en_conduit_sync_types_1.TUserIdentityType.IDENTITYID,
                longIdentifier: Number(Converters_1.convertGuidToService(recipientEdge.dstID, en_core_entity_types_1.CoreEntityTypes.Profile)),
            };
            break;
        case en_conduit_sync_types_1.MembershipRecipientType.EMAIL:
            unshare = {
                type: en_conduit_sync_types_1.TUserIdentityType.EMAIL,
                stringIdentifier: Converters_1.convertGuidToService(recipientEdge.dstID, en_core_entity_types_1.CoreEntityTypes.Profile),
            };
            break;
        default:
            throw conduit_utils_1.absurd(membership.NodeFields.recipientType, `Unknown recipient type ${membership.NodeFields.recipientType}`);
    }
    const managedShares = {
        notebookGuid: Converters_1.convertGuidToService(notebookID, en_core_entity_types_1.CoreEntityTypes.Notebook),
        unshares: [unshare],
    };
    const result = await noteStore.manageNotebookShares(trc, auth.token, managedShares);
    if (result.errors || result.unshareErrors) {
        conduit_utils_1.logger.error('Failed unsharing notebook', result.errors, result.unshareErrors);
        throw new Error('Unable to manage notebook shares');
    }
    return null;
}
async function removeMembershipFromSharedNote(trc, params, auth, noteID, membership) {
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const unshareUsers = [];
    const unshareEmails = [];
    const recipientId = conduit_utils_1.firstStashEntry(membership.outputs.recipient).dstID;
    switch (membership.NodeFields.recipientType) {
        case en_conduit_sync_types_1.MembershipRecipientType.USER:
            unshareUsers.push(Number(Converters_1.convertGuidToService(recipientId, en_core_entity_types_1.CoreEntityTypes.Profile)));
            break;
        case en_conduit_sync_types_1.MembershipRecipientType.IDENTITY:
            unshareEmails.push(Number(Converters_1.convertGuidToService(recipientId, en_core_entity_types_1.CoreEntityTypes.Profile)));
            break;
        case en_conduit_sync_types_1.MembershipRecipientType.BUSINESS:
        case en_conduit_sync_types_1.MembershipRecipientType.EMAIL:
        default:
            throw new Error(`Unknown recipient type ${membership.NodeFields.recipientType}`);
    }
    const result = await noteStore.manageNoteShares(trc, auth.token, {
        noteGuid: Converters_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note),
        invitationsToUnshare: unshareEmails.length ? unshareEmails : undefined,
        membershipsToUnshare: unshareUsers.length ? unshareUsers : undefined,
    });
    if (result.errors) {
        throw new conduit_utils_1.MultiError(result.errors.map(e => {
            return e.notFoundException ? new conduit_utils_1.NotFoundError((e.userID || e.identityID || 0).toString()) : new Error(`Unable to unshare ${e.userID || e.identityID}`);
        }));
    }
    return null;
}
class MembershipConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Membership;
    }
    convertGuidFromService(guid) {
        return `Membership:${guid}`;
    }
    convertGuidToService(guid) {
        return guid.slice('Membership:'.length);
    }
    async convertFromService(trc, params, syncContext, serviceData, parentNode) {
        if (!parentNode) {
            throw new Error('parentNode is required in MembershipConverter.convertFromService');
        }
        let node;
        if (en_core_entity_types_1.isWorkspace(parentNode)) {
            node = membershipFromWorkspace(serviceData, parentNode, params.personalUserId, params.vaultUserId);
        }
        else if (en_core_entity_types_1.isNotebook(parentNode)) {
            const profile = profileFromSharedNotebook(serviceData);
            profile && await ProfileConverter_1.ProfileConverter.convertFromService(trc, params, syncContext, profile);
            node = await membershipFromSharedNotebook(trc, params, serviceData, parentNode);
        }
        else if (en_core_entity_types_1.isNote(parentNode)) {
            const data = serviceData;
            if (data.recipientIdentity && data.recipientIdentity.userId) {
                const profile = buildProfileFromServerForSharedNote(data.recipientIdentity.id, data.recipientIdentity.userId);
                await ProfileConverter_1.ProfileConverter.convertFromService(trc, params, syncContext, profile);
            }
            node = await membershipFromSharedNote(trc, params, parentNode.id, data, parentNode);
        }
        else {
            throw conduit_utils_1.absurd(parentNode, `Invalid parentNode for Membership`);
        }
        conduit_storage_1.addInputEdgeToNode(node, 'parent', {
            id: parentNode.id,
            type: parentNode.type,
            port: 'memberships',
        });
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, node);
        return !prevNode;
    }
    async customToService(trc, params, commandRun, syncContext) {
        switch (commandRun.command) {
            case 'RemoveMembership': {
                const membership = (await params.graphTransaction.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.Membership, id: commandRun.params.membership }));
                if (!membership) {
                    return null;
                }
                const parentEdge = conduit_utils_1.firstStashEntry(membership.inputs.parent);
                if (!parentEdge) {
                    throw new Error('No parent edge found');
                }
                const { auth } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, membership);
                switch (parentEdge.srcType) {
                    case en_core_entity_types_1.CoreEntityTypes.Workspace: {
                        return await removeMembershipFromWorkspace(trc, params, auth, parentEdge.srcID, membership);
                    }
                    case en_core_entity_types_1.CoreEntityTypes.Notebook: {
                        return await removeMembershipFromNotebook(trc, params, auth, parentEdge.srcID, membership);
                    }
                    case en_core_entity_types_1.CoreEntityTypes.Note: {
                        return await removeMembershipFromSharedNote(trc, params, auth, parentEdge.srcID, membership);
                    }
                    default: {
                        throw new Error(`Unsupported membership parented to node with type ${parentEdge.srcType}`);
                    }
                }
            }
            default: {
                throw new Error(`Unknown Command ${commandRun.command} for MembershipConverter`);
            }
        }
    }
    async createOnService() {
        throw new Error('Nope');
    }
    async deleteFromService(trc, params, syncContext, ids) {
        for (const id of ids) {
            const membership = await params.graphTransaction.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.Membership, id });
            if (!membership) {
                throw new conduit_utils_1.NotFoundError(id, 'No membership found');
            }
            const parentEdge = conduit_utils_1.firstStashEntry(membership.inputs.parent);
            if (!parentEdge) {
                throw new conduit_utils_1.NotFoundError('No parent edge found');
            }
            if (parentEdge.srcType === en_core_entity_types_1.CoreEntityTypes.Workspace) {
                const workspace = parentEdge.srcID;
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                const workspaceId = Converters_1.convertGuidToService(workspace, en_core_entity_types_1.CoreEntityTypes.Workspace);
                await utilityStore.leaveWorkspace(trc, auth.token, workspaceId);
            }
            else if (parentEdge.srcType === en_core_entity_types_1.CoreEntityTypes.Notebook) {
                const nbID = parentEdge.srcID;
                const serviceGuid = NotebookConverter_1.NotebookConverter.convertGuidToService(nbID);
                const metadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                let noteStoreUrl;
                if (!metadata || !metadata.sharedNotebookGlobalID) {
                    // Either shared notebook that belongs to the same business.
                    // Or internal error, then rely on service backend to reject invalid request.
                    noteStoreUrl = params.personalAuth.urls.noteStoreUrl;
                }
                else {
                    noteStoreUrl = await params.graphTransaction.getSyncState(trc, null, ['sharing', 'sharedNotebooks', metadata.sharedNotebookGlobalID, 'noteStoreUrl']);
                }
                if (!noteStoreUrl) {
                    throw new conduit_utils_1.InvalidOperationError(`notebookLeave: Cannot fetch noteStoreUrl for notebook ${nbID}`);
                }
                const authToken = params.personalAuth.token;
                const noteStore = params.thriftComm.getNoteStore(noteStoreUrl);
                const recipientSettings = new en_conduit_sync_types_1.TNotebookRecipientSettings({ recipientStatus: en_conduit_sync_types_1.TRecipientStatus.NOT_IN_MY_LIST });
                await noteStore.setNotebookRecipientSettings(trc, authToken, serviceGuid, recipientSettings);
                if (metadata && metadata.sharedNotebookGlobalID && en_core_entity_types_1.isLinkedSyncContext(syncContext)) {
                    // clean up linkedNb syncContext for shared nbs to avoid race with a pending invitationAccept
                    const syncStatePath = ['sharing', 'sharedNotebooks', metadata.sharedNotebookGlobalID];
                    await params.graphTransaction.deleteSyncState(trc, syncStatePath);
                    await params.graphTransaction.deleteSyncContext(trc, syncContext);
                    await params.graphTransaction.deleteSyncState(trc, [syncContext]);
                }
            }
        }
        return false;
    }
    async updateToService(trc, params, syncContext, membershipID, diff) {
        const membershipRef = { id: membershipID, type: en_core_entity_types_1.CoreEntityTypes.Membership };
        const membership = await params.graphTransaction.getNode(trc, null, membershipRef);
        const parentEdge = conduit_utils_1.firstStashEntry(membership.inputs.parent);
        if (!parentEdge) {
            throw new Error('No parent edge found');
        }
        if (diff.NodeFields && diff.NodeFields.privilege) {
            const { auth } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, membership);
            switch (parentEdge.srcType) {
                case en_core_entity_types_1.CoreEntityTypes.Workspace: {
                    await updateWorkspaceMembershipPrivilege(trc, params, auth, membershipRef.id, parentEdge.srcID, diff.NodeFields.privilege);
                    break;
                }
                case en_core_entity_types_1.CoreEntityTypes.Notebook: {
                    await updateSharedNotebookMembershipPrivilege(trc, params, auth, parentEdge.srcID, diff.NodeFields.privilege, membership);
                    break;
                }
                case en_core_entity_types_1.CoreEntityTypes.Note: {
                    await updateSharedNoteMembershipPrivilege(trc, params, auth, parentEdge.srcID, diff.NodeFields.privilege, membership);
                    break;
                }
                default: {
                    throw new Error(`Unsupported membership parented to node with type ${parentEdge.srcType}`);
                }
            }
        }
        return false;
    }
    async applyEdgeChangesToService() {
        throw new Error('Nope');
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Membership)
], MembershipConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Membership)
], MembershipConverterClass.prototype, "customToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Membership)
], MembershipConverterClass.prototype, "updateToService", null);
exports.MembershipConverter = new MembershipConverterClass();
//# sourceMappingURL=MembershipConverter.js.map