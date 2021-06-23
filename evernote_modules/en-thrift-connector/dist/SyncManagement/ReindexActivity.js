"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reindexActivityHydrator = exports.ReindexActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const ENSyncActivity_1 = require("./ENSyncActivity");
class ReindexActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.ReindexActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: en_conduit_sync_types_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    get progressBucketSize() { return 20000; }
    async runSyncImpl(trc) {
        const params = this.initParams('best', null, 0);
        await SyncHelpers_1.updateSyncProgressType(trc, this.context.syncEngine, conduit_view_types_1.SyncProgressType.REINDEXING);
        const count = await this.context.syncEngine.configureIndexes(trc, params.setProgress);
        if (count) {
            conduit_utils_1.logger.debug(`Rebuilt ${count} indexes`);
        }
        await SyncHelpers_1.updateSyncProgressType(trc, this.context.syncEngine, conduit_view_types_1.SyncProgressType.NONE);
    }
}
exports.ReindexActivity = ReindexActivity;
function reindexActivityHydrator(di, context, p, timeout) {
    return new ReindexActivity(di, context, p.subpriority, timeout);
}
exports.reindexActivityHydrator = reindexActivityHydrator;
//# sourceMappingURL=ReindexActivity.js.map