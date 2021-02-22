"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementalSyncActivity = exports.IncrementalSyncBaseActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const Auth_1 = require("../Auth");
const LinkedNotebookSync_1 = require("../SyncFunctions/LinkedNotebookSync");
const MessageSync_1 = require("../SyncFunctions/MessageSync");
const NoteStoreSync_1 = require("../SyncFunctions/NoteStoreSync");
const NSyncSync_1 = require("../SyncFunctions/NSyncSync");
const SharedNoteSync_1 = require("../SyncFunctions/SharedNoteSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const CatchupSyncActivity_1 = require("./CatchupSyncActivity");
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
const CHUNK_TIMEBOX = 200;
const MESSAGE_SUBBUCKET_SIZE = 0.2; // for incremenatal progress
const NSYNC_SUBBUCKET_SIZE = 0.05; // for incremental progress
const NOTES_SUBBUCKET_SIZE = 0.35; // for incremental progress
const SHAREDNOTES_SUBUCKET_SIZE = 0.2; // for incremental progress
const SHAREDNOTEBOOKS_SUBUCKET_SIZE = 0.2; // for incremental progress
class IncrementalSyncBaseActivity extends SyncActivity_1.SyncActivity {
    constructor(ibaseDI, context, params, options) {
        super(ibaseDI, context, params, options);
        this.ibaseDI = ibaseDI;
    }
    async syncMessages(trc, subBucketSize, offset) {
        const syncParams = this.initParams('personal', 'messages', CHUNK_TIMEBOX, subBucketSize, offset);
        await MessageSync_1.syncMessages(trc, syncParams);
    }
    async syncNSync(trc, syncEventManager, subBucketSize, offset) {
        const syncParams = this.initParams('personal', 'nsync', CHUNK_TIMEBOX, subBucketSize, offset);
        await NSyncSync_1.syncNSync(trc, syncEventManager, syncParams);
    }
    async syncNotestore(trc, isVault, subBucketSize, offset) {
        const syncParams = this.initParams(isVault ? 'vault' : 'personal', 'notestore', CHUNK_TIMEBOX, subBucketSize, offset);
        const catchUpRefs = await NoteStoreSync_1.syncForward(trc, syncParams);
        if (catchUpRefs.length) {
            await this.context.syncManager.addActivity(trc, new CatchupSyncActivity_1.CatchupSyncActivity(this.ibaseDI, this.context, isVault, catchUpRefs, subBucketSize, offset));
        }
    }
    async syncSharedNotebook(trc, shareGuid) {
        const shareState = await this.context.syncEngine.graphStorage.getSyncState(trc, null, ['sharing', 'sharedNotebooks', shareGuid]);
        if (!shareState) {
            return;
        }
        const linkedNotebook = shareState.linkedNotebook;
        if (!linkedNotebook.guid || !shareState.authStr) {
            return;
        }
        const syncContext = LinkedNotebookSync_1.linkedNotebookSyncContext(linkedNotebook.guid);
        this.curParams = {
            thriftComm: this.context.thriftComm,
            syncEngine: this.context.syncEngine,
            auth: Auth_1.decodeAuthData(shareState.authStr),
            personalAuth: this.context.syncManager.getAuth(),
            isVault: false,
            syncContext,
            syncStatePath: [syncContext, 'notestore'],
            personalUserID: this.context.syncEngine.userId,
            vaultUserID: this.context.syncEngine.vaultUserId,
            chunkTimebox: CHUNK_TIMEBOX,
            yieldCheck: this.yieldCheck,
            localSettings: this.context.syncEngine.localSettings,
            offlineContentStrategy: this.context.syncEngine.offlineContentStrategy,
        };
        conduit_utils_1.logger.debug('syncSharedNotebook', shareGuid);
        const res = await conduit_utils_1.withError(LinkedNotebookSync_1.syncLinkedNotebook(trc, this.curParams, shareState, shareGuid));
        if (res.err) {
            if (res.err instanceof conduit_utils_1.AuthError) {
                res.err = await this.ibaseDI.handleAuthError(trc, res.err);
            }
        }
    }
    async syncSharedNote(trc, guid) {
        const shareState = await this.context.syncEngine.graphStorage.getSyncState(trc, null, ['sharing', 'sharedNotes', guid]);
        if (!shareState || !shareState.authStr) {
            return;
        }
        const syncContext = SharedNoteSync_1.sharedNoteSyncContext(guid);
        this.curParams = {
            thriftComm: this.context.thriftComm,
            syncEngine: this.context.syncEngine,
            auth: Auth_1.decodeAuthData(shareState.authStr),
            personalAuth: this.context.syncManager.getAuth(),
            isVault: false,
            syncContext,
            syncStatePath: [syncContext, 'notestore'],
            personalUserID: this.context.syncEngine.userId,
            vaultUserID: this.context.syncEngine.vaultUserId,
            chunkTimebox: CHUNK_TIMEBOX,
            yieldCheck: this.yieldCheck,
            localSettings: this.context.syncEngine.localSettings,
            offlineContentStrategy: this.context.syncEngine.offlineContentStrategy,
        };
        conduit_utils_1.logger.debug('syncSharedNote', guid);
        // Assuming current user is the owner if ownerId field is null by some reason
        const res = await conduit_utils_1.withError(SharedNoteSync_1.syncSharedNote(trc, this.curParams, shareState.noteStoreUrl, guid, shareState.ownerId || this.curParams.auth.userID));
        if (res.err) {
            if (res.err instanceof conduit_utils_1.AuthError) {
                res.err = await this.ibaseDI.handleAuthError(trc, res.err);
            }
            throw res.err;
        }
    }
}
exports.IncrementalSyncBaseActivity = IncrementalSyncBaseActivity;
class IncrementalSyncActivity extends IncrementalSyncBaseActivity {
    constructor(di, context, priority, subpriority = 0, timeout, withProgress) {
        super(di, context, {
            activityType: SyncActivity_1.SyncActivityType.IncrementalSyncActivity,
            priority,
            subpriority,
            // TODO use min of poll times in active sync contexts
            runAfter: Date.now() + (typeof timeout === 'number' ? timeout : (priority === SyncActivity_1.SyncActivityPriority.BACKGROUND ? 30000 : 0)),
        }, {
            priority,
            syncProgressTableName: withProgress ? SyncActivity_1.INITIAL_DOWNSYNC_PROGRESS_TABLE : null,
        });
        this.di = di;
        this.withProgress = withProgress;
    }
    get progressBucketSize() {
        return this.params.subpriority > 0 ? 5000 : 1000;
    }
    async runSyncImpl(trc) {
        try {
            // don't update syncProgressType if running during initial downsync.
            this.withProgress && this.params.subpriority === 0 && await SyncHelpers_1.updateSyncProgressType(trc, this.context.syncEngine, conduit_view_types_1.SyncProgressType.INCREMENTAL_SYNC);
            await this.runIncrementalSync(trc);
        }
        finally {
            this.withProgress && this.params.subpriority === 0 && await SyncHelpers_1.clearSyncProgress(trc, this.context.syncEngine);
        }
    }
    async runIncrementalSync(trc) {
        var _a, _b;
        const syncEngine = this.context.syncEngine;
        const auth = this.context.syncManager.getAuth();
        if (!auth) {
            throw new Error('Cannot downsync without auth');
        }
        // run incremental sync on all sync types
        // be carefull when changing order - make sure to setup right weights and offsets
        await this.yieldCheck;
        await this.syncMessages(trc, MESSAGE_SUBBUCKET_SIZE);
        await this.yieldCheck;
        await this.syncNSync(trc, this.di.syncEventManager(), NSYNC_SUBBUCKET_SIZE);
        const notesBucket = auth.vaultAuth ? NOTES_SUBBUCKET_SIZE / 2 : NOTES_SUBBUCKET_SIZE;
        await this.yieldCheck;
        await this.syncNotestore(trc, false, notesBucket, MESSAGE_SUBBUCKET_SIZE);
        if (auth.vaultAuth) {
            await this.yieldCheck;
            await this.syncNotestore(trc, true, notesBucket, MESSAGE_SUBBUCKET_SIZE);
        }
        await this.yieldCheck;
        const sharing = await syncEngine.graphStorage.getSyncState(trc, null, ['sharing']);
        const sharedNotebooks = (_a = sharing === null || sharing === void 0 ? void 0 : sharing.sharedNotebooks) !== null && _a !== void 0 ? _a : {};
        const sharedNotes = (_b = sharing === null || sharing === void 0 ? void 0 : sharing.sharedNotes) !== null && _b !== void 0 ? _b : {};
        for (const shareGuid in sharedNotebooks) {
            await this.yieldCheck;
            const res = await conduit_utils_1.withError(this.syncSharedNotebook(trc, shareGuid));
            if (res.err && !(res.err instanceof conduit_utils_1.RetryError)) {
                throw res.err;
            }
        }
        await this.setProgress(trc, MESSAGE_SUBBUCKET_SIZE + NOTES_SUBBUCKET_SIZE + SHAREDNOTEBOOKS_SUBUCKET_SIZE);
        for (const guidIter in sharedNotes) {
            await this.yieldCheck;
            const res = await conduit_utils_1.withError(this.syncSharedNote(trc, guidIter));
            if (res.err && !(res.err instanceof conduit_utils_1.RetryError)) {
                throw res.err;
            }
        }
        await this.setProgress(trc, MESSAGE_SUBBUCKET_SIZE + NOTES_SUBBUCKET_SIZE + SHAREDNOTEBOOKS_SUBUCKET_SIZE + SHAREDNOTES_SUBUCKET_SIZE);
        await this.context.syncEngine.graphStorage.transact(trc, 'updateSyncTime', async (tx) => {
            await tx.replaceSyncState(trc, ['lastSyncTime'], Date.now());
        });
    }
}
exports.IncrementalSyncActivity = IncrementalSyncActivity;
SyncActivityHydration_1.registerSyncActivityType(SyncActivity_1.SyncActivityType.IncrementalSyncActivity, (di, context, p, timeout) => {
    return new IncrementalSyncActivity(di, context, p.options.priority, p.subpriority, timeout);
});
//# sourceMappingURL=IncrementalSyncActivity.js.map