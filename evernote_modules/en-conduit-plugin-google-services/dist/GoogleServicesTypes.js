"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtlCacheManagerWrapper = exports.GoogleDriveResponseSchema = exports.GoogleDriveFileSchema = exports.GoogleApiCredentialSchema = exports.GoogleScopes = exports.GoogleServicesEnum = exports.GoogleServicesGQLEndpoint = void 0;
const conduit_utils_1 = require("conduit-utils");
const cacheTableName = 'GoogleDrive';
exports.GoogleServicesGQLEndpoint = 'GoogleServices';
var GoogleServicesEnum;
(function (GoogleServicesEnum) {
    GoogleServicesEnum["DRIVE"] = "DRIVE";
    GoogleServicesEnum["CALENDAR"] = "CALENDAR";
    GoogleServicesEnum["CONTACTS"] = "CONTACTS";
})(GoogleServicesEnum = exports.GoogleServicesEnum || (exports.GoogleServicesEnum = {}));
exports.GoogleScopes = {
    drive: {
        enum: GoogleServicesEnum.DRIVE,
        scope: '/auth/drive',
        scopeUri: 'https://www.googleapis.com/auth/drive',
    },
    calendar: {
        enum: GoogleServicesEnum.CALENDAR,
        scope: '/auth/calendar',
        scopeUri: 'https://www.google.com/calendar/feeds',
    },
    contacts: {
        enum: GoogleServicesEnum.CONTACTS,
        scope: '/m8/feeds',
        scopeUri: 'https://www.google.com/m8/feeds',
    },
};
const GoogleScopesEnumSchema = conduit_utils_1.EnumWithKeys({
    DRIVE: GoogleServicesEnum.DRIVE,
    CALENDAR: GoogleServicesEnum.CALENDAR,
    CONTACTS: GoogleServicesEnum.CONTACTS,
}, 'GoogleScopesEnum');
exports.GoogleApiCredentialSchema = conduit_utils_1.Struct({
    accessToken: 'string',
    oAuthVersion: 'number',
    services: conduit_utils_1.ListOf(GoogleScopesEnumSchema),
    scopeUris: conduit_utils_1.ListOf('string'),
    refreshesAfter: 'timestamp',
    expiresAfter: 'timestamp',
}, 'GoogleAuthCredential');
exports.GoogleDriveFileSchema = conduit_utils_1.Struct({
    id: 'string',
    label: conduit_utils_1.NullableString,
    description: conduit_utils_1.NullableString,
    modifiedTime: conduit_utils_1.NullableString,
    mimeType: conduit_utils_1.NullableString,
    binaryUri: conduit_utils_1.NullableString,
    viewerUri: conduit_utils_1.NullableString,
    fileSize: conduit_utils_1.NullableNumber,
    thumbnailLink: conduit_utils_1.NullableString,
    fullFileExtension: conduit_utils_1.NullableString,
}, 'GoogleDriveFile');
exports.GoogleDriveResponseSchema = conduit_utils_1.Struct({
    reason: 'string',
    message: 'string',
    fileId: 'string',
    data: conduit_utils_1.Nullable(exports.GoogleDriveFileSchema),
}, 'GoogleDriveResponse');
class TtlCacheManagerWrapper {
    constructor(ttlInMilliseconds = 5 * conduit_utils_1.MILLIS_IN_ONE_MINUTE, softCap = 750, hardCap = 1000) {
        this.ttlInMilliseconds = ttlInMilliseconds;
        this.cacheTableName = 'GoogleDrive';
        this.googleDriveCachePolicy = { softCap, hardCap };
        this.cacheManager = new conduit_utils_1.CacheManager(this.googleDriveCachePolicy);
        this.cacheManager.createTable(this.cacheTableName);
    }
    put(key, value) {
        const cachedValue = {
            data: value,
            timestamp: Date.now(),
        };
        this.cacheManager.put(this.cacheTableName, key, cachedValue);
    }
    get(key) {
        const entry = this.cacheManager.get(cacheTableName, key);
        if (entry && entry.data) {
            if (Date.now() - entry.timestamp <= this.ttlInMilliseconds) {
                return entry.data;
            }
            else {
                this.cacheManager.delete(this.cacheTableName, key);
            }
        }
        return null;
    }
    clear() {
        this.cacheManager.empty(this.cacheTableName);
    }
}
exports.TtlCacheManagerWrapper = TtlCacheManagerWrapper;
//# sourceMappingURL=GoogleServicesTypes.js.map