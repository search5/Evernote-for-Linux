"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
exports.getAuthPlugin = exports.loginWithCookies = exports.setLoginAuthData = exports.RemoteServiceCredentialGQL = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const graphql_1 = require("graphql");
const Auth = __importStar(require("../Auth"));
const AccountLimitsConverter_1 = require("../Converters/AccountLimitsConverter");
const UserConverter_1 = require("../Converters/UserConverter");
const ThriftSyncEngine_1 = require("../ThriftSyncEngine");
const ThriftTypes_1 = require("../ThriftTypes");
const AuthStateEnum = Object.keys(conduit_view_types_1.AuthState);
AuthStateEnum.__enumName = 'AuthStateEnum';
const LoginResultGQL = conduit_core_1.schemaToGraphQLType({
    state: AuthStateEnum,
    secondFactorDeliveryHint: 'string?',
    usernameOrEmail: 'string?',
    secondFactorTempToken: 'string?',
}, 'LoginResult', true);
const LoginInfoGQL = conduit_core_1.schemaToGraphQLType({
    loginStatus: Object.keys(Auth.LoginStatus),
    pendingInvites: 'int[]',
    businessUserType: Object.keys(Auth.BusinessUserType),
    facadeEnabled: 'boolean',
    napMigrationState: Auth.NAP_MIGRATION_STATE_ENUM,
    signedUsernameOrEmail: 'string?',
}, 'LoginInfo', true);
exports.RemoteServiceCredentialGQL = new graphql_1.GraphQLInterfaceType({
    name: 'RemoteServiceCredential',
    fields: {
        apiKey: {
            type: graphql_1.GraphQLString,
            description: 'API Key used to authorize requests against a remote service.',
        },
        clientId: {
            type: graphql_1.GraphQLString,
            description: 'String identifying what kind of client is making the remote service requests.',
        },
    },
    description: 'Interface for managing authentication credentials to external, remote services.',
});
function validateMUPAndKeys(context) {
    if (context && context.multiUserProvider && context.clientCredentials) {
        return true;
    }
    throw new Error('Context not correctly setup: MultiUserProvider or credentials missing');
}
async function authStateResolver(_1, _2, context) {
    if (!(context === null || context === void 0 ? void 0 : context.multiUserProvider)) {
        throw new Error('Context not correctly setup: MultiUserProvider missing');
    }
    const auth = await context.multiUserProvider.getAuthTokenAndState(context.trc, context.watcher);
    return { authState: auth ? auth.state : conduit_view_types_1.AuthState.NoAuth };
}
async function authRemoteHostResolver(_1, _2, context) {
    conduit_core_1.validateDB(context);
    const tokenAndState = await context.db.getAuthTokenAndState(context.trc, context.watcher);
    if (!(tokenAndState === null || tokenAndState === void 0 ? void 0 : tokenAndState.token)) {
        throw new Error('Not logged in');
    }
    const auth = Auth.decodeAuthData(tokenAndState.token);
    return {
        remoteHost: auth.thriftHost,
    };
}
function genUpdate(trc, thriftComm, token, user, vaultUser) {
    return async (tx) => {
        const authData = Auth.decodeAuthData(token);
        let locale;
        async function updateUser(trc1, graphTransaction, userData, isVaultUser, auth) {
            var _a, _b, _c, _d;
            const syncContext = await ThriftSyncEngine_1.initUserSyncContext(trc1, tx, isVaultUser ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, auth);
            const params = {
                trc: trc1,
                graphTransaction,
                personalUserId: authData.userID,
                vaultUserId: (_b = (_a = authData.vaultAuth) === null || _a === void 0 ? void 0 : _a.userID) !== null && _b !== void 0 ? _b : 0,
            };
            if (!isVaultUser) {
                const enLocale = (_d = (_c = user.attributes) === null || _c === void 0 ? void 0 : _c.preferredLanguage) !== null && _d !== void 0 ? _d : undefined;
                const enLocaleMap = {
                    en_US: 'en-US',
                    en_XA: 'en-XA',
                    in: 'id',
                    pt_BR: 'pt-BR',
                    zh_CN: 'zh-CN',
                    zh_TW: 'zh-TW',
                    zh_CN_yxbj: 'zh-CN',
                };
                locale = enLocale ? enLocaleMap[enLocale] || enLocale : enLocale;
            }
            await UserConverter_1.convertUserFromService(trc1, params, syncContext, user, isVaultUser);
            if (isVaultUser || !userData.businessUserInfo) {
                await AccountLimitsConverter_1.initAccountLimitsNode(trc1, Object.assign(Object.assign({}, params), { thriftComm }), syncContext, auth, userData.accountLimits || undefined);
            }
        }
        // Filling user data if available. Often happens when getting fresh user data from response of login API.
        await updateUser(trc, tx, user, false, authData);
        if (vaultUser && authData.vaultAuth) {
            await updateUser(trc, tx, vaultUser, true, authData.vaultAuth);
        }
        return locale;
    };
}
async function setLoginAuthData(thriftComm, context, auth, deviceIdentifier, options = { cookieAuth: false, noSync: false }) {
    setDeviceTelemetryDimensions(deviceIdentifier);
    if (auth.user && auth.token) {
        const user = auth.user;
        const loginData = {
            cookieAuth: options.cookieAuth,
            isBusinessAccount: Boolean(auth.vaultUser),
            state: auth.state,
            token: auth.token,
            userID: user.id,
        };
        // set auth and user data before allowing this user to send their account-specific queries (setCurrentUser call).
        // if conduit is killed before setCurrentUser(),
        // it either has no auth which then forces relogin
        // or already has the auth data without current user set which clients can prompt them to setCurrentUser themselves.
        await context.multiUserProvider.setAuthTokenAndState(context.trc, loginData);
        await context.multiUserProvider.setUserInfo(context.trc, {
            userID: conduit_utils_1.keyStringForUserID(loginData.userID),
            email: user.email || '',
            businessName: (user.businessUserInfo && user.businessUserInfo.businessName) || '',
            fullName: user.name || '',
            photoUrl: user.photoUrl || '',
            username: user.username || '',
        });
        await context.multiUserProvider.setCurrentUser(context.trc, loginData.userID, false, auth.state === conduit_view_types_1.AuthState.Authorized ? {
            noSync: options.noSync,
            // Filling user data if available. Often happens when getting fresh user data from response of login API.
            update: genUpdate(context.trc, thriftComm, loginData.token, user, auth.vaultUser),
        } : undefined);
    }
}
exports.setLoginAuthData = setLoginAuthData;
function toGraphQL(auth) {
    const ret = Object.assign({}, auth);
    delete ret.user;
    delete ret.vaultUser;
    return ret;
}
function setDeviceTelemetryDimensions(deviceId) {
    if (deviceId) {
        conduit_utils_1.setDimension('deviceId', deviceId);
    }
}
async function activateAccount(thriftComm, context, auth) {
    if (!validateMUPAndKeys(context)) {
        return;
    }
    if (auth.state === conduit_view_types_1.AuthState.NeedSSO || auth.state === conduit_view_types_1.AuthState.NeedTwoFactor) {
        conduit_utils_1.logger.info(`Current account cannot be activated: ${auth.state}`);
    }
    else {
        // if user is already signed in, let them sign in again.
        // avoid edge case like "if user already signs in and their auth is expired, allow them to sign in."
        await setLoginAuthData(thriftComm, context, auth, context.clientCredentials.deviceIdentifier);
    }
}
async function loginWithCookies(context, thriftComm, serviceHost, userSlot = null, deviceIdentifier) {
    // explicitly pass in no token and NoAuth state to trigger login with cookies flow.
    const auth = await Auth.loginWithExistingAuth(context.trc, thriftComm, serviceHost, serviceHost, { state: conduit_view_types_1.AuthState.NoAuth, token: null }, userSlot);
    if (auth) {
        await setLoginAuthData(thriftComm, context, auth, deviceIdentifier, { cookieAuth: true, noSync: false });
    }
    return auth;
}
exports.loginWithCookies = loginWithCookies;
function getAuthPlugin(thriftComm, httpClient, tokenRefreshManager, deviceIdentifier) {
    async function getLoginInfoResolver(_, args, context) {
        if (validateMUPAndKeys(context)) {
            if (!args || !args.serviceHost || (!args.usernameOrEmail && !args.tokenPayload)) {
                throw new Error('Missing arguments for getLoginInfo');
            }
            return Auth.getLoginInfo(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, args.clientName, args.usernameOrEmail, args.tokenPayload);
        }
    }
    async function retryLoginAfterLegacyError(trc, thriftCommInterface, defaultHost, credentials, error) {
        const maxRetryDuration = 10 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
        let currentRetryDuration = 0;
        let currentError = error;
        while (currentRetryDuration < maxRetryDuration) {
            const legacyAccountError = currentError instanceof conduit_utils_1.AuthError &&
                currentError.errorCode === conduit_utils_1.AuthErrorCode.LEGACY_ACCOUNT_NOT_PERMITTED;
            const userIdLockedError = currentError instanceof conduit_utils_1.ServiceError &&
                currentError.message.includes('StaleObjectStateException');
            if (legacyAccountError || userIdLockedError) {
                // sleep 6 seconds to give the monolth cache time to clear
                if (legacyAccountError) {
                    await conduit_utils_1.sleep(6 * conduit_utils_1.MILLIS_IN_ONE_SECOND);
                    currentRetryDuration += 6 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
                }
                if (userIdLockedError) {
                    await conduit_utils_1.sleep(100);
                    currentRetryDuration += 100;
                }
                try {
                    return await Auth.login(trc, thriftCommInterface, defaultHost, defaultHost, credentials, false);
                }
                catch (newError) {
                    currentError = newError;
                }
            }
            else {
                throw currentError;
            }
        }
        // Throw an error if the query is still failing after the timeout.
        throw currentError;
    }
    async function loginResolver(_, args, context) {
        var _a;
        if (validateMUPAndKeys(context)) {
            const auth = await Auth.login(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { usernameOrEmail: args.email, password: args.password }), (_a = args.allowFacadeAsPersonal) !== null && _a !== void 0 ? _a : false);
            await activateAccount(thriftComm, context, auth);
            return toGraphQL(auth);
        }
    }
    async function loginWithCookiesResolver(_, args, context) {
        if (!context) {
            throw new conduit_utils_1.InternalError('Missing GraphQL context');
        }
        if (!args.serviceHost) {
            throw new Error('Missing serviceHost!');
        }
        const auth = await loginWithCookies(context, thriftComm, args.serviceHost, args.userSlot, deviceIdentifier);
        if (!auth) {
            throw new Error('Unable to login with cookies');
        }
        return toGraphQL(auth);
    }
    async function loginWithSplitTokensResolver(_, args, context) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        if (validateMUPAndKeys(context)) {
            let auth1 = null;
            let auth2 = null;
            try {
                auth1 = await Auth.login(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { exchangeToken: args.token1 }), false);
            }
            catch (error) {
                auth1 = await retryLoginAfterLegacyError(context.trc, thriftComm, args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { exchangeToken: args.token1 }), error);
            }
            if (args.token2) {
                try {
                    auth2 = await Auth.login(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { exchangeToken: args.token2 }), false);
                }
                catch (error) {
                    auth2 = await retryLoginAfterLegacyError(context.trc, thriftComm, args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { exchangeToken: args.token2 }), error);
                }
            }
            if (auth2) {
                if (!((_a = auth2.user) === null || _a === void 0 ? void 0 : _a.id) || !((_b = auth1.user) === null || _b === void 0 ? void 0 : _b.id)) {
                    // Users who go through this flow must have ids.
                    throw new Error('SplitFlow: auth has no user id');
                }
                // Store auth tokens and states of both users & pick first user as current user
                const loginData2 = {
                    isBusinessAccount: Boolean(auth2.vaultUser),
                    state: auth2.state,
                    token: auth2.token,
                    userID: (_c = auth2.user) === null || _c === void 0 ? void 0 : _c.id,
                };
                await context.multiUserProvider.setAuthTokenAndState(context.trc, loginData2);
                await context.multiUserProvider.setCurrentUser(context.trc, loginData2.userID, false, auth2.state === conduit_view_types_1.AuthState.Authorized ? {
                    noSync: true,
                    update: auth2.token ? genUpdate(context.trc, thriftComm, auth2.token, auth2.user, auth2.vaultUser) : undefined,
                } : undefined);
                await context.multiUserProvider.setUserInfo(context.trc, {
                    userID: conduit_utils_1.keyStringForUserID(loginData2.userID),
                    email: (_d = auth2.user.email) !== null && _d !== void 0 ? _d : '',
                    fullName: (_e = auth2.user.name) !== null && _e !== void 0 ? _e : '',
                    username: (_f = auth2.user.username) !== null && _f !== void 0 ? _f : '',
                    businessName: (_h = (_g = auth2.user.businessUserInfo) === null || _g === void 0 ? void 0 : _g.businessName) !== null && _h !== void 0 ? _h : '',
                    photoUrl: (_j = auth2.user.photoUrl) !== null && _j !== void 0 ? _j : '',
                });
                const loginData1 = {
                    isBusinessAccount: Boolean(auth1.vaultUser),
                    state: auth1.state,
                    token: auth1.token,
                    userID: (_k = auth1.user) === null || _k === void 0 ? void 0 : _k.id,
                };
                await context.multiUserProvider.setAuthTokenAndState(context.trc, loginData1);
                await context.multiUserProvider.setCurrentUser(context.trc, loginData1.userID, false, auth1.state === conduit_view_types_1.AuthState.Authorized ? {
                    noSync: false,
                    update: auth1.token ? genUpdate(context.trc, thriftComm, auth1.token, auth1.user, auth1.vaultUser) : undefined,
                } : undefined);
                await context.multiUserProvider.setUserInfo(context.trc, {
                    userID: conduit_utils_1.keyStringForUserID(loginData1.userID),
                    email: (_l = auth1.user.email) !== null && _l !== void 0 ? _l : '',
                    fullName: (_m = auth1.user.name) !== null && _m !== void 0 ? _m : '',
                    username: (_o = auth1.user.username) !== null && _o !== void 0 ? _o : '',
                    businessName: (_q = (_p = auth1.user.businessUserInfo) === null || _p === void 0 ? void 0 : _p.businessName) !== null && _q !== void 0 ? _q : '',
                    photoUrl: (_r = auth1.user.photoUrl) !== null && _r !== void 0 ? _r : '',
                });
            }
            else {
                await setLoginAuthData(thriftComm, context, auth1, context.clientCredentials.deviceIdentifier);
            }
            return toGraphQL(auth1);
        }
    }
    async function loginWithSSOResolver(_, args, context) {
        if (validateMUPAndKeys(context)) {
            const auth = await Auth.login(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { usernameOrEmail: args.email, ssoLoginToken: args.ssoLoginToken }), false);
            await activateAccount(thriftComm, context, auth);
            return toGraphQL(auth);
        }
    }
    async function loginWithOAuthResolver(_, args, context) {
        if (validateMUPAndKeys(context)) {
            const serviceProvider = args.serviceProvider;
            if (!Auth.SERVICE_PROVIDER_STRING_TO_ENUM.hasOwnProperty(serviceProvider)) {
                throw new Error('Unknown service provider');
            }
            const auth = await Auth.login(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { openIdCredential: {
                    tokenPayload: args.tokenPayload,
                    serviceProvider: Auth.SERVICE_PROVIDER_STRING_TO_ENUM[serviceProvider],
                } }), false);
            await activateAccount(thriftComm, context, auth);
            return toGraphQL(auth);
        }
    }
    async function loginWithServiceTokenResolver(_, args, context) {
        var _a;
        if (validateMUPAndKeys(context)) {
            const slot = args.userSlot === undefined ? null : args.userSlot;
            const auth = await Auth.loginWithServiceToken(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, args.token || '', slot, (_a = args.allowFacadeAsPersonal) !== null && _a !== void 0 ? _a : false);
            if (!auth) {
                throw new Error('Login with token failed, possibly offline');
            }
            await activateAccount(thriftComm, context, auth);
            return toGraphQL(auth);
        }
    }
    async function loginWithTwoFactorResolver(_, args, context) {
        if (validateMUPAndKeys(context)) {
            const auth = await Auth.loginWithTwoFactor(context.trc, thriftComm, args.serviceHost, args.externalServiceHost || args.serviceHost, args.secondFactorTempToken, Object.assign(Object.assign({}, context.clientCredentials), { oneTimeCode: args.oneTimeCode }));
            await activateAccount(thriftComm, context, auth);
            return toGraphQL(auth);
        }
    }
    function validateLogoutParams(args) {
        if (args.all && args.nextUserID) {
            throw new conduit_utils_1.InvalidOperationError('Invalid arguments: can not provide all and nextUserID for log out');
        }
    }
    async function logoutResolver(_, args, context) {
        var _a;
        validateLogoutParams(args);
        if (context === null || context === void 0 ? void 0 : context.multiUserProvider) {
            const currentUserID = await context.multiUserProvider.getCurrentUserID(context.trc, context.watcher);
            if (!currentUserID) {
                throw new Error('Unable to logout without a signed in user');
            }
            if (args.all) {
                const userIDs = await context.multiUserProvider.getUsers(context.trc, null);
                const otherUserIDs = Object.keys(userIDs).map(id => conduit_utils_1.userIDForKeyString(id)).filter(id => id !== currentUserID);
                await context.multiUserProvider.removeAllUsers(context.trc, otherUserIDs, args.keepData);
                conduit_utils_1.logger.info('done logout other accounts');
            }
            if (!context.db) {
                // logout is called without a current user. Terminate early.
                await context.multiUserProvider.setCurrentUser(context.trc, null);
                return;
            }
            const currentAuth = await context.db.getAuthTokenAndState(context.trc, null);
            const nextUserID = args.nextUserID ? conduit_utils_1.userIDForKeyString(args.nextUserID) : null;
            let newUserID = !args.all && nextUserID && await context.multiUserProvider.hasUser(context.trc, nextUserID) ?
                nextUserID :
                null;
            if (!args.keepData) {
                await context.db.clear(context.trc, false);
            }
            await context.multiUserProvider.clearAuth(context.trc, currentUserID);
            const res = await conduit_utils_1.withError(context.multiUserProvider.setCurrentUser(context.trc, newUserID, true));
            if (res.err && newUserID !== null) {
                conduit_utils_1.logger.warn(`Unable to smoothly switch to ${newUserID}. Switch to no user.`, res.err);
                await context.multiUserProvider.setCurrentUser(context.trc, null, true);
                newUserID = null;
            }
            const serviceRes = (currentAuth === null || currentAuth === void 0 ? void 0 : currentAuth.token) ? await Auth.invalidateAuthToken(context.trc, currentAuth.token, thriftComm, httpClient, (_a = context.clientCredentials) !== null && _a !== void 0 ? _a : null)
                : { success: true };
            conduit_utils_1.logger.info('Client logging out', args.reason);
            return Object.assign(Object.assign({}, serviceRes), { currentUserID: newUserID });
        }
    }
    async function sessionTokenResolver(_, args, context) {
        return tokenRefreshManager.renewAndSaveAuthToken(context, thriftComm);
    }
    async function userSignupResolver(_, args, context) {
        if (validateMUPAndKeys(context)) {
            if (!httpClient) {
                throw new conduit_utils_1.InternalError(`Http client is not configured`);
            }
            const oAuthProvider = args.oAuthProvider;
            if (oAuthProvider && !Auth.SERVICE_PROVIDER_STRING_TO_ENUM.hasOwnProperty(oAuthProvider)) {
                throw new Error('Unknown service provider');
            }
            const auth = await Auth.userSignupandLogin(context.trc, thriftComm, httpClient, args.serviceHost, args.externalServiceHost || args.serviceHost, Object.assign(Object.assign({}, context.clientCredentials), { usernameOrEmail: args.email, password: args.password, openIdCredential: {
                    tokenPayload: args.tokenPayload,
                    serviceProvider: oAuthProvider ? Auth.SERVICE_PROVIDER_STRING_TO_ENUM[oAuthProvider] : ThriftTypes_1.TServiceProvider.GOOGLE,
                } }));
            await activateAccount(thriftComm, context, auth);
            return toGraphQL(auth);
        }
    }
    async function napAuthInfoResolver(_, args, context) {
        var _a;
        if (!validateMUPAndKeys(context)) {
            throw new conduit_utils_1.InternalError('No context db');
        }
        if (!httpClient) {
            throw new conduit_utils_1.InternalError('No HttpClient');
        }
        const authResult = await Auth.loginWithNAP(context.trc, thriftComm, args, context.clientCredentials, httpClient);
        await setLoginAuthData(thriftComm, context, authResult, (_a = context.clientCredentials) === null || _a === void 0 ? void 0 : _a.deviceIdentifier);
        return toGraphQL(authResult);
    }
    async function getThriftUtilityEndpoint(trc, serviceHost, token) {
        const userStore = thriftComm.getUserStore(`${serviceHost}/edam/user`);
        const urls = await userStore.getUserUrls(trc, token);
        if (!urls.utilityUrl) {
            throw new Error('Unable to find api endpoint');
        }
        return urls.utilityUrl;
    }
    async function twoFactorAuthSendCodeResolver(_, args, context) {
        if (context) {
            const thriftUtilityUrl = await getThriftUtilityEndpoint(context.trc, args.serviceHost, args.token);
            const utilityStore = thriftComm.getUtilityStore(thriftUtilityUrl);
            return await utilityStore.sendOneTimeCode(context.trc, args.token, args.sendToBackupPhone, args.textMsgTemplate, args.useVoice);
        }
    }
    async function twoFactorAuthMaskedPhoneNumbersResolver(_, args, context) {
        if (context) {
            const thriftUtilityUrl = await getThriftUtilityEndpoint(context.trc, args.serviceHost, args.token);
            const utilityStore = thriftComm.getUtilityStore(thriftUtilityUrl);
            const res = await utilityStore.getMasked2FAMobileNumbers(context.trc, args.token);
            return {
                primary: res.AUTH_TWOFACTOR_MOBILE,
                secondary: res.AUTH_TWOFACTOR_MOBILE_BACKUP,
            };
        }
    }
    return {
        name: 'Auth',
        defineMutators: () => {
            const mutators = {
                clientLogin: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        email: 'string',
                        password: 'string?',
                        allowFacadeAsPersonal: 'boolean?',
                    }),
                    type: LoginResultGQL,
                    resolve: loginResolver,
                },
                clientLoginWithCookies: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        userSlot: 'int?',
                    }),
                    type: LoginResultGQL,
                    resolve: loginWithCookiesResolver,
                },
                clientMultiLoginWithSplitTokens: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        token1: 'string',
                        token2: 'string?',
                    }),
                    type: LoginResultGQL,
                    resolve: loginWithSplitTokensResolver,
                },
                clientLoginWithSSO: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        email: 'string',
                        ssoLoginToken: 'string',
                    }),
                    type: LoginResultGQL,
                    resolve: loginWithSSOResolver,
                },
                clientLoginWithOAuth: {
                    type: LoginResultGQL,
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        tokenPayload: 'string',
                        serviceProvider: Auth.SERVICE_PROVIDER_ENUM,
                    }),
                    resolve: loginWithOAuthResolver,
                },
                clientLoginWithServiceToken: {
                    type: LoginResultGQL,
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        token: 'string?',
                        userSlot: 'number?',
                        allowFacadeAsPersonal: 'boolean?',
                    }),
                    resolve: loginWithServiceTokenResolver,
                },
                clientLoginWithTwoFactor: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        oneTimeCode: 'string',
                        secondFactorTempToken: 'string',
                    }),
                    type: LoginResultGQL,
                    resolve: loginWithTwoFactorResolver,
                },
                clientLogout: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        reason: 'string',
                        nextUserID: 'string?',
                        all: 'boolean?',
                        keepData: 'boolean?',
                    }),
                    type: conduit_core_1.schemaToGraphQLType({
                        success: 'boolean',
                        napAddress: 'string?',
                        currentUserID: 'string?',
                    }, 'LogoutResult', false),
                    resolve: logoutResolver,
                },
                sessionToken: {
                    args: conduit_core_1.schemaToGraphQLArgs({}),
                    type: conduit_core_1.schemaToGraphQLType('string'),
                    resolve: sessionTokenResolver,
                },
                twoFactorAuthSendCode: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        token: 'string',
                        sendToBackupPhone: 'boolean',
                        textMsgTemplate: 'string',
                        useVoice: 'boolean',
                    }),
                    type: conduit_core_1.schemaToGraphQLType('string'),
                    resolve: twoFactorAuthSendCodeResolver,
                },
                newUserSignUp: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        email: 'string',
                        password: 'string',
                    }),
                    type: LoginResultGQL,
                    resolve: userSignupResolver,
                },
                newUserSignUpWithOAuth: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        tokenPayload: 'string',
                        oAuthProvider: Auth.SERVICE_PROVIDER_ENUM,
                    }),
                    type: LoginResultGQL,
                    resolve: userSignupResolver,
                },
                saveNAPAuthInfo: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        serviceToken: 'string',
                        accessToken: 'string',
                        refreshToken: 'string',
                        napAuthUrl: 'string',
                        napClientId: 'string',
                        napRedirectUri: 'string',
                    }),
                    type: LoginResultGQL,
                    resolve: napAuthInfoResolver,
                },
            };
            return mutators;
        },
        defineQueries: () => {
            const queries = {
                getLoginInfo: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        serviceHost: 'string',
                        externalServiceHost: 'string?',
                        usernameOrEmail: 'string?',
                        tokenPayload: 'string?',
                        clientName: 'string',
                    }),
                    type: LoginInfoGQL,
                    resolve: getLoginInfoResolver,
                },
                clientAuthState: {
                    args: conduit_core_1.schemaToGraphQLArgs({}),
                    type: conduit_core_1.schemaToGraphQLType({ authState: AuthStateEnum }, 'AuthState', true),
                    resolve: authStateResolver,
                },
                authRemoteHost: {
                    args: conduit_core_1.schemaToGraphQLArgs({}),
                    type: conduit_core_1.schemaToGraphQLType({ remoteHost: 'string' }, 'AuthRemoteHost', true),
                    resolve: authRemoteHostResolver,
                },
                twoFactorAuthMaskedPhoneNumbers: {
                    args: conduit_core_1.schemaToGraphQLArgs({ serviceHost: 'string', token: 'string' }),
                    type: conduit_core_1.schemaToGraphQLType({ primary: 'string?', secondary: 'string?' }, 'TwoFactorAuthMaskedPhoneNumbers', false),
                    resolve: twoFactorAuthMaskedPhoneNumbersResolver,
                },
            };
            return queries;
        },
    };
}
exports.getAuthPlugin = getAuthPlugin;
//# sourceMappingURL=AuthPlugin.js.map