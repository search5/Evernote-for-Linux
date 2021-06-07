"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notebookPublish = exports.notebookJoin = exports.notebookUnpublish = exports.notebookAcceptInvite = exports.notebookChangeInAppReminderSetting = exports.notebookChangeEmailReminderSetting = exports.notebookSetDisplayColor = exports.notebookSetNoteDisplayOrder = exports.notebookSetAsDefault = exports.notebookLeave = exports.notebookInvite = exports.notebookRemoveFromWorkspace = exports.notebookMoveToWorkspace = exports.notebookDelete = exports.notebookRename = exports.notebookCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const AccountLimits_1 = require("../AccountLimits");
const CommandPolicyRules_1 = require("../CommandPolicyRules");
const EntityConstants_1 = require("../EntityConstants");
const ShareUtils_1 = require("../ShareUtils");
const MiscHelpers_1 = require("./Helpers/MiscHelpers");
const NoteMutatorHelpers_1 = require("./Helpers/NoteMutatorHelpers");
const Profile_1 = require("./Helpers/Profile");
const MutatorHelpers_1 = require("./MutatorHelpers");
function getParentID(notebook) {
    const parentEdge = conduit_utils_1.firstStashEntry(notebook.inputs.parent);
    return parentEdge ? parentEdge.srcID : null;
}
async function genericNotebookUpdatePlan(trc, ctx, noteID, fields) {
    const nodeRef = { id: noteID, type: EntityConstants_1.CoreEntityTypes.Notebook };
    const notebook = await ctx.fetchEntity(trc, nodeRef);
    if (!notebook) {
        throw new conduit_utils_1.NotFoundError(noteID, 'Missing note');
    }
    const plan = {
        results: {},
        ops: [{
                changeType: 'Node:UPDATE',
                nodeRef: { id: notebook.id, type: notebook.type },
                node: ctx.assignFields(notebook.type, fields),
            }],
    };
    return plan;
}
exports.notebookCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        label: 'string',
        container: conduit_utils_1.NullableID,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        const container = params.container ? await ctx.fetchEntity(trc, { id: params.container, type: EntityConstants_1.CoreEntityTypes.Workspace }) : null;
        /*
        // race condition in syncing causes memberships to not be there to check for the
        // container's privilege in some automated tests. Try this again once nsync is in
        if (container) {
          const permContext: MutationPermissionContext = new MutationPermissionContext(trc, ctx);
          const policy = await commandPolicyOfSpace(container.id, permContext);
          if (!policy.canCreateFolder) {
            throw new PermissionError('Permission Denied: cannot create notebook in this space');
          }
        }
        */
        // Check account limits
        const limits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        MutatorHelpers_1.validateAccountLimits(limits, { userNotebookCountChange: 1 });
        // determine which account this notebook should be created in
        const owner = container || ctx.vaultUserID || ctx.userID;
        const notebookGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Notebook);
        const notebookID = notebookGenID[1];
        const profile = await Profile_1.getAccountProfileRef(trc, ctx);
        const notebookEntity = ctx.createEntity({ id: notebookID, type: EntityConstants_1.CoreEntityTypes.Notebook }, {
            label: params.label,
            created: ctx.timestamp,
            updated: ctx.timestamp,
            inWorkspace: Boolean(container),
            // optimistically count active business user as a share when creating new orphan notebook like service does.
            internal_shareCountProfiles: ctx.isOptimistic && ctx.vaultUserID && !container && profile ? { [profile.id]: 1 } : {},
        });
        const plan = {
            results: {
                result: notebookID,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: notebookEntity,
                    id: notebookGenID,
                    remoteFields: {
                        workspaceID: container === null || container === void 0 ? void 0 : container.id,
                    },
                }],
        };
        if (ctx.isOptimistic) {
            // TODO(ME) need to change creator from an edge to a UserID field with auto-resolver for traversal
            if (profile) {
                plan.ops.push({
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: notebookID, srcType: notebookEntity.type, srcPort: 'creator',
                            dstID: profile.id, dstType: profile.type, dstPort: null,
                        }],
                });
            }
        }
        if (container) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: container.id, srcType: container.type, srcPort: 'children',
                        dstID: notebookID, dstType: notebookEntity.type, dstPort: 'parent',
                    }],
            });
        }
        else if (ctx.isOptimistic && ctx.vaultUserID && profile) {
            const membershipOps = await MutatorHelpers_1.createMembershipOps(trc, ctx, owner, {
                recipientIsMe: true,
                privilege: en_conduit_sync_types_1.MembershipPrivilege.MANAGE,
                parentRef: { id: notebookID, type: EntityConstants_1.CoreEntityTypes.Notebook },
                profileEdgeMap: {
                    recipient: profile.id,
                    sharer: profile.id,
                },
            });
            plan.ops.push(...membershipOps);
        }
        return plan;
    },
};
exports.notebookRename = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        label: 'string',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing notebook on rename');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNotebook(notebook.id, permContext);
        if (!policy.canEditLabel) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit notebook label');
        }
        const fields = {
            updated: ctx.timestamp,
            label: params.label,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Notebook, fields),
                }],
        };
        if (ctx.isOptimistic) {
            const memberships = await ctx.traverseGraph(trc, nodeRef, [{
                    edge: ['outputs', 'memberships'],
                    type: EntityConstants_1.CoreEntityTypes.Membership,
                }]);
            const memField = {
                label: params.label || '',
            };
            for (const membership of memberships) {
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: membership.id, type: EntityConstants_1.CoreEntityTypes.Membership },
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Membership, memField),
                });
            }
        }
        return plan;
    },
};
exports.notebookDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(params.notebook, 'missing notebook in delete');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNotebook(notebook.id, permContext);
        if (!policy.canExpunge) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot delete notebook');
        }
        const plan = {
            results: {},
            ops: [],
        };
        const children = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'children'], type: EntityConstants_1.CoreEntityTypes.Note }]);
        // in optimistic we need to mimic what the monolith will be doing internally (moving notes in the notebook to trash / default notebook)
        if (ctx.isOptimistic) {
            const childrenInTrash = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'childrenInTrash'], type: EntityConstants_1.CoreEntityTypes.Note }]);
            // move notes to trash and change parent to default nb.
            const defaultNotebook = await ctx.traverseGraph(trc, { id: conduit_core_1.PERSONAL_USER_ID, type: EntityConstants_1.CoreEntityTypes.User }, [{
                    edge: ['outputs', 'defaultNotebook'],
                    type: EntityConstants_1.CoreEntityTypes.Notebook,
                }]);
            // move notes to trash (will also move to default nb)
            for (const child of children) {
                await NoteMutatorHelpers_1.genNoteMoveToTrashOps(trc, ctx, child, plan.ops, defaultNotebook.length ? defaultNotebook[0] : undefined);
            }
            // change parent to default nb for children already in the trash
            if (defaultNotebook.length) {
                for (const child of childrenInTrash) {
                    plan.ops.push({
                        changeType: 'Edge:MODIFY',
                        edgesToCreate: [{
                                srcID: defaultNotebook[0].id, srcType: defaultNotebook[0].type, srcPort: 'childrenInTrash',
                                dstID: child.id, dstType: child.type, dstPort: 'parent',
                            }],
                        edgesToDelete: [{
                                dstID: child.id, dstType: child.type, dstPort: 'parent',
                            }],
                    });
                }
            }
        }
        else {
            // TODO: clean this part when migrating the logic to Conduit v2
            plan.ops.push({
                changeType: 'Custom',
                commandName: 'taskNotesMoveToTrash',
                params: {
                    noteIDs: children.map(child => child.id),
                },
            });
        }
        // delete the notebook
        plan.ops.push({
            changeType: 'Node:DELETE',
            nodeRef,
        });
        return plan;
    },
};
exports.notebookMoveToWorkspace = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        workspace: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(params.notebook, 'missing notebook in delete');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNotebook(notebook.id, permContext);
        if (!policy.canMove) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot move notebook');
        }
        const workspace = await ctx.fetchEntity(trc, { id: params.workspace, type: EntityConstants_1.CoreEntityTypes.Workspace });
        const fields = {
            inWorkspace: true,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [{
                            dstID: notebook.id, dstType: EntityConstants_1.CoreEntityTypes.Notebook, dstPort: 'parent',
                        }],
                }, {
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(notebook.type, fields),
                }],
        };
        if (workspace) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: workspace.id, srcType: workspace.type, srcPort: 'children',
                        dstID: notebook.id, dstType: notebook.type, dstPort: 'parent',
                    }],
            });
        }
        return plan;
    },
};
exports.notebookRemoveFromWorkspace = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        workspace: conduit_utils_1.NullableID,
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(params.notebook, 'missing notebook in remove');
        }
        const workspaceID = params.workspace || getParentID(notebook);
        if (!workspaceID) {
            throw new conduit_utils_1.MissingParameterError('missing workspaceID in remove. no parent');
        }
        const workspace = await ctx.fetchEntity(trc, { id: workspaceID, type: EntityConstants_1.CoreEntityTypes.Workspace });
        if (!workspace) {
            throw new conduit_utils_1.NotFoundError(workspaceID, 'missing workspace');
        }
        const fields = {
            inWorkspace: false,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [{
                            srcID: workspace.id, srcType: workspace.type, srcPort: 'children',
                            dstID: notebook.id, dstType: notebook.type, dstPort: 'parent',
                        }],
                }, {
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(notebook.type, fields),
                }],
        };
        if (ctx.isOptimistic && ctx.vaultUserID) {
            const ownMemberships = await ctx.queryGraph(trc, EntityConstants_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', { parent: { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook } });
            if (!ownMemberships.length) {
                const owner = ctx.vaultUserID;
                const profile = await Profile_1.getAccountProfileRef(trc, ctx);
                if (conduit_utils_1.isNullish(profile)) {
                    throw new conduit_utils_1.NotFoundError('', 'Failed to find current user profile');
                }
                const membershipOps = await MutatorHelpers_1.createMembershipOps(trc, ctx, owner, {
                    recipientIsMe: true,
                    privilege: en_conduit_sync_types_1.MembershipPrivilege.MANAGE,
                    parentRef: { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook },
                    profileEdgeMap: {
                        recipient: profile.id,
                        sharer: profile.id,
                    },
                });
                plan.ops.push(...membershipOps);
            }
        }
        return plan;
    },
};
exports.notebookInvite = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        privilege: en_conduit_sync_types_1.MembershipPrivilegeSchema,
        emails: conduit_utils_1.NullableListOf('string'),
        userIDs: conduit_utils_1.NullableListOf('ID'),
        profileIDs: conduit_utils_1.NullableListOf('ID'),
        message: conduit_utils_1.NullableString,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.message = (_a = paramsIn.message) !== null && _a !== void 0 ? _a : '';
    },
    executeOnService: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing notebook in invite');
        }
        return {
            command: 'NotebookInvite',
            nodeType: EntityConstants_1.CoreEntityTypes.Notebook,
            params,
            owner: nodeRef,
        };
    },
    execute: null,
};
exports.notebookLeave = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing notebook in leave');
        }
        const plan = {
            results: {},
            ops: [],
        };
        await MiscHelpers_1.genEntityLeaveOps(trc, ctx, notebook, plan);
        return plan;
    },
};
exports.notebookSetAsDefault = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing notebook in set as default');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNotebook(notebook.id, permContext);
        if (!policy.canMakeDefault) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot make notebook default');
        }
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            // TODO(ME) need to figure out what to do with these User-attached edges...
                            srcID: conduit_core_1.PERSONAL_USER_ID, srcType: EntityConstants_1.CoreEntityTypes.User, srcPort: 'defaultNotebook',
                            dstID: nodeRef.id, dstType: EntityConstants_1.CoreEntityTypes.Notebook, dstPort: 'userForDefaultNotebook',
                        }],
                    edgesToDelete: [{
                            // TODO(ME) need to figure out what to do with these User-attached edges...
                            srcID: conduit_core_1.PERSONAL_USER_ID, srcType: EntityConstants_1.CoreEntityTypes.User, srcPort: 'defaultNotebook',
                        }],
                }],
        };
        return plan;
    },
};
exports.notebookSetNoteDisplayOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        noteDisplayOrder: conduit_utils_1.ListOf('ID'),
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            noteDisplayOrder: params.noteDisplayOrder,
        };
        return genericNotebookUpdatePlan(trc, ctx, params.notebook, fields);
    },
};
exports.notebookSetDisplayColor = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        displayColor: 'int',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            displayColor: params.displayColor,
        };
        return genericNotebookUpdatePlan(trc, ctx, params.notebook, fields);
    },
};
exports.notebookChangeEmailReminderSetting = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        emailReminder: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            reminderNotifyEmail: params.emailReminder,
        };
        return genericNotebookUpdatePlan(trc, ctx, params.notebook, fields);
    },
};
exports.notebookChangeInAppReminderSetting = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        inAppReminder: 'boolean',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            reminderNotifyInApp: params.inAppReminder,
        };
        return genericNotebookUpdatePlan(trc, ctx, params.notebook, fields);
    },
};
exports.notebookAcceptInvite = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing notebook in graph');
        }
        if (!notebook.NodeFields.isPartialNotebook) {
            throw new Error('notebookAcceptInvite operation is only valid for partial notebooks');
        }
        return {
            command: 'NotebookAcceptShare',
            nodeType: EntityConstants_1.CoreEntityTypes.Notebook,
            params,
            owner: nodeRef,
        };
    },
};
exports.notebookUnpublish = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
    },
    executeOnService: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing notebook to unpublish');
        }
        return {
            command: 'NotebookUnpublish',
            nodeType: EntityConstants_1.CoreEntityTypes.Notebook,
            params,
            owner: nodeRef,
        };
    },
    execute: null,
};
exports.notebookJoin = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        if (!params.notebook) {
            throw new conduit_utils_1.MissingParameterError('missing notebook id');
        }
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        return {
            command: 'NotebookJoin',
            nodeType: EntityConstants_1.CoreEntityTypes.Notebook,
            params,
            owner: nodeRef,
        };
    },
};
exports.notebookPublish = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notebook: 'ID',
        description: 'string',
        privilege: en_conduit_sync_types_1.MembershipPrivilegeSchema,
        recommended: conduit_utils_1.NullableBoolean,
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const nodeRef = { id: params.notebook, type: EntityConstants_1.CoreEntityTypes.Notebook };
        const notebook = await ctx.fetchEntity(trc, nodeRef);
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'missing notebook to publish');
        }
        return {
            command: 'NotebookPublish',
            nodeType: EntityConstants_1.CoreEntityTypes.Notebook,
            params,
            owner: nodeRef,
        };
    },
};
//# sourceMappingURL=NotebookMutators.js.map