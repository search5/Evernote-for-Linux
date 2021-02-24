"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncBetaFeature = exports.BETA_FEATURES_SYNC_PERIOD = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const BetaFeatureConverter_1 = require("../Converters/BetaFeatureConverter");
const Converters_1 = require("../Converters/Converters");
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
exports.BETA_FEATURES_SYNC_PERIOD = conduit_utils_1.MILLIS_IN_ONE_HOUR;
async function processUpdates(trc, params, betaFeatures, lastUpdateCount) {
    await params.syncEngine.transact(trc, 'processBetaFeaturesUpdates', async (graphTransaction) => {
        const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
        await ChunkConversion_1.processSyncUpdates(trc, converterParams, params.syncContext, BetaFeatureConverter_1.BetaFeatureConverter, undefined, 0, betaFeatures);
        const update = {
            lastUpdateCount,
        };
        if (params.syncStatePath) {
            await graphTransaction.updateSyncState(trc, params.syncStatePath, update);
        }
    });
}
async function syncBetaFeature(trc, params, betaFeaturesIDs) {
    if (!betaFeaturesIDs.length) {
        params.setProgress && await params.setProgress(trc, 1);
        return;
    }
    // Diff existing betaFeatures against ID list in case more got added since last app run.
    const existingBetaFeatureRefs = await params.syncEngine.graphStorage.getGraphNodeRefsByType(trc, null, en_data_model_1.CoreEntityTypes.BetaFeature);
    const existingBetaFeatureIDs = existingBetaFeatureRefs.map(ref => parseInt(Converters_1.convertGuidToService(ref.id, en_data_model_1.CoreEntityTypes.BetaFeature), 10));
    const newBetaFeatureIDs = betaFeaturesIDs.filter(id => !existingBetaFeatureIDs.includes(id));
    if (newBetaFeatureIDs.length) {
        // Fill in dummy betaFeature nodes, in case we are offline and the getBetaFeatureStatus call fails.
        // Also set lastUpdateCount to 0 to make sure we actually call getBetaFeatureStatus right away.
        const newLastUpdateCount = 0;
        const dummyBetaFeature = newBetaFeatureIDs.map(featureKey => {
            return { featureKey };
        });
        await processUpdates(trc, params, dummyBetaFeature, newLastUpdateCount);
    }
    const utilityStore = params.thriftComm.getUtilityStore(params.auth.urls.utilityUrl);
    const authToken = params.auth.token;
    const updateCount = Math.floor(Date.now() / exports.BETA_FEATURES_SYNC_PERIOD);
    const syncAvailable = await SyncHelpers_1.checkIfSyncAvailable(trc, params, SyncHelpers_1.EmptySyncState, updateCount);
    if (!syncAvailable) {
        params.setProgress && await params.setProgress(trc, 1);
        return;
    }
    await params.yieldCheck;
    params.setProgress && await params.setProgress(trc, 0.5);
    const betaFeatures = await SyncHelpers_1.interruptible(params, utilityStore.checkUserFeatures(trc, authToken, betaFeaturesIDs));
    await params.yieldCheck;
    await processUpdates(trc, params, betaFeatures, updateCount);
    params.setProgress && await params.setProgress(trc, 1);
}
exports.syncBetaFeature = syncBetaFeature;
//# sourceMappingURL=BetaFeatureSync.js.map