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
exports.validateHydrators = exports.hydrateActivity = void 0;
const AccountSessionSyncActivity_1 = require("./AccountSessionSyncActivity");
const BackgroundNoteSyncActivity_1 = require("./BackgroundNoteSyncActivity");
const CatchupSyncActivity_1 = require("./CatchupSyncActivity");
const ContentFetchSyncActivity_1 = require("./ContentFetchSyncActivity");
const HybridDownsync = __importStar(require("./HybridInitialDownsyncActivity"));
const IncrementalSyncActivity_1 = require("./IncrementalSyncActivity");
const NSyncInitActivity_1 = require("./NSyncInitActivity");
const OfflineSearchIndexActivity_1 = require("./OfflineSearchIndexActivity");
const ReindexActivity_1 = require("./ReindexActivity");
const SchemaMigrationActivity_1 = require("./SchemaMigrationActivity");
const SyncActivity_1 = require("./SyncActivity");
const gSyncActivityHydrators = {
    [SyncActivity_1.SyncActivityType.FetchPrebuiltDatabaseActivity]: HybridDownsync.fetchPrebuiltDatabaseActivityHydrator,
    [SyncActivity_1.SyncActivityType.UserUpdateActivity]: HybridDownsync.userUpdateActivityHydrator,
    [SyncActivity_1.SyncActivityType.BootstrapActivity]: HybridDownsync.bootstrapActivityHydrator,
    [SyncActivity_1.SyncActivityType.VaultBootstrapActivity]: HybridDownsync.vaultBootstrapActivityHydrator,
    [SyncActivity_1.SyncActivityType.BetaFeatureSyncActivity]: HybridDownsync.betaFeatureSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.MaestroSyncActivity]: HybridDownsync.maestroSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.PromotionsSyncActivity]: HybridDownsync.promotionsSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.MessagesSyncActivity]: HybridDownsync.messagesSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.NotesFetchActivity]: HybridDownsync.notesFetchActivityHydrator,
    [SyncActivity_1.SyncActivityType.BackgroundNoteSyncActivity]: BackgroundNoteSyncActivity_1.backgroundNoteSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.TrashedNoteMetadataFetchActivity]: HybridDownsync.trashedNoteMetadataFetchActivityHydrator,
    [SyncActivity_1.SyncActivityType.NoteMetadataFetchActivity]: HybridDownsync.noteMetadataFetchActivityHydrator,
    [SyncActivity_1.SyncActivityType.SnippetsFetchActivity]: HybridDownsync.snippetsFetchActivityHydrator,
    [SyncActivity_1.SyncActivityType.ReindexActivity]: ReindexActivity_1.reindexActivityHydrator,
    [SyncActivity_1.SyncActivityType.InitialDownsyncCompleteActivity]: HybridDownsync.initialDownsyncCompleteActivityHydrator,
    [SyncActivity_1.SyncActivityType.CatchupSyncActivity]: CatchupSyncActivity_1.catchupSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.OfflineSearchIndexActivity]: OfflineSearchIndexActivity_1.offlineSearchIndexActivityHydrator,
    [SyncActivity_1.SyncActivityType.ContentFetchSyncActivity]: ContentFetchSyncActivity_1.contentFetchSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.IncrementalSyncActivity]: IncrementalSyncActivity_1.incrementalSyncActivityHydrator,
    [SyncActivity_1.SyncActivityType.SchemaMigrationActivity]: SchemaMigrationActivity_1.schemaMigrationActivityHydrator,
    [SyncActivity_1.SyncActivityType.SchemaMigrationCompleteActivity]: HybridDownsync.schemaMigrationCompleteActivityHydrator,
    [SyncActivity_1.SyncActivityType.NotesCountFetchActivity]: HybridDownsync.notesCountFetchActivityHydrator,
    [SyncActivity_1.SyncActivityType.AccountSessionSyncActivity]: AccountSessionSyncActivity_1.accountSessionActivityHydrator,
    [SyncActivity_1.SyncActivityType.NSyncInitActivity]: NSyncInitActivity_1.nsyncInitActivityHydrator,
    [SyncActivity_1.SyncActivityType.NSyncInitialDownsyncActivity]: HybridDownsync.nsyncInitialDownsyncActivityHydrator,
};
function hydrateActivity(di, context, p, timeout) {
    const hydrator = gSyncActivityHydrators[p.type];
    if (!hydrator) {
        throw new Error(`No hydrator found for SyncActivity type ${p.type}`);
    }
    return hydrator(di, context, p, timeout);
}
exports.hydrateActivity = hydrateActivity;
function validateHydrators() {
    for (const type of Object.values(SyncActivity_1.SyncActivityType)) {
        if (!gSyncActivityHydrators[type]) {
            throw new Error(`No hydrator found for SyncActivity type ${type}`);
        }
    }
}
exports.validateHydrators = validateHydrators;
//# sourceMappingURL=SyncActivityHydration.js.map