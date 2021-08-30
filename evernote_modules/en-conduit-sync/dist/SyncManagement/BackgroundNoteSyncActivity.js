"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundNoteSyncActivityHydrator = exports.BackgroundNoteSyncActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const NoteStoreSync_1 = require("../SyncFunctions/NoteStoreSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const ContentFetchSyncActivity_1 = require("./ContentFetchSyncActivity");
const ENSyncActivity_1 = require("./ENSyncActivity");
let gMaxTime = conduit_utils_1.registerDebugSetting('BackgroundNoteMaxTimePerPoll', 1000, v => gMaxTime = v);
let gChunkTimebox = conduit_utils_1.registerDebugSetting('BackgroundNoteChunkTimebox', 400, v => gChunkTimebox = v);
class BackgroundNoteSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.BackgroundNoteSyncActivity,
            priority: subpriority > 0 ? en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC : en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: en_conduit_sync_types_1.BACKGROUND_SYNC_PROGRESS_TABLE,
        });
        this.di = di;
    }
    async getInitialProgressPercent(trc) {
        const syncParams = this.initParams('best', SyncHelpers_1.NOTES_SYNC_STATE_PATH, gChunkTimebox);
        return await NoteStoreSync_1.currentBackgroundNoteSyncProgress(trc, syncParams);
    }
    async runSyncImpl(trc) {
        var _a, _b;
        const pollTime = (_a = this.di.backgroundNoteMetadataSyncConfig.pollingIntervalMilliseconds) !== null && _a !== void 0 ? _a : 5000;
        const downsyncMode = this.di.downsyncConfig.downsyncMode;
        const syncParams = this.initParams('best', SyncHelpers_1.NOTES_SYNC_STATE_PATH, gChunkTimebox);
        if (this.params.subpriority > 0 &&
            (downsyncMode === conduit_view_types_1.DownsyncMode.NO_METADATA_WITH_BACKGROUND_SYNC || downsyncMode === conduit_view_types_1.DownsyncMode.ADAPTIVE)) {
            // During initial downsync NotesFetchActivity already downsynced required number of notes.
            // throw RetryError to continue in background after initial downsync.
            this.params.subpriority = 0;
            // set progress appropriately otherwise it'll be 0 until background sync activity can run after initial downsync.
            await this.setProgress(trc, await NoteStoreSync_1.currentBackgroundNoteSyncProgress(trc, syncParams));
            throw new conduit_utils_1.RetryError('continue', pollTime);
        }
        const maxNotes = (_b = this.di.backgroundNoteMetadataSyncConfig.notesPerFetch) !== null && _b !== void 0 ? _b : 20;
        const res = await NoteStoreSync_1.syncBackgroundNotes(trc, syncParams, maxNotes, this.params.subpriority <= 0 ? gMaxTime : undefined);
        await SyncHelpers_1.updateInitialSnippetsToFetch(trc, syncParams, res.noteGuids);
        if (res.hasMore) {
            // keep going in the background
            this.params.subpriority = 0;
            this.options.syncProgressTableName = en_conduit_sync_types_1.BACKGROUND_SYNC_PROGRESS_TABLE;
            throw new conduit_utils_1.RetryError('continue', pollTime);
        }
        else {
            await this.setProgress(trc, 1);
            await this.kickoffBackgroundContentFetch(trc, syncParams);
        }
    }
    async kickoffBackgroundContentFetch(trc, syncParams) {
        // all notes synced. Start content fetch activity for any nbs marked for offline.
        if (syncParams.offlineContentStrategy !== conduit_view_types_1.OfflineContentStrategy.NONE) {
            await this.context.syncManager.addActivity(trc, new ContentFetchSyncActivity_1.ContentFetchSyncActivity(this.di, this.context, null));
        }
    }
}
exports.BackgroundNoteSyncActivity = BackgroundNoteSyncActivity;
function backgroundNoteSyncActivityHydrator(di, context, p, timeout) {
    return new BackgroundNoteSyncActivity(di, context, p.subpriority, timeout);
}
exports.backgroundNoteSyncActivityHydrator = backgroundNoteSyncActivityHydrator;
//# sourceMappingURL=BackgroundNoteSyncActivity.js.map