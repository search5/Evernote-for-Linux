"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSettings = void 0;
const conduit_utils_1 = require("conduit-utils");
const LOCAL_SETTINGS_DB_NAME = 'LocalSettingsDB';
const LOCAL_SETTINGS_TABLE_PREFIX = 'LocalSettingsTable';
const DIVIDER = ':';
const CONDUIT_TABLE_PREFIX = 'Conduit'; // for conduit internal use only.
function getTableName(userID, isConduitTable = false) {
    let postFix = isConduitTable ? (DIVIDER + CONDUIT_TABLE_PREFIX) : '';
    postFix += !userID ? '' : (DIVIDER + conduit_utils_1.keyStringForUserID(userID));
    return `${LOCAL_SETTINGS_TABLE_PREFIX}${postFix}`;
}
class LocalSettings {
    constructor(di) {
        this.di = di;
    }
    async destructor() {
        if (this.localSettingsStore) {
            await this.localSettingsStore.destructor();
            this.localSettingsStore = undefined;
        }
    }
    async init(trc) {
        this.localSettingsStore = await this.di.KeyValStorage(trc, LOCAL_SETTINGS_DB_NAME);
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        this.localSettingsStore.addChangeHandler(this.di.WatchTree);
    }
    async setValue(trc, tableName, key, value) {
        if (!key) {
            throw new Error('No key given');
        }
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        await this.localSettingsStore.transact(trc, 'LocalSettings.setValue', async (db) => {
            await db.setValue(trc, tableName, key, value);
        });
    }
    async getValue(trc, watcher, tableName, key, allowEmpty = false) {
        if (!key) {
            throw new Error('No key given');
        }
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        const val = await this.localSettingsStore.getValue(trc, watcher, tableName, key);
        if (val === undefined) {
            if (allowEmpty) {
                return;
            }
            throw new conduit_utils_1.NotFoundError(key, 'Key not found in local settings');
        }
        return val;
    }
    async removeValue(trc, tableName, key) {
        if (!key) {
            throw new Error('No key given');
        }
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        await this.localSettingsStore.transact(trc, 'LocalSettings.removeValue', async (db) => {
            await db.removeValue(trc, tableName, key);
        });
    }
    async getUserValue(trc, watcher, userID, key, allowEmpty) {
        return await this.getValue(trc, watcher, getTableName(userID), key, allowEmpty);
    }
    async setUserValue(trc, userID, key, value) {
        await this.setValue(trc, getTableName(userID), key, value);
    }
    async removeUserValue(trc, userID, key) {
        await this.removeValue(trc, getTableName(userID), key);
    }
    async getSystemValue(trc, watcher, key, allowEmpty) {
        return await this.getValue(trc, watcher, getTableName(null), key, allowEmpty);
    }
    async setSystemValue(trc, key, value) {
        await this.setValue(trc, getTableName(null), key, value);
    }
    async removeSystemValue(trc, key) {
        await this.removeValue(trc, getTableName(null), key);
    }
    async getConduitValue(trc, userID, key) {
        return await this.getValue(trc, null, getTableName(userID, true), key, true);
    }
    async setConduitValue(trc, userID, key, value) {
        await this.setValue(trc, getTableName(userID, true), key, value);
    }
    async removeConduitValue(trc, userID, key) {
        await this.removeValue(trc, getTableName(userID, true), key);
    }
    async clearUserSettings(trc, userID) {
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        await this.localSettingsStore.transact(trc, 'LocalSettings.clearUserSettings', async (db) => {
            await db.clearTable(trc, getTableName(userID));
        });
    }
    async clearSystemSettings(trc) {
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        await this.localSettingsStore.transact(trc, 'LocalSettings.clearSystemSettings', async (db) => {
            await db.clearTable(trc, getTableName(null));
        });
    }
    async clearConduitSettings(trc, userID) {
        if (!this.localSettingsStore) {
            throw new Error('Error initting the key value store');
        }
        await this.localSettingsStore.transact(trc, 'LocalSettings.clearConduitSettings', async (db) => {
            await db.clearTable(trc, getTableName(userID, true));
        });
    }
}
exports.LocalSettings = LocalSettings;
//# sourceMappingURL=LocalSettings.js.map