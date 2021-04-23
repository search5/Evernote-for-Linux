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
const queryString = __importStar(require("querystring"));
const postUtils_1 = require("./postUtils");
let skuMapString = null;
let fetchTimestamp = null;
const ClientPlatformSchema = conduit_utils_1.EnumWithKeys({
    ANDROID: 'android',
    IOS: 'ios',
    MAC: 'mac',
}, 'ClientPlatform');
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
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                args: conduit_core_1.schemaToGraphQLArgs({
                    clientPlatform: ClientPlatformSchema,
                    forceFetch: conduit_utils_1.NullableBoolean,
                }),
                resolve: productDataResolver,
            },
            getSubscriptionInfo: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                resolve: subscriptionInfoResolver,
            },
        }),
        defineMutators: () => ({
            createAndroidPrePurchaseTransactionID: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                args: conduit_core_1.schemaToGraphQLArgs({
                    sku: 'string',
                    extend: conduit_utils_1.NullableBoolean,
                }),
                resolve: androidPrePurchaseResolver,
            },
            verifyAndroidPostPurchase: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                args: conduit_core_1.schemaToGraphQLArgs({
                    developerPayload: 'string',
                    offer: 'string',
                    sku: 'string',
                    signedData: 'string',
                    signature: 'string',
                }),
                resolve: androidPostPurchaseResolver,
            },
            verifyApplePostPurchase: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                args: conduit_core_1.schemaToGraphQLArgs({
                    currency: 'string',
                    offer: 'string',
                    price: 'string',
                    productId: 'string',
                    receiptData: 'string',
                    transactionId: 'string',
                    layout: conduit_utils_1.NullableString,
                    extend: conduit_utils_1.NullableBoolean,
                    receiptOnly: conduit_utils_1.NullableString,
                    transactionState: conduit_utils_1.NullableString,
                    verifyReceiptOnly: conduit_utils_1.NullableString,
                    version: conduit_utils_1.NullableInt,
                }),
                resolve: applePostPurchaseResolver,
            },
            notifyAppleTransactionFailure: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                args: conduit_core_1.schemaToGraphQLArgs({
                    layout: conduit_utils_1.NullableString,
                    currency: conduit_utils_1.NullableString,
                    price: conduit_utils_1.NullableString,
                    productId: conduit_utils_1.NullableString,
                    receiptData: conduit_utils_1.NullableString,
                    transactionId: conduit_utils_1.NullableString,
                }),
                resolve: appleFailureResolver,
            },
            sendAppleReceiptOnly: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableString),
                args: conduit_core_1.schemaToGraphQLArgs({
                    layout: conduit_utils_1.NullableString,
                    receiptData: 'string',
                }),
                resolve: appleReceiptOnlyResolver,
            },
        }),
    };
}
exports.getENInAppPurchasingPlugin = getENInAppPurchasingPlugin;
//# sourceMappingURL=index.js.map