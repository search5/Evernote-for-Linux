"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchupSyncActivityHydrator = exports.CatchupSyncActivity = void 0;
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const NoteStoreSync_1 = require("../SyncFunctions/NoteStoreSync");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const ENSyncActivity_1 = require("./ENSyncActivity");
const CHUNK_TIMEBOX = 200;
class CatchupSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, isVault, subBucketSize, offset, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.CatchupSyncActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority: 0,
            runAfter: Date.now() + timeout,
        }, {
            isVault,
            syncProgressTableName: null,
            subBucketSize,
            offset,
        });
    }
    async runSyncImpl(trc) {
        const syncParams = this.initParams(this.options.isVault ? 'vault' : 'personal', null, CHUNK_TIMEBOX);
        const catchupRefs = await SyncHelpers_1.getCatchupSyncState(trc, syncParams);
        if (catchupRefs.guids.notebooks.length || catchupRefs.guids.workspaces.length) {
            await NoteStoreSync_1.syncCatchup(trc, syncParams);
        }
    }
}
exports.CatchupSyncActivity = CatchupSyncActivity;
function catchupSyncActivityHydrator(di, context, p, timeout) {
    return new CatchupSyncActivity(di, context, p.options.isVault, p.options.subBucketSize, p.options.offset, timeout);
}
exports.catchupSyncActivityHydrator = catchupSyncActivityHydrator;
//# sourceMappingURL=CatchupSyncActivity.js.map