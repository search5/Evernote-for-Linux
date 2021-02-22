"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSendMarketingEmailPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
function getSendMarketingEmailPlugin(thriftComm) {
    async function sendMarketingEmailResolver(parent, args = {}, context) {
        conduit_core_1.validateDB(context);
        const metadata = await context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT);
        if (!metadata || !metadata.authToken) {
            throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_CONTEXT, 'Sync context metadata not found');
        }
        const auth = en_thrift_connector_1.decodeAuthData(metadata.authToken);
        const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
        await utilityStore.sendMarketingEmail(context.trc, auth.token, args);
        return { success: true };
    }
    return {
        type: conduit_core_1.GenericMutationResult,
        args: {
            marketingEmailType: {
                type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
                    name: 'MarketingEmailType',
                    values: {
                        DESKTOP_UPSELL: { value: 1 },
                        CLIPPER_UPSELL: { value: 2 },
                        MOBILE_UPSELL: { value: 3 },
                    },
                })),
            },
        },
        resolve: sendMarketingEmailResolver,
    };
}
exports.getSendMarketingEmailPlugin = getSendMarketingEmailPlugin;
//# sourceMappingURL=SendMarketingEmail.js.map