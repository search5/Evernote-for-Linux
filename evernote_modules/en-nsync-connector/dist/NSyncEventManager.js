"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSyncEventManager = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const MutationTrackerConverter_1 = require("./Converters/MutationTrackerConverter");
const DataHelpers_1 = require("./DataHelpers");
const index_1 = require("./index");
const NSyncProcessor_1 = require("./NSyncProcessor");
const NSyncTypes_1 = require("./NSyncTypes");
const BUFFER_TIME = 100;
const BACKOFF_TIME = 1000;
const BACKOFF_MAX = 10 * 1000;
const MAX_INT = 2147483647;
const BACKOFF_RECONNECT = 5 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
const RECONNECT_JITTER_RATIO = 0.4;
function buildCatchupFilter(newTypes, oldTypes) {
    const missingTypes = [];
    for (const type of newTypes) {
        if (oldTypes.indexOf(type) === -1) {
            missingTypes.push(type);
        }
    }
    return missingTypes.length ? missingTypes : null;
}
class NSyncEventManager extends conduit_core_1.SyncEventManager {
    constructor(di, hostResolver) {
        super(di);
        this.hostResolver = hostResolver;
        this.eventSrc = null;
        this.dataHelpers = null;
        this.storage = null;
        this.clientID = '';
        this.monolithHost = '';
        this.monolithToken = '';
        this.jwt = '';
        this.connectionInfo = null;
        this.messageQueue = [];
        this.processingEntities = {};
        this.backoffSleep = null;
        this.catchupFilter = null;
        this.nodeFilter = [];
        this.availability = null;
        this.nsyncRunning = false;
        this.toggleEventSync = null;
        this.enabledBeforeOverride = true; // Default is on
        this.processData = async (docs, opts) => {
            if (!this.dataHelpers) {
                throw new Error('NSyncEventManager is not initialized');
            }
            return await NSyncProcessor_1.processNSyncData(this.trc, docs, this.dataHelpers, this, opts);
        };
        this.testOverride = async (trc, args) => {
            let disable = args.disable;
            if (!this.toggleEventSync) {
                throw new Error('NSyncEventManager not initialized');
            }
            if (disable === true) {
                this.enabledBeforeOverride = this.isEnabled();
            }
            else {
                disable = !this.enabledBeforeOverride;
            }
            await this.toggleEventSync(trc, disable);
            return true;
        };
        this.resolvePlugin = async (parent, args, context) => {
            if (!this.storage) {
                throw new Error('NSync not yet initialized');
            }
            const connInfo = await this.storage.getSyncState(context.trc, context.watcher, ['NSyncEventManager']);
            return {
                enabled: this.isEnabled(),
                offline: (connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastAttempt) !== 200 || 0,
                nextAttempt: (connInfo === null || connInfo === void 0 ? void 0 : connInfo.backoff) || 0,
                lastConnection: (connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastConnection) || 0,
            };
        };
        /* *** WARNING ***
        // This module uses an init function, that is repsonsible for setting the default state.
        // Anything set in here, might need to be cleared in the destructor, and set again in the init function
        // to avoid re-using values from different users, or possibly sessions.
        */
        if (!this.di.newEventSource) {
            conduit_utils_1.logger.error('Unable to run NSync without creating EventSources');
            throw new Error('Missing EventSource creator');
        }
        if (this.di.nSyncEntityFilter === '*') {
            conduit_utils_1.logger.warn('nSyncEntityFilter is set to download everything. This should only be used in development!');
        }
        this.trc = conduit_utils_1.createTraceContext('NSyncEventManager', this.di.getTestEventTracker());
        this.expungeSet = new Set();
    }
    async init(trc, host, monolithToken, jwtToken, storage, clientID, resourceManager, toggleEventSync, availability) {
        this.dataHelpers = DataHelpers_1.createDataHelpers(host, resourceManager);
        this.monolithHost = host;
        this.storage = storage;
        this.clientID = clientID;
        this.monolithToken = monolithToken;
        this.jwt = jwtToken;
        this.toggleEventSync = toggleEventSync;
        this.availability = availability;
        this.availability.startPolling(trc);
        this.connectionInfo = null;
        const connInfo = await this.getConnectionInformation(trc);
        this.nodeFilter = en_data_model_1.getNSyncEntityFilter(this.di.getNodeTypeDefs(), this.di.nSyncEntityFilter);
        if (connInfo.lastFilter.length) {
            this.catchupFilter = buildCatchupFilter(this.nodeFilter, connInfo.lastFilter);
        }
        if (this.isAvailable()) {
            this.nsyncRunning = true;
            this.createDataConsumer();
            await this.createSync(trc);
        }
    }
    isAvailable() {
        var _a;
        return Boolean(this.di.isNSyncEnabled && ((_a = this.availability) === null || _a === void 0 ? void 0 : _a.isServiceAvailable()));
    }
    isEnabled() {
        return this.nsyncRunning;
    }
    async clearBackoff(trc) {
        if (this.backoffSleep) {
            this.backoffSleep.cancel();
            await this.updateConnectionInformation(trc, {
                backoff: 0,
                attempts: 0,
            });
            if (!this.eventSrc) {
                await this.createSync(trc);
            }
        }
    }
    async clearConnectionInfo(trc) {
        await this.updateConnectionInformation(trc, {
            connectionID: this.di.uuid('NSyncEventManager'),
            lastConnection: 0,
        });
        if (this.eventSrc) {
            this.destroySync();
            await this.createSync(trc);
        }
    }
    async updateConnectionInformation(trc, updates, tx) {
        if (!this.connectionInfo) {
            this.connectionInfo = await this.getConnectionInformation(trc);
        }
        this.connectionInfo = Object.assign(Object.assign({}, this.connectionInfo), updates);
        if (tx) {
            await tx.replaceSyncState(trc, ['NSyncEventManager'], this.connectionInfo);
        }
        else {
            if (!this.storage) {
                throw new Error('Missing storage, cannot update nsync connection info');
            }
            await this.storage.transact(trc, 'UpdateConnectionInformation', async (transaction) => {
                await transaction.replaceSyncState(trc, ['NSyncEventManager'], this.connectionInfo);
            });
        }
        return this.connectionInfo;
    }
    async getConnectionInformation(trc) {
        var _a, _b, _c;
        if (this.connectionInfo) {
            return this.connectionInfo;
        }
        if (!this.storage) {
            throw new Error('Missing storage, cannot get nsync connection info');
        }
        const connInfo = await this.storage.getSyncState(trc, null, ['NSyncEventManager']);
        this.connectionInfo = {
            connectionID: (_a = connInfo === null || connInfo === void 0 ? void 0 : connInfo.connectionID) !== null && _a !== void 0 ? _a : this.di.uuid('NSyncEventManager'),
            lastConnection: (_b = connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastConnection) !== null && _b !== void 0 ? _b : 0,
            lastFilter: (_c = connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastFilter) !== null && _c !== void 0 ? _c : [],
            backoff: 0,
            attempts: 0,
            lastAttempt: 0,
        };
        return this.connectionInfo;
    }
    enqueueEvent(event) {
        var _a, _b;
        const docs = conduit_utils_1.safeParse(event.data);
        if (Array.isArray(docs)) {
            (_a = this.eventConsumer) === null || _a === void 0 ? void 0 : _a.push.apply(this.eventConsumer, docs);
        }
        else if (docs) {
            (_b = this.eventConsumer) === null || _b === void 0 ? void 0 : _b.push(docs);
        }
    }
    async updateToken(trc, jwt, monolithToken) {
        if (this.jwt !== jwt || this.monolithToken !== this.monolithToken) {
            this.destroySync();
            this.jwt = jwt;
            // Monolith token is required to determine this is Monolith-authed or NAP-authed during token refresh process
            this.monolithToken = monolithToken;
            await this.clearBackoff(trc);
        }
        if (!this.eventSrc) {
            await this.createSync(trc);
        }
    }
    async updateLastConnection(trc, updated, tx) {
        if (!this.connectionInfo) {
            return;
        }
        if (updated > this.connectionInfo.lastConnection) {
            await this.updateConnectionInformation(trc, { lastConnection: updated }, tx);
        }
    }
    async onSyncStateChange(trc, paused, disabled) {
        if (paused) {
            await this.pause();
        }
        else {
            await this.resume();
        }
        if (this.nsyncRunning !== disabled) {
            return;
        }
        this.nsyncRunning = !disabled;
        if (this.nsyncRunning) {
            await this.createSync(trc);
        }
        else {
            this.destroySync();
        }
    }
    onSyncMessage(message) {
        if (this.messageConsumer && this.messageQueue.length === 0) {
            this.messageConsumer(message);
        }
        else {
            this.messageQueue.push(message);
        }
    }
    setMessageConsumer(consumer) {
        if (this.messageConsumer) {
            throw new Error('Message consumer already set');
        }
        this.messageConsumer = consumer;
        while (this.messageConsumer) {
            const message = this.messageQueue.shift();
            if (!message) {
                break;
            }
            this.messageConsumer(message);
        }
    }
    clearMessageConsumer() {
        this.messageConsumer = null;
    }
    async upsertTracker(trc, timestamp) {
        if (!this.storage) {
            throw new Error('Missing storage, cannot get nsync connection info');
        }
        const currentTracker = await this.storage.getNode(trc, en_data_model_1.MUTATION_TRACKER_REF);
        if (currentTracker && currentTracker.NodeFields.updated > timestamp) {
            return;
        }
        await this.storage.transact(trc, 'updateMutationTracker', async (tx) => {
            const tracker = MutationTrackerConverter_1.createTrackerNode(timestamp, this.getUserID());
            await tx.replaceNode(trc, index_1.NSYNC_CONTEXT, tracker);
        });
    }
    clearCatchupFilter(trc) {
        new Promise(async (resolve) => {
            this.catchupFilter = null;
            await this.disconnect(trc);
            await this.createSync(trc);
            resolve();
        }).catch(err => {
            this.onSyncMessage({
                type: 'Error',
                message: 'Unable to clear catchup filter',
                error: err,
            });
        });
    }
    async createSync(trc) {
        var _a;
        if (this.eventSrc) {
            return;
        }
        if (this.backoffSleep) {
            return;
        }
        if (!this.eventConsumer) {
            this.createDataConsumer();
        }
        const connInfo = await this.getConnectionInformation(trc);
        if (connInfo.backoff && connInfo.backoff > Date.now()) {
            this.backoffSleep = conduit_utils_1.cancellableSleep(connInfo.backoff - Date.now());
            this.backoffSleep.promise.then(async () => {
                this.backoffSleep = null;
                await this.createSync(trc);
            }).catch(err => {
                conduit_utils_1.logger.error('Error with cancelable sleep', err);
                this.backoffSleep = null;
                this.createSync(trc).catch(err2 => {
                    conduit_utils_1.logger.error('Error with createSync', err2);
                });
            });
            return;
        }
        if (this.jwt === '') {
            // Early out with a auth token error, so we don't make attempts we know wont work.
            this.onSyncMessage({ type: 'Error', message: 'Not Authorized', error: new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.JWT_AUTH_EXPIRED, this.monolithToken) });
            return;
        }
        const entityFilterParam = NSyncTypes_1.nodeTypeArrayToEntityFilterParam(this, (_a = this.catchupFilter) !== null && _a !== void 0 ? _a : this.nodeFilter);
        const lastConnection = this.catchupFilter ? 0 : connInfo.lastConnection;
        const connectionID = this.catchupFilter ? this.di.uuid('NSyncEventManager') : connInfo.connectionID;
        const nsyncHost = await this.hostResolver.getServiceHost(trc, this.monolithHost, 'Sync');
        this.eventSrc = this.di.newEventSource(`${nsyncHost}/v1/connect?lastConnection=${lastConnection}&connectionId=${connectionID}&encode=${false}${entityFilterParam}`, {
            ['x-mono-authn-token']: `auth=${this.monolithToken}`,
            Authorization: `Bearer ${this.jwt}`,
            ['x-conduit-version']: conduit_core_1.CONDUIT_VERSION,
            ['x-feature-version']: this.di.featureVersion,
        });
        if (!this.eventSrc) {
            throw new Error('EventSource failed to connect');
        }
        this.eventSrc.addEventListener('connection', (event) => {
            conduit_utils_1.logger.debug('Successful connection!', event);
            this.updateConnectionInformation(trc, {
                connectionID: event.data.toString(),
                lastAttempt: 200,
                attempts: 0,
                backoff: 0,
            }).catch(err => conduit_utils_1.logger.error('Unable to update connection information', err));
            this.onSyncMessage({ type: 'Connection', message: 'Connected!' });
        });
        this.eventSrc.onerror = (event) => {
            this.handleErrorEvent(trc, event);
        };
        this.eventSrc.addEventListener('sync', (event) => {
            conduit_utils_1.logger.debug('Sync event', event);
            this.enqueueEvent(event);
        });
        this.eventSrc.addEventListener('event', (event) => {
            conduit_utils_1.logger.debug('Event event', event);
            this.enqueueEvent(event);
        });
        this.eventSrc.addEventListener('ping', (msg) => {
            conduit_utils_1.logger.debug('Ping from service', msg);
        });
        this.eventSrc.addEventListener('complete', (event) => {
            var _a;
            conduit_utils_1.logger.debug('Sync updates completed.', event);
            const lastEventTime = (event.lastEventId && event.lastEventId.indexOf('::') && parseInt(event.lastEventId.split('::')[1], 0)) || 0;
            (_a = this.eventConsumer) === null || _a === void 0 ? void 0 : _a.flush(MAX_INT).then(() => {
                // If there is a catchup filter set, don't send the onSyncMessage event
                // instead, clear the filter and restart syncing with full filter
                if (this.catchupFilter) {
                    conduit_utils_1.logger.debug('Sync updates on catch up completed.', event);
                    this.clearCatchupFilter(this.trc);
                    return;
                }
                this.updateConnectionInformation(this.trc, {
                    lastConnection: lastEventTime - 60000,
                    lastFilter: this.nodeFilter,
                }).catch(err => conduit_utils_1.logger.error('Unable to update connection information', err));
                this.onSyncMessage({ type: 'Complete', message: 'Completed' });
                this.clearProcessingEntities();
                if (lastEventTime) {
                    this.upsertTracker(trc, lastEventTime).catch(err => conduit_utils_1.logger.error('Unable to upsert tracker', err));
                }
            }).catch(err => {
                conduit_utils_1.logger.error(`Unable to flush event consumer ${err}`);
                this.onSyncMessage({ type: 'Complete', message: 'Completed', error: err });
                this.clearProcessingEntities();
            });
        });
    }
    handleErrorEvent(trc, errorEvent) {
        var _a;
        this.destroySync();
        const attempts = this.connectionInfo ? this.connectionInfo.attempts : 0;
        // First attempt is jitter, use backoff for subsequent
        // tslint:disable-next-line: no-bitwise
        const backoff = Math.min(60000, BACKOFF_RECONNECT * (1 << attempts) - BACKOFF_RECONNECT);
        const jitterMax = Math.max(BACKOFF_RECONNECT, backoff * RECONNECT_JITTER_RATIO);
        const jitter = jitterMax * Math.random();
        this.updateConnectionInformation(trc, {
            backoff: Date.now() + backoff + jitter,
            attempts: attempts + 1,
            lastAttempt: (_a = errorEvent.status) !== null && _a !== void 0 ? _a : 0,
        }).catch(err => conduit_utils_1.logger.error('Unable to update backoff', err));
        if (errorEvent.status && errorEvent.status === 401 || errorEvent.status === 403) {
            this.onSyncMessage({ type: 'Error', message: 'Not Authorized', error: new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.JWT_AUTH_EXPIRED, this.monolithToken) });
            // DO NOT recreate sync here, expect to wait for proper auth information and try again
            return;
        }
        else if (errorEvent.status && errorEvent.status >= 500) {
            conduit_utils_1.logger.error(`${errorEvent.status} from NSync: ${errorEvent.message}`);
            this.onSyncMessage({ type: 'Error', message: 'Service Error', error: new conduit_utils_1.ServiceError('NSyncInternal', errorEvent.status.toString(), errorEvent.message) });
        }
        else if (errorEvent.message === undefined || errorEvent.message === 'network error') {
            conduit_utils_1.logger.warn('Likely disconnect from nsync. Trying reconnect...');
        }
        else {
            conduit_utils_1.logger.error(`Unhandled error: ${errorEvent.message}`);
            this.onSyncMessage({ type: 'Error', message: 'Unknown Error', error: new Error(`${errorEvent.status}: ${errorEvent.message}`) });
        }
        this.createSync(this.trc).catch(err => {
            this.onSyncMessage({ type: 'Error', message: 'Unable to re-create sync', error: err });
        });
    }
    destroySync() {
        if (this.eventSrc) {
            this.eventSrc.close();
            this.eventSrc = null;
        }
    }
    createDataConsumer() {
        if (!this.nsyncRunning) {
            return;
        }
        this.eventConsumer = new conduit_utils_1.DataConsumer({
            debugName: 'NSyncDownsync',
            bufferTime: BUFFER_TIME,
            consumer: this.processData,
            backoffIncrement: BACKOFF_TIME,
            backoffMax: BACKOFF_MAX,
        });
    }
    async pause() {
        var _a;
        return await ((_a = this.eventConsumer) === null || _a === void 0 ? void 0 : _a.stopConsumer());
    }
    async resume() {
        var _a;
        return await ((_a = this.eventConsumer) === null || _a === void 0 ? void 0 : _a.resumeConsumer());
    }
    async flush() {
        var _a;
        return await ((_a = this.eventConsumer) === null || _a === void 0 ? void 0 : _a.flush());
    }
    async disconnect(trc) {
        this.destroySync();
    }
    getUserID() {
        if (!this.storage) {
            throw new Error('Missing storage, cannot get userID');
        }
        return this.storage.getUserID();
    }
    getClientID() {
        return this.clientID;
    }
    getStorage() {
        if (!this.storage) {
            throw new Error('Missing storage, NSyncEventManager is not initialized');
        }
        return this.storage;
    }
    hasBeenExpunged(id) {
        return this.expungeSet.has(id);
    }
    addToExpunged(id) {
        return this.expungeSet.add(id);
    }
    async destructor(trc) {
        var _a, _b;
        this.destroySync();
        (_a = this.backoffSleep) === null || _a === void 0 ? void 0 : _a.cancel();
        this.connectionInfo = null;
        this.messageQueue = [];
        this.messageConsumer = null;
        await this.pause();
        if (this.eventConsumer) {
            await this.eventConsumer.destructor(trc);
            this.eventConsumer = undefined;
        }
        this.expungeSet.clear();
        this.clearProcessingEntities();
        (_b = this.availability) === null || _b === void 0 ? void 0 : _b.destructor();
        this.availability = null;
        this.storage = null;
        this.jwt = '';
        this.clientID = '';
        this.monolithHost = '';
        this.monolithToken = '';
        this.dataHelpers = null;
        this.toggleEventSync = null;
    }
    addProcessingEntity(id, type, entity) {
        if (!this.processingEntities.hasOwnProperty(type)) {
            this.processingEntities[type] = {};
        }
        this.processingEntities[type][id] = entity;
    }
    getProcessingEntity(id, type) {
        return (this.processingEntities[type] && this.processingEntities[type][id]) || null;
    }
    clearProcessingEntities() {
        this.processingEntities = {};
    }
    getPlugin() {
        return {
            name: 'nSyncManagerPlugin',
            defineQueries: () => {
                return {
                    nsyncStatus: {
                        type: conduit_core_1.schemaToGraphQLType({
                            enabled: 'boolean',
                            offline: 'boolean',
                            nextAttempt: 'timestamp',
                            lastConnection: 'timestamp',
                        }, 'NSyncStatusResult', false),
                        resolve: this.resolvePlugin,
                    },
                };
            },
            defineMutators: () => {
                return {
                    clearNSyncBackoff: {
                        type: conduit_core_1.schemaToGraphQLType('boolean'),
                        resolve: async (parent, args, context) => {
                            await this.clearBackoff(context.trc);
                            return Boolean(this.backoffSleep);
                        },
                    },
                    testOverrideNewEntityServiceKillSwitch: {
                        type: conduit_core_1.schemaToGraphQLType('boolean'),
                        args: conduit_core_1.schemaToGraphQLArgs({
                            disable: 'boolean',
                        }),
                        resolve: this.testOverride,
                    },
                };
            },
        };
    }
}
exports.NSyncEventManager = NSyncEventManager;
//# sourceMappingURL=NSyncEventManager.js.map