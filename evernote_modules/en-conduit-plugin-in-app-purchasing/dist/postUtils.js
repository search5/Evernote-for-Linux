"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanedArgsForPost = exports.createAuthHeadersForPost = exports.SKU_ENDPOINTS = exports.APPLE_TRANSACTION_ENDPOINT = exports.ANDROID_TRANSACTION_ENDPOINT = void 0;
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
exports.ANDROID_TRANSACTION_ENDPOINT = '/AndroidInAppPurchase.action';
exports.APPLE_TRANSACTION_ENDPOINT = '/IphonePurchaseVerify.action'; // mas + ios
var SKU_ENDPOINTS;
(function (SKU_ENDPOINTS) {
    SKU_ENDPOINTS["android"] = "/download/android/commerce/PremiumCommerceSku.json";
    SKU_ENDPOINTS["ios"] = "/download/iphone/Misc/PremiumCommerceSku.json";
    SKU_ENDPOINTS["mac"] = "/download/mac/commerce/PremiumCommerceSku.json";
})(SKU_ENDPOINTS = exports.SKU_ENDPOINTS || (exports.SKU_ENDPOINTS = {}));
function createAuthHeadersForPost(authToken) {
    return ({
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Cookie': `auth=${authToken}`,
    });
}
exports.createAuthHeadersForPost = createAuthHeadersForPost;
const validPostKeysApple = [
    'currency',
    'extend',
    'layout',
    'offer',
    'price',
    'productId',
    'receiptData',
    'receiptOnly',
    'transactionId',
    'transactionState',
    'verifyReceiptOnly',
    'version',
];
const renamedKeysApple = {
    productId: 'product-id',
    receiptData: 'receipt-data',
    receiptOnly: 'receipt-only',
    transactionId: 'transaction-id',
    transactionState: 'transaction-state',
    verifyReceiptOnly: 'verify-receipt-only',
};
function cleanedArgsForPost(obj, validKeys = validPostKeysApple, newKeys = renamedKeysApple) {
    const truthyArgs = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] && validKeys.includes(key)) {
            truthyArgs[newKeys.hasOwnProperty(key) ? newKeys[key] : key] = obj[key];
        }
    });
    return truthyArgs;
}
exports.cleanedArgsForPost = cleanedArgsForPost;
//# sourceMappingURL=postUtils.js.map