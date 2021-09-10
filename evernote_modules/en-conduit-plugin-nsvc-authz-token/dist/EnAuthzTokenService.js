"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTokenTypeArg = exports.disallowedEmailDomain = exports.TokenTypeValues = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const DISALLOWED_AUTHZ_DOMAINS = [
    /@etonreve.com$/i,
    /@inactive.evernote.com$/i,
];
exports.TokenTypeValues = [
    'IN_APP_BORON_LINUX',
    'IN_APP_BORON_MAC',
    'IN_APP_BORON_WIN',
    'IN_APP_ION',
    'MOBILE_DEFAULT',
    'MOBILE_NEUTRON_ANDROID',
    'MOBILE_NEUTRON_IOS',
    'PUSH_BORON_LINUX',
    'PUSH_BORON_MAC',
    'PUSH_BORON_WIN',
    'PUSH_ION',
];
function disallowedEmailDomain(email) {
    return DISALLOWED_AUTHZ_DOMAINS.some(disallowedDomain => email.match(disallowedDomain));
}
exports.disallowedEmailDomain = disallowedEmailDomain;
/**
 * Verifies if the provided args contain a valid Authz token type argument.
 * @param args GraphQL query arguments
 */
function validateTokenTypeArg(args) {
    if (args.hasOwnProperty('tokenType')) {
        const tokenTypeName = args.tokenType;
        const tokenType = en_conduit_sync_types_1.TNsvcTokenType[tokenTypeName];
        if (tokenType === undefined) {
            throw new conduit_utils_1.InvalidOperationError(`Invalid tokenType query argument: ${args.tokenType}`);
        }
        return tokenTypeName;
    }
    else {
        throw new conduit_utils_1.InvalidOperationError(`No tokenType argument provided`);
    }
}
exports.validateTokenTypeArg = validateTokenTypeArg;
//# sourceMappingURL=EnAuthzTokenService.js.map