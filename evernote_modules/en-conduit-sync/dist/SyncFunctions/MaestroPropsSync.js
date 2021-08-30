"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMaestroProps = exports.MAESTRO_SYNC_PERIOD = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const ChunkConversion_1 = require("./ChunkConversion");
const SyncHelpers_1 = require("./SyncHelpers");
exports.MAESTRO_SYNC_PERIOD = 12 * conduit_utils_1.MILLIS_IN_ONE_HOUR;
function createMaestroUrl(prefix) {
    if ((!prefix.includes('https') && !prefix.includes('http://localhost')) || !prefix.includes('shard')) {
        throw new Error(`Incorrect webPrefixUrl: ${prefix}`);
    }
    return `${prefix}experiments`;
}
async function processUpdates(trc, params, maestroProps, lastUpdateCount) {
    await params.syncEngine.transact(trc, 'processMaestroUpdates', async (graphTransaction) => {
        const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
        await ChunkConversion_1.processSyncUpdates(trc, converterParams, params.syncContext, en_thrift_connector_1.MaestroPropsConverter, undefined, 0, [maestroProps]);
        const update = {
            lastUpdateCount,
        };
        if (params.syncStatePath) {
            await graphTransaction.updateSyncState(trc, params.syncStatePath, update);
        }
    });
}
async function syncMaestroProps(trc, params, clientType, platform, overridingArmIds) {
    const maestroService = params.comm.getMaestroService(createMaestroUrl(params.auth.urls.webApiUrlPrefix));
    const authToken = params.auth.token;
    const localSyncState = await SyncHelpers_1.getLocalSyncState(trc, params, en_thrift_connector_1.EmptySyncState);
    const currentTimeMillis = Date.now();
    const lastSyncTimeMillis = localSyncState.lastUpdateCount;
    const syncAvailable = (currentTimeMillis - lastSyncTimeMillis) > exports.MAESTRO_SYNC_PERIOD;
    if (!syncAvailable) {
        params.setProgress && await params.setProgress(trc, 1);
        return;
    }
    await params.yieldCheck;
    params.setProgress && await params.setProgress(trc, 0.5);
    const user = await params.syncEngine.graphStorage.getNode(trc, null, { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User });
    if (!user) {
        throw new conduit_utils_1.NoUserError('No current user');
    }
    const userInfo = en_thrift_connector_1.toUserClientInfo({
        clientType,
        platform,
        host: params.auth.thriftHost,
        user,
    });
    let maestroProps = { jsonResponse: null };
    let shouldRetry = false;
    try {
        maestroProps = await SyncHelpers_1.interruptible(params, maestroService.getProps2(trc, authToken, { clientType, overridingArmIds, userInfo }));
        await params.yieldCheck;
        await processUpdates(trc, params, maestroProps, currentTimeMillis);
    }
    catch (err) {
        if (err instanceof conduit_utils_1.RetryError) {
            shouldRetry = true;
        }
        handleGetProps2Error(err);
    }
    finally {
        if (!shouldRetry) {
            await params.yieldCheck;
            params.setProgress && await params.setProgress(trc, 1);
        }
    }
}
exports.syncMaestroProps = syncMaestroProps;
function handleGetProps2Error(err) {
    if (err instanceof conduit_utils_1.ServiceError) {
        switch (err.errorCode) {
            // maestro is disabled
            case en_conduit_sync_types_1.EDAMErrorCode.UNSUPPORTED_OPERATION:
                conduit_utils_1.logger.debug(`Error calling maestroService.getProps2`, err);
                break;
            // we expect UNKNOWN and INTERNAL_ERROR to be thrown occasionally.
            case en_conduit_sync_types_1.EDAMErrorCode.UNKNOWN:
            case en_conduit_sync_types_1.EDAMErrorCode.INTERNAL_ERROR:
                conduit_utils_1.logger.warn(`Error calling maestroService.getProps2`, err);
                break;
            default:
                throw err;
        }
    }
    else {
        throw err;
    }
}
//# sourceMappingURL=MaestroPropsSync.js.map