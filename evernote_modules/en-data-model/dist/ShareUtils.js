"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharerID = exports.getRecipientID = exports.getOwnerID = exports.getOwnMemberships = exports.getAncestors = exports.getParent = exports.MutationPermissionContext = exports.GraphQLPermissionContext = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("./EntityConstants");
const Notebook_1 = require("./NodeTypes/Notebook");
const Workspace_1 = require("./NodeTypes/Workspace");
// Adapter for GraphQLContext
class GraphQLPermissionContext {
    constructor(context) {
        this.context = context;
        if (!context.db) {
            throw new Error('Unable to use a null db in context');
        }
        conduit_core_1.validateDB(context, 'Invalid db used in GraphQLContext');
    }
    async getUserNode() {
        if (!this.context.db) {
            throw new Error('Unable to find permission without db.');
        }
        return await this.context.db.getUserNode(this.context);
    }
    async getNode(ref) {
        if (!this.context.db) {
            throw new Error('Unable to find permission without db.');
        }
        return await this.context.db.getNode(this.context, ref);
    }
    async getNodes(nodeType, ids) {
        if (!this.context.db) {
            throw new Error('Unable to find permission without db.');
        }
        return await this.context.db.batchGetNodes(this.context, nodeType, ids);
    }
    async traverseGraph(ref, traverse) {
        if (!this.context.db) {
            throw new Error('Unable to find permission without db.');
        }
        return await this.context.db.traverseGraph(this.context, ref, traverse);
    }
    async queryGraph(nodeType, queryName, queryParams) {
        if (!this.context.db) {
            throw new Error('Unable to find permission without db.');
        }
        return await this.context.db.queryGraph(this.context, nodeType, queryName, queryParams);
    }
}
exports.GraphQLPermissionContext = GraphQLPermissionContext;
// Adapter for MutationContext
class MutationPermissionContext {
    constructor(trc, context) {
        this.trc = trc;
        this.context = context;
    }
    async getUserNode() {
        const user = await this.context.fetchEntity(this.trc, { id: conduit_core_1.PERSONAL_USER_ID, type: EntityConstants_1.CoreEntityTypes.User });
        return user;
    }
    async getNode(ref) {
        return await this.context.fetchEntity(this.trc, ref);
    }
    async getNodes(nodeType, ids) {
        return await this.context.fetchEntities(this.trc, nodeType, ids);
    }
    async traverseGraph(ref, traverse) {
        return await this.context.traverseGraph(this.trc, ref, traverse);
    }
    async queryGraph(nodeType, queryName, queryParams) {
        return await this.context.queryGraph(this.trc, nodeType, queryName, queryParams);
    }
}
exports.MutationPermissionContext = MutationPermissionContext;
async function getParent(context, node) {
    const parentEdge = conduit_utils_1.firstStashEntry(node.inputs.parent);
    if (parentEdge) {
        return await context.getNode({ id: parentEdge.srcID, type: parentEdge.srcType });
    }
    return null;
}
exports.getParent = getParent;
async function getAncestors(context, node) {
    if (Workspace_1.isWorkspace(node)) {
        return [];
    }
    const ancestors = [];
    const parent = await getParent(context, node);
    if (parent) {
        ancestors.push(parent);
        if (Notebook_1.isNotebook(parent)) {
            // get possible workspace
            const ws = await getParent(context, parent);
            if (ws) {
                ancestors.push(ws);
            }
        }
    }
    return ancestors;
}
exports.getAncestors = getAncestors;
async function getOwnMemberships(node, context) {
    const membershipsRes = await context.queryGraph(EntityConstants_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', { parent: { id: node.id, type: node.type } });
    if (membershipsRes.length === 0) {
        return [];
    }
    return await context.getNodes(EntityConstants_1.CoreEntityTypes.Membership, membershipsRes.map(m => m.id));
}
exports.getOwnMemberships = getOwnMemberships;
async function getOwnerID(membership) {
    const edge = conduit_utils_1.firstStashEntry(membership.outputs.owner);
    if (edge) {
        return edge.dstID;
    }
}
exports.getOwnerID = getOwnerID;
async function getRecipientID(membership) {
    const edge = conduit_utils_1.firstStashEntry(membership.outputs.recipient);
    if (edge) {
        return edge.dstID;
    }
}
exports.getRecipientID = getRecipientID;
async function getSharerID(membership) {
    const edge = conduit_utils_1.firstStashEntry(membership.outputs.sharer);
    if (edge) {
        return edge.dstID;
    }
}
exports.getSharerID = getSharerID;
//# sourceMappingURL=ShareUtils.js.map