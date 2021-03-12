"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENInAppPurchasingPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
const queryString = __importStar(require("querystring"));
const postUtils_1 = require("./postUtils");
let skuMapString = null;
let fetchTimestamp = null;
const clientPlatform = new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
    name: 'clientPlatform',
    values: {
        ANDROID: { value: 'android' },
        IOS: { value: 'ios' },
        MAC: { value: 'mac' },
    },
}));
function getENInAppPurchasingPlugin(httpClient) {
    async function productDataResolver(parent, args, context) {
        var _a;
        if (!(args && args.clientPlatform)) {
            throw new Error('Unknown device, cannot fetch SKUS');
        }
        if (args.forceFetch || !fetchTimestamp || !skuMapString || (Date.now() - fetchTimestamp > conduit_utils_1.MILLIS_IN_ONE_DAY)) {
            const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
            const response = await httpClient.request(context.trc, {
                method: 'GET',
                url: authData.urlHost,
                path: postUtils_1.SKU_ENDPOINTS[args.clientPlatform],
            });
            skuMapString = (_a = response.result) !== null && _a !== void 0 ? _a : null;
            fetchTimestamp = Date.now();
        }
        return skuMapString;
    }
    async function subscriptionInfoResolver(parent, args, context) {
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const userStore = context.thriftComm.getUserStore(authData.urls.userStoreUrl);
        return conduit_utils_1.safeStringify(await userStore.getSubscriptionInfo(context.trc, authData.token));
    }
    async function androidPrePurchaseResolver(parent, args, context) {
        if (!(args && args.sku)) {
            throw new Error('Missing SKU for android pre-purchase step');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const response = await httpClient.request(context.trc, {
            headers: postUtils_1.createAuthHeadersForPost(authData.token),
            method: 'POST',
            body: queryString.stringify({
                sku: args.sku,
                getPendingPurchase: '',
                auth: authData.token,
                extend: args.extend ? true : false,
            }),
            path: postUtils_1.ANDROID_TRANSACTION_ENDPOINT,
            url: authData.urlHost,
        });
        return response.result;
    }
    async function androidPostPurchaseResolver(parent, args, context) {
        if (!(args)) {
            throw new Error('Missing args');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const response = await httpClient.request(context.trc, {
            headers: postUtils_1.createAuthHeadersForPost(authData.token),
            method: 'POST',
            body: queryString.stringify({
                sku: args.sku,
                completePurchase: '',
                auth: authData.token,
                signedData: args.signedData,
                signature: args.signature,
                offer: args.offer,
                developerPayload: args.developerPayload,
            }),
            path: postUtils_1.ANDROID_TRANSACTION_ENDPOINT,
            url: authData.urlHost,
        });
        if (response.status < 200 || response.status > 299) {
            throw new Error(`Google Play checkout verification failed: ${JSON.stringify(response)}`);
        }
        return response.result;
    }
    async function applePostPurchaseResolver(parent, args, context) {
        if (!args) {
            throw new Error('Missing arguments to applePostPurchaseResolver');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const response = await httpClient.request(context.trc, {
            headers: postUtils_1.createAuthHeadersForPost(authData.token),
            method: 'POST',
            body: queryString.stringify(Object.assign({ auth: authData.token, version: 3 }, postUtils_1.cleanedArgsForPost(args))),
            path: postUtils_1.APPLE_TRANSACTION_ENDPOINT,
            url: authData.urlHost,
        });
        if (response.status < 200 || response.status > 299) {
            throw new Error(`iTunes checkout verification failed: ${JSON.stringify(response)}`);
        }
        return response.result;
    }
    async function appleFailureResolver(parent, args, context) {
        if (!args) {
            throw new Error('Missing arguments to appleFailureResolver');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const response = await httpClient.request(context.trc, {
            headers: postUtils_1.createAuthHeadersForPost(authData.token),
            method: 'POST',
            body: queryString.stringify(Object.assign({ 'auth': authData.token, 'transaction-state': 'failed' }, postUtils_1.cleanedArgsForPost(args))),
            path: postUtils_1.APPLE_TRANSACTION_ENDPOINT,
            url: authData.urlHost,
        });
        return response.result;
    }
    async function appleReceiptOnlyResolver(parent, args, context) {
        if (!(args && args.receiptData && args.layout)) {
            throw new Error('Missing arguments to appleReceiptOnlyResolver');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const response = await httpClient.request(context.trc, {
            headers: postUtils_1.createAuthHeadersForPost(authData.token),
            method: 'POST',
            body: queryString.stringify(Object.assign({ 'auth': authData.token, 'receipt-only': 'true', 'verify-receipt-only': 'true' }, postUtils_1.cleanedArgsForPost(args))),
            path: postUtils_1.APPLE_TRANSACTION_ENDPOINT,
            url: authData.urlHost,
        });
        return response.result;
    }
    return {
        name: 'ENInAppPurchasing',
        defineQueries: () => ({
            getBillableProducts: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'getBillableProducts', true),
                args: {
                    clientPlatform: {
                        type: clientPlatform,
                    },
                    forceFetch: {
                        type: graphql_1.GraphQLBoolean,
                    },
                },
                resolve: productDataResolver,
            },
            getSubscriptionInfo: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'getSubscriptionInfo', true),
                resolve: subscriptionInfoResolver,
            },
        }),
        defineMutators: () => ({
            createAndroidPrePurchaseTransactionID: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'createAndroidPrePurchaseTransactionID', true),
                args: {
                    sku: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    extend: {
                        type: graphql_1.GraphQLBoolean,
                    },
                },
                resolve: androidPrePurchaseResolver,
            },
            verifyAndroidPostPurchase: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'verifyAndroidPostPurchase', true),
                args: {
                    developerPayload: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    offer: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    sku: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    signedData: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    signature: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                },
                resolve: androidPostPurchaseResolver,
            },
            verifyApplePostPurchase: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'verifyApplePostPurchase', true),
                args: {
                    currency: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    offer: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    price: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    productId: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    receiptData: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    transactionId: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                    layout: {
                        type: graphql_1.GraphQLString,
                    },
                    extend: {
                        type: graphql_1.GraphQLBoolean,
                    },
                    receiptOnly: {
                        type: graphql_1.GraphQLString,
                    },
                    transactionState: {
                        type: graphql_1.GraphQLString,
                    },
                    verifyReceiptOnly: {
                        type: graphql_1.GraphQLString,
                    },
                    version: {
                        type: graphql_1.GraphQLInt,
                    },
                },
                resolve: applePostPurchaseResolver,
            },
            notifyAppleTransactionFailure: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'notifyAppleTransactionFailure', true),
                args: {
                    layout: {
                        type: graphql_1.GraphQLString,
                    },
                    currency: {
                        type: graphql_1.GraphQLString,
                    },
                    price: {
                        type: graphql_1.GraphQLString,
                    },
                    productId: {
                        type: graphql_1.GraphQLString,
                    },
                    receiptData: {
                        type: graphql_1.GraphQLString,
                    },
                    transactionId: {
                        type: graphql_1.GraphQLString,
                    },
                },
                resolve: appleFailureResolver,
            },
            sendAppleReceiptOnly: {
                type: conduit_core_1.schemaToGraphQLType('string?', 'sendAppleReceiptOnly', true),
                args: {
                    layout: {
                        type: graphql_1.GraphQLString,
                    },
                    receiptData: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                },
                resolve: appleReceiptOnlyResolver,
            },
        }),
    };
}
exports.getENInAppPurchasingPlugin = getENInAppPurchasingPlugin;
//# sourceMappingURL=index.js.map