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
const GetRolloutReleaseDataArgs = conduit_core_1.schemaToGraphQLArgs({ serviceHost: 'string', featureRolloutClientType: RolloutData_1.ClientTypeSchema });
const SignInMethodResultType = conduit_core_1.schemaToGraphQLType({
    siwg: SignInMethod_1.SignInMethodTypeSchema,
    siwa: SignInMethod_1.SignInMethodTypeSchema,
}, 'FeatureRolloutDataResult', true);
function getFeatureRolloutPlugin(httpClient) {
    async function getSignInMethodResolver(parent, args, context) {
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
            const rolloutData = await RolloutData_1.fetchRolloutData(context.trc, httpClient, args.featureRolloutClientType);
            const data = rolloutData.find(datum => datum.host_name === args.serviceHost);
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
            conduit_utils_1.logger.error('Failed to fech gradual rollout information', e);
            return SignInMethod_1.getFallbackSignInMethodValue(context.trc, context.localSettings);
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
            };
            return queries;
        },
    };
}
exports.getFeatureRolloutPlugin = getFeatureRolloutPlugin;
//# sourceMappingURL=index.js.map