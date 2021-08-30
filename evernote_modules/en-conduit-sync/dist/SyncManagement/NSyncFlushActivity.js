"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nsyncFlushActivityHydrator = exports.NSyncFlushActivity = void 0;
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const NSyncSync_1 = require("../SyncFunctions/NSyncSync");
const ENSyncActivity_1 = require("./ENSyncActivity");
const CHUNK_TIMEBOX = 200;
class NSyncFlushActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, priority) {
        super(di, context, {
            priority,
            activityType: en_conduit_sync_types_1.SyncActivityType.FlushNSyncActivity,
            runAfter: Date.now(),
            subpriority: 0,
        }, {
            syncProgressTableName: null,
        });
        this.runSyncImpl = async (trc) => {
            const syncParams = this.initParams('personal', 'nsync', CHUNK_TIMEBOX);
            await NSyncSync_1.syncNSync(trc, this.context.syncEventManager, syncParams);
        };
    }
}
exports.NSyncFlushActivity = NSyncFlushActivity;
function nsyncFlushActivityHydrator(di, context, p, timeout) {
    return new NSyncFlushActivity(di, context, en_conduit_sync_types_1.SyncActivityPriority.IMMEDIATE);
}
exports.nsyncFlushActivityHydrator = nsyncFlushActivityHydrator;
//# sourceMappingURL=NSyncFlushActivity.js.map