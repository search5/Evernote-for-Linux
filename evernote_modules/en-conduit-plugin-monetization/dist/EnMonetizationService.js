"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResolverArgs = exports.createDeviceSync = exports.getPaywallState = void 0;
async function getPaywallState(trc, thriftComm, auth, request) {
    const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
    const response = await utilityStore.mmsvcGetPaywallState(trc, auth.token, request);
    return response.jsonResponse;
}
exports.getPaywallState = getPaywallState;
async function createDeviceSync(trc, thriftComm, auth) {
    const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
    const response = await utilityStore.mmsvcCreateDeviceSync(trc, auth.token, { userId: `${auth.userID}` });
    return response.jsonResponse;
}
exports.createDeviceSync = createDeviceSync;
function validateResolverArgs(expectedKeys, args) {
    const missing = expectedKeys.filter(key => !args.hasOwnProperty(key));
    if (missing.length > 0) {
        throw new Error(`Missing query arguments: ${missing.join(', ')}`);
    }
}
exports.validateResolverArgs = validateResolverArgs;
//# sourceMappingURL=EnMonetizationService.js.map