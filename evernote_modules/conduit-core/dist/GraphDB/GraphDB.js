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
const GraphMutationTypes_1 = require("../Types/GraphMutationTypes");
const MutationManager_1 = require("./MutationManager");
exports.SYNC_DB_VERSION = 15; // vkumar2: CON-1080 adding attributes to Attachment
const REMOTE_MUTATION_BUFFER = 500;
const DOWNSYNC_BUFFER = 200;
const SYNC_PAUSED_RETRY_TIME = 1000 * 60;
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
        this.downsyncEvents = [];
        this.queuedOptimisticMutationRerun = false;
        this.authBackoff = {};
        this.activeAuthRevalidations = {};
        this.lastDownsyncTimestamp = 0;
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
                if (event.path[2] !== 'lastDownsyncStartTime' || event.type !== conduit_storage_1.StorageChangeType.Replace) {
                    return;
                }
                if (typeof event.value === 'number' && isFinite(event.value)) {
                    this.lastDownsyncTimestamp = event.value;
                }
            }
            if (!this.mutationManager.hasOptimisticMutations()) {
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
            optimisticMutationsCount: () => {
                return this.mutationManager.getOptimisticMutations().length;
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
        conduit_utils_1.logger.info('Initializing GraphDB');
        this.remoteSyncedGraphStorage = await this.di.GraphStorageDB(trc, GraphDB.DB_NAMES.RemoteGraph, exports.SYNC_DB_VERSION),
            this.remoteSyncedGraphStorage.addChangeHandler(this.onSyncStorageChange);
        this.initOverlay();
        this.localKeyValStorage = await this.di.KeyValStorage(trc, GraphDB.DB_NAMES.LocalStorage);
        this.localKeyValStorage.addChangeHandler(this);
        this.mutationManager = new MutationManager_1.MutationManager(this.localKeyValStorage);
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
        return Object.assign({ completed: 0, pending: 0 }, this.mutationManager.getOptimisticMutationInfo());
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
    async needContentFetchSync(trc) {
        return await this.syncEngine.needContentFetchSync(trc);
    }
    async immediateContentFetchSync(trc, args) {
        return await this.syncEngine.immediateContentFetchSync(trc, args);
    }
    async cancelContentFetchSync(trc) {
        return await this.syncEngine.cancelContentFetchSync(trc);
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
    async loadPersistedMutations() {
        const changeEvents = [];
        await gTrcPool.runTraced(this.di.getTestEventTracker(), async (trc) => {
            await this.orchestratorMutex.runInMutex(trc, 'loadPersistedMutations', async () => {
                const mutatorDefs = this.getMutators();
                const remoteMutations = await this.mutationManager.loadMutations(trc, mutatorDefs);
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
        conduit_utils_1.logger.info(`Start syncing for the user ${auth.userID}`);
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
            await this.syncEngine.onDBClear(trc);
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
    async flushRemoteMutations() {
        const res = await this.remoteMutationConsumer.flush();
        return Object.assign(Object.assign({}, res), this.mutationManager.getOptimisticMutationInfo());
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
        }, undefined, conduit_utils_1.MutexPriority.HIGH);
        await this.mutationManager.addMutation(trc, mutation);
        this.remoteMutationConsumer.push(mutation);
        return mutation;
    }
    async runBatch(trc, type, auth, userID, vaultUserID, mutations, opts, ret) {
        const timestamp = Date.now();
        if (ret.retryError) {
            for (const mutation of mutations) {
                ret.mutationResults[mutation.mutationID] = {
                    timestamp,
                    error: new conduit_utils_1.RetryError(ret.retryError.message, ret.retryError.timeout, ret.retryError.reason),
                };
            }
            return;
        }
        if (type === GraphMutationTypes_1.MutatorRemoteExecutorType.CommandService && !this.remoteMutationExecutor[type].isAvailable()) {
            // TODO: CON-2017 - Do something to preserve these mutations.
            conduit_utils_1.logger.error(`${type} not available. DATA LOSS HAS OCCURED`);
            mutations.forEach(mutation => {
                conduit_utils_1.logger.error(mutation.name, mutation.params);
            });
            conduit_utils_1.logger.error(`END OF DATA LOSS`);
            for (const mutation of mutations) {
                ret.mutationResults[mutation.mutationID] = {
                    timestamp,
                    error: new conduit_utils_1.ServiceNotActiveError(type),
                };
            }
            return;
        }
        const latestUpsync = await this.remoteMutationExecutor[type].runMutations(trc, auth, userID, vaultUserID, mutations, opts, ret);
        if (latestUpsync) {
            await this.remoteSyncedGraphStorage.transact(trc, 'updateSyncTime', async (tx) => {
                await tx.replaceSyncState(trc, ['lastSyncTime'], latestUpsync);
            });
        }
    }
    async runMutations(trc, auth, userID, vaultUserID, mutations, opts) {
        let batch = [];
        let currentType = GraphMutationTypes_1.MutatorRemoteExecutorType.Thrift;
        const ret = {
            mutationResults: {},
            retryError: null,
        };
        for (const mutation of mutations) {
            const def = this.di.getMutatorDefs()[mutation.name];
            const type = def.type || GraphMutationTypes_1.MutatorRemoteExecutorType.Thrift;
            if (type !== currentType && batch.length) {
                await this.runBatch(trc, currentType, auth, userID, vaultUserID, batch, opts, ret);
                batch = [];
            }
            currentType = type;
            batch.push(mutation);
        }
        if (batch.length) {
            await this.runBatch(trc, currentType, auth, userID, vaultUserID, batch, opts, ret);
        }
        return ret;
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
        const ret = await this.orchestratorMutex.runInMutex(trc, 'runMutatorRemoteOnly', async () => {
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
            const { mutationResults } = await this.runMutations(trc, auth.token, this.userID, vaultUserID, [mutation], { isFlush: true, stopConsumer: false });
            const res = mutationResults[mutation.mutationID];
            const error = GraphMutationTypes_1.mutationUpsyncError(res);
            if (error) {
                throw error;
            }
            // force a downsync, as there is no roundtrip detection
            try {
                await this.syncEngine.forceDownsyncUpdate(trc, 5000);
            }
            catch (err) {
                conduit_utils_1.logger.warn('forceDownsync failed', err);
            }
            if (GraphMutationTypes_1.isMutationUpsyncSuccess(res) && res.results) {
                mutation.results = res.results;
            }
            return mutation;
        }, undefined, conduit_utils_1.MutexPriority.HIGH);
        // wait for optimistic mutations to roundtrip, so that there are no overlays that might be preventing the underlying data changes
        // caused by this remote-only mutation to be seen by clients
        for (let i = 0; i < 10 && this.mutationManager.hasOptimisticMutations(); ++i) {
            // just need to sleep, the forceDownsyncUpdate() above should have already triggered a downsync so we're just waiting for
            // the roundtrip detction to clear out the overlay
            await conduit_utils_1.sleep(200);
        }
        return ret;
    }
    async runRemoteMutationsInternal(trc, mutationsIn, opts) {
        if (this.isDestroyed) {
            return mutationsIn;
        }
        const mutatorDefs = this.getMutators();
        const mutations = await this.mutationManager.rollupForUpsync(trc, mutatorDefs, mutationsIn);
        conduit_utils_1.logger.debug('GraphDB.runRemoteMutations', { count: mutations.length, opts });
        const auth = await this.getAuthTokenAndState(trc, null);
        if (!(auth === null || auth === void 0 ? void 0 : auth.token) || auth.state !== conduit_view_types_1.AuthState.Authorized) {
            throw new Error('not authorized');
        }
        const { mutationResults } = await this.runMutations(trc, auth.token, this.userID, this.syncEngine.getVaultUserID(), mutations, opts);
        const { retryMutations, failedMutations } = await this.mutationManager.processMutationUpsyncResults(trc, mutations, mutationResults);
        // report errors coming back from runMutations
        if (failedMutations) {
            for (const m of failedMutations) {
                const err = GraphMutationTypes_1.mutationUpsyncError(mutationResults[m.mutationID]);
                if (!err) {
                    throw new conduit_utils_1.InternalError('missing error in failed mutation');
                }
                await this.di.addError(trc, err, m);
            }
        }
        if (this.isDestroyed) {
            return retryMutations || [];
        }
        if (failedMutations && failedMutations.length) {
            // rerun optimistic mutations immediately to correct the mispredicts caused by the failed remote execution
            const changeEvents = [];
            await conduit_utils_1.withError(this.orchestratorMutex.runInMutex(trc, 'runRemoteMutations.rerunOptimisticMutations', async () => {
                if (!this.isDestroyed) {
                    await this.rerunOptimisticMutations(trc, changeEvents, true);
                }
            }));
            this.emitChanges(changeEvents);
        }
        return retryMutations || [];
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
            const optimisticMutations = this.mutationManager.getOptimisticMutations();
            await this.localMutationExecutor.runMutations(trc, newOverlay, this.userID, this.syncEngine.getVaultUserID(), optimisticMutations, shouldTimeboxYield);
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
                loggerArgs.optimisticMutations = this.mutationManager.hasOptimisticMutations();
                // pause syncing
                await this.syncEngine.stopSyncing(trc);
                loggerArgs.stopSyncingDone = true;
                // remove optimistic mutations that we ran remotely
                await this.mutationManager.clearRoundTrippedOptimisticMutations(trc, this.remoteSyncedGraphStorage, this.lastDownsyncTimestamp);
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
        return await this.mutationManager.hasPendingMutations(trc, watcher);
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
    markDependencySynced(trc, depKey, depVersion) {
        return this.mutationManager.markDependencySynced(trc, depKey, depVersion);
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
    conduit_utils_1.traceAsync('GraphDB')
], GraphDB.prototype, "setAuthTokenAndState", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphDB.prototype, "onDownsyncChanges", null);
exports.GraphDB = GraphDB;
//# sourceMappingURL=GraphDB.js.map