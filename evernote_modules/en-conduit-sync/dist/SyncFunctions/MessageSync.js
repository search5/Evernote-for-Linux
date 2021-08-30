"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMessages = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
async function syncMessages(trc, params) {
    var _a;
    const messageStore = params.comm.getMessageStore(params.auth.urls.messageStoreUrl);
    const authToken = params.auth.token;
    let floor = 0;
    let loopCount = 1;
    while (true) {
        let progress = 1 - (1 / loopCount);
        progress = floor > progress ? floor : progress;
        await params.yieldCheck;
        const localSyncState = await SyncHelpers_1.getLocalSyncState(trc, params, en_thrift_connector_1.EmptySyncState);
        const syncTime = Date.now();
        floor = progress + (1 - progress) * 0.15;
        params.setProgress && await params.setProgress(trc, floor);
        const chunk = await SyncHelpers_1.interruptible(params, messageStore.getMessageSyncChunk(trc, authToken, { afterEventId: localSyncState.lastUpdateCount }));
        floor = progress + (1 - progress) * 0.3;
        params.setProgress && await params.setProgress(trc, floor);
        const syncAvailable = await SyncHelpers_1.checkIfSyncAvailable(trc, params, en_thrift_connector_1.EmptySyncState, chunk.chunkMaxEventId);
        loopCount++;
        if (!syncAvailable) {
            params.setProgress && await params.setProgress(trc, 1);
            return;
        }
        try {
            await ChunkConversion_1.convertMessageSyncChunk(trc, params, chunk, syncTime);
        }
        catch (e) {
            // Processing missing participants check here because `convertFromService` cannot access to thrift calls.
            if (e instanceof conduit_utils_1.NotFoundError) {
                const idsUpdates = chunk.identities || [];
                const threads = await SyncHelpers_1.interruptible(params, messageStore.getThreads(trc, params.auth.token));
                const idsToAdd = ((_a = threads.identities) !== null && _a !== void 0 ? _a : []).filter(idn => idsUpdates.every(i => i.id !== idn.id));
                chunk.identities = idsUpdates.concat(idsToAdd);
                await ChunkConversion_1.convertMessageSyncChunk(trc, params, chunk, syncTime);
            }
            else {
                throw e;
            }
        }
        floor = progress + (1 - progress) * 0.45;
        params.setProgress && await params.setProgress(trc, floor);
    }
}
exports.syncMessages = syncMessages;
//# sourceMappingURL=MessageSync.js.map