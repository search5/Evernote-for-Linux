"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThriftGraphInterface = exports.ErrorWithCleanup = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_nsync_connector_1 = require("en-nsync-connector");
const Auth = __importStar(require("./Auth"));
const BlobConverter = __importStar(require("./Converters/BlobConverter"));
const Converters_1 = require("./Converters/Converters");
const Helpers_1 = require("./Converters/Helpers");
const Helpers_2 = require("./Helpers");
const MAX_ATTEMPTS = 5;
// Internal conduit error used to identify any cleanup for a failed mutation.
// Should be used with care as it could lead to data inconsistencies if mutation succeeds partially.
class ErrorWithCleanup extends Error {
    constructor(actualErr) {
        super('Conduit internal error');
        this.actualErr = actualErr;
        this.name = 'ErrorWithCleanup';
    }
}
exports.ErrorWithCleanup = ErrorWithCleanup;
function isGuidInUseError(err) {
    return Boolean(err instanceof conduit_utils_1.ServiceError && err.errorCode === en_conduit_sync_types_1.EDAMErrorCode.DATA_CONFLICT && err.errorKey.match(/\w+\.guid/));
}
function isCommandRun(change) {
    return change.command !== undefined;
}
function isBlobReplaceOperation(change) {
    return !isCommandRun(change) && change.changeType === 'Blob:REPLACE';
}
function isBlobUploadOperation(change) {
    return !isCommandRun(change) && change.changeType === 'Blob:UPLOAD';
}
function isFileUploadOperation(change) {
    return !isCommandRun(change) && change.changeType === 'File:UPLOAD';
}
function convertBlobData(blob) {
    var _a, _b;
    return {
        content: blob.content,
        hash: (_a = blob.hash) !== null && _a !== void 0 ? _a : conduit_utils_1.md5(blob.content),
        size: (_b = blob.size) !== null && _b !== void 0 ? _b : blob.content.length,
    };
}
class ThriftGraphInterface {
    constructor(di, config) {
        this.di = di;
        this.config = config;
        this.replaceSyncState = async (trc, transactionName, path, value) => {
            const graphStorage = this.config.graphStorage;
            await graphStorage.transact(trc, transactionName, async (tx) => {
                await tx.replaceSyncState(trc, path, value);
            });
        };
        this.runExecutionPlan = async (trc, mutation, plan) => {
            let deps = null;
            const { deps: earlySyncChanges } = await this.runExecutionPlanInternal(trc, mutation, plan.ops, deps);
            deps = conduit_core_1.mergeMutationDependencies(deps, earlySyncChanges);
            if (plan.lateOps) {
                const { deps: lateSyncChanges } = await this.runExecutionPlanInternal(trc, mutation, plan.lateOps, deps);
                deps = conduit_core_1.mergeMutationDependencies(deps, lateSyncChanges);
            }
            return deps;
        };
        this.runRemoteCommand = async (trc, mutation, command) => {
            const { result } = await this.runExecutionPlanInternal(trc, mutation, [command], null);
            return result;
        };
        this.fetchEntity = async (trc, nodeRef) => {
            return await this.config.graphStorage.getNode(trc, null, nodeRef);
        };
        this.traverseGraph = async (trc, nodeRef, traverse) => {
            return await this.config.graphStorage.traverseGraph(trc, null, nodeRef, traverse);
        };
        this.queryGraph = async (trc, nodeType, queryName, queryParams) => {
            return await this.config.graphStorage.queryGraph(trc, null, nodeType, queryName, queryParams);
        };
        this.fetchNodeField = async (trc, nodeRef, fieldName) => {
            var _a, _b;
            const typeDef = (_a = this.config.graphStorage.config.nodeTypes) === null || _a === void 0 ? void 0 : _a[nodeRef.type];
            if ((_b = typeDef === null || typeDef === void 0 ? void 0 : typeDef.cache) === null || _b === void 0 ? void 0 : _b[fieldName]) {
                const cached = await this.config.graphStorage.getNodeCachedField(trc, null, nodeRef, fieldName);
                return cached ? cached.values[fieldName] : null;
            }
            const node = await this.config.graphStorage.getNode(trc, null, nodeRef);
            if (!node) {
                return null;
            }
            if (fieldName === 'label' || fieldName === 'id') {
                return node[fieldName];
            }
            return conduit_utils_1.walkObjectPath(node.NodeFields, fieldName.split('.'), null);
        };
        this.resolveOwnerRef = async (trc, owner) => {
            const syncContext = await this.getNodeBestSyncContext(trc, this.config.graphStorage, owner);
            if (syncContext === en_nsync_connector_1.NSYNC_CONTEXT) {
                const node = await this.fetchEntity(trc, owner);
                return node && node.owner || conduit_utils_1.NullUserID;
            }
            const syncContextMetadata = await this.config.graphStorage.getSyncContextMetadata(trc, null, syncContext);
            if (!syncContextMetadata) {
                throw new conduit_utils_1.PermissionError(`No user found for OwnerRef ${conduit_utils_1.safeStringify(owner)}`);
            }
            return syncContextMetadata.userID;
        };
        const localOnlyNodeTypes = [];
        if (this.di.getNodeTypeDefs) {
            const defs = this.di.getNodeTypeDefs();
            for (const type in defs) {
                if (defs[type].syncSource === conduit_storage_1.SyncSource.LOCAL) {
                    localOnlyNodeTypes.push(defs[type].name);
                }
            }
        }
        Converters_1.initNodeConverters(localOnlyNodeTypes);
    }
    async updateBlobToGraph(trc, mutatorParams, nodeRef, syncContext, blobName, blob) {
        const nodeUpdate = {
            NodeFields: {
                [blobName]: {
                    localChangeTimestamp: 0,
                    hash: blob.hash,
                    size: blob.size,
                },
            },
        };
        await mutatorParams.graphTransaction.updateNode(trc, syncContext, nodeRef, nodeUpdate);
        // assumes all blob content is cached...
        await mutatorParams.graphTransaction.setNodeCachedField(trc, nodeRef, `${blobName}.content`, blob.content, {
            [`${blobName}.hash`]: blob.hash,
            [`${blobName}.size`]: blob.size,
        });
    }
    async handleEdgeModify(trc, mutatorParams, modifyChange) {
        let error = null;
        let edgeConverter = null;
        try {
            const nodesModified = Helpers_1.processEdgeModifications(modifyChange.edgesToDelete || [], modifyChange.edgesToCreate || [], this.config.graphStorage.config.nodeTypes || {});
            for (const nodeID in nodesModified) {
                const mod = nodesModified[nodeID];
                edgeConverter = Converters_1.getNodeConverter(mod.type);
                const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, { id: nodeID, type: mod.type });
                const appliedToGraph = edgeConverter && await edgeConverter.applyEdgeChangesToService(trc, mutatorParams, syncContext, nodeID, mod.changes);
                if (edgeConverter && !appliedToGraph) {
                    await mutatorParams.graphTransaction.replaceEdges(trc, mod.edgesToDelete, mod.edgesToCreate);
                }
            }
        }
        catch (e) {
            error = e;
        }
        return {
            error,
            edgeConverter,
        };
    }
    async processChangeWithRetry(trc, mutation, mutatorParams, change, deps) {
        let converter = null;
        let currentChange = change;
        let attempt = 0;
        let result = null;
        while (attempt < MAX_ATTEMPTS) {
            try {
                if (isCommandRun(currentChange)) {
                    converter = Converters_1.getNodeConverter(currentChange.nodeType);
                    if (converter && converter.customToService) {
                        const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, currentChange.owner);
                        result = await converter.customToService(trc, mutatorParams, currentChange, syncContext);
                    }
                    else {
                        throw new Error(`Command: No customToService function defined in node converter ${currentChange.nodeType}`);
                    }
                    break;
                }
                if (!currentChange) {
                    throw new Error('Missing ops and commandRun in plan');
                }
                switch (currentChange.changeType) {
                    case 'Node:CREATE': {
                        converter = Converters_1.getNodeConverter(currentChange.node.type);
                        const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, currentChange.id[3]);
                        const appliedToGraph = converter && await converter.createOnService(trc, mutatorParams, syncContext, currentChange.node, currentChange.id[0], currentChange.remoteFields || {}, currentChange.blobs);
                        if (converter && !appliedToGraph) {
                            await mutatorParams.graphTransaction.createNode(trc, syncContext, currentChange.node);
                            if (currentChange.blobs) {
                                for (const blobName in currentChange.blobs) {
                                    await this.updateBlobToGraph(trc, mutatorParams, currentChange.node, syncContext, blobName, convertBlobData(currentChange.blobs[blobName]));
                                }
                            }
                        }
                        break;
                    }
                    case 'Node:DELETE': {
                        converter = Converters_1.getNodeConverter(currentChange.nodeRef.type);
                        const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, currentChange.nodeRef);
                        if (!syncContext) {
                            // node doesn't exist
                            break;
                        }
                        const appliedToGraph = converter && await converter.deleteFromService(trc, mutatorParams, syncContext, [currentChange.nodeRef.id]);
                        if (converter && !appliedToGraph) {
                            await mutatorParams.graphTransaction.deleteNode(trc, syncContext, currentChange.nodeRef);
                        }
                        break;
                    }
                    case 'Node:DELETE_MULTI': {
                        const nodesByTypeAndContext = {};
                        for (const nodeRef of currentChange.nodes) {
                            const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, nodeRef);
                            if (syncContext) {
                                nodesByTypeAndContext[nodeRef.type] = nodesByTypeAndContext[nodeRef.type] || {};
                                nodesByTypeAndContext[nodeRef.type][syncContext] = nodesByTypeAndContext[nodeRef.type][syncContext] || [];
                                nodesByTypeAndContext[nodeRef.type][syncContext].push(nodeRef.id);
                            }
                        }
                        for (const nodeType in nodesByTypeAndContext) {
                            const nodesByContext = nodesByTypeAndContext[nodeType];
                            converter = Converters_1.getNodeConverter(nodeType);
                            for (const syncContext in nodesByContext) {
                                const appliedToGraph = converter && await converter.deleteFromService(trc, mutatorParams, syncContext, nodesByContext[syncContext]);
                                if (converter && !appliedToGraph) {
                                    for (const nodeID of nodesByContext[syncContext]) {
                                        await mutatorParams.graphTransaction.deleteNode(trc, syncContext, { id: nodeID, type: nodeType });
                                    }
                                }
                            }
                        }
                        break;
                    }
                    case 'Node:UPDATE': {
                        converter = Converters_1.getNodeConverter(currentChange.nodeRef.type);
                        const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, currentChange.nodeRef);
                        const appliedToGraph = converter && await converter.updateToService(trc, mutatorParams, syncContext, currentChange.nodeRef.id, currentChange.node);
                        if (converter && !appliedToGraph) {
                            await mutatorParams.graphTransaction.updateNode(trc, syncContext, currentChange.nodeRef, currentChange.node);
                        }
                        break;
                    }
                    case 'Edge:MODIFY': {
                        const res = await this.handleEdgeModify(trc, mutatorParams, currentChange);
                        converter = res.edgeConverter;
                        if (res.error) {
                            throw res.error;
                        }
                        break;
                    }
                    case 'Blob:REPLACE': {
                        // this converter lookup is needed for the handleErrorToService call to work
                        converter = Converters_1.getNodeConverter(currentChange.nodeRef.type);
                        const syncContext = await this.getNodeBestSyncContext(trc, mutatorParams.graphTransaction, currentChange.nodeRef);
                        const blobData = convertBlobData(currentChange.blob);
                        const appliedToGraph = await BlobConverter.updateBlobToService(trc, mutatorParams, currentChange.nodeRef, syncContext, currentChange.blob.name, currentChange.remoteFields || {}, blobData);
                        if (converter && !appliedToGraph) {
                            await this.updateBlobToGraph(trc, mutatorParams, currentChange.nodeRef, syncContext, currentChange.blob.name, blobData);
                        }
                        break;
                    }
                    case 'Blob:UPLOAD': {
                        // handled outside the transaction
                        break;
                    }
                    case 'File:UPLOAD': {
                        // handled outside the transaction
                        break;
                    }
                    case 'Custom': {
                        const newDeps = await this.config.dispatchCustomCommand(trc, mutatorParams.personalAuth, mutation, currentChange.commandName, currentChange.params);
                        deps = conduit_core_1.mergeMutationDependencies(deps, newDeps);
                        break;
                    }
                    default:
                        throw conduit_utils_1.absurd(currentChange, 'runExecutionPlan');
                }
                break;
            }
            catch (e) {
                if (e instanceof conduit_utils_1.AuthError) {
                    const msg = isBlobReplaceOperation(currentChange) ? `type ${currentChange.changeType} ref ${currentChange.nodeRef}` : conduit_utils_1.safeStringify(change);
                    conduit_utils_1.logger.info(`Encountered auth error. Need to revalidate auth ${msg}`);
                    e = await this.di.handleAuthError(trc, e, mutatorParams.graphTransaction);
                    conduit_utils_1.logger.info(`handleAuthError ${e instanceof conduit_utils_1.RetryError ? 'refreshed auth. retrying mutation' : `auth still valid err ${e}`} ${msg}`);
                    if ((e instanceof conduit_utils_1.RetryError && e.reason === conduit_utils_1.RetryErrorReason.AUTH_UPDATED) || e instanceof conduit_utils_1.NoAccessError) {
                        // auth updated/access lost. Should let the transaction go through
                        // for new auth to be written to DB/for shared entity cleanup to happen.
                        e = new ErrorWithCleanup(e);
                    }
                }
                if (e instanceof conduit_utils_1.RetryError || e instanceof ErrorWithCleanup) {
                    throw e;
                }
                if (mutation.isRetry && isGuidInUseError(e)) {
                    // guid already taken on a retry means we probably already did this upsync successfully
                    conduit_utils_1.logger.info('Mutation received a guid-in-use error during a retry. Assuming previous run was successful.', e.errorKey);
                    break;
                }
                if (converter && converter.handleErrorToService && !isCommandRun(currentChange) && attempt < MAX_ATTEMPTS) {
                    currentChange = await converter.handleErrorToService(trc, e, mutatorParams, currentChange);
                    if (!currentChange) {
                        throw e;
                    }
                }
                else {
                    if (!converter) {
                        conduit_utils_1.logger.error(`Got an unhandled error in ThriftGraphInterface with no converter present.\n\tMutation: ${mutation.name}`);
                    }
                    throw e;
                }
            }
            attempt++;
        }
        return { result, deps };
    }
    async runExecutionPlanInternal(trc, mutation, changes, deps) {
        var _a;
        let errWithCleanup;
        const authCache = {};
        const personalAuth = await Auth.getAuthFromSyncContext(trc, this.config.graphStorage, conduit_core_1.PERSONAL_USER_CONTEXT);
        authCache[conduit_core_1.PERSONAL_USER_CONTEXT] = personalAuth;
        const vaultUserId = ((_a = personalAuth.vaultAuth) === null || _a === void 0 ? void 0 : _a.userID) || conduit_utils_1.NullUserID;
        let result = null;
        for (const change of changes) {
            if (isBlobUploadOperation(change)) {
                const syncContext = await this.getNodeBestSyncContext(trc, this.config.graphStorage, change.id[3]);
                const auth = await Helpers_1.getAuthForSyncContext(trc, this.config.graphStorage, authCache, syncContext);
                await this.config.stagedBlobManager.uploadStagedBlob(trc, change.stagedBlobID, {
                    auth,
                    syncContext,
                    serviceGuidSeed: change.id[0],
                    remoteFields: change.remoteFields,
                });
            }
            else if (isFileUploadOperation(change)) {
                const auth = await Helpers_1.getAuthForSyncContext(trc, this.config.graphStorage, authCache, conduit_core_1.PERSONAL_USER_CONTEXT);
                await this.config.stagedBlobManager.uploadStagedFile(trc, change.stagedBlobID, {
                    auth,
                    seed: change.remoteLocation[0],
                    remoteFields: change.remoteFields,
                });
            }
        }
        await this.config.graphStorage.transact(trc, 'runExecutionPlan:Thrift', async (graphTransaction) => {
            for (const change of changes) {
                const params = await Helpers_1.makeConverterParams({
                    trc,
                    graphTransaction,
                    authCache,
                    personalUserId: personalAuth.userID,
                    vaultUserId,
                    localSettings: this.config.localSettings,
                    offlineContentStrategy: this.config.offlineContentStrategy,
                });
                const mutatorParams = Object.assign(Object.assign({}, params), { personalAuth, thriftComm: this.config.thriftComm });
                const mutationRes = await conduit_utils_1.withError(this.processChangeWithRetry(trc, mutation, mutatorParams, change, deps));
                if (mutationRes.err) {
                    if (mutationRes.err instanceof ErrorWithCleanup) {
                        // break here but don't throw error to make sure transaction changes go through
                        // for any mutation cleanup to happen. Actual error will be thrown below outside transact.
                        errWithCleanup = mutationRes.err;
                        break;
                    }
                    else {
                        throw mutationRes.err;
                    }
                }
                else {
                    if (mutationRes.data.result) {
                        result = mutationRes.data.result;
                    }
                    deps = conduit_core_1.mergeMutationDependencies(deps, mutationRes.data.deps);
                }
            }
        });
        if (errWithCleanup instanceof ErrorWithCleanup) {
            throw errWithCleanup.actualErr;
        }
        return { result, deps };
    }
    async fetchEntities(trc, nodeType, ids) {
        if (!ids.length) {
            return [];
        }
        const res = await this.config.graphStorage.batchGetNodes(trc, null, nodeType, ids);
        return res || [];
    }
    async getNodeBestSyncContext(trc, graphStorage, nodeOrRef) {
        if (!nodeOrRef) {
            if (await graphStorage.getSyncContextMetadata(trc, null, conduit_core_1.VAULT_USER_CONTEXT)) {
                return conduit_core_1.VAULT_USER_CONTEXT;
            }
            return conduit_core_1.PERSONAL_USER_CONTEXT;
        }
        if (conduit_utils_1.isUserID(nodeOrRef)) {
            if (this.config.vaultUserProvider.getVaultUserID() === nodeOrRef) {
                return conduit_core_1.VAULT_USER_CONTEXT;
            }
            return conduit_core_1.PERSONAL_USER_CONTEXT;
        }
        const node = conduit_storage_1.isGraphNode(nodeOrRef) ?
            nodeOrRef :
            await graphStorage.getNode(trc, null, nodeOrRef);
        if (!node) {
            return '';
        }
        return await Helpers_2.getBestSyncContextForNode(trc, node, null, graphStorage);
    }
}
exports.ThriftGraphInterface = ThriftGraphInterface;
//# sourceMappingURL=ThriftGraphInterface.js.map