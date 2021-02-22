"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEdge = exports.getMembership = exports.getEntityAndEdges = exports.CoreEntityNSyncConverters = exports.generateMembershipID = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const AttachmentConverter_1 = require("./Converters/AttachmentConverter");
const MutationTrackerConverter_1 = require("./Converters/MutationTrackerConverter");
const NotebookConverter_1 = require("./Converters/NotebookConverter");
const NoteConverter_1 = require("./Converters/NoteConverter");
const RecipientSettingsConverter_1 = require("./Converters/RecipientSettingsConverter");
const SavedSearchConverter_1 = require("./Converters/SavedSearchConverter");
const ShortcutConverter_1 = require("./Converters/ShortcutConverter");
const TagConverter_1 = require("./Converters/TagConverter");
const WorkspaceConverter_1 = require("./Converters/WorkspaceConverter");
const NSyncTypes_1 = require("./NSyncTypes");
// May want to move this out eventually
function generateProfileID(source, id) {
    return `Profile:${source}:${id}`;
}
function generateMembershipID(instance) {
    return `Membership:${instance.ref.dst.type}_${instance.ref.dst.id}:${instance.ref.src.type}_${instance.ref.src.id}`;
}
exports.generateMembershipID = generateMembershipID;
const shouldNotImplement = async (trc, instance) => {
    conduit_utils_1.logger.error(`Clients should not receive type ${instance.ref && instance.ref.type}`);
    return null;
};
/*
const yetToImplement = async (trc: TracingContext, instance: NSyncTypes.EntityInstance): Promise<Maybe<NodesAndEdges>> => {
  logger.warn(`Yet to implement NSync type ${instance.ref && instance.ref.type}`);
  return null;
};
*/
exports.CoreEntityNSyncConverters = {
    // Core, V1 Entity Types
    [en_data_model_1.CoreEntityTypes.Attachment]: { [NSyncTypes_1.NSyncTypes.EntityType.ATTACHMENT]: AttachmentConverter_1.getAttachmentNodeAndEdges },
    [en_data_model_1.CoreEntityTypes.Note]: {
        [NSyncTypes_1.NSyncTypes.EntityType.NOTE]: NoteConverter_1.getNoteNodeAndEdges,
        [NSyncTypes_1.NSyncTypes.EntityType.NOTE_ATTACHMENTS]: shouldNotImplement,
        [NSyncTypes_1.NSyncTypes.EntityType.NOTE_TAGS]: shouldNotImplement,
    },
    [en_data_model_1.CoreEntityTypes.Notebook]: {
        [NSyncTypes_1.NSyncTypes.EntityType.NOTEBOOK]: NotebookConverter_1.getNotebookNodesAndEdges,
        [NSyncTypes_1.NSyncTypes.EntityType.RECIPIENT_SETTINGS]: RecipientSettingsConverter_1.getRecipientSettingsNodesAndEdges,
    },
    [en_data_model_1.CoreEntityTypes.SavedSearch]: { [NSyncTypes_1.NSyncTypes.EntityType.SAVED_SEARCH]: SavedSearchConverter_1.getSavedSearchNodesAndEdges },
    [en_data_model_1.CoreEntityTypes.Shortcut]: { [NSyncTypes_1.NSyncTypes.EntityType.SHORTCUT]: ShortcutConverter_1.getShortcutNodesAndEdges },
    [en_data_model_1.CoreEntityTypes.Tag]: { [NSyncTypes_1.NSyncTypes.EntityType.TAG]: TagConverter_1.getTagNodesAndEdges },
    [en_data_model_1.CoreEntityTypes.Workspace]: { [NSyncTypes_1.NSyncTypes.EntityType.WORKSPACE]: WorkspaceConverter_1.getWorkspaceNodesAndEdges },
    [en_data_model_1.InternalEntityTypes.MutationTracker]: {
        [NSyncTypes_1.NSyncTypes.EntityType.MUTATION_TRACKER]: MutationTrackerConverter_1.getMutationTrackerNodesAndEdges,
    },
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
    if (instance.ref.type === undefined || instance.ref.type === null) {
        // Default to note (sometimes missing type since note is 0 and protobuf likes to drop that)
        return context.converters[NSyncTypes_1.NSyncTypes.EntityType.NOTE](trc, instance, context);
    }
    if (!context.converters[instance.ref.type]) {
        conduit_utils_1.logger.warn(`NSync type ${instance.ref.type} not supported`);
        return null;
    }
    return context.converters[instance.ref.type](trc, instance, context);
}
exports.getEntityAndEdges = getEntityAndEdges;
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
    const privilege = (_a = NSyncTypes_1.NSyncPrivilegeMap[instance.role]) !== null && _a !== void 0 ? _a : en_data_model_1.MembershipPrivilege.READ;
    const recipientType = NSyncTypes_1.NSyncAgentToRecipientMap[instance.ref.src.type];
    if (recipientType === undefined) {
        throw new Error('Missing agent/recipient type in membership');
    }
    let recipientSource = en_data_model_1.PROFILE_SOURCE.User;
    if (recipientType === en_data_model_1.MembershipRecipientType.IDENTITY) {
        recipientSource = en_data_model_1.PROFILE_SOURCE.Identity;
    }
    else if (recipientType === en_data_model_1.MembershipRecipientType.EMAIL) {
        recipientSource = en_data_model_1.PROFILE_SOURCE.Contact;
    }
    else if (recipientType === en_data_model_1.MembershipRecipientType.BUSINESS) {
        recipientSource = en_data_model_1.PROFILE_SOURCE.User; // TODO: v2 I don't think this is user. May need new type when we
    }
    let recipientIsMe = false;
    // This assumes that recipient source will always be USER if you're the recipient.
    if (recipientSource === en_data_model_1.PROFILE_SOURCE.User) {
        recipientIsMe = Number(instance.ref.src.id) === currentUserID;
    }
    const nodeType = NSyncTypes_1.entityTypeAsNodeType(eventManager, instance.ref.dst.type);
    if (!nodeType) {
        throw new Error(`Unhandled nsync type ${instance.ref.dst.type} for membership`);
    }
    // const sharedNotebookID = instance.ref.dst.type === NSyncEntityType.NOTEBOOK ? instance.ref.dst.id : null;
    const node = {
        localChangeTimestamp: 0,
        id: generateMembershipID(instance),
        label: `Membership for ${nodeType} to ${recipientIsMe ? 'Me' : recipientSource}`,
        syncContexts: [],
        version: NSyncTypes_1.convertLong(instance.version || 0),
        type: en_data_model_1.CoreEntityTypes.Membership,
        NodeFields: {
            created: NSyncTypes_1.convertLong(instance.created || 0),
            updated: NSyncTypes_1.convertLong(instance.updated || 0),
            privilege,
            recipientIsMe,
            recipientType,
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
    const edgesToCreate = [];
    const edgesToDelete = [];
    edgesToCreate.push({
        srcID: instance.ref.dst.id,
        srcType: nodeType, srcPort: 'memberships',
        dstID: node.id || '',
        dstType: en_data_model_1.CoreEntityTypes.Membership, dstPort: 'parent',
    });
    const recipientProfileID = generateProfileID(recipientSource, instance.ref.src.id);
    const sharerProfileID = instance.sharerId && generateProfileID(en_data_model_1.PROFILE_SOURCE.User, instance.sharerId);
    edgesToCreate.push({
        srcID: node.id,
        srcType: en_data_model_1.CoreEntityTypes.Membership, srcPort: 'recipient',
        dstID: recipientProfileID, dstType: en_data_model_1.CoreEntityTypes.Profile, dstPort: null,
    });
    sharerProfileID && edgesToCreate.push({
        srcID: node.id,
        srcType: en_data_model_1.CoreEntityTypes.Membership, srcPort: 'sharer',
        dstID: sharerProfileID, dstType: en_data_model_1.CoreEntityTypes.Profile, dstPort: null,
    });
    return {
        nodes: { nodesToUpsert: [node], nodesToDelete: [] },
        edges: { edgesToCreate, edgesToDelete },
    };
}
exports.getMembership = getMembership;
function getEdge(eventManager, instance) {
    var _a, _b;
    if (!instance.ref || !instance.ref.src || !instance.ref.dst) {
        conduit_utils_1.logger.info('NSync ref/src/dst missing from association doc');
        return null;
    }
    const { ref: { dst, src, type } } = instance;
    if (src.id === null || src.id === undefined) {
        throw new Error('Missing src id');
    }
    if (dst.id === null || dst.id === undefined) {
        throw new Error('Missing dst id');
    }
    // Proto sometimes likes to lose the zero value, so the coallesce here fixes that.
    const ownerPortsAndTypes = eventManager.di.getNsyncAssociation((_a = src.type) !== null && _a !== void 0 ? _a : NSyncTypes_1.NSyncTypes.EntityType.NOTE, (_b = dst.type) !== null && _b !== void 0 ? _b : NSyncTypes_1.NSyncTypes.EntityType.NOTE, type !== null && type !== void 0 ? type : NSyncTypes_1.NSyncTypes.AssociationType.ANCESTRY);
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
//# sourceMappingURL=NSyncEntityConverter.js.map