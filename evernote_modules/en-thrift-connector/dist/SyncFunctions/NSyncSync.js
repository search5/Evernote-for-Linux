"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncNSync = void 0;
async function syncNSync(trc, syncEventManager, params) {
    if (syncEventManager && syncEventManager.isEnabled()) {
        await syncEventManager.flush(trc, params);
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
    params.setProgress && await params.setProgress(trc, 1);
}
exports.syncNSync = syncNSync;
//# sourceMappingURL=NSyncSync.js.map