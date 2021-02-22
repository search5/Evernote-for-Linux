"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAPAuthnRequest = void 0;
const conduit_utils_1 = require("conduit-utils");
const NAPAuthTypes_1 = require("./NAPAuthTypes");
class NAPAuthnRequest extends NAPAuthTypes_1.AuthorizationRequest {
    constructor(request, napCrypto) {
        var _a, _b;
        super(request, napCrypto, true);
        this.napCrypto = napCrypto;
        this.clientId = request.client_id;
        this.redirectUri = request.redirect_uri;
        this.scope = request.scope;
        this.responseType = request.response_type || NAPAuthTypes_1.AuthorizationRequest.RESPONSE_TYPE_CODE;
        this.statePromise = request.state ? Promise.resolve(request.state) : napCrypto.generateRandomPromisified(10); // 10 bytåes
        this.extras = (_a = request.extras) !== null && _a !== void 0 ? _a : {};
        this.internal = (_b = request.internal) !== null && _b !== void 0 ? _b : {};
    }
    async setupCodeVerifier() {
        const codeVerifier = await this.napCrypto.generateRandomPromisified(128);
        try {
            const challenge = await this.napCrypto.deriveChallenge(codeVerifier);
            if (!challenge) {
                conduit_utils_1.logger.error('No challenge is generated. Cannot use PKCE');
                return;
            }
            this.internal.code_verifier = codeVerifier;
            this.extras.code_challenge = challenge;
            this.extras.code_challenge_method = 'S256'; // AppAuth-JS uses S256
        }
        catch (e) {
            conduit_utils_1.logger.error('An error occured during challenge generation. Cannot use PKCE', e);
            return;
        }
    }
    async toJson() {
        this.state = await this.statePromise;
        return super.toJson();
    }
}
exports.NAPAuthnRequest = NAPAuthnRequest;
//# sourceMappingURL=NAPAuthnRequest.js.map