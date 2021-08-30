"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToBusiness = exports.authDataFromAuthResult = exports.authenticateToSharedNotebook = exports.authenticateToNote = exports.isRevokedShareForNoteOrNotebook = exports.getAuthFromSyncContext = exports.toServiceToken = exports.decodeAuthData = void 0;
const conduit_auth_shared_1 = require("conduit-auth-shared");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
var conduit_auth_shared_2 = require("conduit-auth-shared");
Object.defineProperty(exports, "decodeAuthData", { enumerable: true, get: function () { return conduit_auth_shared_2.decodeAuthData; } });
const CONDUIT_TOKEN_MARKER = ':CONDUIT_';
const CONDUIT_EXPIRE_MARKER = '::EXPIRES_';
// For debugging token expiration
const FORCE_BIZ_EXPIRE_AFTER = 0;
function toServiceToken(authenticationToken, args) {
    // strip out our internal tracking marker before sending auth token to the service
    const conduitAuthMarkerIdx = authenticationToken.indexOf(CONDUIT_TOKEN_MARKER);
    let serviceAuthToken = conduitAuthMarkerIdx >= 0 ? authenticationToken.slice(0, conduitAuthMarkerIdx) : authenticationToken;
    // strip our internal force-expire marker and check for expiration
    const expireAuthMarkerIdx = serviceAuthToken.indexOf(CONDUIT_EXPIRE_MARKER);
    if (expireAuthMarkerIdx >= 0) {
        const expireAfter = parseInt(serviceAuthToken.slice(expireAuthMarkerIdx + CONDUIT_EXPIRE_MARKER.length), 10);
        if (isFinite(expireAfter) && !isNaN(expireAfter) && expireAfter < Date.now()) {
            throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.AUTH_EXPIRED, authenticationToken, 'forceExpireAfter');
        }
        serviceAuthToken = serviceAuthToken.slice(0, expireAuthMarkerIdx);
    }
    if (serviceAuthToken !== authenticationToken) {
        for (let i = 0; i < args.length; ++i) {
            if (args[i] === authenticationToken) {
                args[i] = serviceAuthToken;
            }
        }
    }
    return serviceAuthToken;
}
exports.toServiceToken = toServiceToken;
async function getAuthFromSyncContext(trc, graphStorage, syncContext) {
    const metadata = await graphStorage.getSyncContextMetadata(trc, null, syncContext);
    if (!metadata) {
        throw new conduit_utils_1.NotFoundError(syncContext, `no syncContext "${syncContext}"`);
    }
    if (!metadata.authToken) {
        throw new Error(`no auth for syncContext "${syncContext}"`);
    }
    return conduit_auth_shared_1.decodeAuthData(metadata.authToken);
}
exports.getAuthFromSyncContext = getAuthFromSyncContext;
function authDataFromNoteAuthResult(res, userID, serviceLevel, thriftHost, urlHost, noteStoreUrl, shardId, userSlot) {
    if (!res.authenticationToken) {
        throw new Error('Insufficient data from RPC');
    }
    const authData = {
        token: res.authenticationToken,
        userID,
        businessID: null,
        thriftHost,
        urlHost,
        serviceLevel,
        shard: shardId,
        urls: conduit_auth_shared_1.fixupAuthServiceUrls({
            noteStoreUrl,
        }, thriftHost, urlHost),
        userSlot,
    };
    return {
        data: authData,
        state: conduit_view_types_1.AuthState.Authorized,
        user: null,
        vaultUser: null,
        secondFactorDeliveryHint: null,
        secondFactorTempToken: null,
    };
}
function isRevokedShareForNoteOrNotebook(err) {
    if (err instanceof conduit_utils_1.AuthError && err.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED) {
        return true;
    }
    if (err instanceof conduit_utils_1.ServiceError && err.errorType === 'EDAMNotFoundException') {
        return true;
    }
    return false;
}
exports.isRevokedShareForNoteOrNotebook = isRevokedShareForNoteOrNotebook;
async function authenticateToNote(trc, thriftComm, userAuth, noteGuid, noteStoreUrl, shardId) {
    if (!userAuth) {
        return null;
    }
    const noteStore = thriftComm.getNoteStore(noteStoreUrl);
    const noteAuthRes = await conduit_utils_1.withError(noteStore.authenticateToNote(trc, userAuth.token, noteGuid));
    if (isRevokedShareForNoteOrNotebook(noteAuthRes.err)) {
        // probably revoked after being shared, this is an expected case
        return null;
    }
    if (noteAuthRes.err) {
        conduit_utils_1.logger.error('authenticateToNote failed', noteAuthRes.err);
        throw noteAuthRes.err;
    }
    const noteAuth = noteAuthRes.data;
    if (!noteAuth || !noteAuth.authenticationToken) {
        throw new Error('authenticateToNote failed');
    }
    // make auth token unique by adding custom marker and note guid; this will be stripped off before sending to service
    noteAuth.authenticationToken += CONDUIT_TOKEN_MARKER + noteGuid;
    const authData = authDataFromNoteAuthResult(noteAuth, userAuth.userID, userAuth.serviceLevel, userAuth.thriftHost, userAuth.urlHost, noteStoreUrl, shardId, userAuth.userSlot);
    return {
        guid: noteGuid,
        authStr: conduit_auth_shared_1.encodeAuthData(authData.data),
    };
}
exports.authenticateToNote = authenticateToNote;
// notebookGuid can be either the shared notebook's guid OR the SharedNotebook's globalId
async function authenticateToSharedNotebook(trc, thriftComm, userAuth, notebookGuid, noteStoreUrl) {
    if (!userAuth) {
        return null;
    }
    const noteStore = thriftComm.getNoteStore(noteStoreUrl);
    const notebookAuthRes = await conduit_utils_1.withError(noteStore.authenticateToSharedNotebook(trc, notebookGuid, userAuth.token));
    if (isRevokedShareForNoteOrNotebook(notebookAuthRes.err)) {
        // probably revoked after being shared, this is an expected case
        return null;
    }
    if (notebookAuthRes.err) {
        conduit_utils_1.logger.error('authenticateToSharedNotebook failed', notebookAuthRes.err);
        throw notebookAuthRes.err;
    }
    const notebookAuth = notebookAuthRes.data;
    if (!notebookAuth || !notebookAuth.authenticationToken) {
        throw new Error('authenticateToSharedNotebook failed');
    }
    const sharedNotebookRes = await conduit_utils_1.withError(noteStore.getSharedNotebookByAuth(trc, notebookAuth.authenticationToken));
    if (isRevokedShareForNoteOrNotebook(sharedNotebookRes.err)) {
        // probably revoked after being shared, this is an expected case
        return null;
    }
    if (sharedNotebookRes.err) {
        conduit_utils_1.logger.error('getSharedNotebookByAuth failed', sharedNotebookRes.err);
        throw sharedNotebookRes.err;
    }
    const authData = await authDataFromAuthResult(trc, notebookAuth, userAuth.thriftHost, userAuth.urlHost, userAuth.userSlot, undefined, undefined, false);
    if (authData.state !== conduit_view_types_1.AuthState.Authorized) {
        return null;
    }
    return Object.assign(Object.assign({}, sharedNotebookRes.data), { username: notebookAuth.user ? notebookAuth.user.username : sharedNotebookRes.data.username, authStr: conduit_auth_shared_1.encodeAuthData(authData.data) });
}
exports.authenticateToSharedNotebook = authenticateToSharedNotebook;
async function authDataFromAuthResult(trc, res, thriftHost, urlHost, userSlot, thriftComm, napInfo, allowFacadeAsPersonal) {
    var _a;
    if (res.secondFactorRequired) {
        // no user, no shardId
        return {
            data: {
                token: res.authenticationToken,
                userID: conduit_utils_1.NullUserID,
                businessID: null,
                serviceLevel: 0,
                thriftHost,
                urlHost,
                shard: '',
                urls: {},
                userSlot: null,
            },
            state: conduit_view_types_1.AuthState.NeedTwoFactor,
            user: null,
            vaultUser: null,
            secondFactorDeliveryHint: res.secondFactorDeliveryHint || null,
            secondFactorTempToken: res.authenticationToken,
        };
    }
    let user = res.user;
    if (!user && res.publicUserInfo) {
        user = {
            id: res.publicUserInfo.userId,
            serviceLevel: res.publicUserInfo.serviceLevel,
            shardId: res.publicUserInfo.shardId,
        };
    }
    if (!user || !user.shardId || !user.id || !res.urls) {
        throw new Error('Insufficient data from RPC');
    }
    let ret = {
        data: {
            token: res.authenticationToken,
            userID: (_a = user.id) !== null && _a !== void 0 ? _a : conduit_utils_1.NullUserID,
            businessID: user.businessUserInfo && user.businessUserInfo.businessId || null,
            thriftHost,
            urlHost,
            serviceLevel: user.serviceLevel ? thriftServiceLevelToAuthServiceLevel(user.serviceLevel) : 0,
            shard: user.shardId,
            urls: conduit_auth_shared_1.fixupAuthServiceUrls(res.urls, thriftHost, urlHost),
            userSlot,
        },
        state: conduit_view_types_1.AuthState.Authorized,
        user: res.user || null,
        vaultUser: null,
        secondFactorDeliveryHint: null,
        secondFactorTempToken: null,
    };
    if (napInfo) {
        ret = Object.assign(Object.assign({}, ret), { data: Object.assign(Object.assign({}, ret.data), { napAuthInfo: napInfo }) });
    }
    // check for biz info and service level so legacy business users get blocked
    if (thriftComm && user.businessUserInfo) {
        const utilityStore = thriftComm.getUtilityStore(ret.data.urls.utilityUrl || `${thriftHost}/utility`);
        if (user.serviceLevel === en_conduit_sync_types_1.TServiceLevel.BUSINESS) {
            const vaultRes = await conduit_utils_1.withError(authenticateToBusiness(trc, res.authenticationToken, thriftHost, urlHost, null, utilityStore, thriftComm));
            if (vaultRes.err instanceof conduit_utils_1.AuthError) {
                switch (vaultRes.err.errorCode) {
                    case conduit_utils_1.AuthErrorCode.PERMISSION_DENIED:
                        ret.state = conduit_view_types_1.AuthState.BadAuthToken;
                        vaultRes.err = undefined;
                        break;
                    case conduit_utils_1.AuthErrorCode.BUSINESS_SECURITY_LOGIN_REQUIRED:
                        ret.state = conduit_view_types_1.AuthState.NeedSSO;
                        vaultRes.err = undefined;
                        break;
                }
            }
            if (vaultRes.err) {
                throw vaultRes.err;
            }
            ret.data.vaultAuth = vaultRes.data.data;
            ret.vaultUser = vaultRes.data.user;
        }
        else {
            // this is a legacy account (biz info, non-biz user service level). Block access unless specifically allowed.
            if (allowFacadeAsPersonal) {
                ret.data.businessID = null;
            }
            else {
                throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.LEGACY_ACCOUNT_NOT_PERMITTED, res.authenticationToken);
            }
        }
    }
    return ret;
}
exports.authDataFromAuthResult = authDataFromAuthResult;
async function authenticateToBusiness(trc, userAuthToken, thriftHost, urlHost, userSlot, utilityStore, thriftComm) {
    conduit_utils_1.logger.info('authenticateToBusiness');
    const bizAuthResult = await conduit_utils_1.withError(utilityStore.authenticateToBusiness(trc, userAuthToken));
    if (bizAuthResult.err) {
        throw bizAuthResult.err;
    }
    try {
        const vault = await authDataFromAuthResult(trc, bizAuthResult.data, thriftHost, urlHost, userSlot, thriftComm, undefined, false);
        if (vault.state !== conduit_view_types_1.AuthState.Authorized) {
            throw new Error('failed to authenticate to business');
        }
        if (FORCE_BIZ_EXPIRE_AFTER) {
            vault.data.token = forceExpire(vault.data.token, FORCE_BIZ_EXPIRE_AFTER);
        }
        return vault;
    }
    catch (e) {
        throw new Error('failed to authenticate to business');
    }
}
exports.authenticateToBusiness = authenticateToBusiness;
// TODO: remove all this in followup PR very shortly (03/18/2021)
function thriftServiceLevelToAuthServiceLevel(tLevel) {
    switch (tLevel) {
        case en_conduit_sync_types_1.TServiceLevel.BASIC:
            return conduit_auth_shared_1.AuthServiceLevel.BASIC;
        case en_conduit_sync_types_1.TServiceLevel.PLUS:
            return conduit_auth_shared_1.AuthServiceLevel.PLUS;
        case en_conduit_sync_types_1.TServiceLevel.PREMIUM:
            return conduit_auth_shared_1.AuthServiceLevel.PREMIUM;
        case en_conduit_sync_types_1.TServiceLevel.BUSINESS:
            return conduit_auth_shared_1.AuthServiceLevel.BUSINESS;
        default:
            throw new Error('Using possible serviceLevelV2 value');
    }
}
function forceExpire(token, forceExpireAfter) {
    if (!forceExpireAfter) {
        return token;
    }
    return `${token}${CONDUIT_EXPIRE_MARKER}${Date.now() + forceExpireAfter}`;
}
//# sourceMappingURL=Auth.js.map