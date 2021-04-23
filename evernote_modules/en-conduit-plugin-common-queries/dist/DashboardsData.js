"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardsDataPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
async function dashboardsData(parent, args, context) {
    const token = await conduit_core_1.retrieveAuthorizedToken(context);
    const authData = en_thrift_connector_1.decodeAuthData(token);
    if (!authData.vaultAuth) {
        throw new conduit_utils_1.NoUserError('no vault user');
    }
    return {
        businessShard: authData.vaultAuth.shard,
    };
}
exports.dashboardsDataPlugin = {
    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
        businessShard: 'string',
    }, 'DashboardsData')),
    resolve: dashboardsData,
};
//# sourceMappingURL=DashboardsData.js.map