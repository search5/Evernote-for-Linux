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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_nsync_connector_1 = require("en-nsync-connector");
const Auth = __importStar(require("../Auth"));
const NotebookConverter_1 = require("../Converters/NotebookConverter");
const Migrations_1 = require("../SyncFunctions/Migrations");
const NoteStoreSync_1 = require("../SyncFunctions/NoteStoreSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const AccountSessionSyncActivity_1 = require("./AccountSessionSyncActivity");
const ContentFetchSyncActivity_1 = require("./ContentFetchSyncActivity");
const HybridInitialDownsyncActivity_1 = require("./HybridInitialDownsyncActivity");
const IncrementalSyncActivity_1 = require("./IncrementalSyncActivity");
const NSyncInitActivity_1 = require("./NSyncInitActivity");
const OfflineSearchIndexActivity_1 = require("./OfflineSearchIndexActivity");
const ReindexActivity_1 = require("./ReindexActivity");
const SchemaMigrationActivity_1 = require("./SchemaMigrationActivity");
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
const logger = conduit_utils_1.createLogger('SyncManager');
let gQuerySuppressionTime = conduit_utils_1.registerDebugSetting('QuerySuppressionTime', 100, v => gQuerySuppressionTime = v);
const MUTEX_TIMEOUT = 30 * 1000; // ok to wait longer for mutex when transacting the activity queue, it is critical
// const AUTH_RETRY_TIMEOUT = 5000;
function cmpActivities(a1, a2) {
    let d = a2.params.priority - a1.params.priority;
    if (d) {
        return d;
    }
    d = a1.params.subpriority - a2.params.subpriority;
    if (d) {
        return d;
    }
    return a2.params.runAfter - a1.params.runAfter;
}
class SyncManager {
    constructor(di, thriftComm, syncEngine) {
        this.di = di;
        this.auth = null;
        this.queue = [];
        this.currentActivity = null;
        this.activityTimer = null;
        this.syncPromise = null;
        this.isSyncing = false;
        this.isDestroyed = false;
        this.isSuppressed = false;
        this.initialDownsyncTimings = null;
        this.syncTrc = conduit_utils_1.createTraceContext('SyncManager', this.di.getTestEventTracker());
        this.activityContext = {
            thriftComm,
            syncEngine,
            syncManager: this,
            syncEventManager: null,
            usedPrebuilt: false,
        };
    }
    async destructor(trc) {
        var _a;
        await ((_a = this.activityContext.syncEventManager) === null || _a === void 0 ? void 0 : _a.destructor(trc));
        this.activityContext.syncEventManager = null;
        this.isDestroyed = true;
        await this.pauseSyncing(trc);
    }
    getAuth() {
        return this.auth;
    }
    isReadyForMutations() {
        if (!this.auth) {
            return true;
        }
        for (const activity of this.queue) {
            if (activity.params.priority === SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC) {
                return false;
            }
        }
        return true;
    }
    async waitUntilReadyForMutations(trc) {
        if (!this.auth) {
            return false;
        }
        let p;
        for (const activity of this.queue) {
            if (activity.params.priority === SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC) {
                // wait for final initial downsync activity to complete
                p = activity.completionPromise;
            }
        }
        await p;
        return p !== undefined;
    }
    isEventServiceEnabled() {
        var _a;
        return Boolean((_a = this.activityContext.syncEventManager) === null || _a === void 0 ? void 0 : _a.isEnabled());
    }
    async onDBClear(trc) {
        var _a;
        await ((_a = this.activityContext.syncEventManager) === null || _a === void 0 ? void 0 : _a.onDBClear(trc));
    }
    async initAuth(trc, auth, startPaused) {
        var _a;
        const isColdStart = Boolean(!this.auth && auth); // Not a refresh and not clearing auth
        this.auth = auth;
        logger.info('Pause sync to update or remove auth data.');
        await this.pauseSyncing(trc);
        if (auth) {
            logger.info('Update sync engine auth data and sync activities.');
            if (!Auth.hasNapAuthInfo(auth) || !auth.napAuthInfo.jwt) {
                logger.warn('Missing NAP JWT');
            }
            this.initialDownsyncTimings = {};
            if (this.activityContext.syncEventManager) {
                await this.activityContext.syncEventManager.updateToken(trc, Auth.hasNapAuthInfo(auth) ? auth.napAuthInfo.jwt : '', auth.token);
                // set nsyncDisabled flag since NSyncEventManagers init cannot call toggleNSync during init
                // (toggleNSync calls syncEventManager.isAvailable, but syncEventManager isn't set yet)
                await this.activityContext.syncEngine.transactEphemeral(trc, 'InitNSyncDisabled', async (tx) => {
                    if (!this.activityContext.syncEventManager) {
                        return;
                    }
                    await tx.setValue(trc, 'SyncManager', 'nsyncDisabled', !this.activityContext.syncEventManager.isAvailable());
                });
                // Don't need to call onSyncStateChange, as NSyncEventManager enables or disables itself in the constructor on the same function
            }
            this.di.emitEvent(conduit_view_types_1.ConduitEvent.START_SYNCING_WITH_AUTH);
            const activities = [];
            const syncInitialized = await this.activityContext.syncEngine.graphStorage.getSyncState(trc, null, ['syncInitialized']);
            if (!syncInitialized) {
                await this.activityContext.syncEngine.transact(trc, 'initialDownsync', async (tx) => {
                    await this.initializeSync(trc, tx);
                });
            }
            else {
                await this.loadActivityQueue(trc);
                activities.push(this.getNSyncInitActivity(trc));
                if (this.di.downsyncConfig.downsyncMode === conduit_view_types_1.DownsyncMode.LEGACY_FOR_PREBUILT) {
                    if (isColdStart) {
                        activities.push(this.getSchemaMigrationActivity(trc));
                        activities.push(this.getReindexingActivity(trc));
                        activities.push(this.getImmediateIncrementalSync(trc, isColdStart, SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC));
                    }
                }
                else {
                    if (isColdStart) {
                        activities.push(this.getSchemaMigrationActivity(trc));
                        activities.push(this.getReindexingActivity(trc));
                    }
                    const showLoadingScreen = (_a = this.di.loadingScreenConfig.showDuringIncrementalSyncAfterStartup) !== null && _a !== void 0 ? _a : true;
                    activities.push(this.getImmediateIncrementalSync(trc, isColdStart && showLoadingScreen, SyncActivity_1.SyncActivityPriority.IMMEDIATE));
                    activities.push(new HybridInitialDownsyncActivity_1.MaestroSyncActivity(this.di, this.activityContext));
                    activities.push(new HybridInitialDownsyncActivity_1.PromotionsSyncActivity(this.di, this.activityContext));
                    const contentFetchActivity = await this.getContentFetchSyncActivity(trc);
                    if (contentFetchActivity) {
                        activities.push(contentFetchActivity);
                    }
                }
            }
            activities.push(new OfflineSearchIndexActivity_1.OfflineSearchIndexActivity(this.di, this.activityContext));
            if (Auth.hasNAPData(auth)) {
                activities.push(new AccountSessionSyncActivity_1.AccountSessionSyncActivity(this.di, this.activityContext));
            }
            await this.addActivitiesOnInit(trc, activities);
            await this.activityContext.syncEngine.transact(trc, 'initUserSyncContext', async (graphTransaction) => {
                await this.activityContext.syncEngine.initUserSyncContext(trc, graphTransaction, conduit_core_1.PERSONAL_USER_CONTEXT, auth);
                if (auth.vaultAuth) {
                    await this.activityContext.syncEngine.initUserSyncContext(trc, graphTransaction, conduit_core_1.VAULT_USER_CONTEXT, auth.vaultAuth);
                }
                await this.activityContext.syncEngine.initUserSyncContext(trc, graphTransaction, en_nsync_connector_1.NSYNC_CONTEXT, null);
            });
        }
        else {
            logger.info('Remove auth data and clear activity queue.');
            await this.clearActivityQueue(trc);
        }
        logger.info('Update or remove auth data completed!');
        if (!startPaused) {
            logger.info('Resume sync after auth updated.');
            await this.resumeSyncing(trc);
        }
    }
    async pauseSyncing(trc) {
        logger.debug('pauseSyncing');
        await this.activityContext.syncEngine.transactEphemeral(trc, 'pauseSyncing', async (tx) => {
            await tx.setValue(trc, 'SyncManager', 'syncPaused', true);
        });
        await this.onSyncStateChange(trc);
    }
    async resumeSyncing(trc) {
        logger.debug('resumeSyncing');
        await this.activityContext.syncEngine.transactEphemeral(trc, 'resumeSyncing', async (tx) => {
            await tx.setValue(trc, 'SyncManager', 'syncPaused', false);
        });
        await this.onSyncStateChange(trc);
    }
    async disableSyncing(trc) {
        logger.debug('disableSyncing');
        await this.activityContext.syncEngine.transactEphemeral(trc, 'disableSyncing', async (tx) => {
            await tx.setValue(trc, 'SyncManager', 'syncDisabled', true);
        });
        await this.onSyncStateChange(trc);
    }
    async enableSyncing(trc) {
        logger.debug('enableSyncing');
        await this.activityContext.syncEngine.transactEphemeral(trc, 'enableSyncing', async (tx) => {
            await tx.setValue(trc, 'SyncManager', 'syncDisabled', false);
        });
        await this.onSyncStateChange(trc);
    }
    async toggleNSync(trc, disable) {
        var _a;
        // if not available, always set to disable
        const available = Boolean((_a = this.activityContext.syncEventManager) === null || _a === void 0 ? void 0 : _a.isAvailable());
        if (!available) {
            disable = true;
        }
        await this.activityContext.syncEngine.transactEphemeral(trc, 'toggleSyncing', async (tx) => {
            await tx.setValue(trc, 'SyncManager', 'nsyncDisabled', disable);
        });
        await this.onSyncStateChange(trc);
    }
    async addImmediateActivity(trc, activity, timeout) {
        const syncDisabled = await this.activityContext.syncEngine.getEphemeralFlag(trc, 'SyncManager', 'syncDisabled');
        if (syncDisabled || !this.auth) {
            return;
        }
        const syncPaused = await this.activityContext.syncEngine.getEphemeralFlag(trc, 'SyncManager', 'syncPaused');
        logger.debug('Triggering immediate sync activity ', activity.params.activityType);
        activity = await this.addActivity(trc, activity);
        if (syncPaused) {
            await this.resumeSyncing(trc);
        }
        else {
            if (this.currentActivity && this.currentActivity !== activity) {
                await this.currentActivity.abort();
            }
            this.wakeUp();
        }
        if (timeout) {
            // if timeout is hit, let syncing continue in the background but clean up properly below
            await Promise.race([conduit_utils_1.sleep(timeout), activity.completionPromise]);
        }
        else {
            await activity.completionPromise;
        }
        if (syncPaused) {
            await this.pauseSyncing(trc);
        }
    }
    async forceDownsyncUpdate(trc, timeout) {
        await this.addImmediateActivity(trc, new IncrementalSyncActivity_1.IncrementalSyncActivity(this.di, this.activityContext, SyncActivity_1.SyncActivityPriority.IMMEDIATE), timeout);
    }
    async needImmediateNotesDownsync(trc, args) {
        const existingActivity = this.findActivity(trc, SyncActivity_1.SyncActivityType.NotesFetchActivity);
        if (existingActivity && existingActivity.params.priority === SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC) {
            throw new conduit_utils_1.InvalidOperationError('Cannot execute immediateNotesDownsync when initial downsync is in progress');
        }
        let activity = existingActivity;
        if (!activity) {
            activity = new HybridInitialDownsyncActivity_1.NotesFetchActivity(this.di, this.activityContext, args);
        }
        const syncParams = await activity.initParams('best', SyncHelpers_1.NOTES_SYNC_STATE_PATH, HybridInitialDownsyncActivity_1.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        return await NoteStoreSync_1.checkNotesSyncAvailable(trc, syncParams);
    }
    async immediateNotesDownsync(trc, args) {
        const activity = new HybridInitialDownsyncActivity_1.NotesFetchActivity(this.di, this.activityContext, args);
        const syncParams = await activity.initParams('best', SyncHelpers_1.NOTES_SYNC_STATE_PATH, HybridInitialDownsyncActivity_1.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await this.addImmediateActivity(trc, activity, null);
        return await NoteStoreSync_1.checkNotesSyncAvailable(trc, syncParams);
    }
    async cancelImmediateNotesDownsync(trc) {
        await this.abortActivityByType(trc, SyncActivity_1.SyncActivityType.NotesFetchActivity);
    }
    async needContentFetchSync(trc) {
        if (this.activityContext.syncEngine.offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.NONE) {
            return false;
        }
        const noteIDs = await NotebookConverter_1.getPendingOfflineNoteIDs(trc, this.activityContext.syncEngine.graphStorage);
        return ((noteIDs || []).length > 0);
    }
    async handleImmediateContentFetchSync(trc, args, addImmediateActivity) {
        if (addImmediateActivity) {
            // replace any existing background activity with immediate activity.
            await this.addImmediateActivity(trc, new ContentFetchSyncActivity_1.ContentFetchSyncActivity(this.di, this.activityContext, args), null);
        }
        // add new activity back to queue for regular background processing.
        await this.addActivity(trc, new ContentFetchSyncActivity_1.ContentFetchSyncActivity(this.di, this.activityContext, null));
    }
    async immediateContentFetchSync(trc, args) {
        await this.handleImmediateContentFetchSync(trc, args, true);
        return await this.needContentFetchSync(trc);
    }
    async cancelContentFetchSync(trc) {
        await this.handleImmediateContentFetchSync(trc, null, false);
    }
    async abortActivityByType(trc, type) {
        const activity = this.findActivity(trc, type);
        if (activity) {
            if (activity.params.priority === SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC) {
                throw new conduit_utils_1.InvalidOperationError('Cannot abort initial downsync activities');
            }
            if (this.currentActivity && this.currentActivity === activity) {
                await this.currentActivity.abort(true);
            }
            await this.removeActivity(trc, activity);
        }
    }
    suppressSyncForQuery(name) {
        if (this.isSuppressed) {
            return;
        }
        this.isSuppressed = true;
        setTimeout(() => {
            this.isSuppressed = false;
        }, gQuerySuppressionTime);
        if (this.currentActivity && this.currentActivity.params.priority < SyncActivity_1.SyncActivityPriority.IMMEDIATE && this.currentActivity.isRunning() && !this.currentActivity.isSuppressed()) {
            // suppress anything less than a high priority activity on active query
            logger.debug('Suppressing current sync activity because of active query', { activity: this.currentActivity.params.activityType, query: name });
            this.currentActivity.suppress(gQuerySuppressionTime);
        }
    }
    getNSyncInitActivity(trc) {
        return new NSyncInitActivity_1.NSyncInitActivity(this.di, this.activityContext, HybridInitialDownsyncActivity_1.FINAL_ACTIVITY_ORDER.NSYNC_INIT_ACTIVITY);
    }
    getSchemaMigrationActivity(trc) {
        return new SchemaMigrationActivity_1.SchemaMigrationActivity(this.di, this.activityContext, HybridInitialDownsyncActivity_1.FINAL_ACTIVITY_ORDER.SCHEMA_MIGRATION);
    }
    getReindexingActivity(trc) {
        return new ReindexActivity_1.ReindexActivity(this.di, this.activityContext, HybridInitialDownsyncActivity_1.FINAL_ACTIVITY_ORDER.REINDEX_ACTIVITY);
    }
    async addReindexingActivity(trc, graphTransaction) {
        await this.addActivity(trc, this.getReindexingActivity(trc), graphTransaction);
    }
    async onSyncStateChange(trc, skipSyncEventManager) {
        var _a;
        const syncPaused = await this.activityContext.syncEngine.getEphemeralFlag(trc, 'SyncManager', 'syncPaused');
        const syncDisabled = await this.activityContext.syncEngine.getEphemeralFlag(trc, 'SyncManager', 'syncDisabled');
        const nSyncDisabled = await this.activityContext.syncEngine.getEphemeralFlag(trc, 'SyncManager', 'nsyncDisabled');
        const shouldSync = this.auth !== null && !syncPaused && !syncDisabled;
        await ((_a = this.activityContext.syncEventManager) === null || _a === void 0 ? void 0 : _a.onSyncStateChange(trc, nSyncDisabled || syncDisabled));
        if (shouldSync === this.isSyncing) {
            return;
        }
        return await conduit_utils_1.logIfSlow('SyncManager:onSyncStateChange', 5000, async (loggerArgs) => {
            var _a;
            loggerArgs.shouldSync = shouldSync;
            loggerArgs.currentActivity = ((_a = this.currentActivity) === null || _a === void 0 ? void 0 : _a.params.activityType) || 'none';
            loggerArgs.queue = this.queue.map(a => a.params.activityType);
            this.isSyncing = shouldSync;
            if (this.isSyncing) {
                logger.debug('SyncManager: starting sync activity queue');
                if (this.syncPromise) {
                    conduit_utils_1.traceEventStart(trc, 'SyncManager.syncPromise');
                    await conduit_utils_1.traceEventEndWhenSettled(trc, 'SyncManager.syncPromise', this.syncPromise);
                    loggerArgs.syncPromiseDone = true;
                }
                this.syncPromise = this.runSyncActivities(this.syncTrc).catch(err => {
                    logger.error('Caught error running sync activity queue', err);
                    this.isSyncing = false;
                    this.syncPromise = null;
                    if (err instanceof Migrations_1.SchemaMigrationError) {
                        this.handleSchemaMigrationFailure(trc)
                            .catch(e => logger.error('schema migration handle failure', e));
                    }
                }).then(() => {
                    // would normally do this in a .finally() but Neutron doesn't support that
                    this.syncPromise = null;
                });
            }
            else {
                logger.debug('SyncManager: stopping sync activity queue');
                this.wakeUp();
                if (this.currentActivity) {
                    const activityName = this.currentActivity.params.activityType;
                    conduit_utils_1.traceEventStart(trc, 'SyncManager.abortCurrentActivity');
                    await conduit_utils_1.traceEventEndWhenSettled(trc, 'SyncManager.abortCurrentActivity', this.currentActivity.abort());
                    logger.debug(`SyncManager: Aborting ${activityName} completed!`);
                    loggerArgs.currentActivityAborted = true;
                }
                if (this.syncPromise) {
                    conduit_utils_1.traceEventStart(trc, 'SyncManager.syncPromise');
                    await conduit_utils_1.traceEventEndWhenSettled(trc, 'SyncManager.syncPromise', this.syncPromise);
                    logger.debug(`SyncManager: syncPromise completed!`);
                }
            }
        });
    }
    getImmediateIncrementalSync(trc, trackProgress, priority) {
        return new IncrementalSyncActivity_1.IncrementalSyncActivity(this.di, this.activityContext, priority, 0, 0, trackProgress);
    }
    // No need to add a new content fetch activity if its already in queue or
    // if background note sync hasn't completed. ContentFetchSyncActivity will be
    // added after background note sync completion.
    async getContentFetchSyncActivity(trc) {
        if (this.activityContext.syncEngine.offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.NONE) {
            return;
        }
        await NotebookConverter_1.resetOfflineNbsSyncStateOnInit(trc, this.activityContext.syncEngine.graphStorage);
        const activities = this.queue.map(a => a.dehydrate());
        let addContentFetchActivity = true;
        for (const activity of activities) {
            if (activity.type === 'BackgroundNoteSyncActivity' || activity.type === 'ContentFetchSyncActivity') {
                addContentFetchActivity = false;
                break;
            }
        }
        if (addContentFetchActivity) {
            return new ContentFetchSyncActivity_1.ContentFetchSyncActivity(this.di, this.activityContext, null);
        }
        return null;
    }
    findActivityIndex(trc, activityType) {
        return this.queue.findIndex(a => a.params.activityType === activityType);
    }
    findActivity(trc, activityType) {
        return this.queue.find(a => a.params.activityType === activityType);
    }
    async replaceActivityQueueSyncState(trc, tx) {
        const queue = this.queue.filter(a => !a.params.dontPersist).map(a => a.dehydrate());
        await tx.replaceSyncState(trc, ['SyncManager', 'activityQueue'], queue);
    }
    async getActivitiyQueueSyncState(trc) {
        return await this.activityContext.syncEngine.graphStorage.getSyncState(trc, null, ['SyncManager', 'activityQueue']);
    }
    async addActivitiesOnInit(trc, activities) {
        logger.debug(`addActivitiesOnInit ${activities.map(a => a.params.activityType)}`);
        await this.activityContext.syncEngine.transact(trc, 'addActivitiesOnInit', async (tx) => {
            for (const activity of activities) {
                const idx = this.findActivityIndex(trc, activity.params.activityType);
                if (idx >= 0) {
                    // replace activity if already exists in queue.
                    this.queue.splice(idx, 1, activity);
                }
                else {
                    this.queue.push(activity);
                }
            }
            this.queue.sort(cmpActivities);
            // persist pending activities
            await this.replaceActivityQueueSyncState(trc, tx);
        });
    }
    async addActivity(trc, activity, graphTransaction) {
        const activityType = activity.params.activityType;
        const existingActivity = this.findActivity(trc, activityType);
        if (existingActivity) {
            // already in the queue, replace it
            if (existingActivity.isRunning()) {
                if (conduit_utils_1.isEqual(existingActivity.dehydrate(), activity.dehydrate())) {
                    logger.info(`addActivity: Similar activity ${conduit_utils_1.safeStringify(existingActivity.dehydrate())} is already running. Ignoring new activity.`);
                    return existingActivity;
                }
                logger.info(`addActivity: ${activityType} already running. Cancelling existing activity to replace with new one.`);
                // need to cancel otherwise runActivity will replace with old activity if we abort.
                await existingActivity.abort(true);
            }
            return await this.replaceActivity(trc, existingActivity, activity, graphTransaction);
        }
        logger.debug('addActivity', activity.params.activityType);
        await this.activityContext.syncEngine.transact(trc, 'addActivity', async (tx) => {
            // add to priority queue
            this.queue.push(activity);
            this.queue.sort(cmpActivities);
            // persist pending activities
            await this.replaceActivityQueueSyncState(trc, tx);
        }, graphTransaction);
        return activity;
    }
    async replaceActivity(trc, oldActivity, newActivity, graphTransaction) {
        logger.debug('replaceActivity', newActivity.params.activityType);
        await this.activityContext.syncEngine.transact(trc, 'replaceActivity', async (tx) => {
            const idx = this.findActivityIndex(trc, oldActivity.params.activityType);
            if (idx >= 0) {
                this.queue.splice(idx, 1, newActivity);
            }
            else {
                this.queue.push(newActivity);
            }
            this.queue.sort(cmpActivities);
            // persist pending activities
            await this.replaceActivityQueueSyncState(trc, tx);
        }, graphTransaction, MUTEX_TIMEOUT);
        return newActivity;
    }
    async removeActivity(trc, activity) {
        await this.activityContext.syncEngine.transact(trc, 'removeActivity', async (tx) => {
            const idx = this.findActivityIndex(trc, activity.params.activityType);
            if (idx >= 0) {
                this.queue.splice(idx, 1);
                // persist pending activities
                await this.replaceActivityQueueSyncState(trc, tx);
            }
        }, undefined, MUTEX_TIMEOUT);
    }
    async removeActivitiesByType(trc, types) {
        await this.activityContext.syncEngine.transact(trc, 'removeActivitiesByName', async (tx) => {
            const queue = [];
            for (const activity of this.queue) {
                if (!types.includes(activity.params.activityType)) {
                    queue.push(activity);
                    continue;
                }
                if (activity.isRunning()) {
                    queue.push(activity);
                    continue;
                }
                // make sure the bucket taken up by this activity is marked complete or the loading screen will never drop
                await activity.setProgress(trc, 1);
            }
            // persist pending activities
            this.queue = queue;
            await this.replaceActivityQueueSyncState(trc, tx);
        }, undefined, MUTEX_TIMEOUT);
    }
    async loadActivityQueue(trc) {
        if (this.isSyncing) {
            throw new Error('loadActivityQueue called while syncing');
        }
        this.queue = [];
        this.currentActivity = null;
        const persisted = await this.getActivitiyQueueSyncState(trc);
        if (!Array.isArray(persisted)) {
            return;
        }
        for (const p of persisted) {
            try {
                const existing = this.findActivity(trc, p.type);
                if (existing) {
                    logger.warn(`Ignoring activity ${conduit_utils_1.safeStringify(p)} as another activity of same type already exists ${conduit_utils_1.safeStringify(existing.dehydrate())}`);
                    continue;
                }
                const activity = SyncActivityHydration_1.hydrateActivity(this.di, this.activityContext, p);
                this.queue.push(activity);
            }
            catch (err) {
                logger.error('Failed to hydrate sync activity', err);
            }
        }
    }
    async clearActivityQueue(trc) {
        if (this.isSyncing) {
            throw new Error('clearActivityQueue called while syncing');
        }
        await this.activityContext.syncEngine.transact(trc, 'clearActivityQueue', async (tx) => {
            this.queue = [];
            this.currentActivity = null;
            await this.replaceActivityQueueSyncState(trc, tx);
        }, undefined, MUTEX_TIMEOUT);
    }
    wakeUp() {
        if (this.activityTimer) {
            this.activityTimer.cancel();
            this.activityTimer = null;
        }
    }
    async runSyncActivities(trc) {
        if (this.isSyncing && !this.isDestroyed) {
            for (const activity of this.queue) {
                await activity.setBucketSize(trc);
            }
        }
        while (this.isSyncing && !this.isDestroyed) {
            const next = await this.getNextActivity(trc);
            if (!this.isSyncing || this.isDestroyed) {
                // handling the race condition
                break;
            }
            if (typeof next === 'number') {
                logger.debug('sleeping', next);
                const timer = conduit_utils_1.cancellableSleep(next);
                this.activityTimer = timer;
                await timer.promise;
                this.activityTimer = null;
                continue;
            }
            await this.runActivity(trc, next);
            // sleep to allow forceDownsync to pause if it wants to
            await conduit_utils_1.sleep(5);
        }
    }
    async getNextActivity(trc) {
        const now = Date.now();
        let next = null;
        let incremental = null;
        let nextTime = Infinity;
        let noIncremental = false;
        for (const activity of this.queue) {
            if (activity.params.activityType === SyncActivity_1.SyncActivityType.IncrementalSyncActivity) {
                incremental = activity;
            }
            nextTime = Math.min(nextTime, activity.params.runAfter);
            if (activity.params.runAfter <= now) {
                next = activity;
                break;
            }
            if (activity.params.priority > SyncActivity_1.SyncActivityPriority.IMMEDIATE) {
                // activities above IMMEDIATE priority must be run in order
                noIncremental = true;
                break;
            }
        }
        if (!next && !incremental && !noIncremental) {
            incremental = new IncrementalSyncActivity_1.IncrementalSyncActivity(this.di, this.activityContext, SyncActivity_1.SyncActivityPriority.BACKGROUND);
            await this.addActivity(trc, incremental);
            nextTime = Math.min(nextTime, incremental.params.runAfter);
        }
        if (this.isSuppressed && next && next.params.priority < SyncActivity_1.SyncActivityPriority.IMMEDIATE) {
            // suppress this low priority activity because of active queries
            next = null;
            nextTime = now + gQuerySuppressionTime;
        }
        if (next) {
            return next;
        }
        return Math.max(0, Math.min(nextTime - Date.now(), 10000));
    }
    async runActivity(trc, activity) {
        logger.debug('runActivity', activity.params.activityType);
        const start = Date.now();
        this.currentActivity = activity;
        const err = await activity.runSync(trc);
        this.currentActivity = null;
        const elapsed = Date.now() - start;
        if (this.initialDownsyncTimings && activity.params.priority === SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC) {
            this.initialDownsyncTimings[activity.params.activityType] = this.initialDownsyncTimings[activity.params.activityType] || 0;
            this.initialDownsyncTimings[activity.params.activityType] += elapsed;
        }
        else if (this.initialDownsyncTimings) {
            let total = 0;
            for (const activityName in this.initialDownsyncTimings) {
                total += this.initialDownsyncTimings[activityName];
            }
            logger.info(`Initial Downsync Total time ${total} Timings ${conduit_utils_1.safeStringify(this.initialDownsyncTimings)}`);
            this.initialDownsyncTimings = null;
        }
        if (this.isDestroyed) {
            return;
        }
        if (!err || err instanceof SyncActivity_1.CancelActivityError) {
            logger.debug(`activity ${err instanceof SyncActivity_1.CancelActivityError ? 'cancelled' : 'completed'} ${activity.params.activityType}`);
            await this.removeActivity(trc, activity);
            return;
        }
        const p = activity.dehydrate();
        let timeout = 500;
        if (err instanceof conduit_utils_1.RetryError) {
            logger.debug('retrying activity', activity.params.activityType, err.message);
            timeout = err.timeout;
        }
        else if (err instanceof Migrations_1.SchemaMigrationError) {
            throw err;
        }
        else {
            logger.error('activity threw an error', activity.params.activityType, err);
        }
        try {
            const newActivity = SyncActivityHydration_1.hydrateActivity(this.di, this.activityContext, p, timeout);
            await this.replaceActivity(trc, activity, newActivity);
        }
        catch (hydrateErr) {
            logger.error('Failed to hydrate activity', hydrateErr);
            await this.removeActivity(trc, activity);
        }
    }
    async handleSchemaMigrationFailure(trc) {
        await this.clearActivityQueue(trc);
        await this.activityContext.syncEngine.transact(trc, 'initialDownsyncAfterFailedMigration', async (tx) => {
            await tx.clearAllData(trc);
            this.initialDownsyncTimings = {};
            this.di.emitEvent(conduit_view_types_1.ConduitEvent.START_SYNCING_WITH_AUTH);
            await this.initializeSync(trc, tx);
        });
        await this.resumeSyncing(trc);
    }
    async initializeSync(trc, tx) {
        await tx.replaceSyncState(trc, ['syncInitialized'], true);
        await tx.replaceSyncState(trc, ['workspaces'], {
            wsToBackingNb: {},
            backingNbToWs: {},
        });
        await tx.replaceSyncState(trc, ['offlineNbs'], {});
        await HybridInitialDownsyncActivity_1.addInitialDownsyncActivities(trc, this.di, this.activityContext, tx);
    }
}
__decorate([
    conduit_utils_1.traceAsync('SyncManager')
], SyncManager.prototype, "initAuth", null);
__decorate([
    conduit_utils_1.traceAsync('SyncManager')
], SyncManager.prototype, "forceDownsyncUpdate", null);
__decorate([
    conduit_utils_1.traceAsync('SyncManager')
], SyncManager.prototype, "onSyncStateChange", null);
exports.SyncManager = SyncManager;
//# sourceMappingURL=SyncManager.js.map