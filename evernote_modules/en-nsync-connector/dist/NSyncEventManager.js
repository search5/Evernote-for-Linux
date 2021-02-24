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
exports.NSyncEventManager = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const MutationTrackerConverter_1 = require("./Converters/MutationTrackerConverter");
const DataHelpers_1 = require("./DataHelpers");
const index_1 = require("./index");
const NSyncProcessor_1 = require("./NSyncProcessor");
const NSyncTypes_1 = require("./NSyncTypes");
const gTracePool = new conduit_utils_1.AsyncTracePool('NSyncEventManager');
const LAST_CONNECTION_BUFFER_TIME = 60000;
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
function eventTimeFromEventID(eventID) {
    return (eventID && eventID.indexOf('::') && parseInt(eventID.split('::')[1], 0)) || 0;
}
class NSyncEventManager extends conduit_core_1.SyncEventManager {
    constructor(di, hostResolver) {
        super(di);
        this.hostResolver = hostResolver;
        this.isDestroyed = false;
        this.eventSrc = null;
        this.dataHelpers = null;
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
        this.nsyncRunning = false;
        this.toggleEventSync = null;
        this.enabledBeforeOverride = true; // Default is on
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
        this.expungeSet = new Set();
    }
    async init(trc, host, monolithToken, jwtToken, storage, clientID, resourceManager, toggleEventSync, availability) {
        this.isDestroyed = false;
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
    async processNSyncData(trc, eventData, context) {
        let idx = 0;
        let tracker = null;
        let latestConnectionTime = (await this.getConnectionInformation(trc)).lastConnection;
        let yieldCheckRes;
        while (idx < eventData.length) {
            yieldCheckRes = context.yieldCheck && await conduit_utils_1.withError(context.yieldCheck);
            if (yieldCheckRes === null || yieldCheckRes === void 0 ? void 0 : yieldCheckRes.err) {
                conduit_utils_1.logger.info(`processNSyncData yielded and stopped at index ${idx}. Docs length ${eventData.length}`);
                break;
            }
            await this.getStorage().transact(trc, 'processNSyncData', async (tx) => {
                const startTime = Date.now();
                for (idx; idx < eventData.length; ++idx) {
                    yieldCheckRes = context.yieldCheck && await conduit_utils_1.withError(context.yieldCheck);
                    if (yieldCheckRes === null || yieldCheckRes === void 0 ? void 0 : yieldCheckRes.err) {
                        conduit_utils_1.logger.debug(`processNSyncData yield and break inner loop. idx ${idx} docs ${eventData.length}`);
                        break;
                    }
                    if (this.isDestroyed || !this.dataHelpers) {
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
                            if (doc.instance.ref.type === NSyncTypes_1.NSyncTypes.EntityType.MUTATION_TRACKER) {
                                if (!tracker || (tracker.instance.updated || 0) < (doc.instance.updated || 0)) {
                                    tracker = doc;
                                    continue;
                                }
                            }
                            await NSyncProcessor_1.processNSyncDoc(trc, doc, this, tx, this.dataHelpers);
                        }
                        catch (e) {
                            conduit_utils_1.logger.error('Unable to process document', e);
                        }
                    }
                    if (eventData[idx].eventTime && eventData[idx].eventTime > latestConnectionTime) {
                        latestConnectionTime = eventData[idx].eventTime;
                        await this.updateConnectionInformation(trc, { lastConnection: eventData[idx].eventTime }, tx);
                    }
                }
                if (tracker && idx === eventData.length) {
                    try {
                        if (!this.dataHelpers) {
                            return;
                        }
                        await NSyncProcessor_1.processNSyncDoc(trc, tracker, this, tx, this.dataHelpers);
                    }
                    catch (e) {
                        conduit_utils_1.logger.error('Unable to update mutation tracker', e);
                    }
                }
            });
        }
        return eventData.slice(idx);
    }
    enqueueEvent(event) {
        if (this.isDestroyed) {
            throw new conduit_utils_1.InternalError('Unable to enqueue nsync event. Doc queue is destroyed.');
        }
        const lastEventTime = eventTimeFromEventID(event.lastEventId);
        const docs = conduit_utils_1.safeParse(event.data);
        if (Array.isArray(docs)) {
            for (const doc of docs) {
                this.docQueue.push({ doc, eventTime: 0 });
            }
            this.docQueue.push({ doc: null, eventTime: lastEventTime });
        }
        else if (docs) {
            this.docQueue.push({ doc: docs, eventTime: lastEventTime });
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
    async onSyncStateChange(trc, disabled) {
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
    clearCatchupFilter() {
        new Promise(async (resolve) => {
            this.catchupFilter = null;
            await gTracePool.runTraced(this.di.getTestEventTracker(), async (trc) => {
                await this.disconnect(trc);
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
        if (this.eventSrc) {
            return;
        }
        if (this.backoffSleep) {
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
        const entityFilterParam = NSyncTypes_1.nodeTypeArrayToEntityFilterParam(this, (_a = this.catchupFilter) !== null && _a !== void 0 ? _a : this.nodeFilter);
        const lastConnection = this.catchupFilter ? 0 : connInfo.lastConnection - LAST_CONNECTION_BUFFER_TIME;
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
            gTracePool.runTraced(this.di.getTestEventTracker(), async (trc2) => {
                return this.updateConnectionInformation(trc2, {
                    connectionID: event.data.toString(),
                    lastAttempt: 200,
                    attempts: 0,
                    backoff: 0,
                });
            }).catch(err => conduit_utils_1.logger.error('Unable to update connection information', err));
            this.onSyncMessage({ type: 'Connection', message: 'Connected!' });
        });
        this.eventSrc.onerror = (event) => {
            this.handleErrorEvent(event);
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
            conduit_utils_1.logger.debug('Sync updates completed.', event);
            const lastEventTime = eventTimeFromEventID(event.lastEventId);
            gTracePool.runTraced(this.di.getTestEventTracker(), async (trc2) => {
                await this.flush(trc2, { yieldCheck: null });
            })
                .then(() => {
                // If there is a catchup filter set, don't send the onSyncMessage event
                // instead, clear the filter and restart syncing with full filter
                if (this.catchupFilter) {
                    conduit_utils_1.logger.debug('Sync updates on catch up completed.', event);
                    this.clearCatchupFilter();
                    return;
                }
                gTracePool.runTraced(this.di.getTestEventTracker(), async (trc2) => {
                    return this.updateConnectionInformation(trc2, {
                        lastConnection: lastEventTime,
                        lastFilter: this.nodeFilter,
                    });
                }).catch(err => conduit_utils_1.logger.error('Unable to update connection information', err));
                this.onSyncMessage({ type: 'Complete', message: 'Completed' });
                this.clearProcessingEntities();
                if (lastEventTime) {
                    gTracePool.runTraced(this.di.getTestEventTracker(), async (trc2) => {
                        return this.upsertTracker(trc2, lastEventTime);
                    }).catch(err => conduit_utils_1.logger.error('Unable to upsert tracker', err));
                }
            })
                .catch(err => {
                conduit_utils_1.logger.error(`Unable to flush event consumer ${err}`);
                this.onSyncMessage({ type: 'Complete', message: 'Completed', error: err });
                this.clearProcessingEntities();
            });
        });
    }
    handleErrorEvent(errorEvent) {
        this.destroySync();
        const attempts = this.connectionInfo ? this.connectionInfo.attempts : 0;
        // First attempt is jitter, use backoff for subsequent
        // tslint:disable-next-line: no-bitwise
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
        gTracePool.runTraced(this.di.getTestEventTracker(), async (trc) => {
            return this.createSync(trc);
        }).catch(err => {
            this.onSyncMessage({ type: 'Error', message: 'Unable to re-create sync', error: err });
        });
    }
    destroySync() {
        if (this.eventSrc) {
            this.eventSrc.close();
            this.eventSrc = null;
        }
    }
    async flush(trc, context) {
        if (!this.docQueue.length) {
            return;
        }
        await context.yieldCheck;
        const docs = this.docQueue;
        this.docQueue = [];
        const remainingDocs = await this.processNSyncData(trc, docs, context);
        if (!this.isDestroyed) {
            this.docQueue.unshift(...remainingDocs);
        }
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
        this.isDestroyed = true;
        this.destroySync();
        (_a = this.backoffSleep) === null || _a === void 0 ? void 0 : _a.cancel();
        this.dataHelpers = null;
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
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "init", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "clearBackoff", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "clearConnectionInfo", null);
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
], NSyncEventManager.prototype, "upsertTracker", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "createSync", null);
__decorate([
    conduit_utils_1.traceAsync('NSyncEventManager')
], NSyncEventManager.prototype, "flush", null);
exports.NSyncEventManager = NSyncEventManager;
//# sourceMappingURL=NSyncEventManager.js.map