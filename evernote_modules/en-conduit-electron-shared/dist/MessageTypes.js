"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronLogLevel = exports.ElectronLocaleFetchChannel = exports.ElectronExternalUrlFetchChannel = exports.ElectronPrebuiltDBChannel = exports.ElectronContentFetchChannel = exports.ElectronSecureStorageChannel = exports.ElectronLogChannel = exports.ElectronIPCChannel = void 0;
exports.ElectronIPCChannel = 'conduit-electron-ipc';
exports.ElectronLogChannel = 'conduit-electron-logs-ipc';
exports.ElectronSecureStorageChannel = 'conduit-electron-secured-storage-ipc';
exports.ElectronContentFetchChannel = 'conduit-electron-content-fetch-ipc';
exports.ElectronPrebuiltDBChannel = 'conduit-electron-prebuilt-db-ipc';
exports.ElectronExternalUrlFetchChannel = 'conduit-electron-external-url-fetch-ipc';
exports.ElectronLocaleFetchChannel = 'conduit-electron-locale-fetch-ipc';
var ElectronLogLevel;
(function (ElectronLogLevel) {
    ElectronLogLevel["TRACE"] = "trace";
    ElectronLogLevel["INFO"] = "info";
    ElectronLogLevel["DEBUG"] = "debug";
    ElectronLogLevel["WARN"] = "warn";
    ElectronLogLevel["ERROR"] = "error";
    ElectronLogLevel["FATAL"] = "fatal";
})(ElectronLogLevel = exports.ElectronLogLevel || (exports.ElectronLogLevel = {}));
//# sourceMappingURL=MessageTypes.js.map