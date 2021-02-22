"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoHashQueryStringUtils = exports.ConduitNapAuth = exports.fetchNAPConfiguration = exports.extractMonolithToken = exports.getEndSessionURL = exports.getUserAccountInfo = exports.wrapTokenRequestResponseError = exports.NAPOAuthProvider = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_node_appauth_js_1 = require("en-node-appauth-js");
const js_base64_1 = require("js-base64");
const ConduitHttpRequestor_1 = require("./ConduitHttpRequestor");
const NAPAuthnRequest_1 = require("./NAPAuthnRequest");
const NAPAuthTrcPool = new conduit_utils_1.AsyncTracePool('NAPAuth');
const AUTH_SCOPE = 'openid profile mono_authn_token email offline_access';
const utils = new en_node_appauth_js_1.BasicQueryStringUtils();
var NAPOAuthProvider;
(function (NAPOAuthProvider) {
    NAPOAuthProvider["APPLE"] = "apple";
    NAPOAuthProvider["GOOGLE"] = "google";
})(NAPOAuthProvider = exports.NAPOAuthProvider || (exports.NAPOAuthProvider = {}));
// AppAuthError does not extend Error
// This error can be thrown to the client.
function wrapTokenRequestResponseError(e) {
    if (e instanceof en_node_appauth_js_1.AppAuthError) {
        // https://gluu.org/docs/gluu-server/api-guide/openid-connect-api/#errors_1
        if (e.message === '400') {
            // one of these possible for 400
            // invalid_grant: authorization code or refresh token is invalid. mostly auth is expired.
            // invalid_request: some parameters are missing or wrong. need new client with new settings
            // invalid_client: mostly client id is wrong. we started using a new client id. need new client
            // unauthorized_client: Server config is changed to not allow current settings. Need login again and upgrade client.
            // unsupported_grant_type: current grant type is not allowed for the current client.
            // invalid_scope: Server config is changed to not allow current scope. Need login again and upgrade client.
            if (e.extras === 'invalid_grant') {
                return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.AUTH_EXPIRED, '', e.extras);
            }
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.CLIENT_NOT_SUPPORTED, '', e.extras);
        }
        // 401 can be thrown when "Authorization" request header field is included.
        if (e.message === '401') {
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.AUTH_EXPIRED, '', e.extras);
        }
        // No OIDC spec for 403. This can be thrown somewhere outside of NAP
        if (e.message === '403') {
            return new conduit_utils_1.RetryError('403', 5 * conduit_utils_1.MILLIS_IN_ONE_SECOND);
        }
        // Something is changed in the server side. Need to upgrade client.
        if (e.message === '404') {
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.CLIENT_NOT_SUPPORTED, '');
        }
        // Retry for 500
        if (e.message === '500') {
            return new conduit_utils_1.ServiceError('Auth', '500', 'Retry with Legacy');
        }
    }
    return new conduit_utils_1.ServiceError('Auth', e.message, 'Retry with Legacy');
}
exports.wrapTokenRequestResponseError = wrapTokenRequestResponseError;
function wrapAuthorizationError(e) {
    let errorCode;
    switch (e.error) {
        case 'interaction_required':
            errorCode = conduit_utils_1.NAPAuthErrorCode.InteractionRequired;
        case 'login_required':
            errorCode = conduit_utils_1.NAPAuthErrorCode.LoginRequired;
        case 'account_selection_required':
            errorCode = conduit_utils_1.NAPAuthErrorCode.AccountSelectionRequired;
        case 'consent_required':
            errorCode = conduit_utils_1.NAPAuthErrorCode.ConsentRequired;
        case 'invalid_request_uri':
            errorCode = conduit_utils_1.NAPAuthErrorCode.InvalidRequestUri;
        case 'invalid_request_object':
            errorCode = conduit_utils_1.NAPAuthErrorCode.InvalidRequestObject;
        case 'request_not_supported':
            errorCode = conduit_utils_1.NAPAuthErrorCode.RequestNotSupported;
        case 'request_uri_not_supported':
            errorCode = conduit_utils_1.NAPAuthErrorCode.RequestUriNotSupported;
        case 'registration_not_supported':
            errorCode = conduit_utils_1.NAPAuthErrorCode.RegistrationNotSupported;
        default:
            errorCode = conduit_utils_1.NAPAuthErrorCode.Unknown;
    }
    return new conduit_utils_1.NAPAuthError(errorCode, e.errorDescription, e.errorUri, e.state);
}
async function getUserAccountInfo(trc, httpTransport, authUrl, accessToken) {
    var _a;
    try {
        const requestParam = {
            method: 'GET',
            headers: { authorization: 'Bearer ' + accessToken },
            url: authUrl + '/oxauth/restv1/userinfo',
        };
        const response = await httpTransport.request(trc, requestParam);
        const data = conduit_utils_1.safeParse(response.result);
        return { email: (_a = data === null || data === void 0 ? void 0 : data.email) !== null && _a !== void 0 ? _a : undefined };
    }
    catch (_b) {
        return {};
    }
}
exports.getUserAccountInfo = getUserAccountInfo;
async function getEndSessionURL(napAddress, redirectURI, httpClient, idToken) {
    const trc = NAPAuthTrcPool.alloc();
    const configuration = await fetchNAPConfiguration(trc, napAddress, new ConduitHttpRequestor_1.ConduitHttpRequestor(httpClient));
    NAPAuthTrcPool.release(trc);
    if (!configuration.endSessionEndpoint) {
        return null;
    }
    const requestMap = {
        post_logout_redirect_uri: redirectURI,
    };
    if (idToken) {
        requestMap.id_token_hint = idToken;
    }
    const query = utils.stringify(requestMap);
    const baseUrl = configuration.endSessionEndpoint;
    return `${baseUrl}?${query}`;
}
exports.getEndSessionURL = getEndSessionURL;
function extractMonolithToken(accessToken) {
    var _a;
    const [, encodedPayload] = accessToken.split('.');
    const decodedPayload = conduit_utils_1.safeParse(js_base64_1.Base64.decode(encodedPayload));
    return (_a = decodedPayload === null || decodedPayload === void 0 ? void 0 : decodedPayload.mono_authn_token) !== null && _a !== void 0 ? _a : null;
}
exports.extractMonolithToken = extractMonolithToken;
/**
 * A wrapper for AuthorizationServiceConfiguration.fetchFromIssuer to enforce requestor
 * @param url OIDC URL
 * @param requestor Requestor type from AppAuth-JS
 */
async function fetchNAPConfiguration(trc, url, requestor) {
    conduit_utils_1.traceEventStart(trc, 'ASC.fetchFromIssuer');
    return conduit_utils_1.traceEventEndWhenSettled(trc, 'ASC.fetchFromIssuer', en_node_appauth_js_1.AuthorizationServiceConfiguration.fetchFromIssuer(url, requestor));
}
exports.fetchNAPConfiguration = fetchNAPConfiguration;
class ConduitNapAuth {
    constructor(authConfig, authorizationHandler, httpClient, crypto) {
        this.authConfig = authConfig;
        this.authorizationHandler = authorizationHandler;
        this.httpClient = httpClient;
        this.crypto = crypto;
        this.notifier = new en_node_appauth_js_1.AuthorizationNotifier();
        this.tokenHandler = new en_node_appauth_js_1.BaseTokenRequestHandler(new ConduitHttpRequestor_1.ConduitHttpRequestor(this.httpClient));
        this.authorizationHandler.setAuthorizationNotifier(this.notifier);
        this.notifier.setAuthorizationListener((request, response, authorizationError) => {
            this.onAuthorization(request, response, authorizationError).catch(err => {
                authConfig.onError(wrapTokenRequestResponseError(err));
            });
        });
    }
    requestAuthentication(params, state) {
        const trc = NAPAuthTrcPool.alloc();
        fetchNAPConfiguration(trc, this.authConfig.napAuthUrl, new ConduitHttpRequestor_1.ConduitHttpRequestor(this.httpClient))
            .then(async (configuration) => {
            const extras = {};
            if (params === null || params === void 0 ? void 0 : params.usernameJwt) {
                extras.login_hint = params.usernameJwt;
            }
            else if (params === null || params === void 0 ? void 0 : params.oauthProvider) {
                extras.oauth_provider = params.oauthProvider;
            }
            extras.client_consumer_key = this.authConfig.consumerKey;
            const authnState = state !== null && state !== void 0 ? state : await this.crypto.generateRandomPromisified(10);
            const authRequest = new NAPAuthnRequest_1.NAPAuthnRequest({
                client_id: this.authConfig.clientID,
                redirect_uri: this.authConfig.redirectUrl,
                scope: AUTH_SCOPE,
                response_type: en_node_appauth_js_1.AuthorizationRequest.RESPONSE_TYPE_CODE,
                extras,
                state: authnState,
            }, this.crypto);
            this.authorizationHandler.performAuthorizationRequest(configuration, authRequest);
            NAPAuthTrcPool.release(trc);
        })
            .catch(error => {
            this.authConfig.onError(wrapTokenRequestResponseError(error));
            NAPAuthTrcPool.release(trc);
        });
    }
    async onAuthorization(request, response, authorizationError) {
        if (response) {
            let extras;
            if (request && request.internal) {
                extras = {
                    code_verifier: request.internal.code_verifier,
                };
            }
            const tokenRequest = new en_node_appauth_js_1.TokenRequest({
                client_id: this.authConfig.clientID,
                redirect_uri: this.authConfig.redirectUrl,
                grant_type: en_node_appauth_js_1.GRANT_TYPE_AUTHORIZATION_CODE,
                code: response.code,
                refresh_token: undefined,
                extras,
            });
            const trc = NAPAuthTrcPool.alloc();
            try {
                const configuration = await fetchNAPConfiguration(trc, this.authConfig.napAuthUrl, new ConduitHttpRequestor_1.ConduitHttpRequestor(this.httpClient));
                const oResponse = await this.tokenHandler.performTokenRequest(configuration, tokenRequest);
                const serviceToken = extractMonolithToken(oResponse.accessToken);
                if (!serviceToken) {
                    const revokeTokenRequest = new en_node_appauth_js_1.RevokeTokenRequest({ token: oResponse.accessToken, client_id: this.authConfig.clientID });
                    await this.tokenHandler.performRevokeTokenRequest(configuration, revokeTokenRequest);
                    throw new conduit_utils_1.RetryError('No Service Token received.', 5 * conduit_utils_1.MILLIS_IN_ONE_SECOND);
                }
                const { email } = await getUserAccountInfo(trc, this.httpClient, this.authConfig.napAuthUrl, oResponse.accessToken);
                await this.authConfig.login({
                    serviceToken,
                    serviceHost: this.authConfig.serviceHost,
                    accessToken: oResponse.accessToken,
                    refreshToken: oResponse.refreshToken,
                    napAuthUrl: this.authConfig.napAuthUrl,
                    napClientId: this.authConfig.clientID,
                    napRedirectUri: this.authConfig.redirectUrl,
                    email,
                });
            }
            catch (error) {
                throw wrapTokenRequestResponseError(error);
            }
            finally {
                NAPAuthTrcPool.release(trc);
            }
        }
        else if (authorizationError) {
            throw wrapAuthorizationError(authorizationError);
        }
    }
    requestToken() {
        this.authorizationHandler.completeAuthorizationRequestIfPossible().catch(e => {
            this.authConfig.onError(wrapTokenRequestResponseError(e));
        });
    }
}
exports.ConduitNapAuth = ConduitNapAuth;
class NoHashQueryStringUtils extends en_node_appauth_js_1.BasicQueryStringUtils {
    parse(input, useHash) {
        return super.parse(input, false /* never use hash */);
    }
}
exports.NoHashQueryStringUtils = NoHashQueryStringUtils;
//# sourceMappingURL=ConduitNapAuth.js.map