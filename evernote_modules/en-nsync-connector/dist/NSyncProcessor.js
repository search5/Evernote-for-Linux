"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNSyncDoc = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const index_1 = require("./index");
const NSyncEntityConverter_1 = require("./NSyncEntityConverter");
const NSyncTypes_1 = require("./NSyncTypes");
function isAssociationInstance(instance) {
    return Boolean(instance.ref.src) && Boolean(instance.ref.dst) && Boolean(!instance.ref.hasOwnProperty('role'));
}
async function processEntityAndEdges(trc, entityAndEdges, tx) {
    const { nodes, edges } = entityAndEdges;
    if (nodes) {
        for (const node of nodes.nodesToUpsert) {
            const syncContext = (node.syncContexts.length > 1) ?
                node.syncContexts[0] : // TODO remove once syncContexts are removed
                index_1.NSYNC_CONTEXT;
            // add updated/new node
            await tx.replaceNode(trc, syncContext, node);
        }
        for (const node of nodes.nodesToDelete) {
            const syncContext = index_1.NSYNC_CONTEXT; // Remove when we remove sync context
            await tx.deleteNode(trc, syncContext, node);
        }
    }
    if (edges) {
        conduit_utils_1.logger.debug('processing event > associationEntity');
        await tx.replaceEdges(trc, edges.edgesToDelete, edges.edgesToCreate);
    }
}
async function upsertDoc(trc, doc, currentUserID, eventManager, tx, dataHelpers) {
    const type = doc.instance.type;
    switch (type) {
        case null:
        case undefined:
            break;
        case NSyncTypes_1.NSyncTypes.EnType.AGENT:
            break;
        case NSyncTypes_1.NSyncTypes.EnType.ASSOCIATION:
            conduit_utils_1.logger.debug('processing event > association');
            if (!isAssociationInstance(doc.instance)) {
                break;
            }
            const edge = NSyncEntityConverter_1.getEdge(eventManager, doc.instance);
            if (!edge) {
                break;
            }
            await tx.replaceEdges(trc, [], [edge]);
            break;
        case NSyncTypes_1.NSyncTypes.EnType.CONNECTION:
            break;
        case NSyncTypes_1.NSyncTypes.EnType.ENTITY: {
            const ref = doc.instance.ref;
            if (ref.id && eventManager.hasBeenExpunged(ref.id)) {
                conduit_utils_1.logger.warn(`Received upsert event operation on node id:${ref.id}, type: ${ref.type} after it had been expunged.`);
                return;
            }
            const entityAndEdges = await NSyncEntityConverter_1.getEntityAndEdges(trc, doc.instance, currentUserID, eventManager, tx, dataHelpers);
            if (!entityAndEdges) {
                break;
            }
            await processEntityAndEdges(trc, entityAndEdges, tx);
            break;
        }
        case NSyncTypes_1.NSyncTypes.EnType.MEMBERSHIP: {
            const entityAndEdges = NSyncEntityConverter_1.getMembership(eventManager, doc.instance, currentUserID);
            if (!entityAndEdges) {
                break;
            }
            await processEntityAndEdges(trc, entityAndEdges, tx);
            break;
        }
        default:
            throw conduit_utils_1.absurd(type, 'Unknown msg type');
    }
}
async function removeMembership(trc, eventManager, tx, membership) {
    if (!membership.ref) {
        conduit_utils_1.logger.warn('Missing membership ref on nsync expunge');
        return;
    }
    const id = NSyncEntityConverter_1.generateMembershipID(membership);
    const membershipRef = { id, type: en_data_model_1.CoreEntityTypes.Membership };
    if (eventManager.hasBeenExpunged(membershipRef.id)) {
        conduit_utils_1.logger.debug(`Duplicate event on id: ${membershipRef.id}, was previously expunged.`);
        return;
    }
    eventManager.addToExpunged(membershipRef.id);
    const didDeleteMembership = await tx.deleteNode(trc, index_1.NSYNC_CONTEXT, membershipRef); // All contexts are nysnc for now till we delete syncContexts
    if (!didDeleteMembership) {
        conduit_utils_1.logger.warn(`Node (id: ${membershipRef.id}, type: ${membershipRef.type}) could not be expunged. Possibly missing.`);
    }
}
async function deleteDoc(trc, doc, currentUserID, eventManager, tx, dataHelpers) {
    var _a;
    const type = doc.instance.type;
    switch (type) {
        case null:
        case undefined:
            break;
        case NSyncTypes_1.NSyncTypes.EnType.AGENT:
        case NSyncTypes_1.NSyncTypes.EnType.CONNECTION:
            conduit_utils_1.logger.warn('Unhandled delete: ' + type);
            break;
        case NSyncTypes_1.NSyncTypes.EnType.MEMBERSHIP:
            await removeMembership(trc, eventManager, tx, doc.instance);
        case NSyncTypes_1.NSyncTypes.EnType.ASSOCIATION:
            conduit_utils_1.logger.debug('processing event > association');
            if (!isAssociationInstance(doc.instance)) {
                break;
            }
            const edge = NSyncEntityConverter_1.getEdge(eventManager, doc.instance);
            if (!edge) {
                break;
            }
            await tx.replaceEdges(trc, [edge], []);
            break;
        case NSyncTypes_1.NSyncTypes.EnType.ENTITY:
            const entityAndEdges = await NSyncEntityConverter_1.getEntityAndEdges(trc, doc.instance, currentUserID, eventManager, tx, dataHelpers);
            if (!entityAndEdges) {
                break;
            }
            const nodes = (_a = entityAndEdges.nodes) === null || _a === void 0 ? void 0 : _a.nodesToUpsert;
            if (!nodes || nodes.length !== 1) {
                conduit_utils_1.logger.warn('Did not receive single node for delete');
                break;
            }
            const syncContext = index_1.NSYNC_CONTEXT;
            // add updated/new node
            await tx.replaceNode(trc, syncContext, nodes[0]);
    }
}
async function expungeDoc(trc, doc, eventManager, tx) {
    const type = doc.instance.type;
    switch (type) {
        case null:
        case undefined:
            break;
        case NSyncTypes_1.NSyncTypes.EnType.AGENT:
        case NSyncTypes_1.NSyncTypes.EnType.ASSOCIATION:
        case NSyncTypes_1.NSyncTypes.EnType.CONNECTION:
            conduit_utils_1.logger.warn('Unhandled expunge: ' + type);
            break;
        case NSyncTypes_1.NSyncTypes.EnType.MEMBERSHIP:
            await removeMembership(trc, eventManager, tx, doc.instance);
            break;
        case NSyncTypes_1.NSyncTypes.EnType.ENTITY:
            const instance = doc.instance;
            const ref = instance.ref;
            if (!ref) {
                conduit_utils_1.logger.warn('Missing instance ref on nsync expunge');
                break;
            }
            if (!ref.type) {
                conduit_utils_1.logger.warn('Missing instance ref type on nsync expunge');
                break;
            }
            const nodeType = NSyncTypes_1.entityTypeAsNodeType(eventManager, ref.type);
            if (!nodeType) {
                conduit_utils_1.logger.warn(`Expunge on unhandled nsync entity type: ${instance.ref.type}`);
                break;
            }
            if (ref.id === null || ref.id === undefined) {
                conduit_utils_1.logger.warn('Missing instance ref id on nsync expunge');
                break;
            }
            const nodeRef = { id: ref.id, type: nodeType };
            if (eventManager.hasBeenExpunged(nodeRef.id)) {
                conduit_utils_1.logger.debug(`Duplicate event on id: ${nodeRef.id}, was previously expunged.`);
                break;
            }
            eventManager.addToExpunged(nodeRef.id);
            const didDelete = await tx.deleteNode(trc, index_1.NSYNC_CONTEXT, nodeRef); // All contexts are nsync for now till we delete syncContexts
            if (!didDelete) {
                conduit_utils_1.logger.warn(`Node (id: ${nodeRef.id}, type: ${nodeRef.type}) could not be expunged. Possibly missing.`);
            }
            break;
        default:
            throw new Error('asked to expunge unknown type: ' + type);
    }
}
async function processNSyncDoc(trc, doc, eventManager, tx, dataHelpers) {
    if (doc.updated === null || doc.updated === undefined || !doc.instance || doc.instance.type === null || doc.instance.type === undefined) {
        conduit_utils_1.logger.warn('Unknown sync info', doc);
        return;
    }
    const ref = doc.instance.ref;
    if (ref && ref.id && eventManager.hasBeenExpunged(ref.id)) {
        // Making this a warning as I want to know when we get these ordering problems. Can lower it if spammy.
        conduit_utils_1.logger.warn(`Received event operation: ${doc.operation} on node id:${ref.id}, type: ${ref.type} after it had been expunged.`);
        return;
    }
    let currentUserID;
    switch (doc.operation) {
        case NSyncTypes_1.NSyncTypes.SyncOperation.ACCESS_FANOUT:
        case NSyncTypes_1.NSyncTypes.SyncOperation.CREATE:
        case NSyncTypes_1.NSyncTypes.SyncOperation.UPDATE:
        case NSyncTypes_1.NSyncTypes.SyncOperation.WITH_ENTITY_CREATE: // may want to handle this one separately in the future (batched for after create?)
            currentUserID = eventManager.getUserID();
            await upsertDoc(trc, doc, currentUserID, eventManager, tx, dataHelpers);
            break;
        case NSyncTypes_1.NSyncTypes.SyncOperation.DELETE:
            currentUserID = eventManager.getUserID();
            await deleteDoc(trc, doc, currentUserID, eventManager, tx, dataHelpers);
            break;
        case NSyncTypes_1.NSyncTypes.SyncOperation.EXPUNGE:
            await expungeDoc(trc, doc, eventManager, tx);
            break;
        case NSyncTypes_1.NSyncTypes.SyncOperation.MIGRATE:
            conduit_utils_1.logger.warn('Presently not handling MIGRATE operation');
            break;
        default:
            conduit_utils_1.logger.warn(`Unhandled syncOperation: ${doc.operation}`);
            break;
    }
}
exports.processNSyncDoc = processNSyncDoc;
//# sourceMappingURL=NSyncProcessor.js.map