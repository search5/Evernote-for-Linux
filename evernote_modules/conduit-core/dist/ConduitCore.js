"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.conduitDIProxy = exports.ConduitCore = exports.ResourceManager = exports.RemoteMutationExecutor = exports.SyncEngine = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const ConduitUserCore_1 = require("./ConduitUserCore");
const ConduitVersion_1 = require("./ConduitVersion");
const ErrorManager_1 = require("./ErrorManager");
const GraphDB_1 = require("./GraphDB/GraphDB");
const LocalSettings_1 = require("./LocalSettings");
const MultiUserManager_1 = require("./MultiUserManager");
const pluginManager_1 = require("./pluginManager");
const AWAIT_EVENT_TIMEOUT = 30 * 1000;
class SyncEngine {
    constructor(graphStorage, ephemeralState) {
        this.graphStorage = graphStorage;
        this.ephemeralState = ephemeralState;
    }
}
exports.SyncEngine = SyncEngine;
class RemoteMutationExecutor {
}
exports.RemoteMutationExecutor = RemoteMutationExecutor;
class ResourceManager {
    constructor(di) {
        this.di = di;
    }
    async getResourceUrl(trc, res) {
        if (!this.di.urlEncoder) {
            return res.remoteUrl;
        }
        const activeUserID = await this.di.getCurrentUserID(trc, null);
        if (activeUserID === null) {
            throw new conduit_utils_1.NoUserError('Missing current user');
        }
        return this.di.urlEncoder(res.parentID, res.hash, res.remoteUrl, conduit_utils_1.keyStringForUserID(activeUserID));
    }
    constructFileRemoteURL(authHost, path) {
        return `${this.di.getFileServiceHost(authHost)}${path}`;
    }
}
exports.ResourceManager = ResourceManager;
class ConduitCore {
    constructor(di, config) {
        this.di = di;
        this.config = config;
        this.amendSyncContextMetadataBeforeRead = async (trc, m) => {
            return this.di.amendSyncContextMetadataBeforeRead(trc, m, this.getAuthTokenAndState);
        };
        this.amendSyncContextMetadataBeforeWrite = async (trc, m) => {
            return this.di.amendSyncContextMetadataBeforeWrite(trc, m);
        };
        this.getAuthTokenAndState = async (trc, userID) => {
            var _a, _b;
            return (_b = (_a = this.multiUserManager) === null || _a === void 0 ? void 0 : _a.getAuthTokenAndState(trc, null, userID)) !== null && _b !== void 0 ? _b : null;
        };
        this.getCurrentUserID = async (trc, watcher) => {
            var _a, _b;
            return (_b = (await ((_a = this.multiUserManager) === null || _a === void 0 ? void 0 : _a.getCurrentUserID(trc, watcher)))) !== null && _b !== void 0 ? _b : null;
        };
        if (config.noFreezeImmutable) {
            SimplyImmutable.freezeImmutableStructures(false);
        }
        this.trc = conduit_utils_1.createTraceContext('ConduitCore', this.di.getTestEventTracker());
        this.eventEmitter = new conduit_utils_1.ConduitEventEmitter();
        this.watchTree = new conduit_storage_1.StorageWatchTree();
    }
    async destructor() {
        if (this.graph) {
            await this.releasePluginsResources();
            await this.graph.destructor();
            this.graph = undefined;
        }
        if (this.multiUserManager) {
            await this.multiUserManager.destructor();
            this.multiUserManager = undefined;
        }
        if (this.localSettings) {
            await this.localSettings.destructor();
            this.localSettings = undefined;
        }
        if (this.errorManager) {
            await this.errorManager.destructor();
            this.errorManager = undefined;
        }
        if (this.eventEmitter) {
            this.eventEmitter.destructor();
            this.eventEmitter = undefined;
        }
    }
    async init() {
        conduit_utils_1.logger.info(`Using Conduit Core v${ConduitVersion_1.CONDUIT_VERSION} and DB v${GraphDB_1.SYNC_DB_VERSION}`);
        this.localSettings = new LocalSettings_1.LocalSettings(Object.assign(Object.assign({}, this.di), { WatchTree: this.watchTree }));
        await this.localSettings.init(this.trc);
        await this.di.hostResolver.init(this.trc, this.localSettings, this.config.etncHostInformation);
        this.errorManager = new ErrorManager_1.ErrorManager(Object.assign(Object.assign({}, this.di), { WatchTree: this.watchTree }));
        await this.errorManager.init(this.trc);
        this.multiUserManager = new MultiUserManager_1.MultiUserManager(Object.assign(Object.assign({}, this.di), { 
            // cyclical dependendency here, so make sure core destructor is called
            // if ever cleaned up. MultiUserManager has to be gone.
            onCurrentUserSet: async (trc, id, extra) => {
                var _a, _b;
                (_a = this.userCore) === null || _a === void 0 ? void 0 : _a.aquireReInitLock();
                let error;
                try {
                    // destroy old graph if it exists
                    const graph = this.graph;
                    this.graph = undefined;
                    // TODO timebox releasePluginsResources()
                    graph && await this.releasePluginsResources();
                    conduit_utils_1.logger.info('Releasing plugin resources completed!');
                    // A graph task might be running longer than expected in heavy accounts, blocking destructor() till failure.
                    // So retry a few times to let the long-running task finish.
                    // If all retries fail, we can end up with a zombie graph. If this ever happens we need to design our mutex so that
                    // the destructor() takes highest or more reasonable priority.
                    const N_RETRIES = 5;
                    for (let i = 0; i < N_RETRIES; ++i) {
                        try {
                            graph && await graph.destructor();
                            conduit_utils_1.logger.info('Old graph destruction completed!');
                            break;
                        }
                        catch (e) {
                            if (!(e instanceof conduit_utils_1.RetryError) || i === N_RETRIES - 1) {
                                conduit_utils_1.logger.fatal('UNDEAD GRAPH IS BORN! ', e);
                                this.di.emitEvent && this.di.emitEvent(conduit_view_types_1.ConduitEvent.FATAL_ERROR);
                                break;
                            }
                            conduit_utils_1.logger.error('Unable to destroy user graph while switching/adding account, retry...: ', e);
                        }
                    }
                    // initialize graph because an authenticated account is set/switched to.
                    if (id) {
                        await this.initGraph(id, extra);
                        conduit_utils_1.logger.info('Graph initialization completed!');
                        if (!this.userCore) {
                            throw new Error('Conduit has not been initialized properly');
                        }
                        this.userCore.releaseReInitLock();
                        await this.userCore.reinit(trc);
                        conduit_utils_1.logger.info('API reinitialization completed!');
                    }
                }
                catch (err) {
                    error = err;
                    throw err;
                }
                finally {
                    (_b = this.userCore) === null || _b === void 0 ? void 0 : _b.releaseReInitLock(error);
                }
            }, onUsersRemoved: async (trc, userIDs) => {
                await this.emptyUserDatabases(trc, userIDs);
            }, WatchTree: this.watchTree }));
        const coreUserConfig = Object.assign(Object.assign({}, this.config), { ErrorManager: this.errorManager, LocalSettings: this.localSettings, OfflineContentStrategy: this.di.offlineContentStrategy, MultiUserProvider: this.multiUserManager, WatchTree: this.watchTree });
        this.userCore = new ConduitUserCore_1.ConduitUserCore(this.di, coreUserConfig, () => this.graph);
        // multiUserManager depends on userCore
        await this.multiUserManager.init(this.trc, Boolean(this.config.noSetActiveAccountOnStart));
        // attempt to login and populate auth data on start with token in persistent storage.
        // different platforms may or may not use this token.
        if (this.di.autoLogin) {
            const existingAuth = await this.multiUserManager.getAuthTokenAndState(this.trc, null);
            try {
                await this.di.autoLogin({ trc: this.trc, multiUserProvider: this.multiUserManager }, existingAuth || {
                    token: null,
                    state: conduit_view_types_1.AuthState.NoAuth,
                });
            }
            catch (e) {
                conduit_utils_1.logger.info('Expected error: unable to auto login. ', e);
            }
        }
    }
    getSchema() {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.getSchema();
    }
    unSubscribe(watcherGuid) {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.unSubscribe(watcherGuid);
    }
    async setSubscriptionActive(watcherGuid, active) {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.setSubscriptionActive(watcherGuid, active);
    }
    async pauseSubscriptions(isPaused) {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.pauseSubscriptions(isPaused);
    }
    getData(query, vars, watcher) {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.getData(query, vars, watcher);
    }
    // Deprecated
    async clearGraph(clearAuth) {
        if (!this.multiUserManager) {
            throw new Error('Conduit not initialized');
        }
        const currentUserID = await this.multiUserManager.getCurrentUserID(this.trc, null);
        if (!this.graph || !currentUserID) {
            throw new Error('Attempt to clear graph while there is none');
        }
        await this.graph.clear(this.trc, !clearAuth);
        if (clearAuth) {
            await this.multiUserManager.clearAuth(this.trc, currentUserID);
            await this.multiUserManager.setCurrentUser(this.trc, null, true);
        }
    }
    async awaitEvent(event, timeout = AWAIT_EVENT_TIMEOUT) {
        return new Promise(async (resolve, reject) => {
            let cSleep;
            let resolved = false;
            const listener = () => {
                this.removeConduitEventHandler(event, listener);
                resolved = true;
                if (cSleep) {
                    cSleep.cancel();
                }
                resolve();
            };
            this.addConduitEventHandler(event, listener);
            cSleep = conduit_utils_1.cancellableSleep(timeout);
            await cSleep.promise;
            cSleep = undefined;
            if (!resolved) {
                reject(new Error(`awaitEvent ${event} timed out after ${timeout} ms`));
            }
        });
    }
    emitEvent(event, data) {
        this.eventEmitter && this.eventEmitter.emitEvent(event, data);
    }
    remoteMutationsNeedFlush(dependentGuids) {
        if (!this.graph) {
            throw new Error('Conduit not initialized');
        }
        return this.graph.remoteMutationsNeedFlush(dependentGuids);
    }
    async startUpload(params) {
        if (!this.graph) {
            throw new Error('Conduit not initialized');
        }
        return await this.graph.getFileUploader().startUpload(params);
    }
    async uploadChunk(chunk, context) {
        if (!this.graph) {
            throw new Error('Conduit not initialized');
        }
        return await this.graph.getFileUploader().uploadChunk(chunk, context);
    }
    async finishUpload(context) {
        if (!this.graph) {
            throw new Error('Conduit not initialized');
        }
        return await this.graph.getFileUploader().finishUpload(context);
    }
    async cancelUpload(context) {
        if (!this.graph) {
            throw new Error('Conduit not initialized');
        }
        return await this.graph.getFileUploader().cancelUpload(context);
    }
    async uploadFile(params) {
        if (!this.graph) {
            throw new Error('Conduit not initialized');
        }
        return await this.graph.getFileUploader().uploadFile(params);
    }
    async flushRemoteMutations() {
        if (this.graph) {
            await this.graph.flushRemoteMutations();
        }
    }
    async handleAuthError(trc, err, tx) {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.handleAuthError(trc, err, tx);
    }
    async addError(trc, err, mutation, nodeRef) {
        if (!this.errorManager) {
            throw new Error('Conduit not initialized');
        }
        await this.errorManager.addError(trc, err, mutation, nodeRef);
    }
    async setUserInfo(trc, userInfo) {
        if (!this.multiUserManager) {
            throw new Error('Conduit not initialized');
        }
        await this.multiUserManager.setUserInfo(trc, userInfo);
    }
    async setLogLevel(logLevel) {
        conduit_utils_1.setLogLevel(logLevel);
    }
    startTracing() {
        throw new Error('THIS SHOULD NEVER GET CALLED');
    }
    stopTracing() {
        throw new Error('THIS SHOULD NEVER GET CALLED');
    }
    addConduitEventHandler(event, func) {
        if (!this.eventEmitter) {
            throw new Error('No event emitter');
        }
        this.eventEmitter.addEventListener(event, func);
    }
    removeConduitEventHandler(event, func) {
        if (!this.eventEmitter) {
            throw new Error('No event emitter');
        }
        this.eventEmitter.removeEventListener(event, func);
    }
    getNsyncAssociation(srcType, dstType, associationType) {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.getNsyncAssociation(srcType, dstType, associationType);
    }
    convertNsyncTypeToNodeType(nsyncType) {
        var _a;
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return (_a = this.userCore.nsyncToNodeType[nsyncType]) !== null && _a !== void 0 ? _a : null;
    }
    convertNodeTypeToNSyncType(type) {
        var _a;
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return (_a = this.userCore.nodeTypeToNSyncType[type]) !== null && _a !== void 0 ? _a : null;
    }
    getNsyncConverters() {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.nsyncConverters;
    }
    getNodeTypeDefs() {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.nodeTypes;
    }
    getMutatorDefs() {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.mutatorDefinitions;
    }
    getMutationRules() {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.mutationRules;
    }
    getIndexer() {
        if (!this.userCore) {
            throw new Error('Conduit not initialized');
        }
        return this.userCore.indexer;
    }
    async initGraph(userID, extra) {
        if (!this.multiUserManager || !this.errorManager || !this.localSettings) {
            throw new Error('MultiUserManager is destroyed');
        }
        this.graph = new GraphDB_1.GraphDB(Object.assign(Object.assign({}, this.di), { getMutatorDefs: () => {
                return this.getMutatorDefs();
            }, addError: this.errorManager.addError, GraphStorageDB: async (trc, name, version) => {
                const fullName = this.multiUserManager.getFullDBName(name);
                const storage = new conduit_storage_1.GraphStorageDB(await this.di.KeyValStorage(trc, fullName), this.di.KeyValStorageMem(trc, `ephemeral-${fullName}`), {
                    nodeTypes: this.userCore.nodeTypes,
                    indexer: this.userCore.indexer,
                    countUpdater: this.di.countUpdater,
                    syncContextIndexExcludes: this.config.syncContextIndexExcludes,
                    amendSyncContextMetadataBeforeRead: this.amendSyncContextMetadataBeforeRead,
                    amendSyncContextMetadataBeforeWrite: this.amendSyncContextMetadataBeforeWrite,
                    uuid: this.di.uuid,
                });
                await storage.init(trc, version);
                return storage;
            }, KeyValStorage: (trc, name) => {
                return this.di.KeyValStorage(trc, this.multiUserManager.getFullDBName(name));
            }, localSettings: this.localSettings, getCurrentUserID: async (trc, watcher) => {
                return await this.multiUserManager.getCurrentUserID(trc, watcher);
            }, getAuthTokenAndState: async (trc, watcher, authUserID) => {
                return await this.multiUserManager.getAuthTokenAndState(trc, watcher, authUserID);
            }, setAuthTokenAndState: async (trc, argAuth) => {
                return await this.multiUserManager.setAuthTokenAndState(trc, argAuth);
            }, cookieAuth: async (trc) => {
                return await this.multiUserManager.cookieAuth(trc);
            }, isBusinessAccount: async (trc) => {
                return await this.multiUserManager.isBusinessAccount(trc);
            }, getFileUploaderOverride: parentType => { var _a, _b; return (_b = (_a = this.userCore) === null || _a === void 0 ? void 0 : _a.getFileUploaderOverride(parentType)) !== null && _b !== void 0 ? _b : null; }, getFileUploaderBlobDef: (parentType, blobRef) => { var _a, _b; return (_b = (_a = this.userCore) === null || _a === void 0 ? void 0 : _a.getFileUploaderBlobDef(parentType, blobRef)) !== null && _b !== void 0 ? _b : null; } }), userID, this.config.maxBackoffTimeout);
        this.graph.addChangeHandler(this.watchTree);
        for (const plugin of this.config.plugins || []) {
            pluginManager_1.defineStorageAccess(plugin, this.di, this.graph);
        }
        try {
            await this.graph.init((extra === null || extra === void 0 ? void 0 : extra.noSync) === true ? false : true, extra === null || extra === void 0 ? void 0 : extra.update);
        }
        catch (e) {
            conduit_utils_1.logger.fatal('Failed to initialize DB', e);
            this.di.emitEvent(conduit_view_types_1.ConduitEvent.FATAL_ERROR);
        }
    }
    /**
     * Release each plugin resources if it defines destructor.
     */
    async releasePluginsResources() {
        for (const plugin of this.config.plugins || []) {
            if (plugin && plugin.destructor) {
                try {
                    await plugin.destructor();
                }
                catch (e) {
                    conduit_utils_1.logger.error(`Encounter error while destroying plugin ${plugin.name}: `, e);
                }
            }
        }
    }
    async emptyUserDatabases(trc, userIDs) {
        if (!this.multiUserManager) {
            throw new conduit_utils_1.InternalError('EmptyUserDatabase called before init()');
        }
        const currentUserID = await this.multiUserManager.getCurrentUserID(trc, null);
        if (currentUserID && userIDs.includes(currentUserID)) {
            throw new Error('Database of current user cannot be cleared by emptyUserDatabase');
        }
        for (const userID of userIDs) {
            for (const key in GraphDB_1.GraphDB.DB_NAMES) {
                const dbName = GraphDB_1.GraphDB.DB_NAMES[key];
                const store = await this.di.KeyValStorage(trc, MultiUserManager_1.getDBName(userID, dbName));
                try {
                    conduit_utils_1.logger.debug(`Empty database "${dbName}" of ${userID}`);
                    await store.transact(trc, 'clear user db', async (db) => db.clearAll(trc));
                }
                catch (e) {
                    conduit_utils_1.logger.warn(`Unable to clear ${dbName} database of ${userID} because `, e);
                }
                finally {
                    await store.destructor();
                }
            }
        }
    }
}
exports.ConduitCore = ConduitCore;
function conduitDIProxy(getConduit, eventCallback) {
    return {
        addError: async (trc, error, mutation, nodeRef) => {
            const conduit = getConduit();
            conduit && await conduit.addError(trc, error, mutation, nodeRef);
        },
        emitEvent: (event, data) => {
            const conduit = getConduit();
            conduit && conduit.emitEvent(event, data);
        },
        handleAuthError: async (trc, err, tx) => {
            const conduit = getConduit();
            return conduit ? conduit.handleAuthError(trc, err, tx) : err;
        },
        setUserInfo: async (trc, userInfo) => {
            const conduit = getConduit();
            conduit && await conduit.setUserInfo(trc, userInfo);
        },
        getCurrentUserID: async (trc, watcher) => {
            var _a;
            const conduit = getConduit();
            return (_a = (await (conduit === null || conduit === void 0 ? void 0 : conduit.getCurrentUserID(trc, watcher)))) !== null && _a !== void 0 ? _a : null;
        },
        getNsyncAssociation: (srcType, dstType, associationType) => {
            var _a;
            const conduit = getConduit();
            return (_a = conduit === null || conduit === void 0 ? void 0 : conduit.getNsyncAssociation(srcType, dstType, associationType)) !== null && _a !== void 0 ? _a : null;
        },
        convertNsyncTypeToNodeType: (nsyncType) => {
            var _a;
            const conduit = getConduit();
            return (_a = conduit === null || conduit === void 0 ? void 0 : conduit.convertNsyncTypeToNodeType(nsyncType)) !== null && _a !== void 0 ? _a : null;
        },
        convertNodeTypeToNSyncType: (type) => {
            var _a;
            const conduit = getConduit();
            return (_a = conduit === null || conduit === void 0 ? void 0 : conduit.convertNodeTypeToNSyncType(type)) !== null && _a !== void 0 ? _a : null;
        },
        getNsyncConverters: () => {
            const conduit = getConduit();
            if (!conduit) {
                throw new Error('Conduit not initialized');
            }
            return conduit.getNsyncConverters();
        },
        getNodeTypeDefs: () => {
            const conduit = getConduit();
            if (!conduit) {
                throw new Error('Conduit not initialized');
            }
            return conduit.getNodeTypeDefs();
        },
        getMutatorDefs: () => {
            const conduit = getConduit();
            if (!conduit) {
                throw new Error('Conduit not initialized');
            }
            return conduit.getMutatorDefs();
        },
        getMutationRules: () => {
            const conduit = getConduit();
            if (!conduit) {
                throw new Error('Conduit not initialized');
            }
            return conduit.getMutationRules();
        },
        getIndexer: () => {
            const conduit = getConduit();
            if (!conduit) {
                throw new Error('Conduit not initialized');
            }
            return conduit.getIndexer();
        },
    };
}
exports.conduitDIProxy = conduitDIProxy;
//# sourceMappingURL=ConduitCore.js.map