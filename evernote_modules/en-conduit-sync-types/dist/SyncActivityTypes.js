"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTENT_SYNC_PROGRESS_TABLE = exports.BACKGROUND_SYNC_PROGRESS_TABLE = exports.INITIAL_DOWNSYNC_PROGRESS_TABLE = exports.SyncActivityType = exports.SyncActivityPriority = void 0;
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
    SyncActivityType["VaultBootstrapActivity"] = "VaultBootstrapActivity";
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
    SyncActivityType["FeatureRolloutSyncActivity"] = "FeatureRolloutSyncActivity";
})(SyncActivityType = exports.SyncActivityType || (exports.SyncActivityType = {}));
exports.INITIAL_DOWNSYNC_PROGRESS_TABLE = 'InitialSyncProgress';
exports.BACKGROUND_SYNC_PROGRESS_TABLE = 'BackgroundSyncProgress';
exports.CONTENT_SYNC_PROGRESS_TABLE = 'ContentFetchSyncProgress';
//# sourceMappingURL=SyncActivityTypes.js.map