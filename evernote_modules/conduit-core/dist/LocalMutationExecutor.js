"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalMutationExecutor = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const index_1 = require("./index");
const REPLAY_TIMEBOX = 3 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
const REPLAY_TIMEBOX_SLEEP = 200;
class LocalGraphInterface {
    constructor(di, storage) {
        this.di = di;
        this.storage = storage;
        this.runExecutionPlan = async (trc, mutation, plan) => {
            await this.runExecutionPlanInternal(trc, mutation, plan.ops);
            if (plan.lateOps) {
                await this.runExecutionPlanInternal(trc, mutation, plan.lateOps);
            }
            return null;
        };
        this.runRemoteCommand = null;
        this.traverseGraph = async (trc, nodeRef, traverse) => {
            return await this.storage.traverseGraph(trc, null, nodeRef, traverse);
        };
        this.queryGraph = async (trc, nodeType, queryName, queryParams) => {
            return await this.storage.queryGraph(trc, null, nodeType, queryName, queryParams);
        };
        this.fetchNodeField = async (trc, nodeRef, fieldName) => {
            var _a, _b;
            const typeDef = (_a = this.storage.config.nodeTypes) === null || _a === void 0 ? void 0 : _a[nodeRef.type];
            if ((_b = typeDef === null || typeDef === void 0 ? void 0 : typeDef.cache) === null || _b === void 0 ? void 0 : _b[fieldName]) {
                const cached = await this.storage.getNodeCachedField(trc, null, nodeRef, fieldName);
                return cached ? cached.values[fieldName] : null;
            }
            const node = await this.storage.getNode(trc, null, nodeRef);
            if (!node) {
                return null;
            }
            if (fieldName === 'label' || fieldName === 'id') {
                return node[fieldName];
            }
            return conduit_utils_1.walkObjectPath(node.NodeFields, fieldName.split('.'), null);
        };
        this.fetchEntity = async (trc, nodeRef) => {
            return this.storage.getNode(trc, null, nodeRef);
        };
        this.resolveOwnerRef = async (trc, owner) => {
            const syncContext = await this.getNodeBestSyncContext(trc, this.storage, owner);
            if (syncContext === 'NSyncContext') {
                // SyncContext for all NSync entities is the personal context, which does not relate to the owner anymore.
                // Instead, grab the entity and find the owner there.
                const node = await this.fetchEntity(trc, owner);
                return node && node.owner || conduit_utils_1.NullUserID;
            }
            const syncContextMetadata = await this.storage.getSyncContextMetadata(trc, null, syncContext);
            if (!syncContextMetadata) {
                throw new conduit_utils_1.PermissionError(`No user found for OwnerRef ${conduit_utils_1.safeStringify(owner)}`);
            }
            return syncContextMetadata.userID;
        };
    }
    async updateNodeCachedFields(trc, db, nodeRef, cacheFields) {
        for (const field in cacheFields) {
            await db.setNodeCachedField(trc, nodeRef, field, cacheFields[field], {});
        }
    }
    async updateBlobToGraph(trc, db, nodeRef, syncContext, timestamp, blobName, blob) {
        var _a, _b;
        const nodeUpdate = {
            NodeFields: {
                [blobName]: {
                    localChangeTimestamp: timestamp,
                    hash: (_a = blob.hash) !== null && _a !== void 0 ? _a : conduit_utils_1.md5(blob.content),
                    size: (_b = blob.size) !== null && _b !== void 0 ? _b : blob.content.length,
                },
            },
        };
        await db.updateNode(trc, syncContext, nodeRef, nodeUpdate);
        // assumes all blob content is cached...
        const cacheUpdate = {
            [`${blobName}.content`]: blob.content,
        };
        if (blob.editSequenceNumber !== undefined) {
            cacheUpdate[`${blobName}.editSequenceNumber`] = blob.editSequenceNumber;
        }
        await this.updateNodeCachedFields(trc, db, nodeRef, cacheUpdate);
    }
    async runCommand(command, args) {
        // no-op for local mutation executor
    }
    async runExecutionPlanInternal(trc, mutation, ops) {
        const timestamp = mutation.timestamp;
        await this.storage.transact(trc, 'runExecutionPlan:optimistic', async (db) => {
            for (const change of ops) {
                switch (change.changeType) {
                    case 'Node:CREATE': {
                        const syncContext = await this.getNodeBestSyncContext(trc, db, change.id[3]);
                        await db.createNode(trc, syncContext, change.node, timestamp);
                        if (change.node.CacheFields) {
                            await this.updateNodeCachedFields(trc, db, change.node, change.node.CacheFields);
                        }
                        if (change.blobs) {
                            for (const blobName in change.blobs) {
                                await this.updateBlobToGraph(trc, db, change.node, syncContext, timestamp, blobName, change.blobs[blobName]);
                            }
                        }
                        break;
                    }
                    case 'Node:UPDATE': {
                        const syncContext = await this.getNodeBestSyncContext(trc, db, change.nodeRef);
                        const updatedNode = await db.updateNode(trc, syncContext, change.nodeRef, change.node, timestamp);
                        if (updatedNode && change.node.CacheFields) {
                            await this.updateNodeCachedFields(trc, db, change.nodeRef, change.node.CacheFields);
                        }
                        break;
                    }
                    case 'Node:DELETE': {
                        const syncContext = await this.getNodeBestSyncContext(trc, db, change.nodeRef);
                        if (syncContext) {
                            await db.deleteNode(trc, syncContext, change.nodeRef, undefined, timestamp);
                        }
                        break;
                    }
                    case 'Node:DELETE_MULTI': {
                        for (const nodeRef of change.nodes) {
                            const syncContext = await this.getNodeBestSyncContext(trc, db, nodeRef);
                            if (syncContext) {
                                await db.deleteNode(trc, syncContext, nodeRef);
                            }
                        }
                        break;
                    }
                    case 'Edge:MODIFY': {
                        await db.replaceEdges(trc, change.edgesToDelete || [], change.edgesToCreate || [], timestamp);
                        break;
                    }
                    case 'Blob:REPLACE': {
                        const syncContext = await this.getNodeBestSyncContext(trc, db, change.nodeRef);
                        await this.updateBlobToGraph(trc, db, change.nodeRef, syncContext, timestamp, change.blob.name, change.blob);
                        break;
                    }
                    case 'Blob:UPLOAD': {
                        // noop optimistically
                        break;
                    }
                    case 'File:UPLOAD': {
                        // noop optmistically
                        break;
                    }
                    case 'Custom': {
                        break;
                    }
                    default:
                        throw conduit_utils_1.absurd(change, 'change.changeType');
                }
            }
        });
    }
    async getNodeBestSyncContext(trc, storage, nodeOrRef) {
        if (!nodeOrRef) {
            if (await storage.getSyncContextMetadata(trc, null, index_1.VAULT_USER_CONTEXT)) {
                return index_1.VAULT_USER_CONTEXT;
            }
            return index_1.PERSONAL_USER_CONTEXT;
        }
        if (conduit_utils_1.isUserID(nodeOrRef)) {
            if (this.di.getVaultUserID() === nodeOrRef) {
                return index_1.VAULT_USER_CONTEXT;
            }
            return index_1.PERSONAL_USER_CONTEXT;
        }
        const node = conduit_storage_1.isGraphNode(nodeOrRef) ?
            nodeOrRef :
            await storage.getNode(trc, null, nodeOrRef);
        if (!node) {
            return '';
        }
        return await this.di.getBestSyncContextForNode(trc, node, null, storage);
    }
    async fetchEntities(trc, nodeType, ids) {
        if (!ids.length) {
            return [];
        }
        const res = await this.storage.batchGetNodes(trc, null, nodeType, ids);
        return res || [];
    }
}
class LocalMutationExecutor {
    constructor(di) {
        this.di = di;
        this.mutationEngine = di.MutationEngine(di.sendMutationMetrics);
    }
    getMutators() {
        return this.mutationEngine.mutators;
    }
    async runMutator(trc, storage, clientValues, userID, vaultUserID, name, params) {
        const graph = new LocalGraphInterface(this.di, storage);
        return this.mutationEngine.runMutator(trc, graph, true, clientValues, userID, vaultUserID, name, params);
    }
    async runMutations(trc, storage, userID, vaultUserID, mutations, shouldTimeboxYield) {
        const graph = new LocalGraphInterface(this.di, storage);
        let start = Date.now();
        for (const mutation of mutations) {
            await this.mutationEngine.runMutation(trc, graph, true, userID, vaultUserID, mutation);
            if (shouldTimeboxYield && (Date.now() - start) > REPLAY_TIMEBOX) {
                await conduit_utils_1.sleep(REPLAY_TIMEBOX_SLEEP);
                start = Date.now();
            }
        }
    }
}
exports.LocalMutationExecutor = LocalMutationExecutor;
//# sourceMappingURL=LocalMutationExecutor.js.map