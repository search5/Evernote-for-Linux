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
Object.defineProperty(exports, "__esModule", { value: true });
exports.drillDownIntoResponse = exports.SyncProgressType = exports.AdaptiveDownsyncType = exports.DownsyncMode = exports.OfflineContentStrategy = exports.AuthState = exports.LocalSettingsValueType = exports.LocalSettingsType = exports.isLocalUpload = exports.isExternalUpload = exports.ConduitEvent = exports.FEATURE_VERSION = exports.CONDUIT_VERSION = void 0;
var ConduitVersion_1 = require("./ConduitVersion");
Object.defineProperty(exports, "CONDUIT_VERSION", { enumerable: true, get: function () { return ConduitVersion_1.CONDUIT_VERSION; } });
__exportStar(require("./FeatureFlags"), exports);
__exportStar(require("./HttpTransport"), exports);
__exportStar(require("./Paging"), exports);
// this doesn't really belong here, as it is really Thrift-specific, but we need in places where we don't have the Thrift library imported
exports.FEATURE_VERSION = '4';
var ConduitEvent;
(function (ConduitEvent) {
    ConduitEvent["START_SYNCING_WITH_AUTH"] = "StartSyncingWithAuth";
    ConduitEvent["BOOTSTRAP_SYNC_FINISHED"] = "BootstrapSyncFinished";
    ConduitEvent["FATAL_ERROR"] = "FatalError";
    ConduitEvent["SEARCH_INDEX_UPDATED"] = "SearchIndexUpdated";
    ConduitEvent["NOTIFICATION_ACTION"] = "NotificationAction";
    ConduitEvent["FIRE_NOTIFICATION"] = "FireNotification";
})(ConduitEvent = exports.ConduitEvent || (exports.ConduitEvent = {}));
function isExternalUpload(params) {
    return 'url' in params && params.url !== undefined && params.url !== '';
}
exports.isExternalUpload = isExternalUpload;
function isLocalUpload(params) {
    return 'path' in params && params.path !== undefined && params.path !== '';
}
exports.isLocalUpload = isLocalUpload;
var LocalSettingsType;
(function (LocalSettingsType) {
    LocalSettingsType["User"] = "User";
    LocalSettingsType["System"] = "System";
})(LocalSettingsType = exports.LocalSettingsType || (exports.LocalSettingsType = {}));
var LocalSettingsValueType;
(function (LocalSettingsValueType) {
    LocalSettingsValueType["Boolean"] = "Boolean";
    LocalSettingsValueType["Int"] = "Int";
    LocalSettingsValueType["Number"] = "Number";
    LocalSettingsValueType["String"] = "String";
})(LocalSettingsValueType = exports.LocalSettingsValueType || (exports.LocalSettingsValueType = {}));
var AuthState;
(function (AuthState) {
    AuthState["NoAuth"] = "NoAuth";
    AuthState["NeedTwoFactor"] = "NeedTwoFactor";
    AuthState["NeedSSO"] = "NeedSSO";
    AuthState["Expired"] = "Expired";
    AuthState["BadAuthToken"] = "BadAuthToken";
    AuthState["UserChanged"] = "UserChanged";
    AuthState["Authorized"] = "Authorized";
    AuthState["ClientNotSupported"] = "ClientNotSupported";
    AuthState["SessionRevoked"] = "SessionRevoked";
    AuthState["PasswordResetRequired"] = "PasswordResetRequired";
})(AuthState = exports.AuthState || (exports.AuthState = {}));
var OfflineContentStrategy;
(function (OfflineContentStrategy) {
    OfflineContentStrategy["EVERYTHING"] = "Everything";
    OfflineContentStrategy["SELECTIVE"] = "Selective";
    OfflineContentStrategy["NONE"] = "None";
})(OfflineContentStrategy = exports.OfflineContentStrategy || (exports.OfflineContentStrategy = {}));
var DownsyncMode;
(function (DownsyncMode) {
    DownsyncMode["HYBRID"] = "Hybrid";
    DownsyncMode["NO_METADATA_WITH_BACKGROUND_SYNC"] = "NoMetadataWithBackground";
    DownsyncMode["NO_METADATA_NO_BACKGROUND_SYNC"] = "NoMetadataNoBackground";
    DownsyncMode["ADAPTIVE"] = "Adaptive";
    DownsyncMode["LEGACY"] = "Legacy";
    DownsyncMode["LEGACY_FOR_PREBUILT"] = "LegacyForPrebuilt";
})(DownsyncMode = exports.DownsyncMode || (exports.DownsyncMode = {}));
var AdaptiveDownsyncType;
(function (AdaptiveDownsyncType) {
    AdaptiveDownsyncType["NONE"] = "NONE";
    AdaptiveDownsyncType["FULL_DOWNSYNC_SMALL_ACCOUNT"] = "FULL_DOWNSYNC_SMALL_ACCOUNT";
    AdaptiveDownsyncType["FULL_DOWNSYNC_LARGE_ACCOUNT"] = "FULL_DOWNSYNC_LARGE_ACCOUNT";
    AdaptiveDownsyncType["LIMITED_DOWNSYNC"] = "LIMITED_DOWNSYNC";
})(AdaptiveDownsyncType = exports.AdaptiveDownsyncType || (exports.AdaptiveDownsyncType = {}));
var SyncProgressType;
(function (SyncProgressType) {
    SyncProgressType["NONE"] = "NONE";
    SyncProgressType["INITIAL_DOWNSYNC"] = "INITIAL_DOWNSYNC";
    SyncProgressType["DB_MIGRATION"] = "DB_MIGRATION";
    SyncProgressType["INCREMENTAL_SYNC"] = "INCREMENTAL_SYNC";
    SyncProgressType["IMMEDIATE_NOTE_SYNC"] = "IMMEDIATE_NOTE_SYNC";
    SyncProgressType["REINDEXING"] = "REINDEXING";
})(SyncProgressType = exports.SyncProgressType || (exports.SyncProgressType = {}));
function drillDownIntoResponse(data) {
    if (!data) {
        return data;
    }
    if (Array.isArray(data) || typeof data !== 'object') {
        return data;
    }
    const keys = Object.keys(data);
    // ignore __schema so GraphiQL still works
    if (keys.length === 1 && keys[0] !== '__schema') {
        return drillDownIntoResponse(data[keys[0]]);
    }
    return data;
}
exports.drillDownIntoResponse = drillDownIntoResponse;
//# sourceMappingURL=index.js.map