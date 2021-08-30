"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNSyncDoc = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const NSyncEntityConverter_1 = require("./NSyncEntityConverter");
async function processEntityAndEdges(trc, entityAndEdges, tx) {
    const { nodes, edges } = entityAndEdges;
    if (nodes) {
        for (const node of nodes.nodesToUpsert) {
            const syncContext = (node.syncContexts.length > 1) ?
                node.syncContexts[0] : // TODO remove once syncContexts are removed
                conduit_storage_1.NSYNC_CONTEXT;
            // add updated/new node
            await tx.replaceNode(trc, syncContext, node);
        }
        for (const node of nodes.nodesToDelete) {
            const syncContext = conduit_storage_1.NSYNC_CONTEXT; // Remove when we remove sync context
            await tx.deleteNode(trc, syncContext, node);
        }
    }
    if (edges) {
        conduit_utils_1.logger.debug('processing event > associationEntity');
        await tx.replaceEdges(trc, edges.edgesToDelete, edges.edgesToCreate);
    }
}
async function upsertSyncInstance(trc, instance, currentUserID, eventManager, tx) {
    switch (instance.type) {
        case null:
        case undefined:
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.AGENT:
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.ASSOCIATION: {
            const depKey = NSyncEntityConverter_1.associationRefToDepKey(eventManager.di, instance.ref);
            if (depKey && !conduit_utils_1.isNullish(instance.version)) {
                await eventManager.di.markDependencySynced(trc, depKey, instance.version);
            }
            const edge = NSyncEntityConverter_1.getEdge(eventManager, instance);
            if (!edge) {
                break;
            }
            await tx.replaceEdges(trc, [], [edge]);
            break;
        }
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.CONNECTION:
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.ENTITY: {
            const ref = instance.ref;
            if (ref.id && eventManager.hasBeenExpunged(ref.id)) {
                conduit_utils_1.logger.warn(`Received upsert event operation on node id:${ref.id}, type: ${ref.type} after it had been expunged.`);
                return;
            }
            const depKey = NSyncEntityConverter_1.entityRefToDepKey(eventManager.di, ref);
            if (depKey && !conduit_utils_1.isNullish(instance.version)) {
                await eventManager.di.markDependencySynced(trc, depKey, instance.version);
            }
            const entityAndEdges = await NSyncEntityConverter_1.getEntityAndEdges(trc, instance, currentUserID, eventManager, tx);
            if (!entityAndEdges) {
                break;
            }
            await processEntityAndEdges(trc, entityAndEdges, tx);
            break;
        }
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.MEMBERSHIP: {
            const depKey = NSyncEntityConverter_1.membershipRefToDepKey(eventManager.di, instance.ref);
            if (depKey && !conduit_utils_1.isNullish(instance.version)) {
                await eventManager.di.markDependencySynced(trc, depKey, instance.version);
            }
            const entityAndEdges = NSyncEntityConverter_1.getMembership(eventManager, instance, currentUserID);
            if (!entityAndEdges) {
                break;
            }
            await processEntityAndEdges(trc, entityAndEdges, tx);
            break;
        }
        default:
            conduit_utils_1.logger.warn('upsertSyncInstance', conduit_utils_1.absurd(instance, 'Unknown sync instance type'));
    }
}
async function removeMembership(trc, eventManager, tx, membership) {
    if (!membership.ref) {
        conduit_utils_1.logger.warn('Missing membership ref on nsync expunge');
        return;
    }
    const id = NSyncEntityConverter_1.generateMembershipID(membership.ref);
    const membershipRef = { id, type: en_core_entity_types_1.CoreEntityTypes.Membership };
    if (eventManager.hasBeenExpunged(membershipRef.id)) {
        conduit_utils_1.logger.debug(`Duplicate event on id: ${membershipRef.id}, was previously expunged.`);
        return;
    }
    eventManager.addToExpunged(membershipRef.id);
    const didDeleteMembership = await tx.deleteNode(trc, conduit_storage_1.NSYNC_CONTEXT, membershipRef); // All contexts are nysnc for now till we delete syncContexts
    if (!didDeleteMembership) {
        conduit_utils_1.logger.warn(`Node (id: ${membershipRef.id}, type: ${membershipRef.type}) could not be expunged. Possibly missing.`);
    }
}
async function deleteSyncInstance(trc, instance, currentUserID, eventManager, tx) {
    var _a;
    switch (instance.type) {
        case null:
        case undefined:
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.AGENT:
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.CONNECTION:
            conduit_utils_1.logger.warn('Unhandled delete: ' + instance.type);
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.MEMBERSHIP: {
            const depKey = NSyncEntityConverter_1.membershipRefToDepKey(eventManager.di, instance.ref);
            if (depKey) {
                await eventManager.di.markDependencySynced(trc, depKey, Infinity);
            }
            await removeMembership(trc, eventManager, tx, instance);
            break;
        }
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.ASSOCIATION: {
            const depKey = NSyncEntityConverter_1.associationRefToDepKey(eventManager.di, instance.ref);
            if (depKey) {
                await eventManager.di.markDependencySynced(trc, depKey, Infinity);
            }
            const edge = NSyncEntityConverter_1.getEdge(eventManager, instance);
            if (!edge) {
                break;
            }
            await tx.replaceEdges(trc, [edge], []);
            break;
        }
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.ENTITY: {
            const depKey = NSyncEntityConverter_1.entityRefToDepKey(eventManager.di, instance.ref);
            if (depKey) {
                await eventManager.di.markDependencySynced(trc, depKey, Infinity);
            }
            const entityAndEdges = await NSyncEntityConverter_1.getEntityAndEdges(trc, instance, currentUserID, eventManager, tx);
            if (!entityAndEdges) {
                break;
            }
            const nodes = (_a = entityAndEdges.nodes) === null || _a === void 0 ? void 0 : _a.nodesToUpsert;
            if (!nodes || nodes.length !== 1) {
                conduit_utils_1.logger.warn('Did not receive single node for delete');
                break;
            }
            const syncContext = conduit_storage_1.NSYNC_CONTEXT;
            // add updated/new node
            await tx.replaceNode(trc, syncContext, nodes[0]);
            break;
        }
        default:
            conduit_utils_1.logger.warn('deleteSyncInstance', conduit_utils_1.absurd(instance, 'Unknown sync instance type'));
    }
}
async function expungeSyncInstance(trc, instance, eventManager, tx) {
    switch (instance.type) {
        case null:
        case undefined:
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.AGENT:
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.CONNECTION:
            conduit_utils_1.logger.warn('Unhandled expunge: ' + instance.type);
            break;
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.ASSOCIATION: {
            const depKey = NSyncEntityConverter_1.associationRefToDepKey(eventManager.di, instance.ref);
            if (depKey) {
                await eventManager.di.markDependencySynced(trc, depKey, Infinity);
            }
            break;
        }
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.MEMBERSHIP: {
            const depKey = NSyncEntityConverter_1.membershipRefToDepKey(eventManager.di, instance.ref);
            if (depKey) {
                await eventManager.di.markDependencySynced(trc, depKey, Infinity);
            }
            await removeMembership(trc, eventManager, tx, instance);
            break;
        }
        case en_data_model_1.ClientNSyncTypes.SyncInstanceType.ENTITY: {
            const depKey = NSyncEntityConverter_1.entityRefToDepKey(eventManager.di, instance.ref);
            if (depKey) {
                await eventManager.di.markDependencySynced(trc, depKey, Infinity);
            }
            const nodeType = en_conduit_sync_types_1.entityTypeAsNodeType(eventManager.di, instance.ref.type);
            if (conduit_utils_1.isNullish(nodeType)) {
                conduit_utils_1.logger.warn(`Expunge on unhandled nsync entity type: ${instance.ref.type}`);
                break;
            }
            const nodeRef = { id: instance.ref.id, type: nodeType };
            if (eventManager.hasBeenExpunged(nodeRef.id)) {
                conduit_utils_1.logger.debug(`Duplicate event on id: ${nodeRef.id}, was previously expunged.`);
                break;
            }
            eventManager.addToExpunged(nodeRef.id);
            const didDelete = await tx.deleteNode(trc, conduit_storage_1.NSYNC_CONTEXT, nodeRef); // All contexts are nsync for now till we delete syncContexts
            if (!didDelete) {
                conduit_utils_1.logger.warn(`Node (id: ${nodeRef.id}, type: ${nodeRef.type}) could not be expunged. Possibly missing.`);
            }
            break;
        }
        default:
            conduit_utils_1.logger.warn('expungeSyncInstance', conduit_utils_1.absurd(instance, 'Unknown sync instance type'));
    }
}
async function processNSyncDoc(trc, doc, eventManager, tx) {
    if (doc.updated === null || doc.updated === undefined || !doc.instance || doc.instance.type === null || doc.instance.type === undefined) {
        conduit_utils_1.logger.warn('Unknown sync info', doc);
        return;
    }
    const instance = doc.instance;
    const ref = doc.instance.ref;
    if ((ref === null || ref === void 0 ? void 0 : ref.id) && eventManager.hasBeenExpunged(ref.id)) {
        // Making this a warning as I want to know when we get these ordering problems. Can lower it if spammy.
        conduit_utils_1.logger.warn(`Received event operation: ${doc.operation} on node id:${ref.id}, type: ${ref.type} after it had been expunged.`);
        return;
    }
    switch (doc.operation) {
        case en_data_model_1.ClientNSyncTypes.SyncOperation.ACCESS_FANOUT:
        case en_data_model_1.ClientNSyncTypes.SyncOperation.CREATE:
        case en_data_model_1.ClientNSyncTypes.SyncOperation.UPDATE:
        case en_data_model_1.ClientNSyncTypes.SyncOperation.FORCE_FANOUT: // may want to handle this one separately in the future (fanout membership)
        case en_data_model_1.ClientNSyncTypes.SyncOperation.WITH_ENTITY_CREATE: // may want to handle this one separately in the future (batched for after create?)
            await upsertSyncInstance(trc, instance, eventManager.getUserID(), eventManager, tx);
            break;
        case en_data_model_1.ClientNSyncTypes.SyncOperation.DELETE:
            await deleteSyncInstance(trc, instance, eventManager.getUserID(), eventManager, tx);
            break;
        case en_data_model_1.ClientNSyncTypes.SyncOperation.EXPUNGE:
            await expungeSyncInstance(trc, instance, eventManager, tx);
            break;
        case en_data_model_1.ClientNSyncTypes.SyncOperation.MIGRATE:
            conduit_utils_1.logger.warn('Presently not handling MIGRATE operation');
            break;
        default:
            conduit_utils_1.logger.warn('processNSyncDoc', conduit_utils_1.absurd(doc.operation, `Unhandled SyncOperation: ${doc.operation}`));
            break;
    }
}
exports.processNSyncDoc = processNSyncDoc;
//# sourceMappingURL=NSyncProcessor.js.map