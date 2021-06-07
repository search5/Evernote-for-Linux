"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerWindow = exports.deinit = exports.init = exports.electronLogger = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_1 = require("conduit-view");
const conduit_view_types_1 = require("conduit-view-types");
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const fs_extra_1 = __importDefault(require("fs-extra"));
const ElectronMainSecureStorage_1 = require("./ElectronMainSecureStorage");
const MainResourceProxy_1 = require("./MainResourceProxy");
const MiscMainIPC_1 = require("./MiscMainIPC");
const setupElectronLogger_1 = require("./setupElectronLogger");
var electronLogger_1 = require("./electronLogger");
Object.defineProperty(exports, "electronLogger", { enumerable: true, get: function () { return electronLogger_1.electronLogger; } });
__exportStar(require("./MainResourceProxy"), exports);
const MAX_RETRY_COUNT = 5;
let gConduitWindow;
let gConduitIPC;
let retries = 0;
/**
 * Starts Conduit in a hidden window
 */
async function init(config) {
    en_conduit_electron_shared_1.setupElectronPrebuiltIPC(fs_extra_1.default);
    ElectronMainSecureStorage_1.setupSecureStorageIPC();
    MainResourceProxy_1.setupContentFetchingIPC();
    MainResourceProxy_1.setupExternalUrlFetchingIPC();
    setupElectronLogger_1.setupElectronLogger();
    MiscMainIPC_1.setupLocaleFetchingIPC();
    await initWorkerWindow(config);
}
exports.init = init;
async function deinit() {
    var _a, _b, _c, _d;
    (_a = gConduitWindow === null || gConduitWindow === void 0 ? void 0 : gConduitWindow.webContents) === null || _a === void 0 ? void 0 : _a.removeAllListeners('render-process-gone');
    (_b = gConduitWindow === null || gConduitWindow === void 0 ? void 0 : gConduitWindow.webContents) === null || _b === void 0 ? void 0 : _b.removeAllListeners('destroyed');
    (_c = gConduitWindow === null || gConduitWindow === void 0 ? void 0 : gConduitWindow.webContents) === null || _c === void 0 ? void 0 : _c.removeAllListeners('unresponsive');
    (_d = gConduitWindow === null || gConduitWindow === void 0 ? void 0 : gConduitWindow.webContents) === null || _d === void 0 ? void 0 : _d.removeAllListeners('responsive');
    await deinitWorkerWindow();
}
exports.deinit = deinit;
function getWorkerWindow() {
    return gConduitWindow;
}
exports.getWorkerWindow = getWorkerWindow;
async function initWorkerWindow(config) {
    var _a;
    retries++;
    if (retries > MAX_RETRY_COUNT) {
        const errorMsg = 'Failed to initialize conduit worker, max retry count exceeded';
        // NOTE: this works even when ipc is paused
        gConduitIPC === null || gConduitIPC === void 0 ? void 0 : gConduitIPC.emitEvent(conduit_view_types_1.ConduitEvent.FATAL_ERROR);
        conduit_utils_1.logger.fatal(errorMsg);
        throw new Error(errorMsg);
    }
    gConduitWindow = new electron_1.BrowserWindow({
        show: (_a = config.showConduitWorkerWindow) !== null && _a !== void 0 ? _a : false,
        skipTaskbar: true,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            // Disable web security if we are in a dev environment
            webSecurity: config.nodeEnv !== 'development',
            backgroundThrottling: false,
        },
    });
    const restartOnce = conduit_utils_1.once(() => restartWorkerWindow(config));
    gConduitWindow.on('closed', () => (gConduitWindow = undefined));
    gConduitWindow.webContents.on('render-process-gone', (_, details) => {
        conduit_utils_1.logger.error('Render process gone', details);
        restartOnce();
    });
    gConduitWindow.webContents.on('destroyed', () => {
        conduit_utils_1.logger.warn('Conduit worker webContents destroyed');
        restartOnce();
    });
    let waitForResponsive;
    gConduitWindow.webContents.on('unresponsive', () => {
        waitForResponsive = setTimeout(restartOnce, 10000);
    });
    gConduitWindow.webContents.on('responsive', () => clearTimeout(waitForResponsive));
    // electron doesn't let us override user-agent header from renderer window
    // so strip it here if present and set userAgent option on worker window.
    const { customHeaders } = config;
    const userAgent = customHeaders['User-Agent'] || customHeaders['user-agent'] || null;
    await gConduitWindow.loadURL(config.workerUrl, userAgent ? { userAgent } : undefined);
    const initPromise = new Promise((resolve, reject) => {
        electron_1.ipcMain.once('init-result', (_, errorMsg) => {
            if (errorMsg !== null) {
                reject(new Error(errorMsg));
                return;
            }
            resolve();
        });
    });
    gConduitWindow.webContents.send('init', { params: config });
    await initPromise;
    // Conduit initialized successfully, reset the retry counter
    retries = 0;
    if (!gConduitIPC) {
        gConduitIPC = new en_conduit_electron_shared_1.ConduitMainIPC(gConduitWindow);
    }
    else {
        gConduitIPC.resume(gConduitWindow);
    }
    conduit_view_1.connector.init(gConduitIPC, config.noFreezeImmutable);
    gConduitIPC.resubscribe();
    conduit_utils_1.applyTelemetryDestination(conduit_view_1.eventsOverIPCDestination);
}
function restartWorkerWindow(config) {
    try {
        conduit_utils_1.logger.info('restarted the conduit worker');
        gConduitIPC === null || gConduitIPC === void 0 ? void 0 : gConduitIPC.pause();
        conduit_view_1.connector.deinit();
        // This line errors if the window is already closed
        gConduitWindow === null || gConduitWindow === void 0 ? void 0 : gConduitWindow.close();
    }
    catch (e) {
        conduit_utils_1.logger.warn('tried to kill a non existent conduit worker', e);
    }
    initWorkerWindow(config).catch(e => {
        conduit_utils_1.logger.error('failed to restart worker window', e);
    });
}
async function deinitWorkerWindow() {
    const deinitPromise = new Promise((resolve, reject) => {
        electron_1.ipcMain.once('deinit-result', (_, errorMsg) => {
            if (errorMsg !== null) {
                reject(new Error(errorMsg));
                return;
            }
            resolve();
        });
    });
    gConduitIPC === null || gConduitIPC === void 0 ? void 0 : gConduitIPC.deInit();
    conduit_view_1.connector.deinit();
    await deinitPromise;
    // FIXME close worker window and drop references to it
}
//# sourceMappingURL=index.js.map