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
const Membership_1 = require("../NodeTypes/Membership");
const Workspace_1 = require("../NodeTypes/Workspace");
const Profile_1 = require("./Helpers/Profile");
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
        result: null,
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
    requiredParams: {
        label: 'string',
        type: Workspace_1.WorkspaceTypeSchema,
    },
    optionalParams: {
        description: 'string',
        defaultRole: Object.values(MembershipPrivilege_1.MembershipPrivilege),
    },
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
        if (!accountLimits) {
            throw new conduit_utils_1.NotFoundError(AccountLimits_1.ACCOUNT_LIMITS_REF.id, 'Missing limits');
        }
        const currentWorkspaces = accountLimits.NodeFields.Counts.userWorkspaceCount;
        const maxWorkspaces = accountLimits.NodeFields.Limits.userWorkspaceCountMax;
        if (currentWorkspaces >= maxWorkspaces) {
            // TODO: make errors use actual fields once conduit errors are fully separated from thrift errors
            throw new conduit_utils_1.ServiceError('LIMIT_REACHED', EntityConstants_1.CoreEntityTypes.Workspace, 'type=LIMIT_REACHED thriftExceptionParameter=Workspace limit=userWorkspaceCountMax');
        }
        const owner = ctx.vaultUserID;
        const workspaceGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Workspace);
        const workspaceID = workspaceGenID[1];
        const membershipGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Membership);
        const membershipID = membershipGenID[1];
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
        const membershipEntity = ctx.createEntity({ id: membershipID, type: EntityConstants_1.CoreEntityTypes.Membership }, {
            privilege: MembershipPrivilege_1.MembershipPrivilege.MANAGE,
            recipientType: Membership_1.MembershipRecipientType.USER,
            recipientIsMe: true,
        });
        const plan = {
            result: workspaceID,
            ops: [{
                    changeType: 'Node:CREATE',
                    node: workspaceEntity,
                    id: workspaceGenID,
                }],
        };
        if (ctx.isOptimistic) {
            plan.ops.push({
                changeType: 'Node:CREATE',
                node: membershipEntity,
                id: membershipGenID,
            }, {
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: workspaceID, srcType: EntityConstants_1.CoreEntityTypes.Workspace, srcPort: 'memberships',
                        dstID: membershipID, dstType: EntityConstants_1.CoreEntityTypes.Membership, dstPort: 'parent',
                    }],
            });
        }
        return plan;
    },
};
exports.workspaceUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
    },
    optionalParams: {
        label: 'string',
        description: 'string',
        type: Object.values(Workspace_1.WorkspaceType),
        defaultRole: Object.values(MembershipPrivilege_1.MembershipPrivilege),
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
            result: null,
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
    requiredParams: {
        workspace: 'ID',
    },
    optionalParams: {},
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceJoin');
    },
};
exports.workspaceLeave = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const nodeRef = getNodeRef(params.workspace);
        const workspaceEntity = await ctx.fetchEntity(trc, nodeRef);
        const plan = {
            result: null,
            ops: [],
        };
        if (!workspaceEntity) {
            return plan;
        }
        const userMemberships = await ctx.queryGraph(trc, EntityConstants_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', {
            parent: { id: nodeRef.id, type: nodeRef.type },
        });
        for (const ownMembership of userMemberships) {
            plan.ops.push({
                changeType: 'Node:DELETE',
                nodeRef: { id: ownMembership.id, type: EntityConstants_1.CoreEntityTypes.Membership },
            });
        }
        const shortcuts = Object.values(workspaceEntity.outputs.shortcut).map(edge => ({ id: edge.dstID, type: edge.dstType }));
        for (const shortcut of shortcuts) {
            plan.ops.push({
                changeType: 'Node:DELETE',
                nodeRef: { id: shortcut.id, type: shortcut.type },
            });
        }
        // run this operation on remote as well to immediately cleanup node in graph
        // instead of having to wait for expunges to come in next downsync cycle.
        plan.ops.push({
            changeType: 'Node:DELETE',
            nodeRef,
        });
        return plan;
    },
};
exports.workspaceRequestAccess = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
    },
    optionalParams: {},
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceRequestAccess');
    },
};
exports.workspaceInvite = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
        users: 'ID[]',
        privilege: Object.values(MembershipPrivilege_1.MembershipPrivilege),
    },
    optionalParams: {},
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceInvite');
    },
};
exports.workspaceSetLayoutStyle = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
        layoutStyle: Object.values(Workspace_1.WorkspaceLayoutStyle),
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const fields = {
            layoutStyle: params.layoutStyle,
        };
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, fields);
    },
};
exports.workspaceSetNoteDisplayOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
        noteDisplayOrder: 'ID[]',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const fields = {
            noteDisplayOrder: params.noteDisplayOrder,
        };
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, fields);
    },
};
exports.workspaceSetNotebookDisplayOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
        notebookDisplayOrder: 'ID[]',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const fields = {
            notebookDisplayOrder: params.notebookDisplayOrder,
        };
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, fields);
    },
};
exports.workspaceSetViewed = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        return await generateGeneralUpdateExecutionPlan(trc, ctx, params.workspace, { viewed: true });
    },
};
exports.workspacePinnedContentsUpdate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
    },
    optionalParams: {
        noteIDsToAdd: 'ID[]',
        noteIDsToRemove: 'ID[]',
        nbIDsToAdd: 'ID[]',
        nbIDsToRemove: 'ID[]',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceUpdatePinnedContents');
    },
};
exports.workspaceChangePinnedContentPosition = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        workspace: 'ID',
        contentNodeID: 'string',
        index: 'int',
    },
    optionalParams: {},
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return await generateGeneralexecuteOnServicePlan(trc, ctx, params, 'WorkspaceChangePinnedContentPosition');
    },
};
//# sourceMappingURL=WorkspaceMutators.js.map