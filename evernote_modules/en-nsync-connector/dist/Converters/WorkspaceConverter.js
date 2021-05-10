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
    const initial = createInitialNode(instance);
    if (!initial) {
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
    const node: Workspace = {
      ...initial,
      type: CoreEntityTypes.Workspace,
      NodeFields: {
        accessStatus: WorkspaceAccessStatus.OPEN, // TODO v2: remove
        created: instance.created,
        updated: instance.updated,
        description: instance.description || '',
        defaultRole,
        isSample: instance.isSample,
        notesCount: 0, // TODO v2: remove?
        notebooksCount: 0, // TODO v2: remove?
        workspaceType,
        viewed,
        internal_shareCountProfiles: shareCountProfiles,
      },
      inputs: {},
      outputs: {
        children: {},
        childrenInTrash: {}, // TODO v2: remove
        memberships: {},
        shortcut: {},
        // pinnedContents: {}, // TODO v2: put back in
        manager: {},
      },
      CacheFields: undefined, // TODO
    };
  
    // TODO v2: Add edge to instance manager
    // manager: Number(instance.manager) as UserID,
    return { nodes: { nodesToUpsert: [node], nodesToDelete: [] }};
    */
};
exports.getWorkspaceNodesAndEdges = getWorkspaceNodesAndEdges;
//# sourceMappingURL=WorkspaceConverter.js.map