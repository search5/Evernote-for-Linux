"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuasarMinusAuthHandler = void 0;
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const Auth_1 = require("./Auth");
const ThriftTypes_1 = require("./ThriftTypes");
const logger = conduit_utils_1.createLogger('conduit:QuasarMinusAuthHandler');
exports.QuasarMinusAuthHandler = {
    // this is suuposed to include only the jwt token eventually
    getAuthHeaders(authData) {
        if (!Auth_1.hasNapAuthInfo(authData) || !authData.napAuthInfo.jwt) {
            throw new conduit_utils_1.GWAuthError();
        }
        const jwt = authData.napAuthInfo.jwt;
        const tokenOrigin = authData.napAuthInfo.refreshToken ? 'NAP' : 'MONOLITH';
        logger.debug(`token origin: ${tokenOrigin}`);
        return {
            'Authorization': 'Bearer ' + jwt,
            'x-mono-authn-token': authData.token,
            'x-token-source': tokenOrigin,
            'x-feature-version': ThriftTypes_1.FEATURE_VERSION,
            'x-conduit-version': conduit_core_1.CONDUIT_VERSION,
        };
    },
};
//# sourceMappingURL=QuasarMinusAuthHandler.js.map