"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceNodesAndEdges = void 0;
const getWorkspaceNodesAndEdges = async (trc, instance, context) => {
    throw new Error('Workspace nsync conversion not yet supported');
    /*
    const id = instance.ref.id as NodeID;
    if (!id) {
      throw new Error('Missing workspace id');
    }
    const oldNode = await context.tx.getNode<Workspace>(trc, null, { id, type: CoreEntityTypes.Workspace });
    const viewed = oldNode?.NodeFields.viewed ?? false;
    const shareCountProfiles = oldNode?.NodeFields.internal_shareCountProfiles ?? {};
    const workspace = convertNsyncEntityToNode<Workspace>(instance, context);
    if (!workspace) {
      logger.error('Missing initial values');
      return null;
    }
    const workspaceType: WorkspaceType|undefined = NSyncWorkspaceTypeMap[instance.workspaceType];
    if (!workspaceType) {
      throw new Error(`Missing workspace type: ${instance.workspaceType}`);
    }
    let defaultRole: Maybe<MembershipPrivilege> = null;
    if (instance.defaultRole) {
      defaultRole = NSyncPrivilegeMap[instance.defaultRole] ?? null;
      if (!defaultRole) {
        logger.warn(`Missing defaultRole in map: ${instance.defaultRole}`);
      }
    }
  
    workspace.NodeFields.defaultRole = defaultRole;
    workspace.NodeFields.workspaceType = workspaceType;
    workspace.NodeFields.viewed = viewed;
    workspace.NodeFields.internal_shareCountProfiles = shareCountProfiles;
  
    // TODO v2: Add edge to instance manager
    // manager: Number(instance.manager) as UserID,
    return { nodes: { nodesToUpsert: [workspace], nodesToDelete: [] }};
    */
};
exports.getWorkspaceNodesAndEdges = getWorkspaceNodesAndEdges;
//# sourceMappingURL=WorkspaceConverter.js.map