"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMarketingEmailPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
async function sendMarketingEmailResolver(parent, args, context) {
    conduit_core_1.validateDB(context);
    const metadata = await context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT);
    if (!metadata || !metadata.authToken) {
        throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_CONTEXT, 'Sync context metadata not found');
    }
    const auth = en_thrift_connector_1.decodeAuthData(metadata.authToken);
    const utilityStore = context.thriftComm.getUtilityStore(auth.urls.utilityUrl);
    await utilityStore.sendMarketingEmail(context.trc, auth.token, args);
    return { success: true };
}
exports.sendMarketingEmailPlugin = {
    type: conduit_core_1.GenericMutationResult,
    args: conduit_core_1.schemaToGraphQLArgs({
        marketingEmailType: conduit_utils_1.EnumWithKeys({
            DESKTOP_UPSELL: 1,
            CLIPPER_UPSELL: 2,
            MOBILE_UPSELL: 3,
        }, 'MarketingEmailType'),
    }),
    resolve: sendMarketingEmailResolver,
};
//# sourceMappingURL=SendMarketingEmail.js.map