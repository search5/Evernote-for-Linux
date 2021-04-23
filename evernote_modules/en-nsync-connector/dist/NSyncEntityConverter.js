"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceResultsToMutationDeps = exports.membershipRefToDepKey = exports.associationRefToDepKey = exports.entityRefToDepKey = exports.getEdge = exports.getMembership = exports.getEntityAndEdges = exports.CoreEntityNSyncConverters = exports.generateMembershipID = exports.generateInvitationID = exports.generateProfileID = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const AttachmentConverter_1 = require("./Converters/AttachmentConverter");
const NotebookConverter_1 = require("./Converters/NotebookConverter");
const NoteConverter_1 = require("./Converters/NoteConverter");
const RecipientSettingsConverter_1 = require("./Converters/RecipientSettingsConverter");
const SavedSearchConverter_1 = require("./Converters/SavedSearchConverter");
const ShortcutConverter_1 = require("./Converters/ShortcutConverter");
const TagConverter_1 = require("./Converters/TagConverter");
const WorkspaceConverter_1 = require("./Converters/WorkspaceConverter");
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
const shouldNotImplement = async (trc, instance) => {
    conduit_utils_1.logger.error(`Clients should not receive type ${instance.ref && instance.ref.type}`);
    return null;
};
/*
const yetToImplement = async (trc: TracingContext, instance: ClientNSyncTypes.EntityInstance): Promise<Maybe<NodesAndEdges>> => {
  logger.warn(`Yet to implement NSync type ${instance.ref && instance.ref.type}`);
  return null;
};
*/
exports.CoreEntityNSyncConverters = {
    // Core, V1 Entity Types
    [en_core_entity_types_1.CoreEntityTypes.Attachment]: { [en_data_model_1.ClientNSyncTypes.EntityType.ATTACHMENT]: AttachmentConverter_1.getAttachmentNodeAndEdges },
    [en_core_entity_types_1.CoreEntityTypes.Note]: {
        [en_data_model_1.ClientNSyncTypes.EntityType.NOTE]: NoteConverter_1.getNoteNodeAndEdges,
        [en_data_model_1.ClientNSyncTypes.EntityType.NOTE_ATTACHMENTS]: shouldNotImplement,
        [en_data_model_1.ClientNSyncTypes.EntityType.NOTE_TAGS]: shouldNotImplement,
    },
    [en_core_entity_types_1.CoreEntityTypes.Notebook]: {
        [en_data_model_1.ClientNSyncTypes.EntityType.NOTEBOOK]: NotebookConverter_1.getNotebookNodesAndEdges,
        [en_data_model_1.ClientNSyncTypes.EntityType.RECIPIENT_SETTINGS]: RecipientSettingsConverter_1.getRecipientSettingsNodesAndEdges,
    },
    [en_core_entity_types_1.CoreEntityTypes.SavedSearch]: { [en_data_model_1.ClientNSyncTypes.EntityType.SAVED_SEARCH]: SavedSearchConverter_1.getSavedSearchNodesAndEdges },
    [en_core_entity_types_1.CoreEntityTypes.Shortcut]: { [en_data_model_1.ClientNSyncTypes.EntityType.SHORTCUT]: ShortcutConverter_1.getShortcutNodesAndEdges },
    [en_core_entity_types_1.CoreEntityTypes.Tag]: { [en_data_model_1.ClientNSyncTypes.EntityType.TAG]: TagConverter_1.getTagNodesAndEdges },
    [en_core_entity_types_1.CoreEntityTypes.Workspace]: { [en_data_model_1.ClientNSyncTypes.EntityType.WORKSPACE]: WorkspaceConverter_1.getWorkspaceNodesAndEdges },
};
async function getEntityAndEdges(trc, instance, currentUserID, eventManager, tx, dataHelpers) {
    if (!instance.ref) {
        conduit_utils_1.logger.info('NSync eventSrc doc missing instance or entity');
        return null;
    }
    const context = {
        currentUserID,
        eventManager,
        converters: eventManager.di.getNsyncConverters(),
        dataHelpers,
        tx,
    };
    if (!context.converters[instance.ref.type]) {
        conduit_utils_1.logger.warn(`NSync type ${instance.ref.type} not supported`);
        return null;
    }
    return context.converters[instance.ref.type](trc, instance, context);
}
exports.getEntityAndEdges = getEntityAndEdges;
function getInvitationNode(instance, params, out) {
    const node = {
        localChangeTimestamp: 0,
        id: generateInvitationID(instance.ref),
        label: instance.label,
        syncContexts: [],
        version: instance.version,
        type: en_core_entity_types_1.CoreEntityTypes.Invitation,
        NodeFields: {
            created: instance.created,
            snippet: instance.label,
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
    const privilege = (_a = en_conduit_sync_types_1.NSyncPrivilegeMap[instanceRole]) !== null && _a !== void 0 ? _a : en_core_entity_types_1.MembershipPrivilege.READ;
    const recipientType = en_conduit_sync_types_1.NSyncAgentToRecipientMap[instance.ref.src.type];
    if (recipientType === undefined) {
        throw new Error('Missing agent/recipient type in membership');
    }
    let recipientSource = en_core_entity_types_1.PROFILE_SOURCE.User;
    if (recipientType === en_core_entity_types_1.MembershipRecipientType.IDENTITY) {
        recipientSource = en_core_entity_types_1.PROFILE_SOURCE.Identity;
    }
    else if (recipientType === en_core_entity_types_1.MembershipRecipientType.EMAIL) {
        recipientSource = en_core_entity_types_1.PROFILE_SOURCE.Contact;
    }
    else if (recipientType === en_core_entity_types_1.MembershipRecipientType.BUSINESS) {
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