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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_storage_better_sqlite3_1 = require("conduit-storage-better-sqlite3");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_1 = require("conduit-view");
const conduit_view_types_1 = require("conduit-view-types");
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const en_conduit_plugin_scheduled_notification_1 = require("en-conduit-plugin-scheduled-notification");
const en_conduit_plugin_search_1 = require("en-conduit-plugin-search");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const ENThriftConnector = __importStar(require("en-thrift-connector"));
const event_source_polyfill_1 = require("event-source-polyfill");
const evernote_thrift_1 = require("evernote-thrift");
const fs_extra_1 = __importDefault(require("fs-extra"));
const ElectronNotificationManager_1 = require("./conduit-electron-notifications/ElectronNotificationManager");
const ElectronWorkerSecureStorage_1 = require("./ElectronWorkerSecureStorage");
const setupElectronPlugins_1 = require("./setupElectronPlugins");
const setupMainToWorkerBridge_1 = require("./setupMainToWorkerBridge");
const WorkerResourceProxy_1 = require("./WorkerResourceProxy");
electron_1.ipcRenderer.on('init', async ({ sender }, message) => {
    try {
        await init(message);
        sender.send('init-result', null);
    }
    catch (e) {
        conduit_utils_1.logger.error('conduit init failed', e);
        sender.send('init-result', e.message);
    }
});
let gConduitCore;
async function fetchPrebuiltDBElectron(trc, cookieStr, url, fetchProgressCB) {
    const progressHandler = async (event, message) => {
        fetchProgressCB(message.receivedBytes, message.totalBytes);
    };
    electron_1.ipcRenderer.on(en_conduit_electron_shared_1.ElectronPrebuiltDBChannel, progressHandler);
    const fetchMessage = { cookieStr, url };
    const resp = await electron_1.ipcRenderer.invoke(en_conduit_electron_shared_1.ElectronPrebuiltDBChannel, fetchMessage);
    conduit_utils_1.logger.trace(`Electron prebuilt DB temp file saved at ${resp}`);
    electron_1.ipcRenderer.removeListener(en_conduit_electron_shared_1.ElectronPrebuiltDBChannel, progressHandler);
    return resp;
}
function generateUUID() {
    return conduit_utils_1.uuid();
}
async function init(config) {
    if (gConduitCore) {
        throw new Error('en-conduit-electron-worker already initialized');
    }
    const { backgroundNoteContentSyncConfig, backgroundNoteMetadataSyncConfig, cachePolicy, clientCredentials, customHeaders, dbPath, downsyncConfig, iconPath, loadingScreenConfig, noFreezeImmutable, offlineSearchIndexingConfig, sendMutationMetrics, servicesConfig, } = config.params;
    // Use render logger
    conduit_utils_1.logger.configure({
        name: 'conduit-electron-worker',
        console: {
            level: conduit_utils_1.LogLevel.INFO,
        },
    }, c => new en_conduit_electron_shared_1.ElectronRendererLogger(c.name, true));
    const headers = Object.assign({}, customHeaders);
    headers['X-Feature-Version'] = conduit_view_types_1.FEATURE_VERSION;
    const emitEvent = (event, data) => {
        gConduitCore && gConduitCore.emitEvent(event, data);
        setupMainToWorkerBridge_1.sendConduitEvent(event, data);
    };
    const thriftConduitConfig = ENThriftConnector.init(Object.assign(Object.assign({}, conduit_core_1.conduitDIProxy(() => gConduitCore)), { emitEvent, getBetaFeatureIDs: () => config.params.featureIDs || [], getMaestroClientType: () => config.params.maestroClientType, getMaestroPlatform: () => config.params.maestroPlatform, getPromotionIDs: () => config.params.promotionIDs || [], getProtocol: (serviceHost) => {
            const transportOptions = { noCredentials: true, headers };
            const transport = new evernote_thrift_1.BinaryFetchHttpTransport(serviceHost, transportOptions);
            return new evernote_thrift_1.BinaryProtocol(transport);
        }, getResourceProxyType: () => en_conduit_sync_types_1.ResourceProxyType.NativeLayerCache, getHttpTransport: () => new en_conduit_electron_shared_1.ElectronRendererHttpClient(), ResourceManager: (rmDI) => new WorkerResourceProxy_1.ElectronResourceManager(rmDI), getOfflineContentStrategy: () => config.params.offlineContentStrategy || conduit_view_types_1.OfflineContentStrategy.NONE, newEventSource: (url, esHeaders) => {
            // TODO: unsure if this will work with electron
            return new event_source_polyfill_1.EventSourcePolyfill(url, {
                withCredentials: true,
                headers: Object.assign(Object.assign({}, customHeaders), esHeaders),
            });
        }, getSystemLocale: () => {
            return en_conduit_electron_shared_1.getLocale();
        }, getTestEventTracker: () => null, fetchPrebuiltDatabase: (downsyncConfig === null || downsyncConfig === void 0 ? void 0 : downsyncConfig.noPrebuiltDB) ? null : fetchPrebuiltDBElectron, cleanupTempFile: (trc, filename) => en_conduit_electron_shared_1.cleanupTempFile(trc, filename, fs_extra_1.default), getSearchShareAcceptMetadata: en_conduit_plugin_search_1.getShareAcceptMetadataForNote, uuid: generateUUID, backgroundNoteContentSyncConfig: backgroundNoteContentSyncConfig || {}, backgroundNoteMetadataSyncConfig: backgroundNoteMetadataSyncConfig || {}, downsyncConfig: downsyncConfig || { downsyncMode: conduit_view_types_1.DownsyncMode.HYBRID }, loadingScreenConfig: loadingScreenConfig || {}, offlineSearchIndexingConfig: offlineSearchIndexingConfig || {}, clientCredentials, isNSyncEnabled: true, realtimeMode: true, nSyncEntityFilter: config.params.nSyncEntityFilter, hostDefaults: config.params.hostDefaults, hostResolverUrl: config.params.overrideHostResolverUrl, overrideFileServiceUrl: config.params.overrideFileServiceUrl, customHeaders, serviceAvailabilityOverrideUrl: config.params.serviceAvailabilityOverrideUrl, featureRolloutClientType: en_conduit_sync_types_1.FeatureRolloutClientTypes.Desktop }), { maxBackoffTimeout: servicesConfig === null || servicesConfig === void 0 ? void 0 : servicesConfig.maxBackoffTimeout });
    const di = Object.assign(Object.assign({}, thriftConduitConfig.di), { featureFlags: servicesConfig === null || servicesConfig === void 0 ? void 0 : servicesConfig.featureFlags, SecureStorage: () => ElectronWorkerSecureStorage_1.workerSecureStorage, KeyValStorage: async (trc, name) => {
            const db = new conduit_storage_better_sqlite3_1.ConduitSQLiteStorage(dbPath, name, cachePolicy, () => {
                emitEvent(conduit_view_types_1.ConduitEvent.FATAL_ERROR);
            });
            await db.init(trc);
            return new conduit_storage_1.KeyValBackgroundWriter(db);
        }, KeyValStorageMem: (trc, name) => {
            return new conduit_storage_1.KeyValDatabaseMem(name);
        }, sendMutationMetrics: !!sendMutationMetrics, loginWithAuthInQueue: thriftConduitConfig.loginWithAuthInQueue, getTestEventTracker: () => null, NotificationManager: () => {
            return new ElectronNotificationManager_1.ElectronNotificationManager(Object.assign(Object.assign({}, en_conduit_plugin_scheduled_notification_1.notificationManagerSNUtilityDI), { emitEvent, getIconPath: () => iconPath || '' }));
        } });
    gConduitCore = new conduit_core_1.ConduitCore(di, {
        noFreezeImmutable,
        clientCredentials,
        syncContextIndexExcludes: thriftConduitConfig.syncContextIndexExcludes,
        plugins: setupElectronPlugins_1.setupElectronPlugins(thriftConduitConfig, servicesConfig),
        userFieldMap: {
            username: 'username',
            fullName: 'name',
            email: 'email',
        },
        maxBackoffTimeout: servicesConfig === null || servicesConfig === void 0 ? void 0 : servicesConfig.maxBackoffTimeout,
        etncHostInformation: servicesConfig === null || servicesConfig === void 0 ? void 0 : servicesConfig.etncHostInformation,
    });
    await gConduitCore.init();
    setupMainToWorkerBridge_1.setupMainToWorkerBridge(gConduitCore);
    // for main-process queries:
    conduit_view_1.connector.init(gConduitCore, noFreezeImmutable);
}
//# sourceMappingURL=index.js.map