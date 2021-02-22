"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphDB = exports.SYNC_DB_VERSION = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const dataloader_1 = __importDefault(require("dataloader"));
const FileUploader_1 = require("../FileUploader");
const index_1 = require("../index");
const LocalMutationExecutor_1 = require("../LocalMutationExecutor");
const MutationRollup_1 = require("../MutationRollup");
const GraphMutationTypes_1 = require("../Types/GraphMutationTypes");
exports.SYNC_DB_VERSION = 15; // vkumar2: CON-1080 adding attributes to Attachment
const REMOTE_MUTATION_BUFFER = 500;
const DOWNSYNC_BUFFER = 200;
const SYNC_PAUSED_RETRY_TIME = 1000 * 60;
const CORRUPT_MUTATIONS_TABLE = 'CorruptMutations';
const OPTIMISTIC_MUTATIONS_TABLE = 'OptimisticMutations';
const REMOTE_MUTATIONS_TABLE = 'RemoteMutations';
const gTrcPool = new conduit_utils_1.AsyncTracePool('GraphDB');
function getDataLoader(context, type, loader) {
    if (!context.dataLoaders[type]) {
        context.dataLoaders[type] = new dataloader_1.default(loader.bind(undefined, context, type), {
            batch: true,
            maxBatchSize: 200,
            cache: true,
        });
    }
    return context.dataLoaders[type];
}
function validateMutation(m, def) {
    try {
        conduit_utils_1.validateSchemaType(def.requiredParams, 'root', m.params, false);
        return conduit_utils_1.getTypeOf(m.timestamp) === 'number' && conduit_utils_1.getTypeOf(m.guids) === 'object';
    }
    catch (e) {
        conduit_utils_1.logger.warn('Invalid mutation: ', e);
        return false;
    }
}
class GraphDB extends conduit_storage_1.StorageEventEmitter {
    constructor(di, userID, maxBackoffTimeout = 16000) {
        super();
        this.di = di;
        this.userID = userID;
        this.isDestroyed = false;
        this.isInitialized = false;
        this.tokenUpdate = null;
        this.destructorPromise = null;
        this.orchestratorMutex = new conduit_utils_1.RankedMutex('GraphDB Orchestrator', 10000);
        this.optimisticMutations = [];
        this.downsyncEvents = [];
        this.queuedOptimisticMutationRerun = false;
        this.authBackoff = {};
        this.activeAuthRevalidations = {};
        this.batchGetNodesInternal = (context, type, ids) => {
            if (!this.isInitialized) {
                return Promise.reject(new conduit_utils_1.RetryError('GraphDB not initialized', 500));
            }
            return this.remoteStorageOverlay.batchGetNodes(context.trc, context.watcher, type, ids);
        };
        this.syncContextMetadataProvider = {
            getSyncContextMetadata: (trc, syncContext) => {
                return this.getSyncContextMetadataWithoutGraphQLContext(trc, syncContext);
            },
        };
        this.nodeFieldLookup = async (trc, ref, lookupField) => {
            return this.remoteStorageOverlay.nodeFieldLookup(trc, ref, lookupField);
        };
        // NOTE: includes dummy node refs!
        this.getGraphNodeRefsByType = async (trc, watcher, type) => {
            return await this.remoteStorageOverlay.getGraphNodeRefsByType(trc, watcher, type);
        };
        this.batchGetSyncContextMetadatasInternal = (context, type, ids) => {
            return this.remoteStorageOverlay.batchGetSyncContextMetadatas(context.trc, context.watcher, ids);
        };
        this.getSyncContextMetadataWithoutGraphQLContext = async (trc, syncContext) => {
            return await this.remoteStorageOverlay.getSyncContextMetadata(trc, null, syncContext);
        };
        // NOTE: this is a dangerous function to call, it is intended for use by custom resolvers that need access to the synced data directly
        this.getSyncedNode = async (trc, watcher, nodeRef) => {
            return await this.remoteSyncedGraphStorage.getNode(trc, watcher, nodeRef);
        };
        this.runRemoteMutations = async (mutations, opts) => {
            return gTrcPool.runTraced(this.di.getTestEventTracker(), async (trc) => {
                return this.runRemoteMutationsInternal(trc, mutations, opts);
            });
        };
        this.fetchNodeField = async (trc, nodeRef, fieldName) => {
            const node = await this.remoteStorageOverlay.getNode(trc, null, nodeRef);
            if (!node) {
                return null;
            }
            if (fieldName === 'label' || fieldName === 'id') {
                return node[fieldName];
            }
            return conduit_utils_1.walkObjectPath(node, fieldName.split('.'), null);
        };
        this.onSyncStorageChange = (event) => {
            if (this.isDestroyed) {
                return;
            }
            if (event.path[1] === 'SyncContextMetadata' && event.type === conduit_storage_1.StorageChangeType.Replace) {
                // ignore SyncContextMetadata change events
                return;
            }
            if (event.path[1] === 'SyncState') {
                // fire SyncState change events without triggering a rerun of optimistic mutations
                this.emitChanges([event]);
                return;
            }
            if (!this.optimisticMutations.length) {
                this.emitChanges([event]);
                return;
            }
            if (!this.syncEngine.isReadyForMutations()) {
                this.emitChanges([event]);
                // need to make sure we rerun optimistic mutations after initial downsync is finished!
                if (!this.queuedOptimisticMutationRerun) {
                    this.queueRerunOptimisticAfterDownsync();
                }
                return;
            }
            this.downsyncEvents.push(event);
            if (this.downsyncEvents.length === 1) {
                this.queueOnDownsyncChanges();
            }
        };
        // tslint:disable:variable-name
        // poke a hole for testing
        this._test = {
            optimisticMutations: () => {
                return this.optimisticMutations;
            },
            onSyncStorageChange: (event) => {
                return this.onSyncStorageChange(event);
            },
        };
        this.localMutationExecutor = new LocalMutationExecutor_1.LocalMutationExecutor(Object.assign(Object.assign({}, this.di), { getVaultUserID: () => {
                return this.syncEngine.getVaultUserID();
            } }));
        this.changeQueue = new conduit_utils_1.ExecutionQueue();
        if (maxBackoffTimeout < 1000) {
            conduit_utils_1.logger.debug('maxBackoffTimeout value is less than 1000ms. setting the default value(16000ms)');
            this.maxBackoffTimeout = 16000;
        }
        else {
            this.maxBackoffTimeout = maxBackoffTimeout;
        }
    }
    async init(startSync = true, update) {
        await gTrcPool.runTraced(this.di.getTestEventTracker(), async (trc) => {
            await this.initInternal(trc, startSync, update);
        });
    }
    async initInternal(trc, startSync, update) {
        this.remoteSyncedGraphStorage = await this.di.GraphStorageDB(trc, GraphDB.DB_NAMES.RemoteGraph, exports.SYNC_DB_VERSION),
            this.remoteSyncedGraphStorage.addChangeHandler(this.onSyncStorageChange);
        this.initOverlay();
        this.localKeyValStorage = await this.di.KeyValStorage(trc, GraphDB.DB_NAMES.LocalStorage);
        this.localKeyValStorage.addChangeHandler(this);
        this.ephemeralState = new conduit_storage_1.KeyValOverlay(this.localKeyValStorage, true);
        this.ephemeralState.addChangeHandler(this);
        this.memKeyValStorage = await this.di.KeyValStorageMem(trc, 'MemoryStorage');
        this.memKeyValStorage.addChangeHandler(this);
        this.syncEngine = this.di.SyncEngine(this.remoteSyncedGraphStorage, this.ephemeralState, this.di.localSettings);
        this.stagedBlobManager = this.di.StagedBlobManager(this.remoteSyncedGraphStorage, this.localKeyValStorage, this.di.localSettings);
        this.fileUploader = new FileUploader_1.FileUploader(this.di, this, this.di.getResourceManager(), this.stagedBlobManager);
        this.remoteMutationExecutor = this.di.RemoteMutationExecutor(this.remoteSyncedGraphStorage, this.di.sendMutationMetrics, this.di.localSettings, this.stagedBlobManager, this.syncEngine);
        this.remoteMutationConsumer = new conduit_utils_1.DataConsumer({
            debugName: 'Upsync',
            bufferTime: REMOTE_MUTATION_BUFFER,
            consumer: this.runRemoteMutations,
            backoffIncrement: 3 * 1000,
            backoffMax: 30 * 1000,
        });
        this.isInitialized = true;
        await this.startSyncing(trc, startSync, update);
        await this.loadPersistedMutations();
        if (this.notificationManager) {
            // not awaiting so as to not block the loading screen. TODO(droth) find a better place for this
            this.notificationManager.scheduleExistingScheduledNotifications(trc, this)
                .catch((err) => conduit_utils_1.logger.error('Unable to schedule existing notifications', err));
        }
    }
    async destructor() {
        if (this.destructorPromise) {
            return this.destructorPromise;
        }
        conduit_utils_1.logger.info('GraphDB.destructor');
        this.isDestroyed = true;
        super.destructor();
        this.destructorPromise = conduit_utils_1.logIfSlow('GraphDB:destructor', 5000, async (loggerArgs) => {
            await gTrcPool.runTraced(this.di.getTestEventTracker(), async (trc) => {
                await this.orchestratorMutex.runInMutex(trc, 'stopSyncing', async () => {
                    this.syncEngine && await conduit_utils_1.logAndDiscardError(this.syncEngine.stopSyncing(trc));
                }, undefined, conduit_utils_1.MutexPriority.BEFORE_DESTRUCTION);
            });
            loggerArgs.stopSyncingDone = true;
            await this.orchestratorMutex.destructor();
            loggerArgs.mutexDestructed = true;
            if (!this.isInitialized) {
                return;
            }
            this.isInitialized = false;
            await gTrcPool.runTraced(this.di.getTestEventTracker(), async (trc) => {
                this.changeQueue.destructor();
                await this.remoteMutationConsumer.destructor(trc);
                await this.syncEngine.destructor(trc);
                await this.localKeyValStorage.destructor();
                await this.ephemeralState.destructor();
                await this.memKeyValStorage.destructor();
                await this.remoteStorageOverlay.destructor(trc);
                await this.remoteSyncedGraphStorage.destructor(trc);
            });
            this.activeAuthRevalidations = {};
            this.authBackoff = {};
        });
        return this.destructorPromise;
    }
    initOverlay(newOverlay) {
        this.remoteStorageOverlay = newOverlay || this.remoteSyncedGraphStorage.createOverlay(false);
        this.remoteStorageOverlay.addChangeHandler(this);
    }
    async resetOverlay(trc, newOverlay) {
        if (this.remoteStorageOverlay) {
            await this.remoteStorageOverlay.destructor(trc);
        }
        this.initOverlay(newOverlay);
    }
    async readonlyIndexingTreeForTypeAndIndex(trc, type, index) {
        return this.remoteStorageOverlay.readOnlyTreeForTypeAndIndex(trc, type, index, index.inMemoryIndex);
    }
    async getAuthTokenAndState(trc, watcher) {
        return this.di.getAuthTokenAndState(trc, watcher);
    }
    async setAuthTokenAndState(trc, argAuth, startSync = true, update) {
        if (this.tokenUpdate) {
            return this.tokenUpdate;
        }
        this.tokenUpdate = this.setAuthTokenAndStateInternal(trc, argAuth, startSync, update);
        try {
            await this.tokenUpdate;
        }
        finally {
            this.tokenUpdate = null;
        }
    }
    async setAuthTokenAndStateInternal(trc, argAuth, startSync = true, update) {
        const auth = Object.assign({}, argAuth);
        await this.di.setAuthTokenAndState(trc, auth);
        await this.orchestratorMutex.runInMutex(trc, 'setAuthTokenAndState', async () => {
            if (!this.syncEngine) {
                return;
            }
            if (!auth.token || auth.state !== conduit_view_types_1.AuthState.Authorized) {
                // No auth token OR unauthorized. Shut off sync engine.
                await this.syncEngine.initAuth(trc, null);
            }
            else {
                await this.syncEngine.initAuth(trc, auth.token, startSync, update);
            }
        }, undefined, conduit_utils_1.MutexPriority.HIGH);
    }
    async handleAuthError(trc, err, tx) {
        if (this.activeAuthRevalidations[err.tokenHash]) {
            conduit_utils_1.logger.debug('handleAuthError: returning active promise ', err.tokenHash);
            return this.activeAuthRevalidations[err.tokenHash];
        }
        const p = this.handleAuthErrorImpl(trc, err, tx);
        this.activeAuthRevalidations[err.tokenHash] = p;
        try {
            return await p;
        }
        finally {
            delete this.activeAuthRevalidations[err.tokenHash];
        }
    }
    async handleAuthErrorImpl(trc, err, tx) {
        if (!this.isInitialized) {
            return new conduit_utils_1.RetryError('Unable to handle auth error without a graph db', 500);
        }
        if (err.errorCode === conduit_utils_1.AuthErrorCode.CLIENT_NOT_SUPPORTED) {
            const tokenAndState = await this.getAuthTokenAndState(trc, null);
            const isCookieAuth = await this.di.cookieAuth(trc);
            if (isCookieAuth && tokenAndState && tokenAndState.state !== conduit_view_types_1.AuthState.ClientNotSupported) {
                this.setAuthTokenAndState(trc, { userID: this.userID, token: null, state: conduit_view_types_1.AuthState.ClientNotSupported }).catch(innerErr => {
                    conduit_utils_1.logger.error('setAuthTokenAndState failed', innerErr);
                });
            }
            return err;
        }
        if (err.errorCode === conduit_utils_1.AuthErrorCode.SESSION_REVOKED) {
            // Token is already invalid.
            this.setAuthTokenAndState(trc, { userID: this.userID, token: null, state: conduit_view_types_1.AuthState.SessionRevoked }).catch(innerErr => {
                conduit_utils_1.logger.error('setAuthTokenAndState failed', innerErr);
            });
            return err;
        }
        if (!Boolean(this.authBackoff[err.tokenHash])) {
            this.authBackoff[err.tokenHash] = new conduit_utils_1.ExponentialBackoffManager(this.maxBackoffTimeout);
        }
        const backoffManager = this.authBackoff[err.tokenHash];
        const delay = backoffManager.getDelayDuration();
        if (delay > 0) {
            return new conduit_utils_1.RetryError('Slowing down auth request', delay);
        }
        const { err: authErr, data } = await conduit_utils_1.withError(this.syncEngine.revalidateAuth(trc, err, tx));
        // original AuthError converted to a different error; combine the stacks
        if (authErr) {
            authErr.stack = (authErr.stack || '') + (err.stack || '');
            backoffManager.bumpDelayTime(); // Initial downsync retries token refresh even if there is another error than AuthError.
            return authErr;
        }
        // null indicates that the original AuthError is still correct
        if (!data) {
            backoffManager.bumpDelayTime();
            return err;
        }
        // Token refresh is finished successfully. Remove backoff manager for the current token
        backoffManager.resetDelay();
        delete this.authBackoff[err.tokenHash];
        // auth token and/or state have changed, persist them and convert AuthError to a RetryError
        // setAuthTokenAndState but don't await; we may be inside a mutex lock already
        gTrcPool.runTraced(this.di.getTestEventTracker(), trc2 => this.setAuthTokenAndState(trc2, data)).catch(innerErr => {
            conduit_utils_1.logger.error('setAuthTokenAndState failed', innerErr);
        });
        return new conduit_utils_1.RetryError('auth updated', 500, conduit_utils_1.RetryErrorReason.AUTH_UPDATED);
    }
    async getSyncState(trc, watcher, path) {
        if (path && path.length) {
            return await this.remoteStorageOverlay.getSyncState(trc, watcher, path);
        }
        return await this.remoteStorageOverlay.getFullSyncState(trc, watcher);
    }
    async getCustomSyncState(trc, watcher, customType, key) {
        return this.remoteStorageOverlay.getCustomSyncState(trc, watcher, customType, key);
    }
    async getEphemeralFlag(trc, watcher, tableName, key) {
        return await this.ephemeralState.getValidatedValue(trc, watcher, tableName, key, conduit_storage_1.validateIsBoolean);
    }
    async getEphemeralKeys(trc, watcher, tableName) {
        return await this.ephemeralState.getKeys(trc, watcher, tableName);
    }
    async getEphemeralObject(trc, watcher, tableName, key) {
        return await this.ephemeralState.getValidatedValue(trc, watcher, tableName, key, conduit_storage_1.validateIsObject);
    }
    getFileUploader() {
        return this.fileUploader;
    }
    async forceDownsync(trc, flushMutations) {
        await this.orchestratorMutex.runInMutex(trc, 'forceDownsync', async () => {
            await this.syncEngine.forceDownsyncUpdate(trc, null);
        });
        if (flushMutations) {
            // returns the number of mutations upsynced
            return await this.flushRemoteMutations();
        }
        return {
            completed: 0,
            pending: 0,
            optimistic: this.optimisticMutations.length,
            optimisticNames: this.optimisticMutations.map(mutation => mutation.name),
        };
    }
    async forceStopDownsync(trc) {
        await this.syncEngine.disableSyncing(trc);
    }
    async forceResumeDownsync(trc) {
        await this.syncEngine.enableSyncing(trc);
    }
    async needImmediateNotesDownsync(trc, args) {
        return await this.syncEngine.needImmediateNotesDownsync(trc, args);
    }
    async immediateNotesDownsync(trc, args) {
        return await this.syncEngine.immediateNotesDownsync(trc, args);
    }
    async cancelImmediateNotesDownsync(trc) {
        await this.syncEngine.cancelImmediateNotesDownsync(trc);
    }
    async forceStopUpsync() {
        await this.remoteMutationConsumer.stopConsumer();
    }
    async forceResumeUpsync() {
        await this.remoteMutationConsumer.resumeConsumer();
    }
    async getAllSyncContextMetadata(trc, watcher) {
        return await this.remoteStorageOverlay.getAllSyncContextMetadata(trc, watcher);
    }
    async getAllSyncContexts(trc, watcher) {
        return await this.remoteStorageOverlay.getAllSyncContexts(trc, watcher);
    }
    async loadMutationsFromTable(trc, tableName) {
        const mutationIDs = await this.localKeyValStorage.getKeys(trc, null, tableName);
        const mutations = [];
        const mutationDefs = this.getMutators();
        for (const mutationID of mutationIDs) {
            const mutation = await this.localKeyValStorage.getValidatedValue(trc, null, tableName, mutationID, conduit_storage_1.validateIsObject);
            if (!mutation) {
                continue;
            }
            const mutationDef = mutationDefs[mutation.name];
            if (mutationDef && validateMutation(mutation, mutationDef)) {
                mutations.push(mutation);
            }
            else {
                if (!mutationDef) {
                    conduit_utils_1.logger.warn(`Unable to find definition of mutation "${mutation.name}"`);
                }
                await this.localKeyValStorage.transact(trc, 'moveCorruptMutations', async (db) => {
                    await db.setValue(trc, CORRUPT_MUTATIONS_TABLE, mutationID, mutation);
                    await db.removeValue(trc, tableName, mutationID);
                });
            }
        }
        mutations.sort((a, b) => a.timestamp - b.timestamp);
        return mutations;
    }
    async loadPersistedMutations() {
        const changeEvents = [];
        await gTrcPool.runTraced(this.di.getTestEventTracker(), async (trc) => {
            await this.orchestratorMutex.runInMutex(trc, 'loadPersistedMutations', async () => {
                this.optimisticMutations = await this.loadMutationsFromTable(trc, OPTIMISTIC_MUTATIONS_TABLE);
                const remoteMutations = await this.loadMutationsFromTable(trc, REMOTE_MUTATIONS_TABLE);
                this.remoteMutationConsumer.push(...remoteMutations);
                await this.rerunOptimisticMutations(trc, changeEvents, false);
            });
        });
        this.emitChanges(changeEvents);
    }
    async startSyncing(trc, startSync, update) {
        const auth = await this.getAuthTokenAndState(trc, null);
        if (!auth) {
            conduit_utils_1.logger.warn('startSyncing called without an activated user');
            return;
        }
        const fixed = await this.syncEngine.fixupAuth(trc, auth);
        if (fixed) {
            // setAuthTokenAndState will call initAuth
            await this.clear(trc, false);
            await this.setAuthTokenAndState(trc, fixed, startSync, update);
            return;
        }
        await this.orchestratorMutex.runInMutex(trc, 'startSyncing', async () => {
            if (!auth.token || auth.state !== conduit_view_types_1.AuthState.Authorized) {
                // No auth token OR unauthorized. Shut off sync engine.
                await this.syncEngine.initAuth(trc, null);
            }
            else {
                await this.syncEngine.initAuth(trc, auth.token, startSync, update);
            }
        });
    }
    async clear(trc, rebootSync) {
        if (this.destructorPromise) {
            throw new conduit_utils_1.InternalError('Already GraphDB is destructed');
        }
        const userID = await this.di.getCurrentUserID(trc, null);
        if (!userID) {
            throw new conduit_utils_1.InternalError('Unable to clear graph associated to no user');
        }
        await this.orchestratorMutex.runInMutex(trc, 'clear', async () => {
            var _a;
            await this.syncEngine.stopSyncing(trc);
            // Clear pending notifications if we have a notifications manager
            await ((_a = this.notificationManager) === null || _a === void 0 ? void 0 : _a.unschedulePendingNotifications(trc, this));
            await this.remoteSyncedGraphStorage.transact(trc, 'GraphDB.clear', async (db) => {
                await db.clearAllData(trc);
            });
            // clear localKeyValStorage
            await this.localKeyValStorage.transact(trc, 'GraphDB.LocalKeyValStorage.clear', async (db) => {
                await db.clearAll(trc);
            });
            // clear resource-cache if present
            const resourceManager = this.di.getResourceManager();
            if (resourceManager) {
                await resourceManager.deleteCacheForUser(trc, conduit_utils_1.keyStringForUserID(userID));
            }
            await conduit_storage_1.flushBackgroundWrites(trc);
            await this.resetOverlay(trc);
            await this.syncEngine.initAuth(trc, null);
            if (rebootSync) {
                const auth = await this.getAuthTokenAndState(trc, null);
                if ((auth === null || auth === void 0 ? void 0 : auth.token) && auth.state === conduit_view_types_1.AuthState.Authorized) {
                    await this.syncEngine.initAuth(trc, auth.token, true);
                }
            }
            conduit_utils_1.logger.info('GraphDB.clear: ', { rebootSync });
        }, undefined, conduit_utils_1.MutexPriority.HIGH);
    }
    getNodeLoader(context, type) {
        return getDataLoader(context, type, this.batchGetNodesInternal);
    }
    prefillNodeFetch(context, node) {
        this.getNodeLoader(context, node.type).prime(node.id, node);
    }
    clearNodeFetchCache(context, nodeRef) {
        if (context.dataLoaders[nodeRef.type]) {
            this.getNodeLoader(context, nodeRef.type).clear(nodeRef.id);
        }
    }
    async getNode(context, nodeRef, bypassCache = false) {
        if (conduit_storage_1.isGraphNode(nodeRef) && !bypassCache) {
            return nodeRef;
        }
        if (bypassCache) {
            this.clearNodeFetchCache(context, nodeRef);
        }
        if (!nodeRef.id) {
            throw new conduit_utils_1.InternalError('bad node ref');
        }
        return await this.getNodeLoader(context, nodeRef.type).load(nodeRef.id);
    }
    async getNodeWithoutGraphQLContext(trc, nodeRef) {
        return await this.remoteStorageOverlay.getNode(trc, null, nodeRef);
    }
    getBestSyncContextForNode(trc, node) {
        return this.di.getBestSyncContextForNode(trc, node, this.syncContextMetadataProvider, null);
    }
    async getNodeWithContext(context, nodeRef) {
        const node = await this.getNode(context, nodeRef);
        if (!node) {
            return { node: null, syncContext: '' };
        }
        return { node, syncContext: await this.getBestSyncContextForNode(context.trc, node) };
    }
    async getUserNode(context) {
        // This convenience function assumes a type "User" exists, but since conduit-core is type-agnostic it needs to
        // cast to NodeType instead of using a constant.
        return await this.getNode(context, {
            id: index_1.PERSONAL_USER_ID,
            type: 'User',
        });
    }
    async batchGetNodes(context, type, nodeIDs) {
        if (!nodeIDs.length) {
            return [];
        }
        return await conduit_utils_1.allSettled(nodeIDs.map(id => this.getNode(context, { id, type })));
    }
    async batchGetNodesWithoutGraphQLContext(trc, type, nodeIDs) {
        return await this.remoteStorageOverlay.batchGetNodes(trc, null, type, nodeIDs);
    }
    async traverseGraph(context, nodeRef, traverse) {
        return await this.remoteStorageOverlay.traverseGraph(context.trc, context.watcher, nodeRef, traverse);
    }
    async queryGraph(context, nodeType, queryName, queryParams) {
        return await this.remoteStorageOverlay.queryGraph(context.trc, context.watcher, nodeType, queryName, queryParams);
    }
    async queryGraphWithoutGraphQLContext(trc, nodeType, queryName, queryParams) {
        return await this.remoteStorageOverlay.queryGraph(trc, null, nodeType, queryName, queryParams);
    }
    async getGraphNodesByType(trc, watcher, type) {
        return await this.remoteStorageOverlay.getGraphNodesByType(trc, watcher, type);
    }
    async getNodeCachedField(context, nodeRef, cacheField, cacheFillFunction) {
        const node = await this.getNode(context, nodeRef);
        if (!node) {
            return undefined;
        }
        const cached = await this.remoteStorageOverlay.getNodeCachedField(context.trc, context.watcher, node, cacheField);
        if (cached) {
            if (cached.isStale && cached.node && cacheFillFunction) {
                if (cached.allowStaleOnFillFailure) {
                    try {
                        return await cacheFillFunction(cached.node, await this.getBestSyncContextForNode(context.trc, cached.node));
                    }
                    catch (err) {
                        conduit_utils_1.logger.info('Cache fill failed: ' + err);
                    }
                }
                else {
                    // async fill cache but still return current value
                    const syncContext = await this.getBestSyncContextForNode(context.trc, cached.node);
                    cacheFillFunction(cached.node, syncContext).catch(err => {
                        conduit_utils_1.logger.error(`Failed to async populate cache for field ${cacheField}`, err);
                    });
                }
            }
            return cached.values[cacheField];
        }
        if (!cacheFillFunction) {
            return undefined;
        }
        return await cacheFillFunction(node, await this.getBestSyncContextForNode(context.trc, node));
    }
    async getNodeCachedFieldRaw(trc, nodeRef, cacheField) {
        return await this.remoteStorageOverlay.getNodeCachedField(trc, null, nodeRef, cacheField);
    }
    async getSyncContextMetadata(context, syncContext) {
        const loader = getDataLoader(context, 'SyncContextMetadata', this.batchGetSyncContextMetadatasInternal);
        return loader.load(syncContext);
    }
    // NOTE: this is a dangerous function to call, it is intended for use by custom resolvers that need write access to the synced data directly
    async transactSyncedStorage(trc, transactionName, func) {
        return await this.remoteSyncedGraphStorage.transact(trc, transactionName, func);
    }
    suppressSyncForQuery(name) {
        if (this.isInitialized) {
            this.syncEngine.suppressSyncForQuery(name);
        }
    }
    getMutators() {
        return this.localMutationExecutor.getMutators();
    }
    remoteMutationsNeedFlush(dependentGuids) {
        for (const mutation of this.optimisticMutations) {
            for (const type in mutation.guids) {
                const ops = mutation.guids[type];
                if (ops.length > 0 && ops[0].length > 1 && dependentGuids.includes(ops[0][1])) {
                    return true;
                }
            }
        }
        return false;
    }
    async flushRemoteMutations() {
        const res = await this.remoteMutationConsumer.flush();
        this.optimisticMutations.forEach(mut => {
            conduit_utils_1.logger.warn(mut.name);
        });
        return Object.assign(Object.assign({}, res), { optimistic: this.optimisticMutations.length, optimisticNames: this.optimisticMutations.map(mutation => mutation.name) });
    }
    async runMutator(trc, name, params) {
        const mutatorDef = this.localMutationExecutor.getMutators()[name];
        if (!mutatorDef) {
            throw new conduit_utils_1.NotFoundError(name, `No mutator named "${name}"`);
        }
        if (mutatorDef.type === GraphMutationTypes_1.MutatorRemoteExecutorType.CommandService && !await this.remoteMutationExecutor[mutatorDef.type].isAvailable()) {
            throw new conduit_utils_1.ServiceNotActiveError('Command Service');
        }
        await this.syncEngine.waitUntilReadyForMutations(trc);
        if (mutatorDef.executeOnService) {
            return await this.runMutatorRemoteOnly(trc, name, params);
        }
        else {
            return await this.runMutatorOptimistic(trc, name, params);
        }
    }
    async getMutatorClientValues(trc) {
        const isBusinessAccount = await this.isBusinessAccount(trc);
        const syncContextMetadata = await this.remoteStorageOverlay.getSyncContextMetadata(trc, null, isBusinessAccount ? index_1.VAULT_USER_CONTEXT : index_1.PERSONAL_USER_CONTEXT);
        return syncContextMetadata || {};
    }
    async runMutatorOptimistic(trc, name, params) {
        const mutation = await this.orchestratorMutex.runInMutex(trc, 'runMutatorOptimistic', async () => {
            const clientValues = await this.getMutatorClientValues(trc);
            return await this.localMutationExecutor.runMutator(trc, this.remoteStorageOverlay, clientValues, this.userID, this.syncEngine.getVaultUserID(), name, params);
        });
        await this.localKeyValStorage.transact(trc, 'GraphDB.runMutatorOptimistic', async (db) => {
            await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutation.mutationID, mutation);
            await db.setValue(trc, REMOTE_MUTATIONS_TABLE, mutation.mutationID, mutation);
        });
        this.optimisticMutations.push(mutation);
        this.remoteMutationConsumer.push(mutation);
        return mutation;
    }
    async runBatch(trc, type, auth, userID, vaultUserID, mutations, opts, lastRun) {
        if (lastRun.retryError) {
            const retryErrors = {};
            for (const mutation of mutations) {
                retryErrors[mutation.mutationID] = new conduit_utils_1.RetryError(lastRun.retryError.message, lastRun.retryError.timeout, lastRun.retryError.reason);
            }
            return {
                errors: Object.assign(Object.assign({}, lastRun.errors), retryErrors),
                batchTimestamps: lastRun.batchTimestamps,
                retryError: lastRun.retryError,
            };
        }
        if (type === GraphMutationTypes_1.MutatorRemoteExecutorType.CommandService && !this.remoteMutationExecutor[type].isAvailable()) {
            // TODO: CON-2017 - Do something to preserve these mutations.
            conduit_utils_1.logger.error(`${type} not available. DATA LOSS HAS OCCURED`);
            mutations.forEach(mutation => {
                conduit_utils_1.logger.error(mutation.name, mutation.params);
            });
            conduit_utils_1.logger.error(`END OF DATA LOSS`);
            const serviceNotActiveErrors = {};
            for (const mutation of mutations) {
                serviceNotActiveErrors[mutation.mutationID] = new conduit_utils_1.ServiceNotActiveError(type);
            }
            return {
                errors: Object.assign(Object.assign({}, lastRun.errors), serviceNotActiveErrors),
                batchTimestamps: lastRun.batchTimestamps,
                retryError: lastRun.retryError,
            };
        }
        const { errors, batchTimestamps, retryError } = await this.remoteMutationExecutor[type].runMutations(trc, auth, userID, vaultUserID, mutations, opts);
        return {
            errors: Object.assign(Object.assign({}, lastRun.errors), errors),
            batchTimestamps: Object.assign(Object.assign({}, lastRun.batchTimestamps), batchTimestamps),
            retryError: lastRun.retryError || retryError,
        };
    }
    async runMutations(trc, auth, userID, vaultUserID, mutations, opts) {
        let batch = [];
        let currentType = GraphMutationTypes_1.MutatorRemoteExecutorType.Thrift;
        let lastRun = {
            errors: {},
            batchTimestamps: {},
            retryError: null,
        };
        for (const mutation of mutations) {
            const def = this.di.getMutatorDefs()[mutation.name];
            const type = def.type || GraphMutationTypes_1.MutatorRemoteExecutorType.Thrift;
            if (type !== currentType && batch.length) {
                lastRun = await this.runBatch(trc, currentType, auth, userID, vaultUserID, batch, opts, lastRun);
                batch = [];
            }
            currentType = type;
            batch.push(mutation);
        }
        if (batch.length) {
            lastRun = await this.runBatch(trc, currentType, auth, userID, vaultUserID, batch, opts, lastRun);
        }
        return lastRun;
    }
    async runMutatorRemoteOnly(trc, name, params) {
        conduit_utils_1.logger.debug('GraphDB.runMutatorRemoteOnly', name);
        if (this.remoteMutationConsumer.getPauseState()) {
            throw new conduit_utils_1.RetryError('Sync Paused', SYNC_PAUSED_RETRY_TIME);
        }
        // flush pending remote mutations, retry if offline
        for (let i = 0; i < 20; ++i) {
            try {
                await this.remoteMutationConsumer.flush();
            }
            catch (err) {
                if (err instanceof conduit_utils_1.RetryError) {
                    await conduit_utils_1.sleep(err.timeout);
                    continue;
                }
                throw err;
            }
            break;
        }
        return await this.orchestratorMutex.runInMutex(trc, 'runMutatorRemoteOnly', async () => {
            // run mutator against a temporary overlay (just to generate guids and fill in the Mutation struct)
            const tempOverlay = this.remoteStorageOverlay.createOverlay(false);
            const clientValues = await this.getMutatorClientValues(trc);
            const vaultUserID = this.syncEngine.getVaultUserID();
            const mutationRes = await conduit_utils_1.withError(this.localMutationExecutor.runMutator(trc, tempOverlay, clientValues, this.userID, vaultUserID, name, params));
            await tempOverlay.destructor(trc);
            if (mutationRes.err) {
                throw mutationRes.err;
            }
            const auth = await this.getAuthTokenAndState(trc, null);
            if (!(auth === null || auth === void 0 ? void 0 : auth.token) || auth.state !== conduit_view_types_1.AuthState.Authorized) {
                throw new Error('not authorized');
            }
            // run mutation remotely and wait for the result
            const mutation = mutationRes.data;
            const { errors } = await this.runMutations(trc, auth.token, this.userID, vaultUserID, [mutation], { isFlush: true, stopConsumer: false });
            if (errors[mutation.mutationID]) {
                throw errors[mutation.mutationID];
            }
            // force a downsync, just like in runRemoteMutations()
            try {
                await this.syncEngine.forceDownsyncUpdate(trc, 5000);
            }
            catch (err) {
                conduit_utils_1.logger.warn('forceDownsync failed', err);
            }
            return mutation;
        });
    }
    async preprocessRemoteMutations(trc, remoteMutations) {
        const { changes, mutations, errors } = MutationRollup_1.rollupPendingMutations(remoteMutations, this.di.getMutatorDefs());
        if (errors.length) {
            conduit_utils_1.logger.error('rollupPendingMutations errors: ', errors);
        }
        if (!Object.keys(changes).length) {
            // early out if nothing changed
            return mutations;
        }
        // apply changes
        await this.localKeyValStorage.transact(trc, 'GraphDB.preprocessRemoteMutations', async (db) => {
            for (const mutationID in changes) {
                const m = changes[mutationID];
                const oIdx = this.optimisticMutations.findIndex(om => om.mutationID === mutationID);
                if (m) {
                    await db.setValue(trc, REMOTE_MUTATIONS_TABLE, mutationID, m);
                    if (oIdx >= 0) {
                        await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutationID, m);
                        this.optimisticMutations[oIdx] = m;
                    }
                }
                else {
                    await db.removeValue(trc, REMOTE_MUTATIONS_TABLE, mutationID);
                    if (oIdx >= 0) {
                        await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutationID);
                        this.optimisticMutations.splice(oIdx, 1);
                    }
                }
            }
        });
        return mutations;
    }
    async runRemoteMutationsInternal(trc, mutationsIn, opts) {
        if (this.isDestroyed) {
            return mutationsIn;
        }
        const mutations = await this.preprocessRemoteMutations(trc, mutationsIn);
        conduit_utils_1.logger.debug('GraphDB.runRemoteMutations', { count: mutations.length, opts });
        const auth = await this.getAuthTokenAndState(trc, null);
        if (!(auth === null || auth === void 0 ? void 0 : auth.token) || auth.state !== conduit_view_types_1.AuthState.Authorized) {
            throw new Error('not authorized');
        }
        const { batchTimestamps, errors } = await this.runMutations(trc, auth.token, this.userID, this.syncEngine.getVaultUserID(), mutations, opts);
        // handle errors coming back from runMutations
        const { successMutations, retryMutations, failedMutations } = conduit_utils_1.multiSplitArray(mutations, m => {
            const e = errors[m.mutationID];
            if (e instanceof conduit_utils_1.RetryError) {
                return 'retryMutations';
            }
            if (e) {
                return 'failedMutations';
            }
            return 'successMutations';
        });
        await this.localKeyValStorage.transact(trc, 'GraphDB.runRemoteMutations', async (db) => {
            for (const m of (successMutations || [])) {
                await db.removeValue(trc, REMOTE_MUTATIONS_TABLE, m.mutationID);
                if (batchTimestamps[m.mutationID] !== undefined) {
                    m.commandServiceTimestamp = batchTimestamps[m.mutationID];
                }
                else if (m.clearedWithMutationTracker) {
                    m.clearedWithMutationTracker = false;
                }
                // mark as retry because we already ran it; in case of an error after this transaction the DataConsumer will rerun the mutations
                m.isRetry = true;
                // persist any changes to mutation
                const index = this.optimisticMutations.findIndex(om => om.mutationID === m.mutationID);
                if (index >= 0) {
                    this.optimisticMutations[index] = m; // update the cached optimistic mutation since preprocess now clones mutations
                    await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, m.mutationID, m); // save mutation with new timestamp
                }
                else {
                    conduit_utils_1.logger.error('Mutation should still be in optimistic list. This should never happen');
                }
            }
            for (const m of (failedMutations || [])) {
                await db.removeValue(trc, REMOTE_MUTATIONS_TABLE, m.mutationID);
                await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, m.mutationID);
                const oIdx = this.optimisticMutations.findIndex(om => om.mutationID === m.mutationID);
                if (oIdx >= 0) {
                    this.optimisticMutations.splice(oIdx, 1);
                }
                const err = errors[m.mutationID];
                if (!err) {
                    throw new Error('missing error in failed mutation');
                }
                await this.di.addError(trc, err, m);
            }
            if (retryMutations && retryMutations.length) {
                // mutation may have been run by the server successfully but interrupted on response,
                // so mark for correct handling on retry
                const m = retryMutations[0];
                m.isRetry = true;
                await db.setValue(trc, REMOTE_MUTATIONS_TABLE, m.mutationID, m);
            }
        });
        if (this.isDestroyed) {
            return retryMutations || [];
        }
        if (successMutations || failedMutations) {
            // We need to keep optimistic mutation list separate from pending remote mutation list and clear things
            // out as they are seen in onDownsyncChanges. For now, force a downsync here since we don't have Thrift
            // support for identifying which mutations were seen in a downsync.
            const changeEvents = [];
            await conduit_utils_1.withError(this.orchestratorMutex.runInMutex(trc, 'runRemoteMutations', async () => {
                if (this.isDestroyed) {
                    return;
                }
                if (failedMutations) {
                    // rerun optimistic mutations immediately to correct the mispredicts caused by the failed remote execution
                    await this.rerunOptimisticMutations(trc, changeEvents, true);
                }
                try {
                    await this.syncEngine.forceDownsyncUpdate(trc, 5000);
                }
                catch (err) {
                    conduit_utils_1.logger.warn('forceDownsync failed', err);
                }
            }));
            this.emitChanges(changeEvents);
        }
        return retryMutations || [];
    }
    async clearRoundTrippedOptimisticMutations(trc) {
        await this.localKeyValStorage.transact(trc, 'GraphDB.clearRoundTrippedOptimisticMutations', async (db) => {
            const nsyncEnabled = this.syncEngine.isEventServiceEnabled();
            const lastTrackerTimestamp = this.di.MutationTrackerNodeRef ? await this.fetchNodeField(trc, this.di.MutationTrackerNodeRef, 'NodeFields.updated') || 0 : Date.now();
            while (this.optimisticMutations.length) {
                const m = this.optimisticMutations[0];
                // Mutation has yet to run, don't clear
                if ((await db.hasKey(trc, null, REMOTE_MUTATIONS_TABLE, m.mutationID))) {
                    break;
                }
                // Check if mutation pushed to command service, and if we have gotten the change back
                if (nsyncEnabled && m.clearedWithMutationTracker && (m.commandServiceTimestamp === null || m.commandServiceTimestamp > lastTrackerTimestamp)) {
                    break;
                }
                await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, m.mutationID);
                this.optimisticMutations.splice(0, 1);
            }
        });
    }
    async rerunOptimisticMutations(trc, changeEvents, shouldTimeboxYield) {
        if (this.isDestroyed) {
            return;
        }
        conduit_utils_1.logger.debug('GraphDB.rerunOptimisticMutations');
        function addChangeEvent(event) {
            changeEvents.push(event);
        }
        const newOverlay = this.remoteSyncedGraphStorage.createOverlay(false);
        try {
            // generate undo events from the old overlay, otherwise any mispredicts will not trigger a refetch
            const undoEvents = this.remoteStorageOverlay.generateUndoEvents();
            changeEvents.unshift(...undoEvents);
            newOverlay.addChangeHandler(addChangeEvent);
            await this.localMutationExecutor.runMutations(trc, newOverlay, this.userID, this.syncEngine.getVaultUserID(), this.optimisticMutations, shouldTimeboxYield);
            newOverlay.removeChangeHandler(addChangeEvent);
            await this.resetOverlay(trc, newOverlay);
        }
        catch (err) {
            await newOverlay.destructor(trc);
            newOverlay.removeChangeHandler(addChangeEvent);
        }
    }
    async onDownsyncChanges(trc) {
        if (this.isDestroyed) {
            return;
        }
        conduit_utils_1.logger.debug('GraphDB.onDownsyncChanges');
        let changeEvents = [];
        const res = await conduit_utils_1.withError(this.orchestratorMutex.runInMutex(trc, 'onDownsyncChanges', async () => {
            if (this.isDestroyed) {
                return;
            }
            // buffer to allow more sync changes to roll in
            await conduit_utils_1.sleep(DOWNSYNC_BUFFER);
            return await conduit_utils_1.logIfSlow('GraphDB:onDownsyncChanges', 10000, async (loggerArgs) => {
                loggerArgs.optimisticMutations = this.optimisticMutations.length;
                // pause syncing
                await this.syncEngine.stopSyncing(trc);
                loggerArgs.stopSyncingDone = true;
                // remove optimistic mutations that we ran remotely
                await this.clearRoundTrippedOptimisticMutations(trc);
                loggerArgs.clearRoundTrippedMutationsDone = true;
                // change events fire async, so wait for anything remaining from pausing syncing
                await conduit_utils_1.sleep(10);
                changeEvents = this.downsyncEvents;
                this.downsyncEvents = [];
                try {
                    await this.rerunOptimisticMutations(trc, changeEvents, true);
                    loggerArgs.rerunOptimisticDone = true;
                }
                finally {
                    await this.syncEngine.startSyncing(trc);
                }
            });
        }));
        this.emitChanges(changeEvents);
        if (res.err && !(res.err instanceof conduit_utils_1.RetryError)) {
            throw res.err;
        }
    }
    async waitUntilReady(trc) {
        try {
            return this.syncEngine.waitUntilReadyForMutations(trc);
        }
        catch (waitErr) {
            conduit_utils_1.logger.error('waitUntilReadyForMutations error', waitErr);
            return false;
        }
    }
    async rerunOptimisticAfterDownsync(trc) {
        try {
            await this.syncEngine.waitUntilReadyForMutations(trc);
        }
        catch (waitErr) {
            conduit_utils_1.logger.error('waitUntilReadyForMutations error', waitErr);
        }
        this.queueOnDownsyncChanges();
    }
    queueRerunOptimisticAfterDownsync() {
        this.queuedOptimisticMutationRerun = true;
        this.changeQueue.push(async () => {
            await conduit_utils_1.withError(gTrcPool.runTraced(this.di.getTestEventTracker(), trc => this.rerunOptimisticAfterDownsync(trc)));
            this.queuedOptimisticMutationRerun = false;
        }, []).catch(err => {
            conduit_utils_1.logger.error('rerunOptimisticAfterDownsync fatal', err);
        });
    }
    queueOnDownsyncChanges() {
        this.changeQueue.push(async () => {
            await gTrcPool.runTraced(this.di.getTestEventTracker(), trc => this.onDownsyncChanges(trc));
        }, []).catch(err => {
            conduit_utils_1.logger.warn('onDownsyncChanges failed, retrying', err);
            this.queueOnDownsyncChanges();
        });
    }
    async isBusinessAccount(trc) {
        return this.di.isBusinessAccount(trc);
    }
    async hasPendingMutations(trc, watcher) {
        const remoteMutationKeys = await this.localKeyValStorage.getKeys(trc, watcher, REMOTE_MUTATIONS_TABLE);
        watcher && await this.localKeyValStorage.getKeys(trc, watcher, OPTIMISTIC_MUTATIONS_TABLE);
        let largestTimestamp = 0;
        for (const m of this.optimisticMutations) {
            if (m.commandServiceTimestamp && m.commandServiceTimestamp > largestTimestamp) {
                largestTimestamp = m.commandServiceTimestamp;
            }
        }
        return {
            result: Boolean(remoteMutationKeys.length),
            largestTimestamp,
        };
    }
    /**
     * Provides access to the local key value storage to plugins
     */
    getLocalKeyValStorage() {
        return this.localKeyValStorage;
    }
    /**
     * Provides access to notification manager to plugins
     */
    getNotificationManager() {
        if (!this.notificationManager) {
            this.notificationManager = this.di.NotificationManager();
        }
        return this.notificationManager;
    }
    destructed() {
        return this.isDestroyed;
    }
}
GraphDB.DB_NAMES = {
    RemoteGraph: 'RemoteGraph',
    LocalStorage: 'LocalStorage',
};
__decorate([
    conduit_utils_1.traceAsync
], GraphDB.prototype, "onDownsyncChanges", null);
exports.GraphDB = GraphDB;
//# sourceMappingURL=GraphDB.js.map