"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureRolloutActivityHydrator = exports.FeatureRolloutSyncActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const ENSyncActivity_1 = require("./ENSyncActivity");
const SYNC_INTERVAL = 15 * conduit_utils_1.MILLIS_IN_ONE_MINUTE;
const RETRY_AFTER = SYNC_INTERVAL / 3;
class FeatureRolloutSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, timeout, subpriority = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.FeatureRolloutSyncActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: null,
        });
        this.di = di;
    }
    async runSyncImpl(trc) {
        const params = this.initParams('personal', null, 0);
        const clientType = this.di.featureRolloutClientType;
        if (clientType === en_conduit_sync_types_1.FeatureRolloutClientTypes.Unknown) {
            conduit_utils_1.logger.warn('client type for feature rollout is unknown. stop running');
            return; // not necessary
        }
        const data = await this.fetchRolloutData(trc, params.auth.urlHost, clientType);
        if (!data) {
            conduit_utils_1.logger.error(`Failed to get rollout data for ${params.auth.urlHost}`);
            throw new conduit_utils_1.RetryError('continue', RETRY_AFTER);
        }
        // using async keyword for the case `data[k] !== params.auth.urlHost` instead of using combination of filter and map to avoid looping twice.
        await conduit_utils_1.allSettled(Object.keys(data).map(async (k) => {
            if (data[k] !== params.auth.urlHost) {
                return conduit_utils_1.logAndDiscardError(params.localSettings.setConduitValue(trc, null, k, data[k]));
            }
        }));
        throw new conduit_utils_1.RetryError('continue', SYNC_INTERVAL);
    }
    async fetchRolloutData(trc, hostUrl, clientType) {
        var _a, _b;
        const httpTransport = (_b = (_a = this.di).getHttpTransport) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (!httpTransport) {
            throw new conduit_utils_1.InternalError('No HTTPTransport');
        }
        const address = `https://update.evernote.com/enclients/${clientType}/features_rollout.json`;
        try {
            const resp = await httpTransport.request(trc, {
                method: 'GET',
                url: address,
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (resp.status >= 400) {
                conduit_utils_1.logger.error(`FeatureRolloutSyncActivity failed with status ${resp.status}`);
                throw new conduit_utils_1.RetryError(`continue`, RETRY_AFTER);
            }
            conduit_utils_1.logger.debug('Rollout data is recieved', resp.result);
            const data = conduit_utils_1.safeParse(resp.result);
            if (!data || !Array.isArray(data)) {
                return;
            }
            return data.find(datum => datum.hasOwnProperty('host_name') && datum.host_name === hostUrl);
        }
        catch (e) {
            conduit_utils_1.logger.debug('FeatureRolloutSyncActivity failed', e);
            throw new conduit_utils_1.RetryError(`continue`, RETRY_AFTER);
        }
    }
}
exports.FeatureRolloutSyncActivity = FeatureRolloutSyncActivity;
function featureRolloutActivityHydrator(di, context, p, timeout) {
    return new FeatureRolloutSyncActivity(di, context, timeout !== null && timeout !== void 0 ? timeout : SYNC_INTERVAL, p.subpriority);
}
exports.featureRolloutActivityHydrator = featureRolloutActivityHydrator;
//# sourceMappingURL=FeatureRolloutSyncActivity.js.map