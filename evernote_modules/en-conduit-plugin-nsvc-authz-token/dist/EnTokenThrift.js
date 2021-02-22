"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = void 0;
const en_thrift_connector_1 = require("en-thrift-connector");
async function getToken(trc, thriftComm, authorizedToken, tokenType) {
    const auth = en_thrift_connector_1.decodeAuthData(authorizedToken);
    const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
    const thriftTokenType = en_thrift_connector_1.TNsvcTokenType[tokenType];
    return await utilityStore.getNsvcThirdPartyAuthorizationTokenByType(trc, auth.token, thriftTokenType);
}
exports.getToken = getToken;
//# sourceMappingURL=EnTokenThrift.js.map