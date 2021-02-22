"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENNsvcAuthzToken = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EnAuthzTokenService_1 = require("./EnAuthzTokenService");
const EnTokenThrift_1 = require("./EnTokenThrift");
const TokenStorage_1 = require("./TokenStorage");
const tokenCache = new TokenStorage_1.TokenStorage();
function getENNsvcAuthzToken(thriftComm) {
    /**
     * Get token from Thrift API or from Storage if token is not expired
     *
     * @param parent
     * @param args
     * @param context
     */
    async function tokenResolver(parent, args, context) {
        const tokenType = EnAuthzTokenService_1.validateTokenTypeArg(args);
        conduit_core_1.validateDB(context);
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        if (authorizedToken) {
            const user = await context.db.getUserNode(context);
            if (!user) {
                throw new Error('No current user');
            }
            if (EnAuthzTokenService_1.disallowedEmailDomain(user.NodeFields.email)) {
                return {
                    token: '',
                    expiresAt: Date.now() + conduit_utils_1.MILLIS_IN_ONE_DAY,
                };
            }
            return await resolveStorage(tokenCache, context, authorizedToken, tokenType);
        }
    }
    /**
     * Load token from tokenStorage or if token is expired,
     * fetch it from API and store it on tokenStorage
     *
     * @param tokenStorage
     * @param context
     * @param authorizedToken
     */
    async function resolveStorage(tokenStorage, context, authorizedToken, tokenType) {
        let results;
        results = tokenStorage.load(tokenType);
        if (!tokenStorage.valid(results)) {
            results = await EnTokenThrift_1.getToken(context.trc, thriftComm, authorizedToken, tokenType);
            tokenStorage.save(results, tokenType);
        }
        return results;
    }
    return {
        name: 'ENNvscAuthzToken',
        defineQueries: () => ({
            NsvcAuthzToken: {
                type: conduit_core_1.schemaToGraphQLType({ token: 'string?', expiresAt: 'number?' }, 'NsvcAuthzToken', true),
                args: conduit_core_1.schemaToGraphQLArgs({ tokenType: 'string?' }),
                resolve: tokenResolver,
            },
        }),
    };
}
exports.getENNsvcAuthzToken = getENNsvcAuthzToken;
//# sourceMappingURL=index.js.map