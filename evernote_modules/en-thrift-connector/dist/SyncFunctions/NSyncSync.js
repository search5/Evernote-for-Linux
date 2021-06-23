"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncNSync = void 0;
const conduit_utils_1 = require("conduit-utils");
async function syncNSync(trc, syncEventManager, params, forceWaitCompletion = false) {
    if (syncEventManager && syncEventManager.isEnabled()) {
        let waitForComplete = forceWaitCompletion; // if false - start looping only if 'Connection' message observed.
        do {
            await params.yieldCheck;
            await syncEventManager.flush(trc, params);
            syncEventManager.setMessageConsumer(msg => {
                switch (msg.type) {
                    case 'Error': {
                        waitForComplete = false;
                        syncEventManager.clearMessageConsumer();
                        throw msg.error || new Error('Error message from NSync is recieved');
                    }
                    case 'Complete': {
                        waitForComplete = false;
                        break;
                    }
                    case 'Connection': {
                        waitForComplete = true;
                        break;
                    }
                    default:
                        conduit_utils_1.absurd(msg.type, `Unhandled message type ${msg.type}.`);
                }
            });
            syncEventManager.clearMessageConsumer();
            if (waitForComplete) {
                await conduit_utils_1.sleep(250);
            }
        } while (waitForComplete);
    }
    params.setProgress && await params.setProgress(trc, 1);
}
exports.syncNSync = syncNSync;
//# sourceMappingURL=NSyncSync.js.map