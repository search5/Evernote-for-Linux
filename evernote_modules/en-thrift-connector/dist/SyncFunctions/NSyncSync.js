"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncNSync = void 0;
const conduit_utils_1 = require("conduit-utils");
const SyncHelpers_1 = require("./SyncHelpers");
async function syncNSync(trc, syncEventManager, params) {
    if (syncEventManager && syncEventManager.isEnabled()) {
        try {
            await SyncHelpers_1.interruptible(params, syncEventManager.resume());
            syncEventManager.setMessageConsumer(msg => {
                switch (msg.type) {
                    case 'Error': {
                        syncEventManager.clearMessageConsumer();
                        throw msg.error;
                    }
                }
            });
            syncEventManager.clearMessageConsumer();
        }
        finally {
            syncEventManager.pause().catch(conduit_utils_1.emptyFunc); // Pause should let nsync get updates but not immediately process (if we want that)
        }
    }
    params.setProgress && await params.setProgress(trc, 1);
}
exports.syncNSync = syncNSync;
//# sourceMappingURL=NSyncSync.js.map