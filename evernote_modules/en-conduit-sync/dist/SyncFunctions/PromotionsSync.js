"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPromotions = exports.PROMOTIONS_SYNC_PERIOD = void 0;
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
exports.PROMOTIONS_SYNC_PERIOD = 5 * 60 * 1000;
async function syncPromotions(trc, params, promotionIDs) {
    if (!promotionIDs.length) {
        params.setProgress && await params.setProgress(trc, 1);
        return;
    }
    // Diff existing promotions against ID list in case more got added since last app run.
    const existingPromotionsRefs = await params.syncEngine.graphStorage.getGraphNodeRefsByType(trc, null, en_core_entity_types_1.CoreEntityTypes.Promotion);
    const existingPromotionsIDs = existingPromotionsRefs.map(ref => en_thrift_connector_1.convertGuidToService(ref.id, en_core_entity_types_1.CoreEntityTypes.Promotion));
    const newPromotionIDs = promotionIDs.filter(id => !existingPromotionsIDs.includes(id));
    if (newPromotionIDs.length) {
        // Fill in dummy promotion nodes, in case we are offline and the getPromotionStatus call fails.
        // Also set lastUpdateCount to 0 to make sure we actually call getPromotionStatus right away.
        const newLastUpdateCount = 0;
        const dummyPromotions = newPromotionIDs.map(promotionId => {
            return { promotionId };
        });
        await processUpdates(trc, params, dummyPromotions, newLastUpdateCount);
    }
    const utilityStore = params.comm.getUtilityStore(params.auth.urls.utilityUrl);
    const authToken = params.auth.token;
    const updateCount = Math.floor(Date.now() / exports.PROMOTIONS_SYNC_PERIOD);
    const syncAvailable = await SyncHelpers_1.checkIfSyncAvailable(trc, params, en_thrift_connector_1.EmptySyncState, updateCount);
    if (!syncAvailable) {
        params.setProgress && await params.setProgress(trc, 1);
        return;
    }
    await params.yieldCheck;
    params.setProgress && await params.setProgress(trc, 0.5);
    const promotions = await SyncHelpers_1.interruptible(params, utilityStore.getPromotionStatus(trc, authToken, promotionIDs));
    await params.yieldCheck;
    await processUpdates(trc, params, promotions, updateCount);
    params.setProgress && await params.setProgress(trc, 1);
}
exports.syncPromotions = syncPromotions;
async function processUpdates(trc, params, promotions, lastUpdateCount) {
    await params.syncEngine.transact(trc, 'processPromotionUpdates', async (graphTransaction) => {
        const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
        await ChunkConversion_1.processSyncUpdates(trc, converterParams, params.syncContext, en_thrift_connector_1.PromotionConverter, undefined, 0, promotions);
        const update = {
            lastUpdateCount,
        };
        if (params.syncStatePath) {
            await graphTransaction.updateSyncState(trc, params.syncStatePath, update);
        }
    });
}
//# sourceMappingURL=PromotionsSync.js.map