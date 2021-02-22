"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTokenTypeArg = exports.disallowedEmailDomain = void 0;
const en_thrift_connector_1 = require("en-thrift-connector");
const DISALLOWED_AUTHZ_DOMAINS = [
    /@etonreve.com$/i,
    /@inactive.evernote.com$/i,
];
function disallowedEmailDomain(email) {
    return DISALLOWED_AUTHZ_DOMAINS.some(disallowedDomain => email.match(disallowedDomain));
}
exports.disallowedEmailDomain = disallowedEmailDomain;
/**
 * Verifies if the provided args contain a valid Authz token type argument.
 * If no tokenType arguments is provided it assumes we are requesting the default type (backwards compatible)
 * @param args GraphQL query arguments
 */
function validateTokenTypeArg(args) {
    if (args.hasOwnProperty('tokenType')) {
        const tokenTypeName = args.tokenType;
        const tokenType = en_thrift_connector_1.TNsvcTokenType[tokenTypeName];
        if (tokenType === undefined) {
            throw new Error(`Invalid tokenType query argument: ${args.tokenType}`);
        }
        return tokenTypeName;
    }
    // If tokenType arg not provided, assume default type
    return 'MOBILE_DEFAULT';
}
exports.validateTokenTypeArg = validateTokenTypeArg;
//# sourceMappingURL=EnAuthzTokenService.js.map