"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authHeadersFromAuthString = exports.authHeadersFromAuthData = exports.authHasJWT = exports.fixupAuthServiceUrls = exports.decodeAuthData = exports.NullAuthData = exports.encodeAuthData = exports.hasNapAuthInfo = exports.hasNAPData = exports.AuthServiceLevel = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const js_base64_1 = require("js-base64");
const simply_immutable_1 = require("simply-immutable");
// annoyingly, this is a copy of TServiceLevel because AuthData was originally written to use that type
var AuthServiceLevel;
(function (AuthServiceLevel) {
    AuthServiceLevel[AuthServiceLevel["UNKNOWN"] = 0] = "UNKNOWN";
    AuthServiceLevel[AuthServiceLevel["BASIC"] = 1] = "BASIC";
    AuthServiceLevel[AuthServiceLevel["PLUS"] = 2] = "PLUS";
    AuthServiceLevel[AuthServiceLevel["PREMIUM"] = 3] = "PREMIUM";
    AuthServiceLevel[AuthServiceLevel["BUSINESS"] = 4] = "BUSINESS";
})(AuthServiceLevel = exports.AuthServiceLevel || (exports.AuthServiceLevel = {}));
const expectedEncodedUrls = {
    ns: '${p}${h}/${u}${s}/notestore',
    wp: '${p}${h}/${u}${s}/',
    us: '${p}${h}/${u}${s}/edam/user',
    uu: '${p}${h}/${u}${s}/utility',
    ms: '${p}${h}/${u}${s}/messagestore',
    uws: '${p}ws.${h}/${u}${s}/id',
    ce: '${p}${h}/${u}${s}/communicationengine',
    wdb: '${p}dashboard.svc.${h}/v1/main.html#?v=dashboard',
    wd: '${p}dashboard.svc.${h}/v1/main.html#?v=space-directory',
};
const expectedEncodedAuth = Object.assign({ b: null, s: true }, expectedEncodedUrls);
function encodeUrl(url, host, shard, isSecure, shortName, userSlot, protocol = 'http') {
    if (url === undefined || url === null) {
        return expectedEncodedUrls[shortName];
    }
    const fullProto = `${protocol}${isSecure ? 's' : ''}://`;
    const slotPrefix = (userSlot === null) ? '' : `u/${userSlot}/`;
    url = url.replace(fullProto, '${p}');
    url = url.replace(host, '${h}');
    if (slotPrefix !== '') {
        const newUrl = url.replace(slotPrefix, '${u}');
        // sometimes user store gives us back urls without userSlot even though we need them
        // handle that case
        if (newUrl === url) {
            url = newUrl.replace(`shard/${shard}`, '${u}${s}');
        }
        else {
            url = newUrl.replace(`shard/${shard}`, '${s}');
        }
    }
    else {
        url = url.replace(`shard/${shard}`, '${u}${s}');
    }
    return url;
}
function hasNAPData(authData) {
    return hasNapAuthInfo(authData) &&
        Boolean(authData.napAuthInfo &&
            authData.napAuthInfo.authUrl &&
            authData.napAuthInfo.clientID &&
            authData.napAuthInfo.redirectUri &&
            authData.napAuthInfo.refreshToken);
}
exports.hasNAPData = hasNAPData;
function hasNapAuthInfo(authData) {
    return authData.hasOwnProperty('napAuthInfo');
}
exports.hasNapAuthInfo = hasNapAuthInfo;
function encodeAuthData(auth) {
    const isSecure = auth.thriftHost.startsWith('https://');
    const host = auth.thriftHost.slice(isSecure ? 8 : 7);
    const encodedNAPAuthData = hasNapAuthInfo(auth) ? {
        j: auth.napAuthInfo.jwt,
        nrt: auth.napAuthInfo.refreshToken,
        nau: auth.napAuthInfo.authUrl,
        nci: auth.napAuthInfo.clientID,
        nru: auth.napAuthInfo.redirectUri,
    } : {};
    const obj = Object.assign({ t: auth.token, u: auth.userID, usl: auth.userSlot, b: auth.businessID, sl: auth.serviceLevel, sh: auth.shard, h: host, uh: auth.urlHost === auth.thriftHost ? undefined : auth.urlHost, s: isSecure, ns: encodeUrl(auth.urls.noteStoreUrl, host, auth.shard, isSecure, 'ns', auth.userSlot), wp: encodeUrl(auth.urls.webApiUrlPrefix, host, auth.shard, isSecure, 'wp', auth.userSlot), us: encodeUrl(auth.urls.userStoreUrl, host, auth.shard, isSecure, 'us', auth.userSlot), uu: encodeUrl(auth.urls.utilityUrl, host, auth.shard, isSecure, 'uu', auth.userSlot), ms: encodeUrl(auth.urls.messageStoreUrl, host, auth.shard, isSecure, 'ms', auth.userSlot), uws: encodeUrl(auth.urls.userWebSocketUrl, host, auth.shard, isSecure, 'uws', auth.userSlot, 'ws'), ce: encodeUrl(auth.urls.communicationEngineUrl, host, auth.shard, isSecure, 'ce', auth.userSlot), wdb: encodeUrl(auth.urls.workspaceDashboardUrl, host, auth.shard, isSecure, 'wdb', auth.userSlot), wd: encodeUrl(auth.urls.workspaceDirectoryUrl, host, auth.shard, isSecure, 'wd', auth.userSlot), vu: auth.vaultAuth ? encodeAuthData(auth.vaultAuth) : undefined }, encodedNAPAuthData);
    for (const k in expectedEncodedAuth) {
        const key = k;
        if (obj[key] === expectedEncodedAuth[key]) {
            delete obj[key];
        }
    }
    return js_base64_1.Base64.encode(JSON.stringify(obj));
}
exports.encodeAuthData = encodeAuthData;
function decodeUrl(str, host, shard, isSecure, userSlot, protocol = 'http') {
    const fullProto = `${protocol}${isSecure ? 's' : ''}://`;
    const slotPrefix = userSlot === null ? '' : `u/${userSlot}/`;
    str = str.replace('${p}', fullProto);
    str = str.replace('${h}', host);
    str = str.replace('${s}', `shard/${shard}`);
    str = str.replace('${u}', slotPrefix);
    return str;
}
exports.NullAuthData = simply_immutable_1.deepFreeze({
    token: '',
    userID: conduit_utils_1.NullUserID,
    businessID: null,
    userSlot: null,
    serviceLevel: AuthServiceLevel.BASIC,
    thriftHost: 'NullThriftHost',
    urlHost: 'NullUrlHost',
    shard: 'sNull',
    urls: {
        noteStoreUrl: 'NullNoteStore',
        webApiUrlPrefix: 'NullApiUrl',
        userStoreUrl: 'NullStore',
        utilityUrl: 'NullUtility',
        messageStoreUrl: 'NullMessageStore',
        userWebSocketUrl: 'NullUserWebSocket',
        communicationEngineUrl: 'NullCommunicationEngine',
        workspaceDashboardUrl: 'NullWorkspaceDashboard',
        workspaceDirectoryUrl: 'NullWorkspaceDirectory',
    },
});
function decodeAuthData(authString) {
    var _a;
    if (authString === null) {
        return exports.NullAuthData;
    }
    try {
        const obj = Object.assign({}, expectedEncodedAuth, JSON.parse(js_base64_1.Base64.decode(authString)));
        const userSlot = obj.usl === undefined ? null : obj.usl;
        const thriftHost = decodeUrl('${p}${h}', obj.h, obj.sh, obj.s, userSlot);
        const auth = {
            token: obj.t,
            userID: obj.u,
            businessID: obj.b,
            userSlot,
            serviceLevel: obj.sl,
            thriftHost,
            urlHost: (_a = obj.uh) !== null && _a !== void 0 ? _a : thriftHost,
            shard: obj.sh,
            urls: {
                noteStoreUrl: decodeUrl(obj.ns, obj.h, obj.sh, obj.s, userSlot),
                webApiUrlPrefix: decodeUrl(obj.wp, obj.h, obj.sh, obj.s, userSlot),
                userStoreUrl: decodeUrl(obj.us, obj.h, obj.sh, obj.s, userSlot),
                utilityUrl: decodeUrl(obj.uu, obj.h, obj.sh, obj.s, userSlot),
                messageStoreUrl: decodeUrl(obj.ms, obj.h, obj.sh, obj.s, userSlot),
                userWebSocketUrl: decodeUrl(obj.uws, obj.h, obj.sh, obj.s, userSlot, 'ws'),
                communicationEngineUrl: decodeUrl(obj.ce, obj.h, obj.sh, obj.s, userSlot),
                workspaceDashboardUrl: decodeUrl(obj.wdb, obj.h, obj.sh, obj.s, userSlot),
                workspaceDirectoryUrl: decodeUrl(obj.wd, obj.h, obj.sh, obj.s, userSlot),
            },
        };
        if (obj.vu) {
            auth.vaultAuth = decodeAuthData(obj.vu);
        }
        const napAuthInfo = obj.j ? {
            jwt: obj.j,
            authUrl: obj.nau,
            clientID: obj.nci,
            refreshToken: obj.nrt,
            redirectUri: obj.nru,
        } : undefined;
        if (!napAuthInfo) {
            return auth;
        }
        const personalAuthData = Object.assign(Object.assign({}, auth), { napAuthInfo });
        return personalAuthData;
    }
    catch (e) {
        throw new Error('Invalid auth token');
    }
}
exports.decodeAuthData = decodeAuthData;
// Fixes up urls returned from the service. If Conduit is accessing an internal endpoint (in thriftHost) the service
// still returns the external urls so they need to be converted to internal urls here.
function fixupAuthServiceUrls(urls, thriftHost, urlHost) {
    if (thriftHost === urlHost) {
        return urls;
    }
    const res = {};
    for (const k in urls) {
        const key = k;
        const url = urls[key];
        if (url && url.startsWith(urlHost)) {
            res[key] = thriftHost + url.slice(urlHost.length);
        }
        else {
            res[key] = url;
        }
    }
    return res;
}
exports.fixupAuthServiceUrls = fixupAuthServiceUrls;
function authHasJWT(authData) {
    return Boolean(hasNapAuthInfo(authData) && authData.napAuthInfo.jwt);
}
exports.authHasJWT = authHasJWT;
function authHeadersFromAuthData(authData, includeCookie) {
    const headers = {};
    if (includeCookie) {
        headers.cookie = `auth="${authData.token}"`;
    }
    if (hasNapAuthInfo(authData)) {
        const jwt = authData.napAuthInfo.jwt;
        const tokenOrigin = authData.napAuthInfo.refreshToken ? 'NAP' : 'MONOLITH';
        headers.Authorization = `Bearer ${jwt}`;
        headers['x-mono-authn-token'] = authData.token;
        headers['x-token-source'] = tokenOrigin;
        headers['x-feature-version'] = conduit_view_types_1.FEATURE_VERSION;
        headers['x-conduit-version'] = conduit_view_types_1.CONDUIT_VERSION;
    }
    return headers;
}
exports.authHeadersFromAuthData = authHeadersFromAuthData;
function authHeadersFromAuthString(authString, includeCookie) {
    return authHeadersFromAuthData(decodeAuthData(authString), includeCookie);
}
exports.authHeadersFromAuthString = authHeadersFromAuthString;
//# sourceMappingURL=index.js.map