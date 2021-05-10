"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitUserCore = void 0;
const conduit_utils_1 = require("conduit-utils");
const GraphQL_1 = require("./GraphDB/GraphQL");
const GraphQLTypes_1 = require("./GraphDB/GraphQLTypes");
const TelemetryMutations_1 = require("./GraphDB/Mutations/TelemetryMutations");
const pluginManager_1 = require("./pluginManager");
const gTrcPool = new conduit_utils_1.AsyncTracePool('getData');
const noWaitQueryNames = new Set([
    'SyncState',
    'me',
    'clientAuthState',
    'userInfoList',
    'sessionToken',
    'currentUserID',
    'recordSession',
    'systemSettingsGetString',
    'systemSettingsSetString',
    'userSettingsGetString',
    'userSettingsSetString',
    'systemSettingsGetInt',
    'systemSettingsSetInt',
    'userSettingsGetInt',
    'userSettingsSetInt',
    'systemSettingsGetNumber',
    'systemSettingsSetNumber',
    'userSettingsGetNumber',
    'userSettingsSetNumber',
    'systemSettingsGetBoolean',
    'systemSettingsSetBoolean',
    'userSettingsGetBoolean',
    'userSettingsSetBoolean',
].concat(Object.keys(TelemetryMutations_1.getTelemetryMutators())));
class ConduitUserCore {
    constructor(trc, di, config, getGraph) {
        this.di = di;
        this.config = config;
        this.getGraph = getGraph;
        this.watchers = {};
        this.currentQueries = {};
        this.subscriptionsPaused = false;
        this.reinitLock = null;
        this.nodeTypes = {};
        this.mutatorDefinitions = {};
        this.indexConfig = {};
        this.dataResolvers = {};
        this.deleteHooks = {};
        this.mutationRules = [];
        this.nodeTypeToNSyncType = {};
        this.nsyncToNodeType = {};
        this.nsyncConverters = {};
        this.associationOwners = {};
        this.fileUploaderOverrides = {};
        this.fileUploaderBlobDefs = {};
        this.plugins = {};
        this.handleUpdate = async (watcherGuid) => {
            let newData;
            try {
                if (this.currentQueries[watcherGuid] && this.currentQueries[watcherGuid].active) {
                    if (this.subscriptionsPaused) {
                        // mark query has having pending updates so it can be updated when subscriptions are unpaused.
                        this.currentQueries[watcherGuid].hasPendingUpdates = true;
                        return;
                    }
                    const { debugTrace, priority } = this.watchers[watcherGuid];
                    const { query, vars, onUpdate } = this.currentQueries[watcherGuid];
                    newData = await this.getData(query, vars, {
                        watcherGuid,
                        priority,
                        debugTrace,
                        onUpdate,
                    });
                }
            }
            catch (e) {
                newData = { error: conduit_utils_1.serializeError(new conduit_utils_1.MultiError([e])) };
            }
            finally {
                if (this.currentQueries[watcherGuid]) {
                    if (!this.currentQueries[watcherGuid].active) {
                        // send message to view Watcher telling it data is stale
                        this.currentQueries[watcherGuid].onUpdate({ isStale: true });
                        await this.unSubscribe(watcherGuid);
                    }
                    else {
                        !this.subscriptionsPaused && this.currentQueries[watcherGuid].onUpdate(newData);
                    }
                }
            }
        };
        conduit_utils_1.traceEventStart(trc, 'ConduitUserCore');
        conduit_utils_1.traceEventStart(trc, 'PluginsInit');
        config.plugins && pluginManager_1.initPlugins(di, config.plugins, this);
        conduit_utils_1.traceEventEnd(trc, 'PluginsInit');
        this.indexer = this.di.Indexer(this.nodeTypes, this.indexConfig);
        this.resolver = new GraphQL_1.GraphQLResolver(trc, Object.assign({ indexer: () => this.indexer, mutatorDefinitions: () => this.mutatorDefinitions, nodeTypes: () => this.nodeTypes, plugins: this.plugins, handleAuthError: async (trc2, err, tx) => {
                return await this.handleAuthError(trc2, err, tx);
            }, dataResolvers: () => this.dataResolvers || {}, suppressSyncForQuery: (name) => {
                const graph = this.getGraph();
                graph && graph.suppressSyncForQuery(name);
            } }, this.di));
        conduit_utils_1.traceEventEnd(trc, 'ConduitUserCore');
    }
    aquireReInitLock() {
        this.reinitLock = conduit_utils_1.cancellableSleep(1000 * 10);
    }
    releaseReInitLock(error) {
        var _a;
        (_a = this.reinitLock) === null || _a === void 0 ? void 0 : _a.cancel(error);
        this.reinitLock = null;
    }
    async handleAuthError(trc, err, tx) {
        const graph = this.getGraph();
        return graph ? graph.handleAuthError(trc, err, tx) : err;
    }
    async reinit(trc) {
        await this.config.ErrorManager.clearList(trc);
        for (const watchKey in this.watchers) {
            this.watchers[watchKey].triggerUpdate();
        }
    }
    getSchema() {
        return this.resolver.getSchema();
    }
    getFileUploaderOverride(parentType) {
        var _a;
        return (_a = this.fileUploaderOverrides[parentType]) !== null && _a !== void 0 ? _a : null;
    }
    getFileUploaderBlobDef(parentType, blobRef) {
        var _a, _b;
        return (_b = (_a = this.fileUploaderBlobDefs[parentType]) === null || _a === void 0 ? void 0 : _a[blobRef]) !== null && _b !== void 0 ? _b : null;
    }
    getNsyncAssociation(srcType, dstType, associationType) {
        var _a;
        const associationKey = pluginManager_1.getNsyncAssociationKey(srcType, dstType, associationType);
        return (_a = this.associationOwners[associationKey]) !== null && _a !== void 0 ? _a : null;
    }
    setSubscriptionActive(watcherGuid, active) {
        const query = this.currentQueries[watcherGuid];
        if (query) {
            query.active = active;
        }
    }
    async unSubscribe(watcherGuid) {
        const watcher = this.watchers[watcherGuid];
        watcher === null || watcher === void 0 ? void 0 : watcher.destructor();
        delete this.watchers[watcherGuid];
        delete this.currentQueries[watcherGuid];
    }
    getOrAllocWatcher(query, vars, watcherInfo) {
        if (!watcherInfo) {
            return null;
        }
        const guid = watcherInfo.watcherGuid;
        if (!this.watchers[guid]) {
            this.watchers[guid] = new GraphQLTypes_1.GraphQLWatcher(guid, this.config.WatchTree, watcherInfo.priority);
        }
        this.currentQueries[guid] = { query, vars, onUpdate: watcherInfo.onUpdate, active: true, hasPendingUpdates: false };
        this.watchers[guid].setUpdateFunction(() => this.handleUpdate(guid), watcherInfo.debugTrace);
        return this.watchers[guid];
    }
    pauseSubscriptions(isPaused) {
        if (this.subscriptionsPaused === isPaused) {
            return;
        }
        this.subscriptionsPaused = isPaused;
        if (!this.subscriptionsPaused) {
            // retrigger queries for watchers with pending updates
            for (const guid in this.currentQueries) {
                if (this.currentQueries[guid].hasPendingUpdates) {
                    this.currentQueries[guid].hasPendingUpdates = false;
                    this.handleUpdate(guid).catch(err => conduit_utils_1.logger.warn('watcher handleUpdate failed ', guid, err));
                }
            }
        }
    }
    async getData(query, vars, watcherInfo) {
        var _a;
        if (this.reinitLock) {
            await this.reinitLock.promise;
        }
        // assumption: queries that need db will be called after GraphDB is initialized.
        const watcher = this.getOrAllocWatcher(query, vars, watcherInfo);
        const { doc, cacheID } = this.resolver.readQuery(query);
        const extendedContext = this.di.extendContext ? this.di.extendContext() : {};
        const context = Object.assign(Object.assign({}, extendedContext), { db: this.getGraph(), autoResolverData: this.resolver.autoResolverData, trc: gTrcPool.alloc(this.di.getTestEventTracker()), watcher, indexer: this.indexer, clientCredentials: this.config.clientCredentials, nodeTypes: this.nodeTypes, errorManager: this.config.ErrorManager, localSettings: this.config.LocalSettings, offlineContentStrategy: this.config.OfflineContentStrategy, multiUserProvider: this.config.MultiUserProvider, querySelectionFields: {}, dataLoaders: {}, urlEncoder: this.di.urlEncoder, meUpdater: this.di.meUpdater });
        if (!noWaitQueryNames.has(doc.queryName)) {
            if (await ((_a = context.db) === null || _a === void 0 ? void 0 : _a.waitUntilReady(context.trc))) {
                conduit_utils_1.logger.info(`Waited for critical sync activities to finish before running: ${doc.queryName}`);
            }
        }
        // pass graphql-js soundness (regarding undefined values) check.
        conduit_utils_1.deleteUndefinedProperties(vars || {});
        return await gTrcPool.releaseWhenSettled(context.trc, this.resolver.getData(doc, vars || {}, context, cacheID));
    }
}
exports.ConduitUserCore = ConduitUserCore;
//# sourceMappingURL=ConduitUserCore.js.map