"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchupSyncActivity = void 0;
const NoteStoreSync_1 = require("../SyncFunctions/NoteStoreSync");
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
const CHUNK_TIMEBOX = 200;
class CatchupSyncActivity extends SyncActivity_1.SyncActivity {
    constructor(di, context, isVault, catchupRefs, subBucketSize, offset, timeout = 0) {
        super(di, context, {
            activityType: SyncActivity_1.SyncActivityType.CatchupSyncActivity,
            priority: SyncActivity_1.SyncActivityPriority.BACKGROUND,
            subpriority: 0,
            runAfter: Date.now() + timeout,
        }, {
            isVault,
            syncProgressTableName: null,
            subBucketSize,
            offset,
        });
        this.catchupRefs = catchupRefs;
    }
    async runSyncImpl(trc) {
        const catchupRefsSyncParams = this.initParams(this.options.isVault ? 'vault' : 'personal', 'notestore', CHUNK_TIMEBOX, this.options.subBucketSize, this.options.offset);
        const catchUpRefs = this.catchupRefs.length ? this.catchupRefs : await NoteStoreSync_1.syncForward(trc, catchupRefsSyncParams);
        if (catchUpRefs.length) {
            const syncParams = this.initParams(this.options.isVault ? 'vault' : 'personal', null, CHUNK_TIMEBOX);
            await NoteStoreSync_1.syncCatchup(trc, syncParams, catchUpRefs);
        }
    }
}
exports.CatchupSyncActivity = CatchupSyncActivity;
SyncActivityHydration_1.registerSyncActivityType(SyncActivity_1.SyncActivityType.CatchupSyncActivity, (di, context, p, timeout) => {
    // Provide an empty array as catchupRefs to make the activity refresh target refs.
    // Hydration/Dehydration can be happened for CatchupSyncActivity when it throws an error during sync or aborted/canceled.
    return new CatchupSyncActivity(di, context, p.options.isVault, [], p.options.subBucketSize, p.options.offset, timeout);
});
//# sourceMappingURL=CatchupSyncActivity.js.map