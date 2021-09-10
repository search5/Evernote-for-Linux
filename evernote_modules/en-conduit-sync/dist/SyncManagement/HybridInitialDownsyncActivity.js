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
exports.addInitialDownsyncActivities = exports.nsyncInitialDownsyncActivityHydrator = exports.NSyncInitialDownsyncActivity = exports.schemaMigrationCompleteActivityHydrator = exports.notesFetchActivityHydrator = exports.NotesFetchActivity = exports.noteMetadataFetchActivityHydrator = exports.trashedNoteMetadataFetchActivityHydrator = exports.snippetsFetchActivityHydrator = exports.messagesSyncActivityHydrator = exports.promotionsSyncActivityHydrator = exports.PromotionsSyncActivity = exports.maestroSyncActivityHydrator = exports.MaestroSyncActivity = exports.betaFeatureSyncActivityHydrator = exports.BetaFeatureSyncActivity = exports.vaultBootstrapActivityHydrator = exports.bootstrapActivityHydrator = exports.notesCountFetchActivityHydrator = exports.NotesCountFetchActivity = exports.userUpdateActivityHydrator = exports.fetchPrebuiltDatabaseActivityHydrator = exports.initialDownsyncCompleteActivityHydrator = exports.FINAL_ACTIVITY_ORDER = exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_thrift_connector_1 = require("en-thrift-connector");
const Auth = __importStar(require("../Auth"));
const BetaFeatureSync_1 = require("../SyncFunctions/BetaFeatureSync");
const MaestroPropsSync_1 = require("../SyncFunctions/MaestroPropsSync");
const MessageSync_1 = require("../SyncFunctions/MessageSync");
const Migrations_1 = require("../SyncFunctions/Migrations");
const NoteStoreSync_1 = require("../SyncFunctions/NoteStoreSync");
const NSyncSync_1 = require("../SyncFunctions/NSyncSync");
const PromotionsSync_1 = require("../SyncFunctions/PromotionsSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const BackgroundNoteSyncActivity_1 = require("./BackgroundNoteSyncActivity");
const ContentFetchSyncActivity_1 = require("./ContentFetchSyncActivity");
const ENSyncActivity_1 = require("./ENSyncActivity");
const IncrementalSyncActivity_1 = require("./IncrementalSyncActivity");
const NSyncInitActivity_1 = require("./NSyncInitActivity");
const SchemaMigrationActivity_1 = require("./SchemaMigrationActivity");
exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX = 30000;
var FINAL_ACTIVITY_ORDER;
(function (FINAL_ACTIVITY_ORDER) {
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["SCHEMA_MIGRATION"] = 800] = "SCHEMA_MIGRATION";
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["REINDEX_ACTIVITY"] = 825] = "REINDEX_ACTIVITY";
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["NSYNC_INIT_ACTIVITY"] = 850] = "NSYNC_INIT_ACTIVITY";
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["INCREMENTAL_SYNC"] = 875] = "INCREMENTAL_SYNC";
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["NSYNC_ONLY_INCREMENTAL_SYNC"] = 900] = "NSYNC_ONLY_INCREMENTAL_SYNC";
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["INITIAL_DOWNSYNC_ACTIVITY"] = 950] = "INITIAL_DOWNSYNC_ACTIVITY";
    FINAL_ACTIVITY_ORDER[FINAL_ACTIVITY_ORDER["IMMEDIATE_ACTIVITY"] = 1200] = "IMMEDIATE_ACTIVITY";
})(FINAL_ACTIVITY_ORDER = exports.FINAL_ACTIVITY_ORDER || (exports.FINAL_ACTIVITY_ORDER = {}));
const DEFAULT_INITIAL_NOTES_TO_FETCH = 250;
const DEFAULT_LIMITED_DOWNSYNC_CEILING = 20000;
/*********************************************************/
class InitialDownsyncCompleteActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.InitialDownsyncCompleteActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now(),
        }, {
            syncProgressTableName: null,
        });
        this.di = di;
    }
    get progressBucketSize() { return 0; }
    async runSyncImpl(trc) {
        await SyncHelpers_1.clearSyncProgress(trc, this.context.syncEngine);
        this.di.emitEvent(conduit_view_types_1.ConduitEvent.BOOTSTRAP_SYNC_FINISHED);
    }
}
function initialDownsyncCompleteActivityHydrator(di, context, p) {
    return new InitialDownsyncCompleteActivity(di, context, p.subpriority);
}
exports.initialDownsyncCompleteActivityHydrator = initialDownsyncCompleteActivityHydrator;
/*********************************************************/
class FetchPrebuiltDatabaseActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.FetchPrebuiltDatabaseActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
        this.di = di;
        this.totalBytes = 1000; // gets updated during download
        this.lastPercent = 0;
    }
    get progressBucketSize() { return 5000; }
    updateProgress(trc, receivedBytes, totalBytes) {
        // in case we don't get a content-length header, just use a large guess of 30mb
        totalBytes = totalBytes || Math.max(30 * 1024 * 1024, receivedBytes + 1024);
        const percent = Math.floor(1000 * receivedBytes / totalBytes) / 1000;
        if (percent !== this.lastPercent || totalBytes !== this.totalBytes) {
            this.setProgress(trc, percent).catch(err => {
                conduit_utils_1.logger.warn('Failed to setProgress', err);
            });
            this.lastPercent = percent;
            this.totalBytes = totalBytes;
            conduit_utils_1.logger.debug('Prebuilt download progress', { receivedBytes, totalBytes, progress: (percent * 100).toFixed(2) });
        }
    }
    async runSyncImpl(trc) {
        var _a, _b;
        const auth = this.context.syncManager.getAuth();
        if (!auth || !this.di.fetchPrebuiltDatabase) {
            await this.setProgress(trc, 1);
            return;
        }
        const url = `${auth.urls.webApiUrlPrefix}cnbn/${conduit_core_1.SYNC_DB_VERSION}?cachebust=${Date.now()}`;
        const { data: downloadedFilename, err } = await conduit_utils_1.withError(this.di.fetchPrebuiltDatabase(trc, `auth="${auth.token}"`, url, (receivedBytes, totalBytes) => {
            this.updateProgress(trc, receivedBytes, totalBytes);
        }));
        if (!downloadedFilename) {
            // either it isn't available or there was an error; either way fall back to normal sync
            conduit_utils_1.logger.info('Prebuilt DB not available', err);
            conduit_utils_1.traceTestCounts(trc, { fetchPrebuiltDatabaseNotAvailable: 1 });
            await this.setProgress(trc, 1);
            return;
        }
        conduit_utils_1.logger.info('Got prebuilt DB', downloadedFilename);
        conduit_utils_1.traceTestCounts(trc, { fetchPrebuiltDatabase: 1 });
        const importRes = await conduit_utils_1.withError(this.di.importDatabase(trc, downloadedFilename));
        if (importRes.err) {
            // don't throw the error, just log it and fall back to normal sync
            conduit_utils_1.logger.error('Error trying to import prebuilt DB', importRes.err);
            if (importRes.err instanceof conduit_storage_1.CorruptDBError) {
                conduit_utils_1.recordEvent({
                    category: 'account',
                    action: en_data_model_1.NSyncEvents.CHUNK_EVENT,
                    label: 'corrupted-db',
                });
            }
            if (this.di.cleanupTempFile) {
                await this.di.cleanupTempFile(trc, downloadedFilename);
            }
            await this.setProgress(trc, 1);
            return;
        }
        // Let activites know if this DB has been loaded from a prebuilt database
        this.context.usedPrebuilt = true;
        this.di.emitEvent(conduit_view_types_1.ConduitEvent.PREBUILT_DB_LOADED);
        // reinstate syncProgressType value which gets overriden by importRemoteGraphDatabase.
        await SyncHelpers_1.updateSyncProgressType(trc, this.context.syncEngine, conduit_view_types_1.SyncProgressType.INITIAL_DOWNSYNC);
        conduit_utils_1.traceTestCounts(trc, { importRemoteGraphDatabase: 1 });
        // make sure to run any migration activites added since the prebuild DB was made
        const schemaMigrationActivity = new SchemaMigrationActivity_1.SchemaMigrationActivity(this.di, this.context, FINAL_ACTIVITY_ORDER.SCHEMA_MIGRATION);
        await this.context.syncManager.addActivity(trc, schemaMigrationActivity);
        // add activity to progress bucket.
        await schemaMigrationActivity.setBucketSize(trc);
        const syncEngine = this.context.syncEngine;
        if (this.di.getOfflineContentStrategy && this.di.getOfflineContentStrategy() !== conduit_view_types_1.OfflineContentStrategy.NONE) {
            const userID = (_b = (_a = this.context.syncManager.getAuth()) === null || _a === void 0 ? void 0 : _a.userID) !== null && _b !== void 0 ? _b : conduit_utils_1.NullUserID;
            // populate PendingOfflineNoteSyncStateEntry table
            await syncEngine.transact(trc, 'initPendingOfflineNoteSyncStates', async (tx) => {
                await en_thrift_connector_1.initPendingOfflineNoteSyncStates(trc, tx, this.di.getOfflineContentStrategy(), this.di.getLocalSettings(), userID);
            });
            // and kickoff content fetch in the background
            await this.context.syncManager.addActivity(trc, new ContentFetchSyncActivity_1.ContentFetchSyncActivity(this.di, this.context, null));
        }
        if (this.di.loadingScreenConfig.showDuringIncrementalSyncAfterPrebuilt) {
            const incremental = new IncrementalSyncActivity_1.IncrementalSyncActivity(this.di, this.context, en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC, FINAL_ACTIVITY_ORDER.INCREMENTAL_SYNC, undefined, true);
            await this.context.syncManager.addActivity(trc, incremental);
        }
        // remove hybrid-mode sync activities from the queue
        await this.context.syncManager.removeActivitiesByType(trc, [
            en_conduit_sync_types_1.SyncActivityType.SchemaMigrationCompleteActivity,
            en_conduit_sync_types_1.SyncActivityType.BootstrapActivity,
            en_conduit_sync_types_1.SyncActivityType.VaultBootstrapActivity,
            en_conduit_sync_types_1.SyncActivityType.NotesCountFetchActivity,
            en_conduit_sync_types_1.SyncActivityType.NotesFetchActivity,
            en_conduit_sync_types_1.SyncActivityType.BackgroundNoteSyncActivity,
            en_conduit_sync_types_1.SyncActivityType.TrashedNoteMetadataFetchActivity,
            en_conduit_sync_types_1.SyncActivityType.NoteMetadataFetchActivity,
            en_conduit_sync_types_1.SyncActivityType.SnippetsFetchActivity,
        ]);
        // Read the reindexing activity to run immediately after
        await this.context.syncManager.addReindexingActivity(trc, undefined, true);
        await this.setProgress(trc, 1);
    }
}
function fetchPrebuiltDatabaseActivityHydrator(di, context, p, timeout) {
    return new FetchPrebuiltDatabaseActivity(di, context, p.subpriority, timeout);
}
exports.fetchPrebuiltDatabaseActivityHydrator = fetchPrebuiltDatabaseActivityHydrator;
/*********************************************************/
class UserUpdateActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.UserUpdateActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: null,
        });
        this.di = di;
    }
    get progressBucketSize() { return 500; }
    async runSyncImpl(trc) {
        const syncEngine = this.context.syncEngine;
        const thriftComm = this.context.comm;
        // This activity will get created for 1 of 2 reasons:
        // 1. logged in and have an empty DB; the login process already added the user to the graph
        // 2. the DB was cleared for some other reason (DB version mismatch or mutation)
        // In case 1 we don't need to do anything, so check that first:
        if (await syncEngine.graphStorage.getNode(trc, null, { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User })) {
            return;
        }
        // For case 2, fetch user and vault user from the service and convert to graph nodes
        const auth = this.context.syncManager.getAuth();
        if (!auth) {
            throw new Error('Cannot downsync without auth');
        }
        const user = await Auth.getUser(trc, thriftComm, auth);
        const vaultUser = auth.vaultAuth ? await Auth.getUser(trc, thriftComm, auth.vaultAuth) : undefined;
        await syncEngine.transact(trc, 'initUser', async (tx) => {
            if (user) {
                await this.di.updateUser(trc, tx, user, false, auth);
            }
            if (vaultUser && auth.vaultAuth) {
                await this.di.updateUser(trc, tx, vaultUser, true, auth.vaultAuth);
            }
        });
    }
}
function userUpdateActivityHydrator(di, context, p, timeout) {
    return new UserUpdateActivity(di, context, p.subpriority, timeout);
}
exports.userUpdateActivityHydrator = userUpdateActivityHydrator;
/*********************************************************/
class NotesCountFetchActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.NotesCountFetchActivity,
            priority: subpriority > 0 ? en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC : en_conduit_sync_types_1.SyncActivityPriority.IMMEDIATE,
            subpriority,
            runAfter: Date.now(),
        }, {
            syncProgressTableName: null,
        });
        this.di = di;
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams('best', null, exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        const totalNotes = await NoteStoreSync_1.syncNoteCount(trc, syncParams);
        if (totalNotes) {
            // write adaptive downsync type to DB.
            const config = this.di.downsyncConfig;
            let downsyncType = conduit_view_types_1.AdaptiveDownsyncType.LIMITED_DOWNSYNC;
            if (totalNotes <= (config.initialNotesToFetch || DEFAULT_INITIAL_NOTES_TO_FETCH)) {
                downsyncType = conduit_view_types_1.AdaptiveDownsyncType.FULL_DOWNSYNC_SMALL_ACCOUNT;
            }
            else if (totalNotes > (config.limitedDownsyncNotesCeiling || DEFAULT_LIMITED_DOWNSYNC_CEILING)) {
                downsyncType = conduit_view_types_1.AdaptiveDownsyncType.FULL_DOWNSYNC_LARGE_ACCOUNT;
            }
            await SyncHelpers_1.updateSyncType(trc, this.context.syncEngine, { adaptiveDownsyncType: downsyncType });
        }
    }
}
exports.NotesCountFetchActivity = NotesCountFetchActivity;
function notesCountFetchActivityHydrator(di, context, p) {
    return new NotesCountFetchActivity(di, context, p.subpriority);
}
exports.notesCountFetchActivityHydrator = notesCountFetchActivityHydrator;
/*********************************************************/
class BootstrapActivity extends ENSyncActivity_1.ENSyncActivity {
    get progressBucketSize() { return 10000; }
    constructor(di, context, forVault, shouldBootstrapNotes, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: forVault ? en_conduit_sync_types_1.SyncActivityType.VaultBootstrapActivity : en_conduit_sync_types_1.SyncActivityType.BootstrapActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            forVault,
            shouldBootstrapNotes,
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams(this.options.forVault ? 'vault' : 'personal', 'notestore', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await NoteStoreSync_1.syncBootstrap(trc, syncParams, this.options.shouldBootstrapNotes, [syncParams.syncContext, SyncHelpers_1.NOTES_SYNC_STATE_PATH]);
    }
}
function bootstrapActivityHydrator(di, context, p, timeout) {
    return new BootstrapActivity(di, context, p.options.forVault, p.options.shouldBootstrapNotes, p.subpriority, timeout);
}
exports.bootstrapActivityHydrator = bootstrapActivityHydrator;
class VaultBootstrapActivity extends BootstrapActivity {
    constructor(di, context, shouldBootstrapNotes, subpriority = 0, timeout = 0) {
        super(di, context, true, shouldBootstrapNotes, subpriority, timeout);
    }
}
function vaultBootstrapActivityHydrator(di, context, p, timeout) {
    return new VaultBootstrapActivity(di, context, p.options.shouldBootstrapNotes, p.subpriority, timeout);
}
exports.vaultBootstrapActivityHydrator = vaultBootstrapActivityHydrator;
/*********************************************************/
class BetaFeatureSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.BetaFeatureSyncActivity,
            priority: subpriority ? en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC : en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: subpriority > 0 ? en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE : null,
        });
        this.di = di;
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams('personal', 'betaFeature', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await BetaFeatureSync_1.syncBetaFeature(trc, syncParams, this.di.getBetaFeatureIDs());
        this.params.subpriority = 0;
        this.options.syncProgressTableName = null;
        throw new conduit_utils_1.RetryError('continue', BetaFeatureSync_1.BETA_FEATURES_SYNC_PERIOD);
    }
}
exports.BetaFeatureSyncActivity = BetaFeatureSyncActivity;
function betaFeatureSyncActivityHydrator(di, context, p, timeout) {
    return new BetaFeatureSyncActivity(di, context, p.subpriority, timeout);
}
exports.betaFeatureSyncActivityHydrator = betaFeatureSyncActivityHydrator;
/*********************************************************/
class MaestroSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.MaestroSyncActivity,
            priority: subpriority ? en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC : en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: subpriority > 0 ? en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE : null,
        });
        this.di = di;
    }
    get progressBucketSize() { return 500; }
    async runSyncImpl(trc) {
        const syncParams = this.initParams('personal', 'maestro', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await MaestroPropsSync_1.syncMaestroProps(trc, syncParams, this.di.getMaestroClientType(), this.di.getMaestroPlatform());
        this.params.subpriority = 0;
        this.options.syncProgressTableName = null;
        // GRIN-1041 - mitigate 12-hour interval spikes in maestroProps traffic
        const MAESTRO_SYNC_JITTER_PERIOD = 4 * conduit_utils_1.MILLIS_IN_ONE_HOUR;
        const jitter = Math.random() * MAESTRO_SYNC_JITTER_PERIOD;
        throw new conduit_utils_1.RetryError('continue', MaestroPropsSync_1.MAESTRO_SYNC_PERIOD + jitter);
    }
}
exports.MaestroSyncActivity = MaestroSyncActivity;
function maestroSyncActivityHydrator(di, context, p, timeout) {
    return new MaestroSyncActivity(di, context, p.subpriority, timeout);
}
exports.maestroSyncActivityHydrator = maestroSyncActivityHydrator;
/*********************************************************/
class PromotionsSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.PromotionsSyncActivity,
            priority: subpriority ? en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC : en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: subpriority > 0 ? en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE : null,
        });
        this.di = di;
    }
    get progressBucketSize() { return 500; }
    async runSyncImpl(trc) {
        const syncParams = this.initParams('personal', 'promotions', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await PromotionsSync_1.syncPromotions(trc, syncParams, this.di.getPromotionIDs());
        this.params.subpriority = 0;
        this.options.syncProgressTableName = null;
        throw new conduit_utils_1.RetryError('continue', PromotionsSync_1.PROMOTIONS_SYNC_PERIOD);
    }
}
exports.PromotionsSyncActivity = PromotionsSyncActivity;
function promotionsSyncActivityHydrator(di, context, p, timeout) {
    return new PromotionsSyncActivity(di, context, p.subpriority, timeout);
}
exports.promotionsSyncActivityHydrator = promotionsSyncActivityHydrator;
/*********************************************************/
class MessagesSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.MessagesSyncActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams('personal', 'messages', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await MessageSync_1.syncMessages(trc, syncParams);
    }
}
function messagesSyncActivityHydrator(di, context, p, timeout) {
    return new MessagesSyncActivity(di, context, p.subpriority, timeout);
}
exports.messagesSyncActivityHydrator = messagesSyncActivityHydrator;
/*********************************************************/
class SnippetsFetchActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.SnippetsFetchActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams('best', 'notestore', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        try {
            await NoteStoreSync_1.syncCurrentNoteSnippets(trc, syncParams);
        }
        catch (err) {
            // ignore snippet fetch errors during initial downsync
            conduit_utils_1.logger.warn('Failed to fetch snippets ', err);
        }
    }
}
function snippetsFetchActivityHydrator(di, context, p, timeout) {
    return new SnippetsFetchActivity(di, context, p.subpriority, timeout);
}
exports.snippetsFetchActivityHydrator = snippetsFetchActivityHydrator;
/*********************************************************/
class TrashedNoteMetadataFetchActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, forVault, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.TrashedNoteMetadataFetchActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            forVault,
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams(this.options.forVault ? 'vault' : 'personal', 'trashedNotesMetadata', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        await NoteStoreSync_1.syncAllNotesMetadata(trc, syncParams, true);
    }
}
function trashedNoteMetadataFetchActivityHydrator(di, context, p, timeout) {
    return new TrashedNoteMetadataFetchActivity(di, context, p.options.forVault, p.subpriority, timeout);
}
exports.trashedNoteMetadataFetchActivityHydrator = trashedNoteMetadataFetchActivityHydrator;
/*********************************************************/
class NoteMetadataFetchActivity extends ENSyncActivity_1.ENSyncActivity {
    get progressBucketSize() { return 10000; }
    constructor(di, context, forVault, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.NoteMetadataFetchActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            forVault,
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams(this.options.forVault ? 'vault' : 'personal', 'notesMetadata', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        const syncStartTime = Date.now();
        await NoteStoreSync_1.syncAllNotesMetadata(trc, syncParams, false);
        await this.context.syncEngine.graphStorage.transact(trc, 'updateSyncTime', async (tx) => {
            await tx.replaceSyncState(trc, ['lastSyncTime'], Date.now());
            await tx.replaceSyncState(trc, ['lastDownsyncStartTime'], syncStartTime);
        });
    }
}
function noteMetadataFetchActivityHydrator(di, context, p, timeout) {
    return new NoteMetadataFetchActivity(di, context, p.options.forVault, p.subpriority, timeout);
}
exports.noteMetadataFetchActivityHydrator = noteMetadataFetchActivityHydrator;
class NotesFetchActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, immediateSyncArgs, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.NotesFetchActivity,
            priority: subpriority > 0 ? en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC : en_conduit_sync_types_1.SyncActivityPriority.IMMEDIATE,
            subpriority,
            runAfter: Date.now() + timeout,
            dontPersist: Boolean(immediateSyncArgs),
        }, {
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
            immediateSyncArgs,
        });
        this.di = di;
    }
    get progressBucketSize() { return 10000; }
    async runSyncImpl(trc) {
        var _a, _b, _c;
        const isImmediateNoteSync = Boolean(this.options.immediateSyncArgs);
        isImmediateNoteSync && await SyncHelpers_1.updateSyncProgressType(trc, this.context.syncEngine, conduit_view_types_1.SyncProgressType.IMMEDIATE_NOTE_SYNC);
        // use same sync state as backgroundNoteSyncActivity so that background sync can continue where this left off.
        const syncParams = this.initParams('best', SyncHelpers_1.NOTES_SYNC_STATE_PATH, exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX);
        let totalNotesToFetch;
        let maxNotesPerFetch;
        let reportProgressType = NoteStoreSync_1.NotesSyncProgressType.USN;
        if (this.options.immediateSyncArgs) {
            await this.setProgress(trc, 0);
            const { maxNotes, maxTime, notesPerFetch } = this.options.immediateSyncArgs;
            maxNotesPerFetch = notesPerFetch || 250;
            if (maxNotes) {
                totalNotesToFetch = maxNotes;
                reportProgressType = NoteStoreSync_1.NotesSyncProgressType.NOTES_COUNT;
            }
            else {
                // if max notes is not specified, try to fetch as many notes as possible for immediateNotesDownsync.
                totalNotesToFetch = Infinity;
                if (maxTime) {
                    reportProgressType = NoteStoreSync_1.NotesSyncProgressType.TIME_ELAPSED;
                }
            }
        }
        else {
            reportProgressType = NoteStoreSync_1.NotesSyncProgressType.NOTES_COUNT;
            totalNotesToFetch = (_a = this.di.downsyncConfig.initialNotesToFetch) !== null && _a !== void 0 ? _a : DEFAULT_INITIAL_NOTES_TO_FETCH;
            maxNotesPerFetch = (_b = this.di.downsyncConfig.notesPerFetch) !== null && _b !== void 0 ? _b : 250;
            if (this.di.downsyncConfig.downsyncMode === conduit_view_types_1.DownsyncMode.ADAPTIVE) {
                // for adaptive downsync, if total notes in account is greater than limitedDownsyncNotesCeiling,
                // we revert to a full downsync. Otherwise stick to initialNotesToFetch config.
                const notesInAccount = await NoteStoreSync_1.getTotalNotesInAccount(trc, syncParams);
                totalNotesToFetch = notesInAccount > (this.di.downsyncConfig.limitedDownsyncNotesCeiling || DEFAULT_LIMITED_DOWNSYNC_CEILING) ? notesInAccount : totalNotesToFetch;
            }
        }
        try {
            conduit_utils_1.logger.debug(`NotesFetchActivity fetching ${totalNotesToFetch} notes with ${maxNotesPerFetch} per fetch`);
            const res = await NoteStoreSync_1.syncNotesReverse(trc, syncParams, totalNotesToFetch, maxNotesPerFetch, reportProgressType, (_c = this.options.immediateSyncArgs) === null || _c === void 0 ? void 0 : _c.maxTime);
            // only need to update snippets to fetch for initial downsync
            !isImmediateNoteSync && await SyncHelpers_1.updateInitialSnippetsToFetch(trc, syncParams, res.noteGuids);
        }
        finally {
            if (this.options.immediateSyncArgs) {
                // for immediateNoteSync always reset progress at the end.
                await SyncHelpers_1.clearSyncProgress(trc, this.context.syncEngine);
            }
        }
    }
}
exports.NotesFetchActivity = NotesFetchActivity;
function notesFetchActivityHydrator(di, context, p, timeout) {
    return new NotesFetchActivity(di, context, p.options.immediateSyncArgs, p.subpriority, timeout);
}
exports.notesFetchActivityHydrator = notesFetchActivityHydrator;
/*********************************************************/
class SchemaMigrationCompleteActivity extends ENSyncActivity_1.ENSyncActivity {
    get progressBucketSize() { return 2500; }
    constructor(di, context, subpriority = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.SchemaMigrationCompleteActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now(),
        }, {
            syncProgressTableName: null,
        });
    }
    async runSyncImpl(trc) {
        const pendingSchemaMigrations = Migrations_1.getAllMigrations();
        // if any migration scripts  detected
        if (!pendingSchemaMigrations.length) {
            return;
        }
        const now = Date.now();
        const migrationMap = pendingSchemaMigrations.reduce((h, m) => {
            h[m] = now;
            return h;
        }, {});
        // populate table to make sure we dont run migration on full sync
        await this.context.syncEngine.transact(trc, 'initialDownsyncMigration', async (tx) => {
            await tx.replaceSyncState(trc, ['schemaMigrations'], migrationMap);
        });
    }
}
function schemaMigrationCompleteActivityHydrator(di, context, p) {
    return new SchemaMigrationCompleteActivity(di, context, p.subpriority);
}
exports.schemaMigrationCompleteActivityHydrator = schemaMigrationCompleteActivityHydrator;
/*********************************************************/
class NSyncInitialDownsyncActivity extends ENSyncActivity_1.ENSyncActivity {
    get progressBucketSize() { return 500; }
    constructor(di, context, subpriority = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.NSyncInitialDownsyncActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now(),
        }, {
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    async runSyncImpl(trc) {
        const syncEventManager = this.context.syncEventManager;
        // Possible that nsync not enabled. early out on null manager
        if (!syncEventManager) {
            return;
        }
        const syncParams = this.initParams('personal', 'initialDownsync', exports.INITIAL_DOWNSYNC_CHUNK_TIMEBOX); // TODO: move syncParams into downsync and make progress granular
        await NSyncSync_1.syncNSync(trc, syncEventManager, syncParams, true);
    }
}
exports.NSyncInitialDownsyncActivity = NSyncInitialDownsyncActivity;
function nsyncInitialDownsyncActivityHydrator(di, context, p, timeout) {
    return new NSyncInitialDownsyncActivity(di, context, p.subpriority);
}
exports.nsyncInitialDownsyncActivityHydrator = nsyncInitialDownsyncActivityHydrator;
/*********************************************************/
async function addInitialDownsyncActivities(trc, di, context, tx) {
    const auth = context.syncManager.getAuth();
    if (!auth) {
        throw new Error('Cannot downsync without auth');
    }
    function isDownsyncMode(...modes) {
        return modes.includes(di.downsyncConfig.downsyncMode);
    }
    const hasVault = Boolean(auth.vaultAuth);
    let order = 1;
    await SyncHelpers_1.updateSyncProgressType(trc, context.syncEngine, conduit_view_types_1.SyncProgressType.INITIAL_DOWNSYNC, tx);
    if (!isDownsyncMode(conduit_view_types_1.DownsyncMode.LEGACY_FOR_PREBUILT) && di.fetchPrebuiltDatabase) {
        await context.syncManager.addActivity(trc, new FetchPrebuiltDatabaseActivity(di, context, order++), tx);
    }
    await context.syncManager.addActivity(trc, new SchemaMigrationCompleteActivity(di, context, order++), tx);
    await context.syncManager.addActivity(trc, new UserUpdateActivity(di, context, order++), tx);
    if (isDownsyncMode(conduit_view_types_1.DownsyncMode.ADAPTIVE)) {
        await context.syncManager.addActivity(trc, new NotesCountFetchActivity(di, context, order++), tx);
    }
    const shouldBootstrapNotes = isDownsyncMode(conduit_view_types_1.DownsyncMode.LEGACY, conduit_view_types_1.DownsyncMode.LEGACY_FOR_PREBUILT);
    if (hasVault) {
        await context.syncManager.addActivity(trc, new VaultBootstrapActivity(di, context, shouldBootstrapNotes, order++), tx);
    }
    await context.syncManager.addActivity(trc, new BootstrapActivity(di, context, false, shouldBootstrapNotes, order++), tx);
    await context.syncManager.addActivity(trc, new NSyncInitActivity_1.NSyncInitActivity(di, context, en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC, order++), tx);
    await context.syncManager.addActivity(trc, new NSyncInitialDownsyncActivity(di, context, order++), tx);
    if (!isDownsyncMode(conduit_view_types_1.DownsyncMode.LEGACY_FOR_PREBUILT)) {
        await context.syncManager.addActivity(trc, new BetaFeatureSyncActivity(di, context, order++), tx);
        await context.syncManager.addActivity(trc, new MaestroSyncActivity(di, context, order++), tx);
        await context.syncManager.addActivity(trc, new PromotionsSyncActivity(di, context, order++), tx);
    }
    await context.syncManager.addActivity(trc, new MessagesSyncActivity(di, context, order++), tx);
    if (isDownsyncMode(conduit_view_types_1.DownsyncMode.NO_METADATA_WITH_BACKGROUND_SYNC, conduit_view_types_1.DownsyncMode.NO_METADATA_NO_BACKGROUND_SYNC, conduit_view_types_1.DownsyncMode.ADAPTIVE)) {
        await context.syncManager.addActivity(trc, new NotesFetchActivity(di, context, null, order++), tx);
    }
    if (isDownsyncMode(conduit_view_types_1.DownsyncMode.HYBRID, conduit_view_types_1.DownsyncMode.NO_METADATA_WITH_BACKGROUND_SYNC, conduit_view_types_1.DownsyncMode.ADAPTIVE)) {
        await context.syncManager.addActivity(trc, new BackgroundNoteSyncActivity_1.BackgroundNoteSyncActivity(di, context, order++), tx);
    }
    if (isDownsyncMode(conduit_view_types_1.DownsyncMode.HYBRID)) {
        await context.syncManager.addActivity(trc, new TrashedNoteMetadataFetchActivity(di, context, hasVault, order++), tx);
        await context.syncManager.addActivity(trc, new NoteMetadataFetchActivity(di, context, hasVault, order++), tx);
    }
    await context.syncManager.addActivity(trc, new SnippetsFetchActivity(di, context, order++), tx);
    // TODO: [CON-2401] Enable once we want this as a background activity
    // await context.syncManager.addActivity(trc, new DemandFetchNoteActivity(di, context, null, order++), tx);
    // make sure these activities are always last, even if new ones get inserted
    await context.syncManager.addReindexingActivity(trc, tx);
    await context.syncManager.addActivity(trc, new InitialDownsyncCompleteActivity(di, context, FINAL_ACTIVITY_ORDER.INITIAL_DOWNSYNC_ACTIVITY), tx);
}
exports.addInitialDownsyncActivities = addInitialDownsyncActivities;
//# sourceMappingURL=HybridInitialDownsyncActivity.js.map