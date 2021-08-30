"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupElectronPrebuiltIPC = exports.cleanupTempFile = exports.fetchPrebuiltDatabase = exports.setDefaultPrebuiltDownloadPath = void 0;
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const zlib_1 = __importDefault(require("zlib"));
const MessageTypes_1 = require("./MessageTypes");
let gDefaultPrebuiltPath = '';
function setDefaultPrebuiltDownloadPath(downloadPath) {
    gDefaultPrebuiltPath = downloadPath;
}
exports.setDefaultPrebuiltDownloadPath = setDefaultPrebuiltDownloadPath;
async function fetchPrebuiltDatabase(trc, request, cookieStr, url, fetchProgressCB, fs) {
    const downloadPath = (electron_1.app === null || electron_1.app === void 0 ? void 0 : electron_1.app.getPath('userData')) || gDefaultPrebuiltPath;
    if (!downloadPath) {
        throw new Error('Could not find a download path for prebuilt binary');
    }
    const filePath = path_1.default.join(downloadPath, conduit_utils_1.generateRandomString('temp_'));
    await fs.ensureFile(filePath);
    return new Promise((resolve, reject) => {
        request.setHeader('cookie', cookieStr);
        request.on('response', response => {
            var _a;
            response.on('error', (err) => {
                conduit_utils_1.logger.info(`failed to fetch prebuilt binary: ${err}`);
                reject(err);
            });
            if (response.statusCode !== 200) {
                conduit_utils_1.logger.info(`Could not fetch prebuilt binary at ${url} - status code ${response.statusCode}`);
                if (response.statusCode === 503) {
                    return reject(new conduit_utils_1.RetryError(`${response.statusCode}`, 500));
                }
                return reject(response.statusCode);
            }
            const totalBytes = Number(response.headers['content-length']) || 0;
            let receivedBytes = 0;
            response.addListener('data', chunk => {
                receivedBytes += chunk.byteLength || chunk.length;
                fetchProgressCB(receivedBytes, totalBytes);
            });
            let inStream = response; // Node response objects ARE readable streams.
            const outStream = fs.createWriteStream(filePath);
            if (((_a = response.headers['content-encoding']) === null || _a === void 0 ? void 0 : _a.includes('gzip')) && process.type !== 'browser') {
                // electron automatically decompresses zipped content
                inStream = inStream.pipe(zlib_1.default.createGunzip());
            }
            const pipeStream = inStream.pipe(outStream);
            pipeStream.on('error', e => {
                conduit_utils_1.logger.info(`Could not write downloaded prebuilt binary to disk at ${filePath}`, e);
                reject(e);
            });
            pipeStream.on('finish', () => {
                conduit_utils_1.logger.debug(`Finished writing downloaded prebuilt binary to disk at ${filePath}`);
                const builderVersion = response.headers['conduit-version'];
                conduit_utils_1.logger.info(`Binary built by conduit ${builderVersion !== null && builderVersion !== void 0 ? builderVersion : '<unknown>'}`);
                resolve(filePath);
            });
        });
        request.on('error', err => {
            conduit_utils_1.logger.info(`Failed to fetch prebuilt binary: ${err}`);
            reject(new Error(err.message));
        });
        request.end();
    });
}
exports.fetchPrebuiltDatabase = fetchPrebuiltDatabase;
async function cleanupTempFile(trc, filename, fs) {
    await conduit_utils_1.withError(fs.unlink(filename));
}
exports.cleanupTempFile = cleanupTempFile;
const prebuiltTrc = conduit_utils_1.createTraceContext('ElectronFetchPrebuiltDB');
function setupElectronPrebuiltIPC(fs) {
    const isMain = process.type === 'browser';
    if (!isMain) {
        // only need to register this in main process.
        throw new Error('setupElectronPrebuiltIPC should only be called in the main process');
    }
    electron_1.ipcMain.handle(MessageTypes_1.ElectronPrebuiltDBChannel, async ({ sender }, message) => {
        const progressCB = (receivedBytes, totalBytes) => {
            const updateMessage = { receivedBytes, totalBytes };
            sender.send(MessageTypes_1.ElectronPrebuiltDBChannel, updateMessage);
        };
        const request = electron_1.net.request({ url: message.url });
        return await fetchPrebuiltDatabase(prebuiltTrc, request, message.cookieStr, message.url, progressCB, fs);
    });
}
exports.setupElectronPrebuiltIPC = setupElectronPrebuiltIPC;
//# sourceMappingURL=fetchElectronPrebuiltDB.js.map