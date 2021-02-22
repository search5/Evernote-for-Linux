"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlToNativeCache = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
function urlToNativeCache(parentKey, key, url, userID) {
    if (!url || !userID) {
        return url;
    }
    /*
    We are passing the key under which the auth token lives in secure storage.
    The key will be used by the resource proxy to retrieve the token from the client's native secure storage.
    Using the user's longlived auth token is fine even for shared notes as the monolith will resolve the token.
    */
    const tokenKey = conduit_storage_1.getSecureStorageKey(userID);
    const tokenKeyCookieString = `tokenKey="${tokenKey}"`;
    return `en-cache://${encodeURIComponent(tokenKeyCookieString)}+${encodeURIComponent(parentKey)}+${key || conduit_utils_1.md5(url)}+${encodeURI(url)}`;
    // TODO there still seems to be the occasional auth problem here; specifically a notebook shared from a
    // business account to a non-business account will give thumbnail urls with business/dispatch/ in them.
    // These fail to fetch with a 401 not authorized error.
}
exports.urlToNativeCache = urlToNativeCache;
//# sourceMappingURL=UrlCacheEncoder.js.map