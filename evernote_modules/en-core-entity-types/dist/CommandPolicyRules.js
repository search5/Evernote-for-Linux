"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandPolicyOfSpace = exports.commandPolicyOfNotebook = exports.commandPolicyOfNote = exports.computePermission = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("./EntityConstants");
const MembershipPrivilege_1 = require("./MembershipPrivilege");
const Membership_1 = require("./NodeTypes/Membership");
const Notebook_1 = require("./NodeTypes/Notebook");
const User_1 = require("./NodeTypes/User");
const ShareUtils_1 = require("./ShareUtils");
async function isUnpaidUser(context) {
    const user = await context.getUserNode();
    if (!user) {
        throw new Error('User data is not populated yet.');
    }
    return user.NodeFields.privilege === User_1.PrivilegeLevel.NORMAL;
}
function isUserSyncContext(node) {
    return node.syncContexts.includes(conduit_core_1.PERSONAL_USER_CONTEXT);
}
function isBusinessSyncContext(node) {
    return node.syncContexts.includes(conduit_core_1.VAULT_USER_CONTEXT);
}
function isSharedSyncContext(node) {
    for (const syncContext of node.syncContexts) {
        if (syncContext.split(':')[0] === 'SharedNote') {
            return true;
        }
    }
    return false;
}
async function getParent(node, context) {
    const parentEdge = conduit_utils_1.firstStashEntry(node.inputs.parent);
    if (!parentEdge) {
        return null;
    }
    return await context.getNode({ type: parentEdge.srcType, id: parentEdge.srcID });
}
async function computePermission(node, context) {
    if (!node.outputs.memberships) {
        throw new conduit_utils_1.InvalidParameterError(`computePermission only works with entities that have memberships`);
    }
    const memberships = await ShareUtils_1.getOwnMemberships(node, context);
    let highestPermission = MembershipPrivilege_1.MembershipPrivilege.READ;
    for (const membership of memberships) {
        if (membership && [Membership_1.MembershipRecipientType.USER, Membership_1.MembershipRecipientType.BUSINESS].includes(membership.NodeFields.recipientType)) {
            highestPermission = MembershipPrivilege_1.highestPrivilege(membership.NodeFields.privilege, highestPermission);
        }
        if (highestPermission === MembershipPrivilege_1.MembershipPrivilege.MANAGE) {
            break;
        }
    }
    return highestPermission;
}
exports.computePermission = computePermission;
async function permissionOf(node, permissionContext, ancestors) {
    let nodePermission = await computePermission(node, permissionContext);
    let parentPermission = MembershipPrivilege_1.MembershipPrivilege.READ;
    for (const parent of ancestors) {
        if (parent) {
            parentPermission = MembershipPrivilege_1.highestPrivilege(parentPermission, await computePermission(parent, permissionContext));
        }
        if (parentPermission === MembershipPrivilege_1.MembershipPrivilege.MANAGE) {
            break;
        }
    }
    if (node.type === EntityConstants_1.CoreEntityTypes.Note) {
        // The only way a note has higher permission than its container is via sharing
        const isShared = isSharedSyncContext(node);
        nodePermission = isShared ? MembershipPrivilege_1.highestPrivilege(nodePermission, parentPermission) : parentPermission;
    }
    else {
        nodePermission = MembershipPrivilege_1.highestPrivilege(nodePermission, parentPermission);
    }
    return { nodePermission, parentPermission };
}
async function commandPolicyOfNote(noteID, context) {
    const note = await context.getNode({ id: noteID, type: EntityConstants_1.CoreEntityTypes.Note });
    if (!note) {
        return {
            canDuplicate: false,
            canEditContent: false,
            canEditLabel: false,
            canEmail: false,
            canExpunge: false,
            canMove: false,
            canMoveToTrash: false,
            canRestoreFromTrash: false,
            canSeeVersionHistory: false,
            canShare: false,
            canSharePublicly: false,
            canTag: false,
            canCreateTag: false,
            canUpdateMetadata: false,
        };
    }
    const inTrash = Boolean(note.NodeFields.deleted);
    const isNoteEditable = !inTrash;
    // owned by personal account
    if (isUserSyncContext(note)) {
        return {
            canDuplicate: true,
            canEditContent: isNoteEditable,
            canEditLabel: isNoteEditable,
            canEmail: true,
            canExpunge: true,
            canMove: true,
            canMoveToTrash: !inTrash,
            canRestoreFromTrash: inTrash,
            canSeeVersionHistory: !(await isUnpaidUser(context)),
            canShare: true,
            canSharePublicly: true,
            canTag: !inTrash,
            canCreateTag: !inTrash,
            canUpdateMetadata: true,
        };
    }
    // Learn move privilege via its parent's permission when user does not own this note.
    const noteParent = await getParent(note, context);
    let notebookParent = null;
    if (noteParent && Notebook_1.isNotebook(noteParent)) {
        // fetch possible notebook's parent if note belongs to notebook.
        notebookParent = await getParent(noteParent, context);
    }
    const { nodePermission, parentPermission } = await permissionOf(note, context, [noteParent, notebookParent]);
    const isBusinessContext = isBusinessSyncContext(note);
    const parentFullControl = MembershipPrivilege_1.MembershipPrivilege.MANAGE === parentPermission;
    const parentEditable = parentFullControl || MembershipPrivilege_1.MembershipPrivilege.EDIT === parentPermission;
    // owned by either business or someone else (shared entity)
    switch (nodePermission) {
        case MembershipPrivilege_1.MembershipPrivilege.MANAGE:
            return {
                canDuplicate: parentEditable,
                canEditContent: isNoteEditable,
                canEditLabel: isNoteEditable,
                canEmail: isBusinessContext,
                canExpunge: false,
                canMove: parentEditable,
                canMoveToTrash: parentEditable && !inTrash,
                canRestoreFromTrash: isBusinessContext && inTrash,
                canSeeVersionHistory: isBusinessContext,
                canShare: true,
                canSharePublicly: true,
                // allow users to tag notes inside shared notebook.
                canTag: (isBusinessContext || noteParent !== null) && !inTrash,
                canCreateTag: isBusinessContext && !inTrash,
                canUpdateMetadata: true,
            };
        case MembershipPrivilege_1.MembershipPrivilege.EDIT:
            return {
                canDuplicate: parentEditable,
                canEditContent: isNoteEditable,
                canEditLabel: isNoteEditable,
                canEmail: isBusinessContext,
                canExpunge: false,
                canMove: parentEditable,
                canMoveToTrash: parentEditable && !inTrash,
                canRestoreFromTrash: isBusinessContext && inTrash,
                canSeeVersionHistory: isBusinessContext,
                canShare: false,
                canSharePublicly: false,
                // allow users to tag notes inside shared notebook.
                canTag: (isBusinessContext || noteParent !== null) && !inTrash,
                canCreateTag: isBusinessContext && !inTrash,
                canUpdateMetadata: true,
            };
        case MembershipPrivilege_1.MembershipPrivilege.READ:
        default:
            return {
                canDuplicate: parentEditable,
                canEditContent: false,
                canEditLabel: false,
                canEmail: false,
                canExpunge: false,
                canMove: false,
                canMoveToTrash: false,
                canRestoreFromTrash: false,
                canSeeVersionHistory: false,
                canShare: false,
                canSharePublicly: false,
                canTag: false,
                canCreateTag: false,
                canUpdateMetadata: false,
            };
    }
}
exports.commandPolicyOfNote = commandPolicyOfNote;
async function commandPolicyOfNotebook(nbID, context) {
    const nbNode = await context.getNode({ id: nbID, type: EntityConstants_1.CoreEntityTypes.Notebook });
    if (!nbNode || nbNode.NodeFields.isPartialNotebook) {
        return {
            canCreateFolder: false,
            canCreateNote: false,
            canEditLabel: false,
            canExpunge: false,
            canLeave: false,
            canMakeDefault: false,
            canMove: false,
            canSetDefaultPrivilege: false,
            canShare: false,
            canStack: false,
            canStore: false,
            canUpdateDescription: false,
            canUpdateType: false,
        };
    }
    const isDefaultNotebook = Object.keys(nbNode.inputs.userForDefaultNotebook).length > 0;
    if (isUserSyncContext(nbNode)) {
        return {
            canCreateFolder: false,
            canCreateNote: true,
            canEditLabel: true,
            canLeave: false,
            canExpunge: !isDefaultNotebook,
            canMakeDefault: !isDefaultNotebook,
            canMove: false,
            canSetDefaultPrivilege: false,
            canShare: true,
            canStack: true,
            canStore: true,
            canUpdateDescription: false,
            canUpdateType: false,
        };
    }
    const isUserNotebook = Object.keys(nbNode.inputs.userForUserNotebook).length > 0;
    // Learn move privilege via its parent's permission when user does not own this notebook.
    const parentNodeAndContext = await getParent(nbNode, context);
    const isBusinessNotebook = isBusinessSyncContext(nbNode);
    // Shared notebooks OR notebooks in unknown space cannot be moved.
    const { nodePermission: nbPermission, parentPermission } = await permissionOf(nbNode, context, [parentNodeAndContext]);
    const notebookFullControl = !nbNode.NodeFields.inWorkspace && MembershipPrivilege_1.MembershipPrivilege.MANAGE === nbPermission;
    const nbParentFullControl = MembershipPrivilege_1.MembershipPrivilege.MANAGE === parentPermission;
    const canMove = isBusinessNotebook && !isUserNotebook && (notebookFullControl || nbParentFullControl);
    // notebook either is shared or belongs to business here.
    const canLeave = !isUserNotebook && !isDefaultNotebook && (!isBusinessNotebook || !nbNode.NodeFields.inWorkspace || !parentNodeAndContext);
    switch (nbPermission) {
        case MembershipPrivilege_1.MembershipPrivilege.MANAGE:
            return {
                canCreateFolder: false,
                canCreateNote: true,
                canEditLabel: isBusinessNotebook,
                canExpunge: false,
                canLeave,
                canMakeDefault: isBusinessNotebook && !isDefaultNotebook,
                canMove,
                canSetDefaultPrivilege: false,
                canShare: !isUserNotebook,
                canStack: true,
                canStore: isBusinessNotebook,
                canUpdateDescription: false,
                canUpdateType: false,
            };
        case MembershipPrivilege_1.MembershipPrivilege.EDIT:
            return {
                canCreateFolder: false,
                canCreateNote: true,
                canEditLabel: isBusinessNotebook,
                canExpunge: false,
                canLeave,
                canMakeDefault: isBusinessNotebook && !isDefaultNotebook,
                canMove,
                canSetDefaultPrivilege: false,
                canShare: false,
                canStack: true,
                canStore: isBusinessNotebook,
                canUpdateDescription: false,
                canUpdateType: false,
            };
        case MembershipPrivilege_1.MembershipPrivilege.READ:
        default:
            return {
                canCreateFolder: false,
                canCreateNote: false,
                canEditLabel: false,
                canExpunge: false,
                canLeave,
                canMakeDefault: false,
                canMove: false,
                canSetDefaultPrivilege: false,
                canShare: false,
                canStack: true,
                canStore: false,
                canUpdateDescription: false,
                canUpdateType: false,
            };
    }
}
exports.commandPolicyOfNotebook = commandPolicyOfNotebook;
async function commandPolicyOfSpace(spaceID, context) {
    const node = await context.getNode({ id: spaceID, type: EntityConstants_1.CoreEntityTypes.Workspace });
    if (!node) {
        return {
            canCreateFolder: false,
            canCreateNote: false,
            canEditLabel: false,
            canExpunge: false,
            canLeave: false,
            canMakeDefault: false,
            canMove: false,
            canSetDefaultPrivilege: false,
            canShare: false,
            canStack: false,
            canStore: false,
            canUpdateDescription: false,
            canUpdateType: false,
        };
    }
    if (isUserSyncContext(node)) {
        // todo(log or signal) personal accounts should not have space atm.
    }
    const { nodePermission } = await permissionOf(node, context, []);
    switch (nodePermission) {
        case MembershipPrivilege_1.MembershipPrivilege.MANAGE:
            return {
                canCreateFolder: true,
                canCreateNote: true,
                canEditLabel: true,
                canExpunge: false,
                canLeave: true,
                canMakeDefault: false,
                canMove: false,
                canSetDefaultPrivilege: true,
                canShare: true,
                canStack: false,
                canStore: true,
                canUpdateDescription: true,
                canUpdateType: true,
            };
        case MembershipPrivilege_1.MembershipPrivilege.EDIT:
            return {
                canCreateFolder: true,
                canCreateNote: true,
                canEditLabel: true,
                canExpunge: false,
                canLeave: true,
                canMakeDefault: false,
                canMove: false,
                canSetDefaultPrivilege: false,
                canShare: false,
                canStack: false,
                canStore: true,
                canUpdateDescription: true,
                canUpdateType: false,
            };
        case MembershipPrivilege_1.MembershipPrivilege.READ:
        default:
            return {
                canCreateFolder: false,
                canCreateNote: false,
                canEditLabel: false,
                canExpunge: false,
                canLeave: true,
                canMakeDefault: false,
                canMove: false,
                canSetDefaultPrivilege: false,
                canShare: false,
                canStack: false,
                canStore: false,
                canUpdateDescription: false,
                canUpdateType: false,
            };
    }
}
exports.commandPolicyOfSpace = commandPolicyOfSpace;
//# sourceMappingURL=CommandPolicyRules.js.map