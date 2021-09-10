"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceResultsToMutationDeps = exports.membershipRefToDepKey = exports.associationRefToDepKey = exports.entityRefToDepKey = exports.getEdge = exports.getMembership = exports.getEntityAndEdges = exports.getEntityAndEdgesBySchema = exports.generateMembershipID = exports.generateInvitationID = exports.generateProfileID = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const BaseConverter_1 = require("./Converters/BaseConverter");
const EXPUNGE_VERSION = Number.MAX_SAFE_INTEGER - 1; // the "- 1" is for safety
// May want to move this out eventually
function generateProfileID(source, id) {
    return `Profile:${source}:${id}`;
}
exports.generateProfileID = generateProfileID;
function generateInvitationID(ref) {
    return `Invitation:${ref.dst.type}_${ref.dst.id}:${ref.src.type}_${ref.src.id}`;
}
exports.generateInvitationID = generateInvitationID;
function generateMembershipID(ref) {
    return `Membership:${ref.dst.type}_${ref.dst.id}:${ref.src.type}_${ref.src.id}`;
}
exports.generateMembershipID = generateMembershipID;
function graphEdgeMatch(element) {
    return element.dstID === this.dstID
        && element.dstPort === this.dstPort
        && element.dstType === this.dstType
        && element.srcID === this.srcID
        && element.srcType === this.srcType
        && element.srcPort === this.srcPort;
}
async function getEntityAndEdgesBySchema(trc, instance, context) {
    var _a, _b;
    const type = context.di.convertNsyncTypeToNodeType(instance.ref.type);
    if (conduit_utils_1.isNullish(type)) {
        return null;
    }
    const typeDef = context.di.getNodeTypeDefs()[type];
    if (!typeDef) {
        return null;
    }
    const nodeAndEdges = BaseConverter_1.convertNsyncEntityToNode(typeDef, instance, context);
    if (!nodeAndEdges || !nodeAndEdges.node) {
        return null;
    }
    const nodesToUpsert = [];
    const edgesToCreate = nodeAndEdges.edges;
    const edgesToDelete = [];
    const node = nodeAndEdges.node;
    nodesToUpsert.push(node);
    const existingNode = await context.tx.getNode(trc, null, { type: node.type, id: node.id });
    if (existingNode && typeDef.edges) {
        for (const port in existingNode.inputs) {
            if (!typeDef.edges[port] || !((_a = context.edgeDefiners[typeDef.name]) === null || _a === void 0 ? void 0 : _a[port])) {
                continue;
            }
            for (const edgeID in existingNode.inputs[port]) {
                const edge = existingNode.inputs[port][edgeID];
                const index = edgesToCreate.findIndex(graphEdgeMatch, edge);
                if (index === -1) {
                    edgesToDelete.push(edge);
                }
                else {
                    // Already exists, don't recreate the edge
                    edgesToCreate.splice(index, 1);
                }
            }
        }
        for (const port in existingNode.outputs) {
            if (!typeDef.edges[port] || !((_b = context.edgeDefiners[typeDef.name]) === null || _b === void 0 ? void 0 : _b[port])) {
                continue;
            }
            for (const edgeID in existingNode.outputs[port]) {
                const edge = existingNode.outputs[port][edgeID];
                const index = edgesToCreate.findIndex(graphEdgeMatch, edge);
                if (index === -1) {
                    edgesToDelete.push(edge);
                }
                else {
                    // Already exists, don't recreate the edge
                    edgesToCreate.splice(index, 1);
                }
            }
        }
    }
    let out = {
        nodes: {
            nodesToUpsert,
            nodesToDelete: [],
        },
        edges: {
            edgesToCreate,
            edgesToDelete,
        },
    };
    const extras = context.di.getNSyncExtraNodesAndEdges()[node.type];
    if (extras && extras.length) {
        for (const fn of extras) {
            const res = await fn(trc, node, instance, context);
            if (res) {
                out = BaseConverter_1.mergeNodesAndEdges(out, res);
            }
        }
    }
    return out;
}
exports.getEntityAndEdgesBySchema = getEntityAndEdgesBySchema;
async function getEntityAndEdges(trc, instance, currentUserID, eventManager, tx) {
    if (!instance.ref) {
        conduit_utils_1.logger.info('NSync eventSrc doc missing instance or entity');
        return null;
    }
    const context = {
        currentUserID,
        eventManager,
        edgeDefiners: eventManager.di.getNSyncEdgeDefiners(),
        tx,
        di: eventManager.di,
        getLocalSettings: eventManager.di.getLocalSettings,
    };
    const nodesAndEdges = await getEntityAndEdgesBySchema(trc, instance, context);
    return nodesAndEdges;
}
exports.getEntityAndEdges = getEntityAndEdges;
function getInvitationNode(instance, params, out) {
    const node = {
        localChangeTimestamp: 0,
        id: generateInvitationID(instance.ref),
        label: '-',
        syncContexts: [],
        version: instance.version,
        type: en_core_entity_types_1.CoreEntityTypes.Invitation,
        NodeFields: {
            created: instance.created,
            snippet: '',
            invitationType: en_core_entity_types_1.InvitationType.UNKNOWN,
            internal_attachment: {},
        },
        inputs: {},
        outputs: {
            owner: {},
            sharer: {},
        },
    };
    out.edges = out.edges || { edgesToCreate: [], edgesToDelete: [] };
    out.nodes = out.nodes || { nodesToUpsert: [], nodesToDelete: [] };
    params.sharerProfileID && out.edges.edgesToCreate.push({
        srcID: node.id, srcType: node.type, srcPort: 'sharer',
        dstID: params.sharerProfileID, dstType: en_core_entity_types_1.CoreEntityTypes.Profile, dstPort: null,
    });
    out.nodes.nodesToUpsert.push(node);
    out.nodes.nodesToDelete.push({
        id: generateMembershipID(instance.ref),
        type: en_core_entity_types_1.CoreEntityTypes.Membership,
    });
}
function getMembershipNode(instance, params, out) {
    const node = {
        localChangeTimestamp: 0,
        id: generateMembershipID(instance.ref),
        label: `Membership for ${params.targetRef.type} to ${params.recipientIsMe ? 'Me' : params.recipientSource}`,
        syncContexts: [],
        version: instance.version,
        type: en_core_entity_types_1.CoreEntityTypes.Membership,
        NodeFields: {
            created: instance.created,
            updated: instance.updated,
            privilege: params.privilege,
            recipientIsMe: params.recipientIsMe,
            recipientType: params.recipientType,
            invitedTime: null,
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
    out.edges = out.edges || { edgesToCreate: [], edgesToDelete: [] };
    out.nodes = out.nodes || { nodesToUpsert: [], nodesToDelete: [] };
    out.edges.edgesToCreate.push({
        srcID: params.targetRef.id, srcType: params.targetRef.type, srcPort: 'memberships',
        dstID: node.id, dstType: node.type, dstPort: 'parent',
    });
    out.edges.edgesToCreate.push({
        srcID: node.id, srcType: node.type, srcPort: 'recipient',
        dstID: params.recipientProfileID, dstType: en_core_entity_types_1.CoreEntityTypes.Profile, dstPort: null,
    });
    params.sharerProfileID && out.edges.edgesToCreate.push({
        srcID: node.id, srcType: node.type, srcPort: 'sharer',
        dstID: params.sharerProfileID, dstType: en_core_entity_types_1.CoreEntityTypes.Profile, dstPort: null,
    });
    out.edges.edgesToCreate.push({
        srcID: node.id, srcType: node.type, srcPort: 'owner',
        dstID: params.ownerProfileID, dstType: en_core_entity_types_1.CoreEntityTypes.Profile, dstPort: null,
    });
    out.nodes.nodesToUpsert.push(node);
    out.nodes.nodesToDelete.push({
        id: generateInvitationID(instance.ref),
        type: en_core_entity_types_1.CoreEntityTypes.Invitation,
    });
}
function getMembership(eventManager, instance, currentUserID) {
    var _a;
    if (instance.ref.src.type === null || instance.ref.src.type === undefined) {
        throw new Error('Missing membership src ref type');
    }
    if (instance.ref.src.id === null || instance.ref.src.id === undefined) {
        throw new Error('Missing membership src ref id');
    }
    if (instance.ref.dst.type === null || instance.ref.dst.type === undefined) {
        throw new Error('Missing membership dst ref type');
    }
    if (instance.ref.dst.id === null || instance.ref.dst.id === undefined) {
        throw new Error('Missing membership dst ref id');
    }
    const instanceRole = en_data_model_1.ClientNSyncTypes.Role[instance.role];
    const privilege = (_a = en_conduit_sync_types_1.NSyncPrivilegeMap[instanceRole]) !== null && _a !== void 0 ? _a : en_conduit_sync_types_1.MembershipPrivilege.READ;
    const recipientType = en_conduit_sync_types_1.NSyncAgentToRecipientMap[instance.ref.src.type];
    if (recipientType === undefined) {
        throw new Error('Missing agent/recipient type in membership');
    }
    let recipientSource = en_core_entity_types_1.PROFILE_SOURCE.User;
    if (recipientType === en_conduit_sync_types_1.MembershipRecipientType.IDENTITY) {
        recipientSource = en_core_entity_types_1.PROFILE_SOURCE.Identity;
    }
    else if (recipientType === en_conduit_sync_types_1.MembershipRecipientType.EMAIL) {
        recipientSource = en_core_entity_types_1.PROFILE_SOURCE.Contact;
    }
    else if (recipientType === en_conduit_sync_types_1.MembershipRecipientType.BUSINESS) {
        recipientSource = en_core_entity_types_1.PROFILE_SOURCE.User; // TODO: v2 I don't think this is user. May need new type when we
    }
    let recipientIsMe = false;
    // This assumes that recipient source will always be USER if you're the recipient.
    if (recipientSource === en_core_entity_types_1.PROFILE_SOURCE.User) {
        recipientIsMe = Number(instance.ref.src.id) === currentUserID;
    }
    const nodeType = en_conduit_sync_types_1.entityTypeAsNodeType(eventManager.di, instance.ref.dst.type);
    if (!nodeType) {
        throw new Error(`Unhandled nsync type ${instance.ref.dst.type} for membership`);
    }
    const targetRef = {
        id: instance.ref.dst.id,
        type: nodeType,
    };
    const recipientProfileID = generateProfileID(recipientSource, instance.ref.src.id);
    const sharerProfileID = instance.sharerId ? generateProfileID(en_core_entity_types_1.PROFILE_SOURCE.User, instance.sharerId) : null;
    const ownerProfileID = generateProfileID(en_core_entity_types_1.PROFILE_SOURCE.User, instance.ownerId);
    const out = {};
    const params = {
        privilege,
        recipientType,
        recipientSource,
        recipientIsMe,
        recipientProfileID,
        sharerProfileID,
        ownerProfileID,
        targetRef,
    };
    if (instance.ref.type === en_data_model_1.ClientNSyncTypes.MembershipType.INVITATION) {
        getInvitationNode(instance, params, out);
    }
    else {
        getMembershipNode(instance, params, out);
    }
    return out;
}
exports.getMembership = getMembership;
function getEdge(eventManager, instance) {
    const { ref: { dst, src, type } } = instance;
    // Proto sometimes likes to lose the zero value, so the coallesce here fixes that.
    const ownerPortsAndTypes = eventManager.di.getNsyncAssociation(src.type, dst.type, type);
    if (!ownerPortsAndTypes) {
        conduit_utils_1.logger.info(`NSync Association <${src.type}|${dst.type}|${type}> not handled by Conduit`);
        return null;
    }
    return {
        srcID: src.id,
        srcType: ownerPortsAndTypes.srcType,
        srcPort: ownerPortsAndTypes.srcPort,
        dstID: dst.id,
        dstType: ownerPortsAndTypes.dstType,
        dstPort: ownerPortsAndTypes.dstPort,
    };
}
exports.getEdge = getEdge;
function isExpunge(version) {
    return version >= EXPUNGE_VERSION;
}
const KEY_SEP = ';:;';
function entityRefToDepKey(dataModelProvider, ref) {
    var _a;
    // we aren't supposed to get dropped types back anymore but the results are still going through proto at the moment between feature service and command service
    const nodeType = en_conduit_sync_types_1.entityTypeAsNodeType(dataModelProvider, (_a = ref.type) !== null && _a !== void 0 ? _a : 0);
    if (!nodeType) {
        return null;
    }
    return ['Entity', nodeType, ref.id].join(KEY_SEP);
}
exports.entityRefToDepKey = entityRefToDepKey;
// assumes entityRefToDepKey has been called and returned a valid key
function entityRefToNodeRef(dataModelProvider, ref) {
    var _a;
    // we aren't supposed to get dropped types back anymore but the results are still going through proto at the moment between feature service and command service
    return {
        id: ref.id,
        type: en_conduit_sync_types_1.entityTypeAsNodeType(dataModelProvider, (_a = ref.type) !== null && _a !== void 0 ? _a : 0),
    };
}
function associationRefToDepKey(dataModelProvider, ref) {
    var _a, _b, _c;
    // we aren't supposed to get dropped types back anymore but the results are still going through proto at the moment between feature service and command service
    const srcType = en_conduit_sync_types_1.entityTypeAsNodeType(dataModelProvider, (_a = ref.src.type) !== null && _a !== void 0 ? _a : 0);
    if (!srcType) {
        return null;
    }
    const dstType = en_conduit_sync_types_1.entityTypeAsNodeType(dataModelProvider, (_b = ref.dst.type) !== null && _b !== void 0 ? _b : 0);
    if (!dstType) {
        return null;
    }
    return ['Association', (_c = ref.type) !== null && _c !== void 0 ? _c : 0, srcType, ref.src.id, dstType, ref.dst.id].join(KEY_SEP);
}
exports.associationRefToDepKey = associationRefToDepKey;
function associationRefToGraphAssociation(dataModelProvider, ref) {
    return {
        src: entityRefToNodeRef(dataModelProvider, ref.src),
        dst: entityRefToNodeRef(dataModelProvider, ref.dst),
    };
}
function membershipRefToDepKey(dataModelProvider, ref) {
    var _a, _b, _c;
    // we aren't supposed to get dropped types back anymore but the results are still going through proto at the moment between feature service and command service
    const dstType = en_conduit_sync_types_1.entityTypeAsNodeType(dataModelProvider, (_a = ref.dst.type) !== null && _a !== void 0 ? _a : 0);
    if (!dstType) {
        return null;
    }
    return ['Membership', (_b = ref.type) !== null && _b !== void 0 ? _b : 0, (_c = ref.src.type) !== null && _c !== void 0 ? _c : 0, ref.src.id, dstType, ref.dst.id].join(KEY_SEP);
}
exports.membershipRefToDepKey = membershipRefToDepKey;
function membershipRefToNodeRef(dataModelProvider, ref) {
    // assumes membershipRefToDepKey has been called and returned a valid key
    return {
        id: generateMembershipID(ref),
        type: en_core_entity_types_1.CoreEntityTypes.Membership,
    };
}
async function serviceResultsToMutationDeps(trc, dataModelProvider, storage, results) {
    if (!results) {
        return null;
    }
    const ret = {};
    async function checkNodeDep(key, version, nodeRef) {
        const node = await storage.getNode(trc, nodeRef);
        if (isExpunge(version)) {
            if (node) {
                // wait for node to be deleted
                ret[key] = {
                    version,
                    deletedNode: nodeRef,
                };
            }
        }
        else {
            if (!node || node.version < version) {
                // need to wait for the expected version
                ret[key] = {
                    version,
                };
            }
        }
    }
    for (const entity of results.entities || []) {
        const key = entityRefToDepKey(dataModelProvider, entity.ref);
        const version = entity.version;
        if (key && !conduit_utils_1.isNullish(version)) {
            await checkNodeDep(key, version, entityRefToNodeRef(dataModelProvider, entity.ref));
        }
    }
    // treating memberships as nodes in v1
    for (const membership of results.memberships || []) {
        const key = membershipRefToDepKey(dataModelProvider, membership.ref);
        const version = membership.version;
        if (key && !conduit_utils_1.isNullish(version)) {
            await checkNodeDep(key, version, membershipRefToNodeRef(dataModelProvider, membership.ref));
        }
    }
    for (const association of results.associations || []) {
        const key = associationRefToDepKey(dataModelProvider, association.ref);
        const version = association.version;
        if (key && !conduit_utils_1.isNullish(version)) {
            const graphAssoc = associationRefToGraphAssociation(dataModelProvider, association.ref);
            const edge = await storage.getEdge(trc, graphAssoc);
            if (isExpunge(version) || association.deleted) {
                if (edge) {
                    // need to wait for the edge to be deleted
                    ret[key] = {
                        version,
                        deletedAssociation: graphAssoc,
                    };
                }
            }
            else {
                if (!edge) {
                    // need to wait for the edge to sync
                    ret[key] = {
                        version,
                    };
                }
            }
        }
    }
    // TODO connections, agents
    return ret;
}
exports.serviceResultsToMutationDeps = serviceResultsToMutationDeps;
//# sourceMappingURL=NSyncEntityConverter.js.map