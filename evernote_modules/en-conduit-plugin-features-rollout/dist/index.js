"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureRolloutPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const RolloutData_1 = require("./RolloutData");
const SignInMethod_1 = require("./SignInMethod");
const GetRolloutReleaseDataArgs = conduit_core_1.schemaToGraphQLArgs({
    serviceHost: 'string',
    featureRolloutClientType: RolloutData_1.ClientTypeSchema,
});
const SignInMethodResultType = conduit_core_1.schemaToGraphQLType({
    siwg: SignInMethod_1.SignInMethodTypeSchema,
    siwa: SignInMethod_1.SignInMethodTypeSchema,
}, 'FeatureRolloutDataResult', true);
const IterableLogsSwitchResultType = conduit_core_1.schemaToGraphQLType({
    iterableLogsEnabled: 'boolean',
}, 'IterableLogsSwitchResult', false);
const PollInterval = conduit_utils_1.MILLIS_IN_ONE_HOUR;
function getFeatureRolloutPlugin(httpClient) {
    const cachedRolloutData = { expiration: 0 };
    async function getRolloutData(args, context) {
        if (!context) {
            throw new conduit_utils_1.InternalError('No Context');
        }
        if (!httpClient) {
            throw new conduit_utils_1.InternalError('No HttpClient');
        }
        if (!args || !args.featureRolloutClientType || !args.serviceHost) {
            throw new conduit_utils_1.MissingParameterError('Both serviceHost and clientType must be passed');
        }
        try {
            return await RolloutData_1.fetchRolloutData(context.trc, httpClient, args.featureRolloutClientType);
        }
        catch (e) {
            conduit_utils_1.logger.error('Failed to fetch gradual rollout information', e);
            throw e;
        }
    }
    async function getCachedRolloutData(args, context) {
        const { expiration, data } = cachedRolloutData;
        try {
            if (!cachedRolloutData.pendingPromise && (!cachedRolloutData.data || expiration < Date.now())) {
                cachedRolloutData.pendingPromise = getRolloutData(args, context);
                cachedRolloutData.expiration = Date.now() + conduit_utils_1.MILLIS_IN_ONE_MINUTE * 30;
            }
            if (cachedRolloutData.pendingPromise) {
                cachedRolloutData.data = await cachedRolloutData.pendingPromise;
                cachedRolloutData.pendingPromise = undefined;
            }
        }
        catch (e) {
            cachedRolloutData.pendingPromise = undefined;
            cachedRolloutData.data = data;
        }
        return cachedRolloutData.data ? cachedRolloutData.data.find(datum => datum.host_name === args.serviceHost) : null;
    }
    async function getSignInMethodResolver(parent, args, context) {
        if (!context) {
            throw new conduit_utils_1.InternalError('No Context');
        }
        try {
            const data = await getCachedRolloutData(args, context);
            if (!data) {
                return {
                    siwg: SignInMethod_1.SignInMethodEnum.Legacy,
                    siwa: SignInMethod_1.SignInMethodEnum.Legacy,
                };
            }
            const hash = context.clientCredentials ? conduit_utils_1.md5(context.clientCredentials.deviceIdentifier) : null;
            const result = SignInMethod_1.determineSignInMethod(hash, data);
            await context.localSettings.setSystemValue(context.trc, 'siwgMethod', result.siwg);
            await context.localSettings.setSystemValue(context.trc, 'siwaMethod', result.siwa);
            return result;
        }
        catch (e) {
            return SignInMethod_1.getFallbackSignInMethodValue(context.trc, context.localSettings);
        }
    }
    async function getIterableLogsSwitchResolver(parent, args, context) {
        var _a;
        try {
            (_a = context === null || context === void 0 ? void 0 : context.watcher) === null || _a === void 0 ? void 0 : _a.triggerAfterTime(PollInterval);
            const data = await getCachedRolloutData(args, context);
            if (!data) {
                return { iterableLogsEnabled: false };
            }
            const { iterable_logs_enabled = false } = data;
            return { iterableLogsEnabled: iterable_logs_enabled };
        }
        catch (e) {
            return { iterableLogsEnabled: false };
        }
    }
    return {
        name: 'FeatureRolloutPlugin',
        defineQueries: () => {
            const queries = {
                SignInMethod: {
                    args: GetRolloutReleaseDataArgs,
                    type: SignInMethodResultType,
                    resolve: getSignInMethodResolver,
                    description: 'Get Gradual Release Feature Flag',
                },
                IterableLogsSwitch: {
                    args: GetRolloutReleaseDataArgs,
                    type: IterableLogsSwitchResultType,
                    resolve: getIterableLogsSwitchResolver,
                    description: 'Get Flag to enable/disable Iterable Datadog Logs',
                },
            };
            return queries;
        },
    };
}
exports.getFeatureRolloutPlugin = getFeatureRolloutPlugin;
//# sourceMappingURL=index.js.map