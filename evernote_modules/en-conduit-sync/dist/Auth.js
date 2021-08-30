"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAuthToken = exports.refreshJWTFromMonolith = exports.registerSession = exports.refreshAuthToken = exports.needMonolithTokenRefresh = exports.getOAuthCredential = exports.setOAuthCredential = exports.getScopedGoogleOAuthCredential = exports.fixupAuth = exports.revalidateSyncContextAuth = exports.getUser = exports.acquireSessionToken = exports.revokeNAPToken = exports.revokeSDMSSession = exports.logoutThrift = exports.userSignupandLogin = exports.loginWithServiceToken = exports.loginWithAuthInQueue = exports.loginWithExistingAuth = exports.loginWithTwoFactor = exports.loginWithNAP = exports.login = exports.getLoginInfo = exports.OAuthCredentialSchema = exports.RevalidateShareError = exports.RefreshUserTokenError = exports.TokenRefreshSource = exports.SERVICE_PROVIDER_STRING_TO_ENUM = exports.ServiceProviderSchema = exports.ServiceProvider = exports.NapMigrationStateTypeSchema = exports.NapMigrationStateType = exports.BusinessUserTypeSchema = exports.BusinessUserType = exports.LoginStatusSchema = exports.LoginStatus = exports.hasNAPData = exports.hasNapAuthInfo = exports.encodeAuthData = exports.decodeAuthData = exports.AuthServiceLevel = void 0;
const conduit_auth_shared_1 = require("conduit-auth-shared");
const conduit_core_1 = require("conduit-core");
const conduit_nap_1 = require("conduit-nap");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
var conduit_auth_shared_2 = require("conduit-auth-shared");
Object.defineProperty(exports, "AuthServiceLevel", { enumerable: true, get: function () { return conduit_auth_shared_2.AuthServiceLevel; } });
Object.defineProperty(exports, "decodeAuthData", { enumerable: true, get: function () { return conduit_auth_shared_2.decodeAuthData; } });
Object.defineProperty(exports, "encodeAuthData", { enumerable: true, get: function () { return conduit_auth_shared_2.encodeAuthData; } });
Object.defineProperty(exports, "hasNapAuthInfo", { enumerable: true, get: function () { return conduit_auth_shared_2.hasNapAuthInfo; } });
Object.defineProperty(exports, "hasNAPData", { enumerable: true, get: function () { return conduit_auth_shared_2.hasNAPData; } });
const logger = conduit_utils_1.createLogger('conduit:Auth');
var LoginStatus;
(function (LoginStatus) {
    LoginStatus["UNKNOWN"] = "UNKNOWN";
    LoginStatus["INVALID_FORMAT"] = "INVALID_FORMAT";
    LoginStatus["NOT_FOUND"] = "NOT_FOUND";
    LoginStatus["INVITE_PENDING"] = "INVITE_PENDING";
    LoginStatus["PASSWORD_RESET"] = "PASSWORD_RESET";
    LoginStatus["PASSWORD"] = "PASSWORD";
    LoginStatus["SSO"] = "SSO";
})(LoginStatus = exports.LoginStatus || (exports.LoginStatus = {}));
exports.LoginStatusSchema = conduit_utils_1.Enum(LoginStatus, 'LoginStatus');
var BusinessUserType;
(function (BusinessUserType) {
    BusinessUserType["UNKNOWN"] = "UNKNOWN";
    BusinessUserType["PERSONAL_ONLY"] = "PERSONAL_ONLY";
    BusinessUserType["LEGACY"] = "LEGACY";
    BusinessUserType["BUSINESS_ONLY"] = "BUSINESS_ONLY";
})(BusinessUserType = exports.BusinessUserType || (exports.BusinessUserType = {}));
exports.BusinessUserTypeSchema = conduit_utils_1.Enum(BusinessUserType, 'BusinessUserType');
var NapMigrationStateType;
(function (NapMigrationStateType) {
    NapMigrationStateType["UNKNOWN"] = "UNKNOWN";
    NapMigrationStateType["LEGACY"] = "LEGACY";
    NapMigrationStateType["MIGRATE_ON_LOGIN"] = "MIGRATE_ON_LOGIN";
    NapMigrationStateType["MIGRATED"] = "MIGRATED";
    NapMigrationStateType["MIGRATION_FAILED"] = "MIGRATION_FAILED";
    NapMigrationStateType["MIGRATED_NAP_ONLY"] = "MIGRATED_NAP_ONLY";
    NapMigrationStateType["NOT_FOUND"] = "NOT_FOUND";
})(NapMigrationStateType = exports.NapMigrationStateType || (exports.NapMigrationStateType = {}));
exports.NapMigrationStateTypeSchema = conduit_utils_1.Enum(NapMigrationStateType, 'NapMigrationStateType');
var ServiceProvider;
(function (ServiceProvider) {
    ServiceProvider["GOOGLE"] = "GOOGLE";
    ServiceProvider["FACEBOOK"] = "FACEBOOK";
})(ServiceProvider = exports.ServiceProvider || (exports.ServiceProvider = {}));
exports.ServiceProviderSchema = conduit_utils_1.Enum(ServiceProvider, 'ServiceProvider');
exports.SERVICE_PROVIDER_STRING_TO_ENUM = {
    GOOGLE: en_conduit_sync_types_1.TServiceProvider.GOOGLE,
    FACEBOOK: en_conduit_sync_types_1.TServiceProvider.FACEBOOK,
};
const THRIFT_LOGIN_STATUS_CONVERTER = {
    [en_conduit_sync_types_1.TLoginStatus.UNKNOWN]: LoginStatus.UNKNOWN,
    [en_conduit_sync_types_1.TLoginStatus.INVALID_FORMAT]: LoginStatus.INVALID_FORMAT,
    [en_conduit_sync_types_1.TLoginStatus.NOT_FOUND]: LoginStatus.NOT_FOUND,
    [en_conduit_sync_types_1.TLoginStatus.INVITE_PENDING]: LoginStatus.INVITE_PENDING,
    [en_conduit_sync_types_1.TLoginStatus.PASSWORD_RESET]: LoginStatus.PASSWORD_RESET,
    [en_conduit_sync_types_1.TLoginStatus.PASSWORD]: LoginStatus.PASSWORD,
    [en_conduit_sync_types_1.TLoginStatus.SSO]: LoginStatus.SSO,
};
const THRIFT_BUSINESS_USER_TYPE_CONVERTER = {
    [en_conduit_sync_types_1.TBusinessUserType.UNKNOWN]: BusinessUserType.UNKNOWN,
    [en_conduit_sync_types_1.TBusinessUserType.PERSONAL_ONLY]: BusinessUserType.PERSONAL_ONLY,
    [en_conduit_sync_types_1.TBusinessUserType.LEGACY]: BusinessUserType.LEGACY,
    [en_conduit_sync_types_1.TBusinessUserType.BUSINESS_ONLY]: BusinessUserType.BUSINESS_ONLY,
};
var TokenRefreshSource;
(function (TokenRefreshSource) {
    TokenRefreshSource["NAP"] = "NAP";
    TokenRefreshSource["Monolith"] = "Monolith";
})(TokenRefreshSource = exports.TokenRefreshSource || (exports.TokenRefreshSource = {}));
class RefreshUserTokenError extends Error {
    constructor(tokenRefreshSource) {
        super(`${tokenRefreshSource === TokenRefreshSource.NAP ? 'Monolith Token from NAP' : 'JWT from monolith'} is expired`);
        this.tokenRefreshSource = tokenRefreshSource;
        this.name = 'RefreshUserTokenError';
    }
}
exports.RefreshUserTokenError = RefreshUserTokenError;
class RevalidateShareError extends Error {
    constructor(type, shareGuid) {
        super(`Shared${type} needs validation`);
        this.type = type;
        this.shareGuid = shareGuid;
    }
}
exports.RevalidateShareError = RevalidateShareError;
exports.OAuthCredentialSchema = conduit_utils_1.Struct({
    serviceId: conduit_utils_1.NullableNumber,
    oAuthVersion: conduit_utils_1.NullableNumber,
    accessToken: conduit_utils_1.NullableString,
    scope: conduit_utils_1.NullableString,
    created: conduit_utils_1.NullableTimestamp,
    updated: conduit_utils_1.NullableTimestamp,
    expires: conduit_utils_1.NullableTimestamp,
    refreshAfter: conduit_utils_1.NullableNumber,
    instanceUrl: conduit_utils_1.NullableUrl,
}, 'OAuthCredential');
async function handleAuthResult(trc, authResult, thriftHost, urlHost, userSlot, allowFacadeAsPersonal, thriftComm) {
    var _a, _b, _c, _d;
    if (authResult.err instanceof conduit_utils_1.AuthError) {
        let usernameOrEmail = null;
        switch (authResult.err.errorCode) {
            case conduit_utils_1.AuthErrorCode.SSO_AUTHENTICATION_REQUIRED:
                usernameOrEmail = authResult.err.parameter || null;
            case conduit_utils_1.AuthErrorCode.BUSINESS_SECURITY_LOGIN_REQUIRED:
                return {
                    token: null,
                    state: conduit_view_types_1.AuthState.NeedSSO,
                    secondFactorDeliveryHint: null,
                    usernameOrEmail,
                    user: null,
                    vaultUser: null,
                    secondFactorTempToken: null,
                };
            case conduit_utils_1.AuthErrorCode.AUTH_EXPIRED:
                return {
                    token: null,
                    state: conduit_view_types_1.AuthState.Expired,
                    secondFactorDeliveryHint: null,
                    usernameOrEmail: null,
                    user: null,
                    vaultUser: null,
                    secondFactorTempToken: null,
                };
            case conduit_utils_1.AuthErrorCode.PASSWORD_RESET_REQUIRED:
                return {
                    token: null,
                    state: conduit_view_types_1.AuthState.PasswordResetRequired,
                    secondFactorDeliveryHint: null,
                    usernameOrEmail: null,
                    user: null,
                    vaultUser: null,
                    secondFactorTempToken: null,
                };
        }
    }
    if (authResult.err) {
        throw authResult.err;
    }
    if (!authResult.data) {
        throw new Error('Missing auth data');
    }
    const auth = await en_thrift_connector_1.authDataFromAuthResult(trc, authResult.data, thriftHost, urlHost, userSlot, thriftComm, { jwt: '' }, allowFacadeAsPersonal);
    // Auth flow does not return JWT yet, but we need it to talk to certain services.
    const jwtRes = await conduit_utils_1.withError(refreshJWTFromMonolith(trc, conduit_auth_shared_1.decodeAuthData(conduit_auth_shared_1.encodeAuthData(auth.data)), thriftComm));
    return {
        token: (_b = (_a = jwtRes.data) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : conduit_auth_shared_1.encodeAuthData(auth.data),
        state: (_d = (_c = jwtRes.data) === null || _c === void 0 ? void 0 : _c.state) !== null && _d !== void 0 ? _d : auth.state,
        secondFactorDeliveryHint: auth.secondFactorDeliveryHint,
        usernameOrEmail: null,
        user: auth.user,
        vaultUser: auth.vaultUser,
        secondFactorTempToken: auth.secondFactorTempToken,
    };
}
function convertNapMigrationState(migrationState) {
    switch (migrationState) {
        case en_conduit_sync_types_1.TNapMigrationState.LEGACY: return NapMigrationStateType.LEGACY;
        case en_conduit_sync_types_1.TNapMigrationState.MIGRATED: return NapMigrationStateType.MIGRATED;
        case en_conduit_sync_types_1.TNapMigrationState.MIGRATED_NAP_ONLY: return NapMigrationStateType.MIGRATED_NAP_ONLY;
        case en_conduit_sync_types_1.TNapMigrationState.MIGRATE_ON_LOGIN: return NapMigrationStateType.MIGRATE_ON_LOGIN;
        case en_conduit_sync_types_1.TNapMigrationState.MIGRATION_FAILED: return NapMigrationStateType.MIGRATION_FAILED;
        case en_conduit_sync_types_1.TNapMigrationState.UNKNOWN:
        default: return NapMigrationStateType.UNKNOWN;
    }
}
async function getLoginInfo(trc, thriftComm, thriftHost, urlHost, clientName, usernameOrEmail, tokenPayload) {
    var _a;
    if (!usernameOrEmail && !tokenPayload) {
        throw new Error('No token or username');
    }
    const userStore = thriftComm.getUserStore(`${thriftHost}/edam/user`);
    logger.info('Checking client version');
    // first check if client version is compatible
    if (!await userStore.checkVersion(trc, clientName)) {
        throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.CLIENT_NOT_SUPPORTED, '', `client ${clientName} checkVersion failed`);
    }
    // assuming only google as service provider for now
    const req = usernameOrEmail
        ? { usernameOrEmail }
        : { openIdCredential: { tokenPayload: tokenPayload, serviceProvider: en_conduit_sync_types_1.TServiceProvider.GOOGLE } };
    logger.info('Requesting user login information');
    const res = await userStore.getLoginInfo(trc, req);
    const pendingInvites = [];
    if (res.pendingInvites && res.pendingInvites.length) {
        for (const invite of res.pendingInvites) {
            if (invite.businessId !== undefined && invite.businessId !== null) {
                pendingInvites.push(invite.businessId);
            }
        }
    }
    logger.info('GetLoginInfo executed, returning');
    return {
        loginStatus: res.loginStatus && THRIFT_LOGIN_STATUS_CONVERTER[res.loginStatus] || LoginStatus.NOT_FOUND,
        businessUserType: res.businessUserType && THRIFT_BUSINESS_USER_TYPE_CONVERTER[res.businessUserType] || BusinessUserType.UNKNOWN,
        pendingInvites,
        facadeEnabled: Boolean(res.facadeEnabled),
        napMigrationState: res.napMigrationState && convertNapMigrationState(res.napMigrationState) || NapMigrationStateType.NOT_FOUND,
        signedUsernameOrEmail: (_a = res.signedUsernameOrEmail) !== null && _a !== void 0 ? _a : null,
    };
}
exports.getLoginInfo = getLoginInfo;
async function login(trc, thriftComm, thriftHost, urlHost, credentials, allowFacadeAsPersonal) {
    const userStore = thriftComm.getUserStore(`${thriftHost}/edam/user`);
    const thriftParams = new en_conduit_sync_types_1.TAuthenticationParameters(Object.assign(Object.assign({}, credentials), { supportsBusinessOnlyAccounts: true, supportsTwoFactor: true }));
    const authResult = await conduit_utils_1.withError(userStore.authenticateLongSessionV2(trc, thriftParams));
    return await handleAuthResult(trc, authResult, thriftHost, urlHost, null, allowFacadeAsPersonal, thriftComm);
}
exports.login = login;
async function loginWithNAPInternal(trc, thriftComm, { serviceHost: defaultHost, serviceToken: monolithToken, accessToken: jwt, refreshToken, napAuthUrl, napClientId, napRedirectUri, }, credentials) {
    const serviceHost = defaultHost; // TODO allow host override from usernameOrEmail
    const utilityStore = thriftComm.getUtilityStore(`${serviceHost}/utility`);
    const user = await utilityStore.getUser(trc, monolithToken);
    const urls = await utilityStore.getUserUrls(trc, monolithToken);
    const authData = {
        user,
        urls,
        authenticationToken: monolithToken,
    };
    const napInfo = {
        jwt,
        refreshToken,
        authUrl: napAuthUrl,
        clientID: napClientId,
        redirectUri: napRedirectUri,
    };
    const auth = await en_thrift_connector_1.authDataFromAuthResult(trc, authData, serviceHost, serviceHost, null, thriftComm, napInfo, false);
    if (!auth.data.urls.utilityUrl) {
        throw new conduit_utils_1.InternalError('Cannot register current session to the service');
    }
    await registerSession(trc, utilityStore, monolithToken, napClientId, refreshToken, credentials);
    return {
        token: conduit_auth_shared_1.encodeAuthData(auth.data),
        state: auth.state,
        secondFactorDeliveryHint: auth.secondFactorDeliveryHint,
        usernameOrEmail: null,
        user: auth.user,
        vaultUser: auth.vaultUser,
        secondFactorTempToken: auth.secondFactorTempToken,
    };
}
async function loginWithNAP(trc, thriftComm, napLoginArgs, credentials, httpClient) {
    async function revokeNAP() {
        await revokeNAPToken(trc, httpClient, {
            refreshToken: napLoginArgs.refreshToken,
            authUrl: napLoginArgs.napAuthUrl,
            clientID: napLoginArgs.napClientId,
        });
    }
    let retryNum = 3;
    while (retryNum > 0) {
        try {
            return await loginWithNAPInternal(trc, thriftComm, napLoginArgs, credentials);
        }
        catch (error) {
            if (error instanceof conduit_utils_1.RetryError) {
                retryNum--;
                await conduit_utils_1.sleep(error.timeout);
            }
            else {
                await revokeNAP();
                throw error;
            }
        }
    }
    await revokeNAP();
    throw new conduit_utils_1.ServiceError('Auth', 'ServiceError', 'Failed to login');
}
exports.loginWithNAP = loginWithNAP;
async function loginWithTwoFactor(trc, thriftComm, thriftHost, urlHost, secondFactorTempToken, credentials) {
    if (!secondFactorTempToken) {
        return {
            token: null,
            state: conduit_view_types_1.AuthState.NoAuth,
            secondFactorDeliveryHint: null,
            usernameOrEmail: null,
            user: null,
            vaultUser: null,
            secondFactorTempToken: null,
        };
    }
    const userStore = thriftComm.getUserStore(`${thriftHost}/edam/user`);
    const authResult = await conduit_utils_1.withError(userStore.completeTwoFactorAuthentication(trc, secondFactorTempToken, credentials.oneTimeCode, credentials.deviceIdentifier, credentials.deviceDescription));
    return await handleAuthResult(trc, authResult, thriftHost, urlHost, null, false, thriftComm);
}
exports.loginWithTwoFactor = loginWithTwoFactor;
async function loginWithExistingAuth(trc, thriftComm, thriftHost, urlHost, existingAuth, userSlot) {
    if (existingAuth.token && (existingAuth.state === conduit_view_types_1.AuthState.Authorized || existingAuth.state === conduit_view_types_1.AuthState.ClientNotSupported)) {
        // validate existing auth
        const existingAuthData = conduit_auth_shared_1.decodeAuthData(existingAuth.token);
        const utilityStore = thriftComm.getUtilityStore(existingAuthData.urls.utilityUrl);
        const currentUser = await conduit_utils_1.withError(utilityStore.getUser(trc, existingAuthData.token));
        if (currentUser.err instanceof conduit_utils_1.AuthError) {
            // handled in ConduitCore
            throw currentUser.err;
        }
        if (currentUser.err instanceof conduit_utils_1.RetryError) {
            // if offline, assume existing auth is still good until proven otherwise
            return undefined;
        }
        if (currentUser.err) {
            logger.warn('loginWithExistingAuth: getUser returned an error', currentUser.err);
            return {
                token: existingAuth.token,
                state: conduit_view_types_1.AuthState.BadAuthToken,
                secondFactorDeliveryHint: null,
                usernameOrEmail: null,
                user: null,
                vaultUser: null,
                secondFactorTempToken: null,
            };
        }
        // check if our cookie token is for the same user as our existing auth
        if (existingAuthData.userID === currentUser.data.id && existingAuth.state !== conduit_view_types_1.AuthState.ClientNotSupported) {
            return undefined;
        }
        // no match, our current DB is for a different user
        if (existingAuthData.userID !== currentUser.data.id) {
            logger.warn('loginWithExistingAuth: userID in local DB no longer matches the userID for the current auth token', {
                oldUserID: existingAuthData.userID,
                newUserID: currentUser.data.id,
            });
        }
        if (existingAuth.state === conduit_view_types_1.AuthState.ClientNotSupported) {
            logger.debug('Recovering auth state from ClientNotSupported');
        }
        return {
            token: existingAuth.token,
            state: existingAuth.state === conduit_view_types_1.AuthState.ClientNotSupported ? conduit_view_types_1.AuthState.Authorized : conduit_view_types_1.AuthState.UserChanged,
            secondFactorDeliveryHint: null,
            usernameOrEmail: null,
            user: null,
            vaultUser: null,
            secondFactorTempToken: null,
        };
    }
    else {
        // login with service token in cookie (empty token)
        return await loginWithServiceToken(trc, thriftComm, thriftHost, urlHost, '', userSlot, false);
    }
}
exports.loginWithExistingAuth = loginWithExistingAuth;
async function loginWithAuthInQueue(trc, thriftComm, existingAuth) {
    if (!existingAuth.token) {
        throw Error('No existing token');
    }
    // validate existing auth
    const existingAuthData = conduit_auth_shared_1.decodeAuthData(existingAuth.token);
    const utilityStore = thriftComm.getUtilityStore(existingAuthData.urls.utilityUrl);
    const currentUser = await conduit_utils_1.withError(utilityStore.getUser(trc, existingAuthData.token));
    if (currentUser.err instanceof conduit_utils_1.AuthError) {
        // handled in ConduitCore
        throw currentUser.err;
    }
    if (currentUser.err instanceof conduit_utils_1.RetryError) {
        // if offline, assume existing auth is still good until proven otherwise
        return undefined;
    }
    if (currentUser.err) {
        logger.warn('loginWithExistingAuth: getUser returned an error', currentUser.err);
        return {
            token: existingAuth.token,
            state: conduit_view_types_1.AuthState.BadAuthToken,
            secondFactorDeliveryHint: null,
            usernameOrEmail: null,
            user: null,
            vaultUser: null,
            secondFactorTempToken: null,
        };
    }
    if (existingAuth.state === conduit_view_types_1.AuthState.ClientNotSupported) {
        logger.debug('Recovering auth state from ClientNotSupported');
    }
    const authResult = {
        authenticationToken: existingAuthData.token,
        user: currentUser.data,
        urls: conduit_auth_shared_1.fixupAuthServiceUrls(await utilityStore.getUserUrls(trc, existingAuthData.token), existingAuthData.thriftHost, existingAuthData.urlHost),
    };
    const auth = await en_thrift_connector_1.authDataFromAuthResult(trc, authResult, existingAuthData.thriftHost, existingAuthData.urlHost, null, thriftComm, { jwt: '' }, false);
    const authState = existingAuth.state === conduit_view_types_1.AuthState.ClientNotSupported || existingAuth.state === conduit_view_types_1.AuthState.Authorized ?
        conduit_view_types_1.AuthState.Authorized :
        conduit_view_types_1.AuthState.UserChanged;
    return {
        token: conduit_auth_shared_1.encodeAuthData(auth.data),
        state: authState,
        secondFactorDeliveryHint: auth.secondFactorDeliveryHint,
        usernameOrEmail: null,
        user: auth.user,
        vaultUser: auth.vaultUser,
        secondFactorTempToken: auth.secondFactorTempToken,
    };
}
exports.loginWithAuthInQueue = loginWithAuthInQueue;
async function loginWithServiceToken(trc, thriftComm, thriftHost, urlHost, serviceToken, userSlot, allowFacadeAsPersonal) {
    var _a, _b, _c, _d;
    // If using cookie to login and passed in a userSlot, use it.
    const utilityUrl = userSlot !== null && serviceToken === ''
        ? `${thriftHost}/u/${userSlot}/utility`
        : `${thriftHost}/utility`;
    const utilityStore = thriftComm.getUtilityStore(utilityUrl);
    const user = await utilityStore.getUser(trc, serviceToken);
    const urls = await utilityStore.getUserUrls(trc, serviceToken);
    const authResult = {
        authenticationToken: serviceToken,
        user,
        urls,
    };
    const auth = await en_thrift_connector_1.authDataFromAuthResult(trc, authResult, thriftHost, urlHost, userSlot, thriftComm, { jwt: '' }, allowFacadeAsPersonal);
    // Auth flow does not return JWT yet, but we need it to talk to certain services.
    const jwtRes = await conduit_utils_1.withError(refreshJWTFromMonolith(trc, conduit_auth_shared_1.decodeAuthData(conduit_auth_shared_1.encodeAuthData(auth.data)), thriftComm));
    return {
        token: (_b = (_a = jwtRes.data) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : conduit_auth_shared_1.encodeAuthData(auth.data),
        state: (_d = (_c = jwtRes.data) === null || _c === void 0 ? void 0 : _c.state) !== null && _d !== void 0 ? _d : auth.state,
        secondFactorDeliveryHint: auth.secondFactorDeliveryHint,
        usernameOrEmail: null,
        user: auth.user,
        userID: auth.data.userID,
        vaultUser: auth.vaultUser,
        secondFactorTempToken: auth.secondFactorTempToken,
    };
}
exports.loginWithServiceToken = loginWithServiceToken;
function createSignupError(object) {
    let errorCode = conduit_utils_1.SignupErrorCode.UNKNOWN;
    let message = '';
    switch (object.code) {
        case 'registrationAction.email.conflict':
            errorCode = conduit_utils_1.SignupErrorCode.EMAIL_CONFLICT;
            message = 'Email already exists on the service.';
            break;
        case 'registrationAction.captia':
            errorCode = conduit_utils_1.SignupErrorCode.CAPTCHA;
            message = 'CAPTCHA required for signup.';
            break;
        case 'AbstractRegistrationAction.error.accountFailed':
            errorCode = conduit_utils_1.SignupErrorCode.ACCOUNT_FAILED;
            message = 'Failed to generate a username, try again.';
            break;
        case 'registrationAction.email.deactivated':
            errorCode = conduit_utils_1.SignupErrorCode.DEACTIVATED;
            message = 'Account has been closed.';
            break;
        case 'registrationAction.email.invalid':
        case 'validation.mask.valueDoesNotMatch':
            errorCode = conduit_utils_1.SignupErrorCode.USERNAME_OR_EMAIL_INVALID;
            message = 'Invalid Format';
            break;
        case 'openid.associate':
            errorCode = conduit_utils_1.SignupErrorCode.OPENID_EMAIL_CONFLICT;
            message = 'Account already exists with OpenID email';
            break;
        case 'openid.conflict':
            errorCode = conduit_utils_1.SignupErrorCode.OPENID_CONFLICT;
            message = 'OpenID associated with different account';
            break;
        case 'openid.already.associated':
            errorCode = conduit_utils_1.SignupErrorCode.OPENID_ASSOCIATED;
            message = 'Different email address associated with same OpenID provider';
            break;
        case 'validation.minlength.valueTooShort':
            errorCode = conduit_utils_1.SignupErrorCode.INVALID_PASSWORD;
            message = 'Password must be at least 6 characters long.Password can contain letters, numbers and punctuation.';
            break;
        default:
            break;
    }
    return new conduit_utils_1.SignupError(errorCode, message);
}
async function newUserSignup(trc, httpTransport, thriftHost, urlHost, credentials) {
    const params = {
        method: 'POST',
        url: thriftHost,
        path: '/CreateUserJSON.action',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
    };
    let query = {};
    if (credentials.usernameOrEmail && credentials.password) {
        query = {
            code: credentials.referrerCode,
            email: credentials.usernameOrEmail,
            password: credentials.password,
            createNoUsername: 'true',
            terms: 'true',
        };
    }
    else if (credentials.openIdCredential) {
        query = {
            code: credentials.referrerCode,
            openIdPayload: credentials.openIdCredential.tokenPayload,
            openIdServiceProvider: credentials.openIdCredential.serviceProvider === en_conduit_sync_types_1.TServiceProvider.FACEBOOK ? 'FACEBOOK' : 'GOOGLE',
            openidRegister: 'true',
            terms: 'true',
        };
    }
    else {
        throw new conduit_utils_1.SignupError(conduit_utils_1.SignupErrorCode.CREDENTIALS_INVALID, `Invalid credentials for user signup ${conduit_utils_1.safeStringify(credentials)}`);
    }
    params.body = conduit_utils_1.toQueryString(query);
    const resp = await httpTransport.request(trc, params);
    let respJson = {};
    try {
        respJson = JSON.parse(resp.result || '');
    }
    catch (err) {
        throw new Error(`user signup response json parse failed ${conduit_utils_1.safeStringify(resp)}`);
    }
    if (!respJson.success) {
        if (respJson.errors && Array.isArray(respJson.errors)) {
            throw createSignupError(respJson.errors[0]);
        }
        else {
            throw new conduit_utils_1.SignupError(conduit_utils_1.SignupErrorCode.UNKNOWN, `User signup failed ${conduit_utils_1.safeStringify(respJson.errors)}`);
        }
    }
}
async function userSignupandLogin(trc, thriftComm, httpTransport, thriftHost, urlHost, credentials) {
    await newUserSignup(trc, httpTransport, thriftHost, urlHost, credentials);
    // login user after successful signup
    return login(trc, thriftComm, thriftHost, urlHost, credentials, false);
}
exports.userSignupandLogin = userSignupandLogin;
async function logoutThrift(trc, thriftComm, authString) {
    const auth = conduit_auth_shared_1.decodeAuthData(authString);
    if (!auth.token) {
        return;
    }
    const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
    await utilityStore.revokeLongSession(trc, auth.token);
}
exports.logoutThrift = logoutThrift;
async function revokeSDMSSession(trc, thriftComm, authData, clientCredentials) {
    if (!conduit_auth_shared_1.hasNAPData(authData)) {
        logger.info('No NAP info found. Cannot revoke the session');
        return;
    }
    const utilityStore = thriftComm.getUtilityStore(authData.urls.utilityUrl);
    let retryNum = 3;
    while (retryNum > 0) {
        try {
            await utilityStore.revokeSession(trc, new en_conduit_sync_types_1.TRevokeSessionRequest({
                authenticationToken: authData.token,
                clientId: authData.napAuthInfo.clientID,
                consumerKey: clientCredentials.consumerKey,
                deviceIdentifier: clientCredentials.deviceIdentifier,
            }));
            return;
        }
        catch (err) {
            retryNum--;
            if (err instanceof conduit_utils_1.RetryError && retryNum > 0) {
                logger.info('Retrying to revoke the current session.');
                await conduit_utils_1.sleep(err.timeout);
            }
            else {
                throw err;
            }
        }
    }
    throw new Error('Failed to revoke the current session');
}
exports.revokeSDMSSession = revokeSDMSSession;
async function revokeNAPToken(trc, httpClient, { clientID, authUrl, refreshToken, }) {
    const configuration = await conduit_nap_1.fetchNAPConfiguration(trc, authUrl, new conduit_nap_1.ConduitHttpRequestor(httpClient));
    if (!configuration.revocationEndpoint) {
        logger.warn('No revocation endpoint from the server');
        return;
    }
    const revokeTokenRequest = new conduit_nap_1.RevokeTokenRequest({ token: refreshToken, client_id: clientID, token_type_hint: 'refresh_token' });
    const tokenHandler = new conduit_nap_1.BaseTokenRequestHandler(new conduit_nap_1.ConduitHttpRequestor(httpClient));
    await tokenHandler.performRevokeTokenRequest(configuration, revokeTokenRequest);
}
exports.revokeNAPToken = revokeNAPToken;
async function logoutNap(trc, authData, httpClient) {
    const defaultResult = {
        res: false,
    };
    if (!httpClient) {
        logger.warn('No Http Client');
        return defaultResult;
    }
    if (!conduit_auth_shared_1.hasNAPData(authData)) {
        logger.info('No NAP info');
        return defaultResult;
    }
    await revokeNAPToken(trc, httpClient, authData.napAuthInfo);
    return { res: true, napAuthUrl: authData.napAuthInfo.authUrl };
}
async function acquireSessionToken(trc, thriftComm, existingAuth) {
    if (!existingAuth.token) {
        throw new Error('Unable to request session token when not logged in');
    }
    const auth = conduit_auth_shared_1.decodeAuthData(existingAuth.token);
    if (!auth.token) {
        throw new Error('Unable to request session token when not logged in');
    }
    const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
    return utilityStore.createSessionAuthenticationToken(trc, auth.token);
}
exports.acquireSessionToken = acquireSessionToken;
async function getUser(trc, thriftComm, auth) {
    const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
    const userRes = await conduit_utils_1.withError(utilityStore.getUser(trc, auth.token));
    if (userRes.err && !(userRes.err instanceof conduit_utils_1.RetryError)) {
        throw userRes.err;
    }
    if (userRes.data) {
        if (!userRes.data || !userRes.data.id) {
            throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.NO_USER, auth.token);
        }
        if (userRes.data.id !== auth.userID) {
            throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.USER_CHANGED, auth.token);
        }
        return userRes.data;
    }
}
exports.getUser = getUser;
function authErrorCodeToState(errorCode) {
    switch (errorCode) {
        case conduit_utils_1.AuthErrorCode.USER_CHANGED:
            return conduit_view_types_1.AuthState.UserChanged;
        case conduit_utils_1.AuthErrorCode.AUTH_EXPIRED:
            return conduit_view_types_1.AuthState.Expired;
        case conduit_utils_1.AuthErrorCode.SSO_AUTHENTICATION_REQUIRED:
        case conduit_utils_1.AuthErrorCode.BUSINESS_SECURITY_LOGIN_REQUIRED:
            return conduit_view_types_1.AuthState.NeedSSO;
    }
    return conduit_view_types_1.AuthState.BadAuthToken;
}
async function revalidateSyncContextAuth(trc, thriftComm, syncContext, metadata, allMetadata, origErr) {
    logger.info('revalidateSyncContextAuth', syncContext);
    function asServiceError(tokenType) {
        logger.info('revalidateSyncContextAuth: Auth still valid ', tokenType);
        if (origErr.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED) {
            return new conduit_utils_1.ServiceError('PERMISSION_DENIED', origErr.parameter || '', origErr.message);
        }
        return new conduit_utils_1.ServiceError('WRONG_AUTH', tokenType);
    }
    const oldAuthData = conduit_auth_shared_1.decodeAuthData(metadata.authToken);
    if (metadata.isUser) {
        // call getUser and see if the auth token is actually invalid
        const userRes = await conduit_utils_1.withError(getUser(trc, thriftComm, oldAuthData));
        if (userRes.err instanceof conduit_utils_1.AuthError) {
            // monolith token issued from NAP could be expired
            if (conduit_auth_shared_1.hasNAPData(oldAuthData)) {
                throw new RefreshUserTokenError(TokenRefreshSource.NAP);
            }
            const userID = oldAuthData.userID;
            // token invalid, return appropriate AuthState and leave token alone
            return {
                userID,
                token: null,
                state: authErrorCodeToState(userRes.err.errorCode),
            };
        }
        if (userRes.data) {
            if (!conduit_auth_shared_1.hasNAPData(oldAuthData) && origErr.errorCode === conduit_utils_1.AuthErrorCode.JWT_AUTH_EXPIRED) {
                // when using monolith auth, jwt will be used for authentication to API GW.
                // getUser will succeed in these cases but jwt might have expired.
                throw new RefreshUserTokenError(TokenRefreshSource.Monolith);
            }
            else {
                // still valid, throw ServiceError
                throw asServiceError('UserAuthToken');
            }
        }
        // some other error happened
        throw userRes.err;
    }
    const userMetadata = allMetadata[conduit_core_1.PERSONAL_USER_CONTEXT];
    if (!userMetadata) {
        // no matching syncContext found; return null to indicate that the original AuthError is still correct
        return null;
    }
    const userAuthData = conduit_auth_shared_1.decodeAuthData(userMetadata.authToken);
    if (metadata.isVaultUser) {
        // call getUser and see if the auth token is actually invalid
        const userRes = await conduit_utils_1.withError(getUser(trc, thriftComm, oldAuthData));
        if (userRes.data) {
            // still valid, throw ServiceError
            throw asServiceError('VaultAuthToken');
        }
        // The refreshed vault auth data is part of current user's auth data.
        // Hence, we DO NOT want to identify this data as the data of the user ID from the `metadata` argument, which is the vault user ID.
        // We want the vault data here to be identified as current user's auth data.
        const userID = userAuthData.userID;
        // reauthorize to business
        const utilityStore = thriftComm.getUtilityStore(userAuthData.urls.utilityUrl);
        const vaultRes = await conduit_utils_1.withError(en_thrift_connector_1.authenticateToBusiness(trc, userAuthData.token, userAuthData.thriftHost, userAuthData.urlHost, null, utilityStore, thriftComm));
        if (vaultRes.err instanceof conduit_utils_1.AuthError) {
            return {
                userID,
                token: null,
                state: authErrorCodeToState(vaultRes.err.errorCode),
            };
        }
        if (vaultRes.err) {
            throw vaultRes.err;
        }
        userAuthData.vaultAuth = vaultRes.data.data;
        logger.info('revalidateSyncContextAuth: refreshed business auth token');
        // encode new auth data and return it
        // no need to update syncContext metadata, that will happen on next sync
        return {
            userID,
            state: conduit_view_types_1.AuthState.Authorized,
            token: conduit_auth_shared_1.encodeAuthData(userAuthData),
        };
    }
    if (metadata.sharedNotebookGlobalID) {
        // call getSharedNotebookByAuth and see if the auth token is actually invalid
        const noteStore = thriftComm.getNoteStore(metadata.sharedNotebookNoteStoreUrl);
        const sharedNotebookRes = await conduit_utils_1.withError(noteStore.getSharedNotebookByAuth(trc, oldAuthData.token));
        if (sharedNotebookRes.data) {
            // still valid, throw ServiceError
            throw asServiceError('SharedNotebookAuthToken');
        }
        if (en_thrift_connector_1.isRevokedShareForNoteOrNotebook(sharedNotebookRes.err)) {
            // revoked after being shared, throw error up to ThriftSync for handling
            throw new RevalidateShareError(en_core_entity_types_1.CoreEntityTypes.Notebook, metadata.sharedNotebookGlobalID);
        }
        if (sharedNotebookRes.err instanceof conduit_utils_1.AuthError && sharedNotebookRes.err.errorCode === conduit_utils_1.AuthErrorCode.AUTH_EXPIRED) {
            // need to reauthenticate
            throw new RevalidateShareError(en_core_entity_types_1.CoreEntityTypes.Notebook, metadata.sharedNotebookGlobalID);
        }
        // some other error happened
        throw sharedNotebookRes.err;
    }
    if (metadata.sharedNoteID) {
        const noteStore = thriftComm.getNoteStore(metadata.sharedNotebookNoteStoreUrl);
        const sharedNoteRes = await conduit_utils_1.withError(noteStore.getNoteWithResultSpec(trc, oldAuthData.token, metadata.sharedNoteID, {}));
        if (sharedNoteRes.data) {
            // still valid, throw ServiceError
            throw asServiceError('SharedNoteAuthToken');
        }
        if (en_thrift_connector_1.isRevokedShareForNoteOrNotebook(sharedNoteRes.err)) {
            throw new RevalidateShareError(en_core_entity_types_1.CoreEntityTypes.Note, metadata.sharedNoteID);
        }
        if (sharedNoteRes.err instanceof conduit_utils_1.AuthError && sharedNoteRes.err.errorCode === conduit_utils_1.AuthErrorCode.AUTH_EXPIRED) {
            // need to reauthenticate
            throw new RevalidateShareError(en_core_entity_types_1.CoreEntityTypes.Note, metadata.sharedNoteID);
        }
        // some other error happened
        throw sharedNoteRes.err;
    }
    return null;
}
exports.revalidateSyncContextAuth = revalidateSyncContextAuth;
async function fixupAuth(trc, thriftComm, tokenAndState) {
    if (!tokenAndState.token || (tokenAndState.state !== conduit_view_types_1.AuthState.Authorized && tokenAndState.state !== conduit_view_types_1.AuthState.ClientNotSupported)) {
        return null;
    }
    const auth = conduit_auth_shared_1.decodeAuthData(tokenAndState.token);
    // fixup missing businessID
    const missingBusiness = auth.vaultAuth && !auth.businessID;
    const unsupportedClient = tokenAndState.state === conduit_view_types_1.AuthState.ClientNotSupported;
    if (missingBusiness || unsupportedClient) {
        const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
        const res = await conduit_utils_1.withError(utilityStore.getUser(trc, auth.token));
        if (res.err) {
            if (res.err instanceof conduit_utils_1.AuthError && res.err.errorCode === conduit_utils_1.AuthErrorCode.CLIENT_NOT_SUPPORTED) {
                return tokenAndState;
            }
            // could be offline, in which case we can't fixup the auth token... just bump the problem back up to the client for now
            return {
                userID: tokenAndState.userID,
                token: null,
                state: conduit_view_types_1.AuthState.BadAuthToken,
            };
        }
        if (missingBusiness) {
            auth.businessID = res.data.businessUserInfo && res.data.businessUserInfo.businessId || null;
        }
        return {
            userID: tokenAndState.userID,
            token: conduit_auth_shared_1.encodeAuthData(auth),
            state: tokenAndState.state === conduit_view_types_1.AuthState.ClientNotSupported ? conduit_view_types_1.AuthState.Authorized : tokenAndState.state,
        };
    }
    return null;
}
exports.fixupAuth = fixupAuth;
async function getScopedGoogleOAuthCredential(trc, thriftComm, authenticationToken, googleOAuthScope) {
    const userToken = conduit_auth_shared_1.decodeAuthData(authenticationToken);
    const utilityStore = thriftComm.getUtilityStore(userToken.urls.utilityUrl);
    const oAuthRes = await conduit_utils_1.withError(utilityStore.getScopedGoogleOAuthCredential(trc, userToken.token, userToken.token, googleOAuthScope));
    if (oAuthRes.err) {
        throw oAuthRes.err;
    }
    return oAuthRes.data;
}
exports.getScopedGoogleOAuthCredential = getScopedGoogleOAuthCredential;
async function setOAuthCredential(trc, thriftComm, authenticationToken, newOAuthCredential) {
    const userToken = conduit_auth_shared_1.decodeAuthData(authenticationToken);
    const utilityStore = thriftComm.getUtilityStore(userToken.urls.utilityUrl);
    const oAuthResult = await conduit_utils_1.withError(utilityStore.setOAuthCredential(trc, userToken.token, newOAuthCredential));
    if (oAuthResult.err) {
        throw oAuthResult.err;
    }
    return oAuthResult.data;
}
exports.setOAuthCredential = setOAuthCredential;
async function getOAuthCredential(trc, thriftComm, authenticationToken, serviceId) {
    const userToken = conduit_auth_shared_1.decodeAuthData(authenticationToken);
    const utilityStore = thriftComm.getUtilityStore(userToken.urls.utilityUrl);
    return utilityStore.getOAuthCredential(trc, userToken.token, serviceId);
}
exports.getOAuthCredential = getOAuthCredential;
function needMonolithTokenRefresh(token) {
    var _a;
    const now = Date.now();
    const tokenExpiration = (_a = token.split(':').find(s => s.startsWith('E'))) === null || _a === void 0 ? void 0 : _a.split('=');
    if (!tokenExpiration || tokenExpiration.length < 2) {
        return true;
    }
    const expirationTimestamp = parseInt(tokenExpiration[1], 16);
    if (isNaN(expirationTimestamp)) {
        return true;
    }
    return now > expirationTimestamp || expirationTimestamp - now < (10 * conduit_utils_1.MILLIS_IN_ONE_MINUTE); // Conduit guarantees token is valid next 10 mins at least
}
exports.needMonolithTokenRefresh = needMonolithTokenRefresh;
async function refreshAuthToken(trc, oldAuthData, httpTransport) {
    const napMetric = { category: 'account', action: 'logout' };
    const userID = oldAuthData.userID;
    if (!conduit_auth_shared_1.hasNAPData(oldAuthData)) {
        // Conduit can refresh tokens from NAP only
        logger.info('refreshAuthToken (NAP): token expired. No NAP', userID);
        conduit_utils_1.recordEvent(Object.assign(Object.assign({}, napMetric), { label: 'expired' }));
        return { userID, token: null, state: conduit_view_types_1.AuthState.Expired };
    }
    const tokenRequest = new conduit_nap_1.TokenRequest({
        refresh_token: oldAuthData.napAuthInfo.refreshToken,
        grant_type: 'refresh_token',
        redirect_uri: oldAuthData.napAuthInfo.redirectUri,
        client_id: oldAuthData.napAuthInfo.clientID,
        extras: {
            monolith_token: oldAuthData.token,
        },
    });
    try {
        const configuration = await conduit_nap_1.fetchNAPConfiguration(trc, oldAuthData.napAuthInfo.authUrl, new conduit_nap_1.ConduitHttpRequestor(httpTransport));
        const tokenRequestHandler = new conduit_nap_1.BaseTokenRequestHandler(new conduit_nap_1.ConduitHttpRequestor(httpTransport));
        conduit_utils_1.traceEventStart(trc, 'performAuthTokenRequest');
        const tokenRequestResult = await conduit_utils_1.traceEventEndWhenSettled(trc, 'performAuthTokenRequest', tokenRequestHandler.performTokenRequest(configuration, tokenRequest));
        const serviceToken = conduit_nap_1.extractMonolithToken(tokenRequestResult.accessToken);
        if (!tokenRequestResult.refreshToken || !serviceToken) {
            logger.info('refreshAuthToken (NAP): token revoked', userID);
            conduit_utils_1.recordEvent(Object.assign(Object.assign({}, napMetric), { label: 'revoked' }));
            throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.SESSION_REVOKED, oldAuthData.token);
        }
        const newAuthData = Object.assign(Object.assign({}, oldAuthData), { napAuthInfo: Object.assign(Object.assign({}, oldAuthData.napAuthInfo), { jwt: tokenRequestResult.accessToken, refreshToken: tokenRequestResult.refreshToken }), token: serviceToken });
        logger.info('refreshAuthToken (NAP)', userID);
        return { userID, token: conduit_auth_shared_1.encodeAuthData(newAuthData), state: conduit_view_types_1.AuthState.Authorized };
    }
    catch (err) {
        // response 400 with message 'invalid_client', 400 with 'invalid_grant' or 401 if client is unauthenticated
        // https://gluu.org/docs/gluu-server/api-guide/openid-connect-api/#errors_1
        // AppAuth-JS puts status to message and statusText to extras of AppAuthError
        // Same for Calling fetchNAPConfiguration. This could have 401 and in this case we have to make user login again because client id is changed
        // https://gluu.org/docs/gluu-server/api-guide/openid-connect-api/#error-response
        if (err instanceof conduit_nap_1.AppAuthError && (err.extras === 'invalid_client' || err.extras === 'invalid_grant' || err.message === '401')) {
            logger.info('refreshAuthToken (NAP): token expired', userID, err.extras || err.message);
            conduit_utils_1.recordEvent(Object.assign(Object.assign({}, napMetric), { label: 'expired' }));
            return { userID, token: conduit_auth_shared_1.encodeAuthData(oldAuthData), state: conduit_view_types_1.AuthState.Expired };
        }
        if (err instanceof conduit_utils_1.AuthError) {
            throw err;
        }
        throw conduit_nap_1.wrapTokenRequestResponseError(err);
    }
}
exports.refreshAuthToken = refreshAuthToken;
async function registerSession(trc, utility, monolithToken, clientId, refreshToken, clientCredentials) {
    const registerDeviceSessionRequest = new en_conduit_sync_types_1.TRegisterDeviceSessionRequest({
        authenticationToken: monolithToken,
        deviceDescription: clientCredentials.deviceDescription,
        deviceIdentifier: clientCredentials.deviceIdentifier,
        clientId,
        refreshToken,
        consumerKey: clientCredentials.consumerKey,
    });
    try {
        await utility.registerSession(trc, monolithToken, registerDeviceSessionRequest);
    }
    catch (error) {
        // SDMS is disabled. Logging.
        if (error instanceof conduit_utils_1.ServiceError && error.errorCode === en_conduit_sync_types_1.EDAMErrorCode.UNSUPPORTED_OPERATION) {
            logger.debug('Encountered an error during session registration process.');
        }
        else {
            throw error;
        }
    }
}
exports.registerSession = registerSession;
async function refreshJWTFromMonolith(trc, authData, thriftComm) {
    const utilityStore = thriftComm.getUtilityStore(authData.urls.utilityUrl);
    const jwtRequest = new en_conduit_sync_types_1.TGetNAPAccessJWTRequest({ includeBusinessFields: Boolean(authData.vaultAuth) });
    const res = await conduit_utils_1.withError(utilityStore.getNAPAccessJWT(trc, authData.token, jwtRequest));
    if (res.err) {
        if (res.err instanceof conduit_utils_1.AuthError) {
            return {
                state: conduit_view_types_1.AuthState.Expired,
                token: null,
                userID: authData.userID,
            };
        }
        logger.error('Error occured while refreshing token', res.err);
        throw res.err;
    }
    logger.info('refreshJWTFromMonolith: refreshed jwt token from monolith');
    const newAuthData = Object.assign(Object.assign({}, authData), { napAuthInfo: {
            jwt: res.data,
        } });
    return {
        state: conduit_view_types_1.AuthState.Authorized,
        token: conduit_auth_shared_1.encodeAuthData(newAuthData),
        userID: authData.userID,
    };
}
exports.refreshJWTFromMonolith = refreshJWTFromMonolith;
async function invalidateAuthToken(trc, token, thriftComm, httpClient, clientCredentials) {
    let napAddress;
    const authData = conduit_auth_shared_1.decodeAuthData(token);
    if (conduit_auth_shared_1.hasNAPData(authData)) {
        if (clientCredentials) {
            await conduit_utils_1.logAndDiscardError(revokeSDMSSession(trc, thriftComm, authData, clientCredentials), 'Failed revoking the session, but continuing anyway');
        }
        else {
            logger.warn('Cannot try to revoke the session because there is no client credentials!');
        }
        try {
            const { napAuthUrl } = await logoutNap(trc, authData, httpClient);
            napAddress = napAuthUrl;
        }
        catch (err) {
            // TODO: Catch error correct way
            logger.warn('Failed revoking the token, but continuing anyway', err);
        }
    }
    else {
        try {
            await logoutThrift(trc, thriftComm, token);
        }
        catch (err) {
            logger.warn('remote logout failed, but continuing anyway', err);
        }
    }
    return {
        success: true,
        napAddress,
    };
}
exports.invalidateAuthToken = invalidateAuthToken;
//# sourceMappingURL=Auth.js.map