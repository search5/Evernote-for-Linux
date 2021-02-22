"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.PluginTokenRefreshManager = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const Auth = __importStar(require("../Auth"));
function validateDBAndKeys(context) {
    if (context && context.db && context.clientCredentials && context.multiUserProvider) {
        return true;
    }
    throw new Error('Context not correctly setup: db or credentials missing');
}
class PluginTokenRefreshManager {
    constructor(di, maxBackoffTimeout = 16000) {
        this.di = di;
        this.backoffManager = new conduit_utils_1.ExponentialBackoffManager(maxBackoffTimeout);
    }
    async renewAndSaveAuthToken(context, thriftComm) {
        if (!validateDBAndKeys(context)) {
            throw new conduit_utils_1.InternalError('No DB Found');
        }
        const delay = this.backoffManager.getDelayDuration();
        if (delay > 0) {
            throw new conduit_utils_1.RetryError('Slowing down auth request', delay);
        }
        const currentAuth = await context.multiUserProvider.getAuthTokenAndState(context.trc, null);
        if (!currentAuth) {
            throw new Error('Unable to get session token without an activated user');
        }
        const authData = currentAuth.token && Auth.decodeAuthData(currentAuth.token);
        // obtain monolith session token for accounts not on NAP
        if (!authData || !Auth.hasNAPData(authData)) {
            return await Auth.acquireSessionToken(context.trc, thriftComm, currentAuth);
        }
        // return current monolith token if Conduit can guarantee the current token won't be expired soon
        if (!Auth.needMonolithTokenRefresh(authData.token)) {
            return authData.token;
        }
        try {
            // renew monolith session token to guarantee it won't be expired soon
            const newAuth = await this.di.refreshAuthToken(context.trc, authData);
            await context.db.setAuthTokenAndState(context.trc, newAuth);
            if (newAuth.state === conduit_view_types_1.AuthState.Expired) {
                return authData.token;
            }
            const newAuthData = newAuth.token && Auth.decodeAuthData(newAuth.token);
            this.backoffManager.resetDelay();
            return newAuthData ? newAuthData.token : authData.token;
        }
        catch (err) {
            if (err instanceof conduit_utils_1.AuthError && err.errorCode === conduit_utils_1.AuthErrorCode.SESSION_REVOKED) {
                // GraphDB#handleAuthError changes current auth state when it detects AuthErrorCode.SESSION_REVOKED
                await context.db.handleAuthError(context.trc, err);
                throw err;
            }
            this.backoffManager.bumpDelayTime();
            throw new conduit_utils_1.RetryError('Failed to refresh token', this.backoffManager.getDelayDuration());
        }
    }
}
exports.PluginTokenRefreshManager = PluginTokenRefreshManager;
//# sourceMappingURL=PluginHelpers.js.map