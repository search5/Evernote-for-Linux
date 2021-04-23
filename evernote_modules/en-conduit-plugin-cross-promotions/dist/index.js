"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupENCrossPromotionPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const ENThriftCrossPromotionInfo_1 = require("./ENThriftCrossPromotionInfo");
function setupENCrossPromotionPlugin() {
    async function crossPromotionInfoResolver(_, args, context) {
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        const authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        return ENThriftCrossPromotionInfo_1.getCrossPromotionsInfo(context.trc, context.thriftComm, authData);
    }
    const responseType = conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
        usesEvernoteWindows: 'boolean',
        usesEvernoteMac: 'boolean',
        usesEvernoteIOS: 'boolean',
        usesEvernoteAndroid: 'boolean',
        usesWebClipper: 'boolean',
        usesClearly: 'boolean',
        usesFoodIOS: 'boolean',
        usesFoodAndroid: 'boolean',
        usesPenultimateIOS: 'boolean',
        usesSkitchWindows: 'boolean',
        usesSkitchMac: 'boolean',
        usesSkitchIOS: 'boolean',
        usesSkitchAndroid: 'boolean',
        usesEvernoteSalesforce: 'boolean',
    }, 'CrossPromotionInfo'));
    return {
        name: 'ENCrossPromotions',
        defineQueries: () => {
            const queries = {};
            queries.CrossPromotionsInfo = {
                type: responseType,
                resolve: crossPromotionInfoResolver,
            };
            return queries;
        },
    };
}
exports.setupENCrossPromotionPlugin = setupENCrossPromotionPlugin;
//# sourceMappingURL=index.js.map