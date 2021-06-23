"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenStorage = void 0;
const conduit_utils_1 = require("conduit-utils");
/**
 * Class to access on graphDb storage for NSVC Authz token
 */
class TokenStorage {
    constructor() {
        this.tokenCache = new Map();
    }
    /**
     * load token and expiration from cache
     */
    load(tokenStorageKey) {
        if (!tokenStorageKey) {
            conduit_utils_1.logger.error(`TokenStorage: invalid token type ${tokenStorageKey}`);
            return { token: null, expiresAt: null };
        }
        const tokenResult = this.tokenCache.get(tokenStorageKey);
        return tokenResult || { token: null, expiresAt: null };
    }
    /**
     * Validate of token is valid
     */
    valid(tokenResult) {
        return !!tokenResult.expiresAt && tokenResult.expiresAt > Date.now();
    }
    /**
     * Update new token and expiration to storage
     *
     * @param expiresAt
     * @param token
     */
    save(results, tokenStorageKey) {
        this.tokenCache.set(tokenStorageKey, results);
    }
}
exports.TokenStorage = TokenStorage;
//# sourceMappingURL=TokenStorage.js.map