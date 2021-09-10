"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSyncEventManager = exports.LAST_NSYNC_SYNC_STATE_PATH = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const NSyncProcessor_1 = require("./NSyncProcessor");
const ServiceAvailability_1 = require("./ServiceAvailability");
exports.LAST_NSYNC_SYNC_STATE_PATH = 'LastNSyncProcessTime';
const gTracePool = new conduit_utils_1.AsyncTracePool('NSyncEventManager');
const LAST_CONNECTION_BUFFER_TIME = 60000;
const BACKOFF_RECONNECT = 5 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
const RECONNECT_JITTER_RATIO = 0.4;
const NEW_CONNID_TRACKER_KEY = 'NSyncEventManager.setConnectionID';
const CLEAR_CONN_INFO_KEY = 'NSyncEventManager.clearConnInfo';
const CONNECT_ATTEMPT_KEY = 'NSyncEventManager.connectAttempt';
const CONNECTED_KEY = 'NSyncEventManager.connected';
const AUTHENTICATION_EXPIRED = 'Authentication Expired';
function buildCatchupFilter(newTypes, oldTypes) {
    const missingTypes = [];
    for (const type of newTypes) {
        if (oldTypes.indexOf(type) === -1) {
            missingTypes.push(type);
        }
    }
    return missingTypes.length ? missingTypes : null;
}
function eventTimeFromEventID(eventID) {
    return (eventID && eventID.indexOf('::') && parseInt(eventID.split('::')[1], 0)) || 0;
}
class NSyncEventManager extends conduit_core_1.SyncEventManager {
    constructor(di, hostResolver) {
        super(di);
        this.hostResolver = hostResolver;
        this.isDestroyed = false;
        this.eventSrc = null;
        this.storage = null;
        this.clientID = '';
        this.monolithHost = '';
        this.monolithToken = '';
        this.jwt = '';
        this.connectionInfo = null;
        this.docQueue = [];
        this.messageQueue = [];
        this.processingEntities = {};
        this.backoffSleep = null;
        this.catchupFilter = null;
        this.nodeFilter = [];
        this.availability = null;
        this.isPaused = false;
        this.disconnectOnPause = null;
        this.isDisabled = false;
        this.disableWithOverride = false;
        this.firstMessagePromise = null;
        this.firstMessageResolve = null;
        this.testOverride = async (trc, args, context) => {
            conduit_core_1.validateDB(context);
            const disable = args.disable;
            this.disableWithOverride = disable;
            const nsyncDisabled = await context.db.getEphemeralFlag(context.trc, context.watcher, 'SyncManager', 'nsyncDisabled');
            await this.onSyncStateChange(trc, nsyncDisabled, this.isPaused);
            return true;
        };
        this.resolvePlugin = async (parent, args, context) => {
            conduit_core_1.validateDB(context);
            if (!this.storage) {
                throw new Error('NSync not yet initialized');
            }
            const connInfo = await context.db.getSyncState(context.trc, context.watcher, ['NSyncEventManager']);
            const nsyncDisabled = await context.db.getEphemeralFlag(context.trc, context.watcher, 'SyncManager', 'nsyncDisabled');
            const lastNSyncProcessTime = await context.db.getSyncState(context.trc, context.watcher, [exports.LAST_NSYNC_SYNC_STATE_PATH]);
            const paused = await context.db.getEphemeralFlag(context.trc, context.watcher, 'SyncManager', 'syncPaused');
            const completed = await context.db.getEphemeralFlag(context.trc, context.watcher, 'SyncManager', 'nsyncCompleted');
            return {
                enabled: !this.isDisabled && !nsyncDisabled,
                paused: this.isPaused || paused,
                offline: (connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastAttempt) !== 200,
                completed,
                nextAttempt: (connInfo === null || connInfo === void 0 ? void 0 : connInfo.backoff) || 0,
                lastConnection: (connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastConnection) || 0,
                lastNSyncProcessTime: lastNSyncProcessTime || 0,
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
        this.expungeSet = new Set();
    }
    setupStorage(storage) {
        this.storage = storage;
    }
    async init(trc, host, monolithToken, jwtToken, clientID, resourceManager, usedPrebuilt) {
        if (!this.storage) {
            throw new Error('Did not setup storage before init');
        }
        this.isDestroyed = false;
        this.monolithHost = host;
        this.clientID = clientID;
        this.monolithToken = monolithToken;
        this.jwt = jwtToken;
        this.firstMessagePromise = null;
        this.firstMessageResolve = null;
        this.connectionInfo = null;
        const connInfo = await (usedPrebuilt ? this.updateConnectionInformation(trc, { connectionID: conduit_utils_1.uuid() }) : this.getConnectionInformation(trc));
        this.nodeFilter = en_core_entity_types_1.getNSyncEntityFilter(this.di.getNodeTypeDefs(), this.di.nSyncEntityFilter, Boolean(this.di.activateLESMode));
        if (connInfo.lastFilter.length) {
            this.catchupFilter = buildCatchupFilter(this.nodeFilter, connInfo.lastFilter);
        }
        const availabilityConfig = {
            httpProvider: this.di.getHttpTransport,
            getLastAvailability: async (newTrc) => {
                if (!this.storage) {
                    return;
                }
                return await this.storage.getSyncState(trc, null, ['SyncManager', 'EventSyncAvailable']);
            },
            saveLastAvailability: async (newTrc, available) => {
                if (!this.storage) {
                    return;
                }
                await this.storage.transact(newTrc, 'saveLastAvailability', async (tx) => {
                    await tx.updateSyncState(newTrc, ['SyncManager', 'EventSyncAvailable'], available);
                });
            },
            host,
            onChange: async (trc) => {
                if (this.isDestroyed || !this.storage) {
                    return;
                }
                const disabled = await this.storage.getEphemeralFlag(trc, 'SyncManager', 'syncDisabled');
                const paused = await this.storage.getEphemeralFlag(trc, 'SyncManager', 'syncPaused');
                await this.onSyncStateChange(trc, disabled, paused);
            },
            url: this.di.serviceAvailabilityOverrideUrl,
        };
        this.availability = new ServiceAvailability_1.ServiceAvailability(availabilityConfig);
        this.availability.startPolling(trc);
        this.isDisabled = !this.isAvailable();
        await this.storage.transactEphemeral(trc, 'InitNSyncDisabled', async (tx) => {
            await tx.setValue(trc, 'SyncManager', 'nsyncDisabled', this.isDisabled);
            await tx.setValue(trc, 'SyncManager', 'nsyncCompleted', false);
        });
        if (this.isDisabled) {
            await this.updateConnectionInformation(trc, {
                lastAttempt: 0,
            });
        }
        else {
            this.isPaused = false;
            await this.createSync(trc);
        }
    }
    isAvailable() {
        if (this.disableWithOverride) {
            return false;
        }
        return Boolean(this.di.isNSyncEnabled && (!this.availability || this.availability.isServiceAvailable()) && this.di.nSyncEntityFilter.length);
    }
    isEnabled() {
        return !this.isDisabled;
    }
    async clearBackoff(trc, clearAttempts = false) {
        if (this.backoffSleep) {
            this.backoffSleep.cancel();
            const update = {
                backoff: 0,
            };
            if (clearAttempts) {
                update.attempts = 0;
            }
            await this.updateConnectionInformation(trc, update);
            if (!this.eventSrc) {
                await this.createSync(trc);
            }
        }
    }
    async refreshConnectionInfo(trc) {
        var _a, _b, _c;
        if (!this.storage) {
            throw new Error('Unable to read from storage');
        }
        const connInfo = await this.storage.getSyncState(trc, null, ['NSyncEventManager']);
        if (connInfo) {
            this.connectionInfo = {
                connectionID: (_a = connInfo === null || connInfo === void 0 ? void 0 : connInfo.connectionID) !== null && _a !== void 0 ? _a : this.di.uuid('NSyncEventManager'),
                lastConnection: (_b = connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastConnection) !== null && _b !== void 0 ? _b : 0,
                lastFilter: (_c = connInfo === null || connInfo === void 0 ? void 0 : connInfo.lastFilter) !== null && _c !== void 0 ? _c : [],
                backoff: 0,
                attempts: 0,
                lastAttempt: 0,
            };
        }
    }
    async onDBClear(trc) {
        var _a;
        conduit_utils_1.traceTestCounts(trc, { [CLEAR_CONN_INFO_KEY]: 1 });
        await this.updateConnectionInformation(trc, {
            connectionID: this.di.uuid('NSyncEventManager'),
            lastConnection: 0,
            backoff: 0,
            attempts: 0,
            lastAttempt: 0,
        });
        if (this.eventSrc) {
            this.destroySync();
            this.docQueue.length = 0;
        }
        (_a = this.backoffSleep) === null || _a === void 0 ? void 0 : _a.cancel();
    }
    async updateConnectionInformation(trc, updates, tx) {
        if (!this.connectionInfo) {
            this.connectionInfo = await this.getConnectionInformation(trc);
        }
        if (updates.connectionID && this.connectionInfo.connectionID !== updates.connectionID) {
            conduit_utils_1.traceTestCounts(trc, { [NEW_CONNID_TRACKER_KEY]: 1 });
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
    async processNSyncData(trc, eventData, context) {
        let idx = 0;
        let latestConnectionTime = (await this.getConnectionInformation(trc)).lastConnection;
        let yieldCheckRes;
        while (idx < eventData.length) {
            yieldCheckRes = context.yieldCheck && await conduit_utils_1.withError(context.yieldCheck);
            if (yieldCheckRes === null || yieldCheckRes === void 0 ? void 0 : yieldCheckRes.err) {
                conduit_utils_1.logger.info(`processNSyncData yielded and stopped at index ${idx}. Docs length ${eventData.length}`);
                break;
            }
            await this.getStorage().transact(trc, 'processNSyncData', async (tx) => {
                var _a;
                const startTime = Date.now();
                for (idx; idx < eventData.length; ++idx) {
                    yieldCheckRes = context.yieldCheck && await conduit_utils_1.withError(context.yieldCheck);
                    if (yieldCheckRes === null || yieldCheckRes === void 0 ? void 0 : yieldCheckRes.err) {
                        conduit_utils_1.logger.debug(`processNSyncData yield and break inner loop. idx ${idx} docs ${eventData.length}`);
                        break;
                    }
                    if (this.isDestroyed) {
                        break;
                    }
                    const elapsedTime = Date.now() - startTime;
                    if (elapsedTime > conduit_utils_1.MILLIS_IN_ONE_SECOND) {
                        // timebox hit, complete transaction and continue from here later
                        break;
                    }
                    const doc = eventData[idx].doc;
                    if (doc) {
                        try {
                            await NSyncProcessor_1.processNSyncDoc(trc, doc, this, tx);
                        }
                        catch (e) {
                            conduit_utils_1.logger.error('Unable to process document', e);
                        }
                    }
                    const eventType = eventData[idx].event;
                    if (!this.catchupFilter && (eventType === en_data_model_1.NSyncEvents.COMPLETE_EVENT || eventData[idx].eventTime && eventData[idx].eventTime > latestConnectionTime)) {
                        latestConnectionTime = eventData[idx].eventTime;
                        await this.updateConnectionInformation(trc, { lastConnection: eventData[idx].eventTime, lastFilter: this.nodeFilter }, tx);
                    }
                    switch (eventType) {
                        case en_data_model_1.NSyncEvents.COMPLETE_EVENT: {
                            await ((_a = this.storage) === null || _a === void 0 ? void 0 : _a.transactEphemeral(trc, 'Update nsync Completed flag', async (tx) => {
                                await tx.setValue(trc, 'SyncManager', 'nsyncCompleted', true);
                            }));
                            this.onSyncMessage({ type: 'Complete', message: 'Sync Completed' });
                            break;
                        }
                        case en_data_model_1.NSyncEvents.CONNECTION_EVENT: {
                            this.onSyncMessage({ type: 'Connection', message: 'Connected!' });
                            break;
                        }
                        case 'error': {
                            this.onSyncMessage({ type: 'Error', error: eventData[idx].error, message: eventData[idx].message || 'Unknown error' });
                            break;
                        }
                    }
                }
            });
        }
        return eventData.slice(idx);
    }
    enqueueErrorEvent(error, message) {
        this.docQueue.push({
            event: 'error',
            eventTime: 0,
            error,
            message,
        });
    }
    enqueueEvent(event) {
        if (this.isDestroyed) {
            throw new conduit_utils_1.InternalError('Unable to enqueue nsync event. Doc queue is destroyed.');
        }
        const lastEventTime = eventTimeFromEventID(event.lastEventId);
        const docs = conduit_utils_1.safeParse(event.data);
        if (Array.isArray(docs)) {
            for (const doc of docs) {
                this.docQueue.push({ doc, eventTime: 0, event: null });
            }
            this.docQueue.push({ doc: null, eventTime: lastEventTime, event: event.type });
        }
        else if (docs) {
            this.docQueue.push({ doc: docs, eventTime: lastEventTime, event: event.type });
        }
        else {
            this.docQueue.push({ doc: null, eventTime: 0, event: event.type });
        }
    }
    async updateToken(trc, jwt, monolithToken) {
        conduit_utils_1.logger.info('Update Nsync engine auth data.');
        if (this.jwt !== jwt || this.monolithToken !== monolithToken) {
            this.destroySync();
            this.jwt = jwt;
            // Monolith token is required to determine this is Monolith-authed or NAP-authed during token refresh process
            this.monolithToken = monolithToken;
            await this.clearBackoff(trc, true);
        }
        if (!this.eventSrc && this.isAvailable()) {
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
    async onSyncStateChange(trc, disabled, paused) {
        var _a;
        const nsyncDisabled = await ((_a = this.storage) === null || _a === void 0 ? void 0 : _a.getEphemeralFlag(trc, 'SyncManager', 'nsyncDisabled'));
        this.isDisabled = nsyncDisabled || disabled || !this.isAvailable();
        this.isPaused = paused;
        if (!this.isPaused && this.disconnectOnPause) {
            clearTimeout(this.disconnectOnPause);
            this.disconnectOnPause = null;
        }
        if (!this.isDisabled && !this.isPaused) {
            await this.createSync(trc);
        }
        else if (this.isDisabled) {
            this.destroySync();
            await this.updateConnectionInformation(trc, {
                lastAttempt: 0,
            });
        }
        else if (this.isPaused && !this.disconnectOnPause) {
            this.disconnectOnPause = setTimeout(() => {
                this.destroySync();
                this.disconnectOnPause = null;
            }, 60000);
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
    clearCatchupFilter() {
        new Promise(async (resolve) => {
            this.catchupFilter = null;
            await gTracePool.runTraced(this.di.getTestEventTracker(), async (trc) => {
                this.destroySync();
                await this.createSync(trc);
            });
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
        conduit_utils_1.traceTestCounts(trc, { [CONNECT_ATTEMPT_KEY]: 1 });
        if (this.eventSrc) {
            return;
        }
        if (this.backoffSleep) {
            return;
        }
        if (!this.isEnabled()) {
            this.isPaused = true;
            return;
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
        const mockExpirationParam = this.di.mockExpiration ? `&expiration=${Date.now() + this.di.mockExpiration}` : '';
        const entityFilterParam = en_conduit_sync_types_1.nodeTypeArrayToEntityFilterParam(this, (_a = this.catchupFilter) !== null && _a !== void 0 ? _a : this.nodeFilter);
        const lastConnection = this.catchupFilter ? 0 : Math.max(0, connInfo.lastConnection - LAST_CONNECTION_BUFFER_TIME);
        const connectionID = this.catchupFilter ? this.di.uuid('NSyncEventManager') : connInfo.connectionID;
        const connectionEndpoint = this.di.realtimeMode ? 'connect' : 'download';
        const nsyncHost = await this.hostResolver.getServiceHost(trc, this.monolithHost, 'Sync');
        try {
            this.eventSrc = this.di.newEventSource(`${nsyncHost}/v1/${connectionEndpoint}?lastConnection=${lastConnection}&connectionId=${connectionID}&encode=${false}${entityFilterParam}${mockExpirationParam}`, {
                ['x-mono-authn-token']: `auth=${this.monolithToken}`,
                Authorization: `Bearer ${this.jwt}`,
                ['x-conduit-version']: conduit_core_1.CONDUIT_VERSION,
                ['x-feature-version']: this.di.featureVersion,
            });
        }
        catch (err) {
            // this is likely never used. Error will be on the async part of the connection.
            conduit_utils_1.logger.error(err);
            const e = {
                type: 'error',
                status: err.status || 0,
                message: ('NSync Connect threw error: ' + err.message) || 'Empty Exception',
            };
            this.handleErrorEvent(e);
        }
        if (!this.eventSrc) {
            throw new Error('Failed to connect to NSync, null eventsource returned');
        }
        const { resolve, promise } = conduit_utils_1.allocPromise();
        this.firstMessagePromise = promise;
        this.firstMessageResolve = () => {
            this.firstMessagePromise = null;
            this.firstMessageResolve = null;
            resolve();
        };
        this.eventSrc.addEventListener(en_data_model_1.NSyncEvents.CONNECTION_EVENT, (event) => {
            this.firstMessageResolve && this.firstMessageResolve();
            conduit_utils_1.logger.debug('Successful connection!', event.lastEventId);
            gTracePool.runTraced(this.di.getTestEventTracker(), async (trc2) => {
                var _a;
                await ((_a = this.storage) === null || _a === void 0 ? void 0 : _a.transactEphemeral(trc2, 'Update nsync Completed flag', async (tx) => {
                    await tx.setValue(trc, 'SyncManager', 'nsyncCompleted', false);
                }));
                return this.updateConnectionInformation(trc2, {
                    connectionID: event.data.toString(),
                    lastAttempt: 200,
                });
            }).catch(err => conduit_utils_1.logger.error('Unable to update connection information', err));
            conduit_utils_1.traceTestCounts(trc, { [CONNECTED_KEY]: 1 });
            this.enqueueEvent(event);
        });
        this.eventSrc.onerror = (event) => {
            this.firstMessageResolve && this.firstMessageResolve();
            this.handleErrorEvent(event);
        };
        this.eventSrc.addEventListener(en_data_model_1.NSyncEvents.CHUNK_EVENT, (event) => {
            this.firstMessageResolve && this.firstMessageResolve();
            conduit_utils_1.logger.debug('Sync event', event.lastEventId);
            this.enqueueEvent(event);
        });
        this.eventSrc.addEventListener(en_data_model_1.NSyncEvents.REALTIME_EVENT, (event) => {
            this.firstMessageResolve && this.firstMessageResolve();
            conduit_utils_1.logger.debug('Event event', event.lastEventId);
            this.enqueueEvent(event);
        });
        this.eventSrc.addEventListener(en_data_model_1.NSyncEvents.PING_EVENT, async (msg) => {
            this.firstMessageResolve && this.firstMessageResolve();
            conduit_utils_1.logger.debug('Ping from service', msg);
            const pingData = JSON.parse(msg.data);
            let lastNSyncProcessingTime = null;
            if (pingData && typeof pingData === 'object') {
                lastNSyncProcessingTime = pingData.globalLastMessageTime;
            }
            else if (pingData !== null && typeof pingData === 'number') {
                // TODO: remove this section after nsync switches over to ping object
                lastNSyncProcessingTime = pingData;
            }
            if (!conduit_utils_1.isNullish(lastNSyncProcessingTime) && !isNaN(lastNSyncProcessingTime)) {
                if (!this.storage) {
                    conduit_utils_1.logger.error('Missing storage. Using unitialized NSyncEventManager');
                    return;
                }
                try {
                    await this.storage.transact(trc, 'UpdateLastNSyncProcessTime', async (transaction) => {
                        await transaction.replaceSyncState(trc, [exports.LAST_NSYNC_SYNC_STATE_PATH], lastNSyncProcessingTime);
                    });
                }
                catch (err) {
                    conduit_utils_1.logger.error('Cannot save LastNSyncProcessTime. Error: ', err);
                }
            }
        });
        this.eventSrc.addEventListener(en_data_model_1.NSyncEvents.EXCEPTION_EVENT, (msg) => {
            this.firstMessageResolve && this.firstMessageResolve();
            if (!msg.data) {
                conduit_utils_1.logger.warn('Received exception with empty data', msg);
                return;
            }
            const evt = conduit_utils_1.safeParse(msg.data);
            if (!evt || typeof (evt) !== 'object') {
                conduit_utils_1.logger.warn('Received exception with non-object error', evt);
                return;
            }
            const err = {
                type: 'error',
                status: evt.status || 0,
                message: evt.message || 'Empty Exception',
            };
            if (err.status === 401 && err.message === AUTHENTICATION_EXPIRED) {
                // Should not happen often and want to see it in logs later
                conduit_utils_1.logger.info('Received token expired exception from nsync. Will get new token...');
            }
            this.handleErrorEvent(err);
        });
        this.eventSrc.addEventListener(en_data_model_1.NSyncEvents.COMPLETE_EVENT, (event) => {
            this.firstMessageResolve && this.firstMessageResolve();
            // Clear backoff information after completing the connection
            gTracePool.runTraced(this.di.getTestEventTracker(), async (trc2) => {
                return this.updateConnectionInformation(trc2, {
                    attempts: 0,
                    backoff: 0,
                });
            }).catch(err => conduit_utils_1.logger.error('Unable to update connection information', err));
            // If there is a catchup filter set, don't enqueue event.
            // Instead, clear the filter and restart syncing with full filter
            if (this.catchupFilter) {
                this.clearCatchupFilter();
                conduit_utils_1.logger.debug('Sync updates on catch up completed.', event.lastEventId);
                return;
            }
            conduit_utils_1.logger.debug('Sync updates completed.', event.lastEventId);
            this.enqueueEvent(event);
        });
    }
    handleErrorEvent(errorEvent) {
        this.destroySync();
        if (this.isDestroyed) {
            return;
        }
        const attempts = this.connectionInfo ? this.connectionInfo.attempts : 0;
        // First attempt is jitter, use backoff for subsequent
        // eslint-disable-next-line no-bitwise
        const backoff = Math.min(60000, BACKOFF_RECONNECT * (1 << attempts) - BACKOFF_RECONNECT);
        const jitterMax = Math.max(BACKOFF_RECONNECT, backoff * RECONNECT_JITTER_RATIO);
        const jitter = jitterMax * Math.random();
        gTracePool.runTraced(this.di.getTestEventTracker(), async (trc) => {
            var _a;
            return this.updateConnectionInformation(trc, {
                backoff: Date.now() + backoff + jitter,
                attempts: attempts + 1,
                lastAttempt: (_a = errorEvent.status) !== null && _a !== void 0 ? _a : 0,
            });
        }).catch(err => conduit_utils_1.logger.error('Unable to update backoff', err));
        if (errorEvent.status && errorEvent.status === 401 || errorEvent.status === 403) {
            this.enqueueErrorEvent(new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.JWT_AUTH_EXPIRED, this.monolithToken), 'Not Authorized');
            // DO NOT recreate sync here, expect to wait for proper auth information and try again
            return;
        }
        else if (errorEvent.status && errorEvent.status >= 500) {
            conduit_utils_1.logger.error(`${errorEvent.status} from NSync: ${errorEvent.message}`);
            this.enqueueErrorEvent(new conduit_utils_1.ServiceError('NSyncInternal', errorEvent.status.toString(), errorEvent.message), 'service error');
        }
        else if (errorEvent.message === undefined) {
            conduit_utils_1.logger.warn('Empty message from nsync. Likely disconnect. Trying reconnect...');
        }
        else if (errorEvent.message === 'network error') {
            conduit_utils_1.logger.warn('Network error message from nsync. Trying reconnect...');
        }
        else if (errorEvent.message === '`EventSource` instance closed while sending.') { // TODO: False mocksse error. Remove with CON-2254. Very Soon!
            if (this.isPaused === false) {
                conduit_utils_1.logger.warn(`Event source instance closed while sending.`);
            }
        }
        else if (errorEvent.message === 'NSync path invalid: empty' ||
            errorEvent.message === 'NSync path invalid: null' ||
            errorEvent.message === 'NSync path invalid') {
            conduit_utils_1.logger.error(errorEvent.message);
            this.enqueueErrorEvent(new Error(`${errorEvent.code}: ${errorEvent.message}`), 'Invalid NSync Path Error');
        }
        else {
            conduit_utils_1.logger.error(`Unhandled error: ${errorEvent.message}`);
            // this.onSyncMessage({type: 'Error', message: 'Unknown Error', error: new Error(`${errorEvent.status}: ${errorEvent.message}`) });
            this.enqueueErrorEvent(new Error(`${errorEvent.status}: ${errorEvent.message}`), 'Unhandled error');
        }
        gTracePool.runTraced(this.di.getTestEventTracker(), async (trc) => {
            return this.createSync(trc);
        }).catch(err => {
            this.enqueueErrorEvent(err, 'Unable to re-create sync');
        });
    }
    destroySync() {
        if (this.eventSrc) {
            this.eventSrc.close();
            this.eventSrc = null;
        }
    }
    requiresFlush() {
        return this.docQueue.length > 0;
    }
    async flush(trc, context) {
        if (this.firstMessagePromise) {
            await this.firstMessagePromise;
        }
        if (this.isPaused) {
            conduit_utils_1.logger.warn('Attempting to flush nsync event data while paused');
            return;
        }
        if (!this.docQueue.length) {
            return;
        }
        await context.yieldCheck;
        const docs = this.docQueue;
        this.docQueue = [];
        const remainingDocs = await this.processNSyncData(trc, docs, context);
        if (!this.isDestroyed) {
            this.docQueue.unshift(...remainingDocs);
            if (!this.docQueue.length) {
                this.clearProcessingEntities();
            }
        }
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
        this.isDestroyed = true;
        this.destroySync();
        (_a = this.backoffSleep) === null || _a === void 0 ? void 0 : _a.cancel();
        this.connectionInfo = null;
        this.messageQueue = [];
        this.messageConsumer = null;
        this.docQueue.length = 0;
        this.expungeSet.clear();
        this.clearProcessingEntities();
        (_b = this.availability) === null || _b === void 0 ? void 0 : _b.destructor();
        this.availability = null;
        this.storage = null;
        this.jwt = '';
        this.clientID = '';
        this.monolithHost = '';
        this.monolithToken = '';
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
                        type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
                            enabled: 'boolean',
                            offline: 'boolean',
                            paused: 'boolean',
                            completed: 'boolean',
                            nextAttempt: 'timestamp',
                            lastConnection: 'timestamp',
                            lastNSyncProcessTime: 'timestamp',
                        }, 'NSyncStatusResult')),
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
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "init", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "clearBackoff", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "updateConnectionInformation", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "getConnectionInformation", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "processNSyncData", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "onSyncStateChange", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "createSync", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "flush", null);
exports.NSyncEventManager = NSyncEventManager;
//# sourceMappingURL=NSyncEventManager.js.map