"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupExternalUrlFetchingIPC = exports.setupContentFetchingIPC = exports.registerResourceHandler = exports.registerResourceSchemePrivileges = exports.getResource = exports.decodeResourceUrl = exports.deleteCacheForUser = exports.fetchExternalResource = exports.fetchResource = exports.cacheResourceToDisk = void 0;
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const en_thrift_connector_1 = require("en-thrift-connector");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const stream_1 = require("stream");
const ElectronMainSecureStorage_1 = require("./ElectronMainSecureStorage");
const resourceProxyTrc = conduit_utils_1.createTraceContext('MainResourceProxy');
const isMain = process.type === 'browser';
const application = isMain ? electron_1.app : electron_1.remote.app;
const oldResourceCacheFolderPath = path_1.default.join(application.getPath('userData'), 'resourceCache');
const resourceCacheFolderPath = path_1.default.join(application.getPath('userData'), 'resource-cache');
const tempFolderPath = application.getPath('temp');
const uploadTempPath = path_1.default.join(tempFolderPath, 'conduit-attachements');
const enResourceRegex = /en-cache:\/\/([^+]+)\+([^+]+)\+([^+]+)\+(.*)/;
const gActiveFetches = {};
async function getAuthHeaderFromCookie(trc, encodedCookieStr) {
    if (!ElectronMainSecureStorage_1.secureStorage) {
        throw new Error(`This function must be called only from main process`);
    }
    const tokenKey = decodeURIComponent(encodedCookieStr).slice('tokenKey="'.length, -1);
    const token = await ElectronMainSecureStorage_1.secureStorage.getString(trc, tokenKey);
    if (!token) {
        throw new Error(`${tokenKey} does not exist in secure storage, the user is unauthenticated`);
    }
    const authData = en_thrift_connector_1.decodeAuthData(token);
    if (en_thrift_connector_1.hasNapAuthInfo(authData)) {
        return Object.assign({ cookie: `auth="${authData.token}"` }, en_thrift_connector_1.QuasarMinusAuthHandler.getAuthHeaders(authData));
    }
    return {
        cookie: `auth="${authData.token}"`,
    };
}
function handleResourceRequest(request, callback) {
    getResource(request.url).then(resource => {
        callback({
            statusCode: 200,
            headers: {
                'Content-Type': resource.mime,
            },
            data: resource.stream,
        });
    }).catch(err => {
        conduit_utils_1.logger.warn('ResourceProxy request failure', { url: request.url, err });
        const data = new stream_1.Readable();
        data._read = () => undefined;
        data.push(err.stack || err.message || conduit_utils_1.safeStringify(err));
        data.push(null);
        callback({
            statusCode: typeof err === 'number' ? err : 500,
            headers: {},
            data,
        });
    });
}
async function cacheResourceToDisk(stream, mimeType, filePath, mimeFilePath) {
    return new Promise(async (resolve, reject) => {
        try {
            const tmpFile = filePath + '.tmp';
            await fs_extra_1.default.ensureFile(tmpFile);
            if (mimeFilePath) {
                await fs_extra_1.default.writeFile(mimeFilePath, mimeType, 'utf-8');
            }
            const fileStream = fs_extra_1.default.createWriteStream(tmpFile);
            const pipeStream = stream.pipe(fileStream);
            pipeStream.on('error', e => {
                conduit_utils_1.logger.error(`Could not write downloaded resource to disk at ${tmpFile}`, e);
                reject(e);
            });
            pipeStream.on('close', async () => {
                conduit_utils_1.logger.debug(`Finished writing downloaded resource to disk at ${tmpFile}`);
                await fs_extra_1.default.move(tmpFile, filePath, { overwrite: true });
                conduit_utils_1.logger.debug(`Moved downloaded resource to ${filePath}`);
                resolve();
            });
        }
        catch (err) {
            conduit_utils_1.logger.error(`Error writing downloaded resource to disk ${filePath}`, err);
            reject(err);
        }
    });
}
exports.cacheResourceToDisk = cacheResourceToDisk;
async function fetchResource(key, url, filePath, mimeFilePath, authHeaders, waitForEntireResource) {
    if (!isMain) {
        throw new Error('#fetchResource cannot be called from outside the main process.');
    }
    if (gActiveFetches[filePath]) {
        return gActiveFetches[filePath];
    }
    const newFetch = new Promise((resolve, reject) => {
        const rejectEnd = (reason) => {
            delete gActiveFetches[filePath];
            reject(reason);
        };
        const resolveEnd = (reason) => {
            delete gActiveFetches[filePath];
            resolve(reason);
        };
        const request = electron_1.net.request({ url });
        for (const header in authHeaders) {
            authHeaders[header] && request.setHeader(header, authHeaders[header]);
        }
        request.on('response', response => {
            response.on('error', (err) => {
                conduit_utils_1.logger.error(`failed to fetch resource: ${err}`);
                rejectEnd(err);
            });
            if (response.statusCode !== 200) {
                conduit_utils_1.logger.error(`Could not fetch resource at ${url} - status code ${response.statusCode}`);
                if (response.statusCode === 503) {
                    return rejectEnd(new conduit_utils_1.RetryError(`${response.statusCode}`, 500));
                }
                return rejectEnd(response.statusCode);
            }
            const stream = response; // Node response objects ARE readable streams.
            // Ref https://nodejs.org/api/http.html#http_message_headers certain headers are type `string[]` while others are `string`
            const mime = (response.headers['content-type'] || '');
            if (waitForEntireResource) {
                cacheResourceToDisk(stream, mime, filePath, mimeFilePath)
                    .then(() => {
                    resolveEnd();
                })
                    .catch(err => {
                    rejectEnd(err);
                });
            }
            else {
                // clone response stream so it can be returned immediately.
                const retStream = new stream_1.PassThrough();
                const fileStream = new stream_1.PassThrough();
                stream.pipe(retStream);
                stream.pipe(fileStream);
                const ret = {
                    key,
                    mime,
                    stream: retStream,
                    url,
                };
                cacheResourceToDisk(fileStream, mime, filePath, mimeFilePath).catch(err => {
                    // errors caught in cacheResourceToDisk
                });
                resolveEnd(ret);
            }
        });
        request.on('error', err => {
            conduit_utils_1.logger.error(`failed to fetch resource: ${err}`);
            rejectEnd(new conduit_utils_1.RetryError(err.message, 500));
        });
        request.end();
    });
    gActiveFetches[filePath] = newFetch;
    return newFetch;
}
exports.fetchResource = fetchResource;
async function fetchExternalResource(url) {
    if (!isMain) {
        throw new Error('#fetchExternalResource cannot be called from outside the main process.');
    }
    const newFetch = new Promise((resolve, reject) => {
        const request = electron_1.net.request({ url });
        request.on('response', response => {
            response.on('error', (err) => {
                conduit_utils_1.logger.error(`failed to fetch resource: ${err}`);
                reject(err);
            });
            const stream = response; // Node response objects ARE readable streams.
            // Ref https://nodejs.org/api/http.html#http_message_headers certain headers are type `string[]` while others are `string`
            const mime = (response.headers['content-type'] || '');
            const tempExternalKey = en_conduit_electron_shared_1.getId();
            const filePath = path_1.default.join(uploadTempPath, tempExternalKey);
            cacheResourceToDisk(stream, mime, filePath)
                .then(() => {
                resolve({
                    filePath,
                    mime,
                });
            })
                .catch(err => {
                reject(err);
            });
        });
        request.on('error', err => {
            conduit_utils_1.logger.error(`failed to fetch resource: ${err}`);
            reject(new Error(err.message));
        });
        request.end();
    });
    return newFetch;
}
exports.fetchExternalResource = fetchExternalResource;
function getUserPathFromID(userID) {
    // windows doesn't allow : in path.
    return userID.replace(':', '');
}
async function deleteCacheForUser(userID) {
    const cachePath = path_1.default.join(resourceCacheFolderPath, getUserPathFromID(userID));
    try {
        if (await fs_extra_1.default.pathExists(cachePath)) {
            await fs_extra_1.default.remove(cachePath);
        }
        if (await fs_extra_1.default.pathExists(oldResourceCacheFolderPath)) {
            await fs_extra_1.default.remove(oldResourceCacheFolderPath);
        }
    }
    catch (err) {
        conduit_utils_1.logger.error(`Failed to clear resource cache for user ${userID} ${cachePath}`);
    }
}
exports.deleteCacheForUser = deleteCacheForUser;
function sanitizeFolderOrFile(name) {
    return sanitize_filename_1.default(name, { replacement: '-!-' });
}
function decodeResourceUrl(url) {
    const matches = url.match(enResourceRegex);
    if (!matches) {
        throw new Error('Invalid en-cache url');
    }
    const [, encodedCookieStr, encodedParentKey, key, encodedResourceUrl] = matches;
    const userID = decodeURIComponent(encodedCookieStr).slice('tokenKey="AuthToken:'.length, -1);
    const userPath = getUserPathFromID(userID);
    const resourceFilePath = path_1.default.join(resourceCacheFolderPath, sanitizeFolderOrFile(userPath), sanitizeFolderOrFile(encodedParentKey), sanitizeFolderOrFile(key));
    const mimeFilePath = resourceFilePath + '.mime';
    const resourceUrl = decodeURI(encodedResourceUrl);
    return {
        encodedCookieStr,
        resourceFilePath,
        mimeFilePath,
        resourceUrl,
        key,
    };
}
exports.decodeResourceUrl = decodeResourceUrl;
async function getResource(url) {
    if (!isMain) {
        throw new Error('#getResource cannot be called from outside the main process.');
    }
    const { key, resourceFilePath, mimeFilePath, resourceUrl, encodedCookieStr } = decodeResourceUrl(url);
    if (!fs_extra_1.default.existsSync(resourceFilePath) || !fs_extra_1.default.existsSync(mimeFilePath)) {
        const authHeader = await getAuthHeaderFromCookie(resourceProxyTrc, encodedCookieStr);
        const res = await fetchResource(key, resourceUrl, resourceFilePath, mimeFilePath, authHeader, false);
        if (!res) {
            throw new Error('Response stream not returned by fetchResource');
        }
        return res;
    }
    return {
        key,
        mime: fs_extra_1.default.readFileSync(mimeFilePath, 'utf-8'),
        stream: fs_extra_1.default.createReadStream(resourceFilePath),
        url: resourceUrl,
    };
}
exports.getResource = getResource;
// TODO Make this extensible
function registerResourceSchemePrivileges() {
    electron_1.protocol.registerSchemesAsPrivileged([{ scheme: 'en-cache', privileges: { supportFetchAPI: true } }]);
}
exports.registerResourceSchemePrivileges = registerResourceSchemePrivileges;
function registerResourceHandler(window) {
    conduit_utils_1.logger.debug('resourceCacheFolderPath', resourceCacheFolderPath);
    window.webContents.session.protocol.registerStreamProtocol('en-cache', handleResourceRequest);
}
exports.registerResourceHandler = registerResourceHandler;
function setupContentFetchingIPC() {
    electron_1.ipcMain.handle(en_conduit_electron_shared_1.ElectronContentFetchChannel, async (event, message) => {
        const authHeader = await getAuthHeaderFromCookie(resourceProxyTrc, message.encodedCookieStr);
        await fetchResource(message.key, message.resourceUrl, message.resourceFilePath, message.mimeFilePath, authHeader, true);
    });
}
exports.setupContentFetchingIPC = setupContentFetchingIPC;
function setupExternalUrlFetchingIPC() {
    electron_1.ipcMain.handle(en_conduit_electron_shared_1.ElectronExternalUrlFetchChannel, async (event, message) => {
        return await fetchExternalResource(message.fileUrl);
    });
}
exports.setupExternalUrlFetchingIPC = setupExternalUrlFetchingIPC;
//# sourceMappingURL=MainResourceProxy.js.map