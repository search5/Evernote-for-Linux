"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENMonetizationPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const EnMonetizationService_1 = require("./EnMonetizationService");
const types_1 = require("./types");
function getENMonetizationPlugin() {
    const getPaywallStateResolver = async (parent, args, context) => {
        EnMonetizationService_1.validateResolverArgs(['clientType'], args);
        conduit_core_1.validateDB(context);
        const user = await context.db.getUserNode(context);
        if (!user) {
            throw new conduit_utils_1.NotFoundError('', 'user not found');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const { clientType } = args;
        return {
            state: await EnMonetizationService_1.getPaywallState(context.trc, context.comm, authData, { clientType }),
        };
    };
    const createDeviceSyncResolver = async (parent, args, context) => {
        conduit_core_1.validateDB(context);
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        return {
            state: await EnMonetizationService_1.createDeviceSync(context.trc, context.comm, authData),
        };
    };
    return {
        name: 'ENMonetization',
        defineQueries: () => ({
            getPaywallState: {
                type: conduit_core_1.schemaToGraphQLType(types_1.PaywallStateSchema),
                args: conduit_core_1.schemaToGraphQLArgs({
                    clientType: types_1.ClientTypeSchema,
                }),
                resolve: getPaywallStateResolver,
            },
        }),
        defineMutators: () => ({
            createDeviceSync: {
                type: conduit_core_1.schemaToGraphQLType(types_1.PaywallStateSchema),
                resolve: createDeviceSyncResolver,
            },
        }),
    };
}
exports.getENMonetizationPlugin = getENMonetizationPlugin;
//# sourceMappingURL=index.js.map