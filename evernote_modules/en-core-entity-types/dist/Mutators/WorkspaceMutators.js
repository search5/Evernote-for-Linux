"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceChangePinnedContentPosition = exports.workspacePinnedContentsUpdate = exports.workspaceSetViewed = exports.workspaceSetNotebookDisplayOrder = exports.workspaceSetNoteDisplayOrder = exports.workspaceSetLayoutStyle = exports.workspaceInvite = exports.workspaceRequestAccess = exports.workspaceLeave = exports.workspaceJoin = exports.workspaceUpdate = exports.workspaceCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const AccountLimits_1 = require("../AccountLimits");
const EntityConstants_1 = require("../EntityConstants");
const MembershipPrivilege_1 = require("../MembershipPrivilege");
const Workspace_1 = require("../NodeTypes/Workspace");
const MiscHelpers_1 = require("./Helpers/MiscHelpers");
const Profile_1 = require("./Helpers/Profile");
const MutatorHelpers_1 = require("./MutatorHelpers");
function getNodeRef(workspaceID) {
    return { id: workspaceID, type: EntityConstants_1.CoreEntityTypes.Workspace };
}
async function generateGeneralexecuteOnServicePlan(trc, ctx, params, command) {
    if (!ctx.vaultUserID) {
        throw new conduit_utils_1.PermissionError('Must be in a business to use Workspaces');
    }
    return {
        command,
        nodeType: EntityConstants_1.CoreEntityTypes.Workspace,
        params,
        owner: ctx.vaultUserID,
    };
}
async function generateGeneralUpdateExecutionPlan(trc, ctx, workspaceID, fields) {
    const nodeRef = getNodeRef(workspaceID);
    const workspaceEntity = await ctx.fetchEntity(trc, nodeRef);
    if (!workspaceEntity) {
        throw new conduit_utils_1.NotFoundError(workspaceID, 'Not found Workspace node in update process');
    }
    const plan = {
        results: {},
        ops: [
            {
                changeType: 'Node:UPDATE',
                nodeRef,
                node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Workspace, fields),
            },
        ],
    };
    return plan;
}
exports.workspaceCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        label: 'string',
        type: Workspace_1.WorkspaceTypeSchema,
        description: conduit_utils_1.NullableString,
        defaultRole: conduit_utils_1.Nullable(MembershipPrivilege_1.MembershipPrivilegeSchema),
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        if (!ctx.vaultUserID) {
            throw new conduit_utils_1.PermissionError('Must be in a business to create a Workspace');
        }
        if ((params.type === Workspace_1.WorkspaceType.DISCOVERABLE || params.type === Workspace_1.WorkspaceType.INVITE_ONLY) && params.defaultRole) {
            throw new conduit_utils_1.ServiceError('DATA_CONFLICT', EntityConstants_1.CoreEntityTypes.Workspace, 'Workspace.defaultRole');
        }
        if (params.type === Workspace_1.WorkspaceType.OPEN && !params.defaultRole) {
            throw new conduit_utils_1.ServiceError('DATA_REQUIRED', EntityConstants_1.CoreEntityTypes.Workspace, 'Workspace.defaultRole');
        }
        const accountLimits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        MutatorHelpers_1.validateAccountLimits(accountLimits, { userWorkspaceCountChange: 1 });
        const owner = ctx.vaultUserID;
        const workspaceGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Workspace);
        const workspaceID = workspaceGenID[1];
        const profile = await Profile_1.getAccountProfileRef(trc, ctx);
        const workspaceEntity = ctx.createEntity({ id: workspaceID, type: EntityConstants_1.CoreEntityTypes.Workspace }, {
            label: params.label,
            created: ctx.timestamp,
            updated: ctx.timestamp,
            description: params.description || '',
            workspaceType: params.type,
            defaultRole: params.defaultRole,
            // optimistically count active business user as a share when creating new workspace like service does.
            internal_shareCountProfiles: ctx.isOptimistic && ctx.vaultUserID && profile ? { [profile.id]: 1 } : {},
        });
        const plan = {
            results: {
                result: workspaceID,
            },
            ops: [{
                    changeType: 'Node:CREATE',
                    node: workspaceEntity,
                    id: workspaceGenID,
                }],
        };
        if (ctx.isOptimistic && profile) {
            const membershipOps = await MutatorHelpers_1.createMembershipOps(trc, ctx, owner, {
                privilege: MembershipPrivilege_1.MembershipPrivilege.MANAGE,
                recipientIsMe: true,
                parentRef: { id: workspaceID, type: EntityConstants_1.CoreEntityTypes.Workspace },
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
exports.workspaceUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        label: conduit_utils_1.NullableString,
        description: conduit_utils_1.NullableString,
        type: conduit_utils_1.Nullable(Workspace_1.WorkspaceTypeSchema),
        defaultRole: conduit_utils_1.Nullable(MembershipPrivilege_1.MembershipPrivilegeSchema),
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = getNodeRef(params.workspace);
        const workspaceEntity = await ctx.fetchEntity(trc, nodeRef);
        if (!workspaceEntity) {
            throw new conduit_utils_1.NotFoundError(params.workspace, 'Not found Workspace node in update');
        }
        const isTypeOpen = params.type && params.type === Workspace_1.WorkspaceType.OPEN;
        const isNotTypeOpen = params.type && params.type !== Workspace_1.WorkspaceType.OPEN;
        if (isNotTypeOpen && params.defaultRole) {
            throw new conduit_utils_1.ServiceError('DATA_CONFLICT', EntityConstants_1.CoreEntityTypes.Workspace, 'Workspace.defaultRole');
        }
        if (isTypeOpen && !params.defaultRole) {
            throw new conduit_utils_1.ServiceError('DATA_REQUIRED', EntityConstants_1.CoreEntityTypes.Workspace, 'Workspace.defaultRole');
        }
        if (!params.type && params.defaultRole && workspaceEntity.NodeFields.workspaceType !== Workspace_1.WorkspaceType.OPEN) {
            throw new conduit_utils_1.ServiceError('DATA_CONFLICT', EntityConstants_1.CoreEntityTypes.Workspace, 'Workspace.defaultRole');
        }
        const defaultRole = isNotTypeOpen ? null : params.defaultRole;
        const fields = {
            label: params.label,
            updated: ctx.timestamp,
            description: params.description,
            workspaceType: params.type,
            defaultRole,
        };
        const plan = {
            results: {},
            ops: [
                {
                    changeType: 'Node:UPDATE',
                    nodeRef,
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Workspace, fields),
                },
            ],
        };
        if (ctx.isOptimistic && params.label) {
            const memberships = await ctx.traverseGraph(trc, nodeRef, [{
                    edge: ['outputs', 'memberships'],
                    type: EntityConstants_1.CoreEntityTypes.Membership,
                }]);
            const memField = {
                label: params.label,
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
exports.workspaceJoin = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceJoin');
    },
};
exports.workspaceLeave = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const nodeRef = getNodeRef(params.workspace);
        const workspaceEntity = await ctx.fetchEntity(trc, nodeRef);
        const plan = {
            results: {},
            ops: [],
        };
        if (!workspaceEntity) {
            return plan;
        }
        await MiscHelpers_1.genEntityLeaveOps(trc, ctx, workspaceEntity, plan);
        return plan;
    },
};
exports.workspaceRequestAccess = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceRequestAccess');
    },
};
exports.workspaceInvite = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        users: conduit_utils_1.ListOf('ID'),
        privilege: MembershipPrivilege_1.MembershipPrivilegeSchema,
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceInvite');
    },
};
exports.workspaceSetLayoutStyle = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        layoutStyle: Workspace_1.WorkspaceLayoutStyleSchema,
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            layoutStyle: params.layoutStyle,
        };
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, fields);
    },
};
exports.workspaceSetNoteDisplayOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        noteDisplayOrder: conduit_utils_1.ListOf('ID'),
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            noteDisplayOrder: params.noteDisplayOrder,
        };
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, fields);
    },
};
exports.workspaceSetNotebookDisplayOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        notebookDisplayOrder: conduit_utils_1.ListOf('ID'),
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            notebookDisplayOrder: params.notebookDisplayOrder,
        };
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, fields);
    },
};
exports.workspaceSetViewed = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
    },
    execute: async (trc, ctx, params) => {
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, { viewed: true });
    },
};
exports.workspacePinnedContentsUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        noteIDsToAdd: conduit_utils_1.NullableListOf('ID'),
        noteIDsToRemove: conduit_utils_1.NullableListOf('ID'),
        nbIDsToAdd: conduit_utils_1.NullableListOf('ID'),
        nbIDsToRemove: conduit_utils_1.NullableListOf('ID'),
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceUpdatePinnedContents');
    },
};
exports.workspaceChangePinnedContentPosition = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        workspace: 'ID',
        contentNodeID: 'string',
        index: 'int',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceChangePinnedContentPosition');
    },
};
//# sourceMappingURL=WorkspaceMutators.js.map