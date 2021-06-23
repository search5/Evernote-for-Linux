"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.offlineSearchIndexActivityHydrator = exports.OfflineSearchIndexActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const ENSyncActivity_1 = require("./ENSyncActivity");
/**
 * Periodically runs offline search indexation.
 *
 * **WARNING**: the offline search WON'T work correctly in the case of multiple conduit instances
 * due to the offline search global variables (the same state will be shared accross all instances)
 */
class OfflineSearchIndexActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.OfflineSearchIndexActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: null,
        });
        this.di = di;
    }
    /**
     * Sets up plugin indexation hook.
     *
     * **WARNING**: the offline search WON'T work correctly in the case of multiple conduit instances
     * due to the offline search global variables (the same state will be shared accross all instances)
     * @param func indexation function ptr
     */
    static setupIndexation(func) {
        this.process = func;
    }
    /**
     * Runs offline search indexation
     * @param trc transaction context
     */
    async runSyncImpl(trc) {
        var _a, _b;
        if (OfflineSearchIndexActivity.process) {
            const params = this.initParams('best', null, 0);
            const gPollTime = (_a = this.di.offlineSearchIndexingConfig.pollingIntervalMilliseconds) !== null && _a !== void 0 ? _a : 6000;
            const gIdlePollTime = (_b = this.di.offlineSearchIndexingConfig.idlePollingIntervalMilliseconds) !== null && _b !== void 0 ? _b : 6000;
            if (await OfflineSearchIndexActivity.process(trc, this.di, params)) {
                conduit_utils_1.logger.debug(`OfflineSearchIndexActivity: More content to be indexed. Retrying after ${gPollTime}`);
                throw new conduit_utils_1.RetryError('continue', gPollTime);
            }
            else {
                conduit_utils_1.logger.debug(`OfflineSearchIndexActivity: All content indexed. Check again after ${gIdlePollTime}`);
                throw new conduit_utils_1.RetryError('continue', gIdlePollTime);
            }
        }
    }
}
exports.OfflineSearchIndexActivity = OfflineSearchIndexActivity;
function offlineSearchIndexActivityHydrator(di, context, p, timeout) {
    return new OfflineSearchIndexActivity(di, context, p.subpriority, timeout);
}
exports.offlineSearchIndexActivityHydrator = offlineSearchIndexActivityHydrator;
//# sourceMappingURL=OfflineSearchIndexActivity.js.map