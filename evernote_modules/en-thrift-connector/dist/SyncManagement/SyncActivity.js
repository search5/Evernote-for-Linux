"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncActivity = exports.CancelActivityError = exports.CONTENT_SYNC_PROGRESS_TABLE = exports.BACKGROUND_SYNC_PROGRESS_TABLE = exports.INITIAL_DOWNSYNC_PROGRESS_TABLE = exports.SyncActivityType = exports.SyncActivityPriority = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
var SyncActivityPriority;
(function (SyncActivityPriority) {
    SyncActivityPriority[SyncActivityPriority["INITIAL_DOWNSYNC"] = 10] = "INITIAL_DOWNSYNC";
    SyncActivityPriority[SyncActivityPriority["IMMEDIATE"] = 5] = "IMMEDIATE";
    SyncActivityPriority[SyncActivityPriority["BACKGROUND"] = 0] = "BACKGROUND";
})(SyncActivityPriority = exports.SyncActivityPriority || (exports.SyncActivityPriority = {}));
var SyncActivityType;
(function (SyncActivityType) {
    SyncActivityType["FetchPrebuiltDatabaseActivity"] = "FetchPrebuiltDatabaseActivity";
    SyncActivityType["UserUpdateActivity"] = "UserUpdateActivity";
    SyncActivityType["BootstrapActivity"] = "BootstrapActivity";
    SyncActivityType["BetaFeatureSyncActivity"] = "BetaFeatureSyncActivity";
    SyncActivityType["MaestroSyncActivity"] = "MaestroSyncActivity";
    SyncActivityType["PromotionsSyncActivity"] = "PromotionsSyncActivity";
    SyncActivityType["MessagesSyncActivity"] = "MessagesSyncActivity";
    SyncActivityType["NotesFetchActivity"] = "NotesFetchActivity";
    SyncActivityType["BackgroundNoteSyncActivity"] = "BackgroundNoteSyncActivity";
    SyncActivityType["TrashedNoteMetadataFetchActivity"] = "TrashedNoteMetadataFetchActivity";
    SyncActivityType["NoteMetadataFetchActivity"] = "NoteMetadataFetchActivity";
    SyncActivityType["SnippetsFetchActivity"] = "SnippetsFetchActivity";
    SyncActivityType["ReindexActivity"] = "ReindexActivity";
    SyncActivityType["InitialDownsyncCompleteActivity"] = "InitialDownsyncCompleteActivity";
    SyncActivityType["CatchupSyncActivity"] = "CatchupSyncActivity";
    SyncActivityType["OfflineSearchIndexActivity"] = "OfflineSearchIndexActivity";
    SyncActivityType["ContentFetchSyncActivity"] = "ContentFetchSyncActivity";
    SyncActivityType["IncrementalSyncActivity"] = "IncrementalSyncActivity";
    SyncActivityType["SchemaMigrationActivity"] = "SchemaMigrationActivity";
    SyncActivityType["SchemaMigrationCompleteActivity"] = "SchemaMigrationCompleteActivity";
    SyncActivityType["NotesCountFetchActivity"] = "NotesCountFetchActivity";
    SyncActivityType["AccountSessionSyncActivity"] = "AccountSessionSyncActivity";
    SyncActivityType["NSyncInitActivity"] = "NSyncInitActivity";
    SyncActivityType["NSyncInitialDownsyncActivity"] = "NSyncInitialDownsyncActivity";
})(SyncActivityType = exports.SyncActivityType || (exports.SyncActivityType = {}));
exports.INITIAL_DOWNSYNC_PROGRESS_TABLE = 'InitialSyncProgress';
exports.BACKGROUND_SYNC_PROGRESS_TABLE = 'BackgroundSyncProgress';
exports.CONTENT_SYNC_PROGRESS_TABLE = 'ContentFetchSyncProgress';
class CancelActivityError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.CancelActivityError = CancelActivityError;
function cancel() {
    return new CancelActivityError('cancelled');
}
function abort() {
    return new conduit_utils_1.RetryError('aborted', 10);
}
class SyncActivity {
    constructor(baseDI, context, params, options) {
        this.baseDI = baseDI;
        this.context = context;
        this.params = params;
        this.options = options;
        this.onComplete = null;
        this.hasRun = false;
        this.isAborted = false;
        this.suppressionSleep = null;
        this.yieldCheck = null;
        this.curParams = null;
        this.setBucketSize = async (trc) => {
            if (this.options.syncProgressTableName) { // Params must be initialized in activity's constructor if you want to track progress
                await this.setProgress(trc, await this.getInitialProgressPercent(trc), true);
            }
        };
        this.setProgress = async (trc, percent, isInit = false) => {
            const tableName = this.options.syncProgressTableName;
            if (tableName) {
                const percentValue = tableName === exports.CONTENT_SYNC_PROGRESS_TABLE ?
                    0 :
                    percent >= 0 || percent <= 1 ? percent : 1;
                await this.context.syncEngine.transactEphemeral(trc, 'updateSyncProgress', async (tx) => {
                    const prevProgress = await tx.getValue(trc, null, tableName, this.progressBucketName);
                    const update = Object.assign(Object.assign({ startTime: 0, endTime: 0 }, prevProgress), { totalSize: this.progressBucketSize, percentComplete: percentValue });
                    if (!isInit && percent === 0) {
                        update.startTime = Date.now();
                    }
                    if (percent === 1) {
                        update.endTime = Date.now();
                    }
                    await tx.setValue(trc, tableName, this.progressBucketName, update);
                });
            }
        };
        this.completionPromise = new Promise(resolve => {
            this.onComplete = resolve;
        });
    }
    get progressBucketSize() { return 1000; }
    get progressBucketName() { return this.params.activityType; }
    async getInitialProgressPercent(trc) { return 0; }
    isRunning() {
        return this.hasRun && !this.isAborted && Boolean(this.onComplete);
    }
    isSuppressed() {
        return Boolean(this.suppressionSleep);
    }
    isActivityAborted() {
        return this.isAborted;
    }
    async abort(cancelActivity = false) {
        if (this.isAborted) {
            return;
        }
        this.isAborted = true;
        const err = cancelActivity ? cancel() : abort();
        if (this.suppressionSleep && this.yieldCheck && this.suppressionSleep.promise === this.yieldCheck) {
            this.suppressionSleep.cancel(err);
            this.suppressionSleep = null;
        }
        this.yieldCheck = Promise.reject(err);
        if (this.curParams) {
            this.curParams.yieldCheck = this.yieldCheck;
        }
        // this catch is stupid but without it the JS runtime will log an error about an unhandled promise rejection
        this.yieldCheck.catch(_ => undefined);
        await this.completionPromise;
    }
    suppress(suppressionTime) {
        if (this.isAborted || this.suppressionSleep) {
            return;
        }
        this.suppressionSleep = conduit_utils_1.cancellableSleep(suppressionTime);
        const sleepPromise = this.suppressionSleep.promise;
        this.yieldCheck = sleepPromise;
        if (this.curParams) {
            this.curParams.yieldCheck = this.yieldCheck;
        }
        sleepPromise.then(() => {
            this.suppressionSleep = null;
            if (this.yieldCheck === sleepPromise) {
                this.yieldCheck = null;
            }
            if (this.curParams && this.curParams.yieldCheck === sleepPromise) {
                this.curParams.yieldCheck = null;
            }
        }).catch(err => {
            // this is normal
            conduit_utils_1.logger.debug('SyncActivity suppression canceled', err);
        });
    }
    async runSync(trc) {
        if (this.hasRun) {
            throw new Error('runSync called more than once');
        }
        if (!this.onComplete) {
            throw new Error('onComplete is null');
        }
        this.hasRun = true;
        if (this.options.syncProgressTableName) {
            // this call is to set startTime
            await this.setProgress(trc, await this.getInitialProgressPercent(trc));
        }
        conduit_utils_1.traceTestCounts(trc, { [`SyncActivity.${this.params.activityType}`]: 1 });
        conduit_utils_1.traceEventStart(trc, this.params.activityType);
        const err = await conduit_utils_1.traceEventEndWhenSettled(trc, this.params.activityType, this.runSyncInternal(trc));
        this.curParams = null;
        if (this.onComplete) {
            this.onComplete(err || null);
            this.onComplete = null;
        }
        return err;
    }
    async runSyncInternal(trc) {
        try {
            await this.runSyncImpl(trc);
        }
        catch (err) {
            if (err instanceof conduit_utils_1.AuthError) {
                err = await this.baseDI.handleAuthError(trc, err);
            }
            return err;
        }
        return null;
    }
    initParams(user, subpath, chunkTimebox, subBucketSize, offset) {
        const auth = this.context.syncManager.getAuth();
        if (!auth) {
            throw new Error('Cannot downsync without auth');
        }
        let isVault = user !== 'personal';
        if (!auth.vaultAuth && user === 'best') {
            isVault = false;
        }
        if (isVault && !auth.vaultAuth) {
            throw new Error('Cannot sync for vault without vault auth');
        }
        const reportProgress = (trc, floor) => {
            // re mapping value if complex progress within activity
            const mappedProgress = subBucketSize ? (subBucketSize * floor + (offset || 0)) : floor;
            return this.setProgress(trc, mappedProgress);
        };
        const syncContext = isVault ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT;
        this.curParams = {
            thriftComm: this.context.thriftComm,
            syncEngine: this.context.syncEngine,
            auth: isVault ? auth.vaultAuth : auth,
            personalAuth: auth,
            isVault,
            syncContext,
            syncStatePath: subpath ? [syncContext, subpath] : null,
            personalUserID: this.context.syncEngine.userId,
            vaultUserID: this.context.syncEngine.vaultUserId,
            chunkTimebox,
            setProgress: reportProgress,
            yieldCheck: this.yieldCheck,
            localSettings: this.context.syncEngine.localSettings,
            offlineContentStrategy: this.context.syncEngine.offlineContentStrategy,
            offsetProgress: offset,
            subBucketProgressSize: subBucketSize,
        };
        return this.curParams;
    }
    dehydrate() {
        return {
            type: this.params.activityType,
            subpriority: this.params.subpriority,
            options: this.options,
        };
    }
}
exports.SyncActivity = SyncActivity;
//# sourceMappingURL=SyncActivity.js.map