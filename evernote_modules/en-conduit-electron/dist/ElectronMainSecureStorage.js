"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecureStorageIPC = exports.secureStorage = exports.ElectronMainSecureStorage = void 0;
const conduit_utils_1 = require("conduit-utils");
const crypto_1 = __importDefault(require("crypto"));
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const fs_extra_1 = __importDefault(require("fs-extra"));
const keytar_1 = __importDefault(require("keytar"));
const path_1 = __importDefault(require("path"));
function isEncryptedFsData(data) {
    return data && typeof data === 'object' && typeof data.iv === 'string' && typeof data.encrypted === 'string';
}
const isMain = process.type === 'browser';
const bridgeTrc = conduit_utils_1.createTraceContext('ElectronSecureStorage');
// MacOS has a deadlock bug where concurrent keystore accesses
// completely blocks all kinds of I/O. Running all keystore operations
// in a mutex to prevent that from happening.
const secureStorageMutex = new conduit_utils_1.Mutex('ConduitSecureStorage');
class ElectronMainSecureStorage {
    constructor() {
        this.service = 'Evernote';
        this.encrKeyPrefix = 'enote-encr-key';
        this.secureStorageCache = {};
        this.encrKeyCache = {};
        this.encryptionAlgorithm = 'aes-256-cbc';
        this.encrKeyLen = 32;
        this.secureStorageFolderPath = isMain ? path_1.default.join(electron_1.app.getPath('userData'), 'secure-storage') : '';
    }
    async getEncryptionKey(trc, key) {
        let newKeyCreated = false;
        if (this.encrKeyCache[key]) {
            return { encrKey: this.encrKeyCache[key], newKeyCreated };
        }
        // read key from keychain
        const encrKey = await secureStorageMutex.runInMutex(trc, 'ConduitSecureStorageGetEncrKey', async () => {
            const val = await keytar_1.default.getPassword(this.service, key);
            if (val === null || val === void 0 ? void 0 : val.startsWith(this.encrKeyPrefix)) {
                return Buffer.from(val.slice(this.encrKeyPrefix.length), 'base64');
            }
            else if (val) {
                conduit_utils_1.logger.warn(`Key ${key} not in expected format in secure storage. Generating new key`);
            }
            newKeyCreated = true;
            const newEncrKey = await crypto_1.default.randomBytes(this.encrKeyLen);
            // write to keychain
            await keytar_1.default.setPassword(this.service, key, this.encrKeyPrefix + newEncrKey.toString('base64'));
            return newEncrKey;
        });
        this.encrKeyCache[key] = encrKey;
        return { encrKey, newKeyCreated };
    }
    async deleteEncryptionKey(trc, key) {
        await secureStorageMutex.runInMutex(trc, 'ConduitSecureStorageDeleteEncrKey', async () => {
            await keytar_1.default.deletePassword(this.service, key);
        });
        delete this.encrKeyCache[key];
    }
    getFilePath(key) {
        // replace non alphanumeric characters.
        const sanitizedKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return path_1.default.join(this.secureStorageFolderPath, sanitizedKey);
    }
    async encrypt(trc, encrKey, text) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(this.encryptionAlgorithm, encrKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'binary');
        encrypted += cipher.final('binary');
        const data = { iv: iv.toString('base64'), encrypted };
        // use JSON stringify so we don't suppress any errors
        return JSON.stringify(data);
    }
    async decrypt(trc, encrKey, encrText) {
        const data = conduit_utils_1.safeParse(encrText);
        if (!isEncryptedFsData(data)) {
            conduit_utils_1.logger.warn(`Failed to decrypt. Bad format for text ${encrText}`);
            return null;
        }
        const decipher = crypto_1.default.createDecipheriv(this.encryptionAlgorithm, encrKey, Buffer.from(data.iv, 'base64'));
        let decrypted = decipher.update(data.encrypted, 'binary', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async replaceString(trc, key, value) {
        if (this.secureStorageCache[key] === value) {
            // early return if overwriting same value.
            return;
        }
        const filePath = this.getFilePath(key);
        if (value) {
            const { encrKey } = await this.getEncryptionKey(trc, key);
            const encrData = await this.encrypt(trc, encrKey, value);
            await fs_extra_1.default.ensureFile(filePath);
            await fs_extra_1.default.writeFile(filePath, encrData);
        }
        else {
            try {
                await fs_extra_1.default.unlink(filePath);
            }
            catch (err) {
                conduit_utils_1.logger.warn('Failed to unlink encrypted value on disk', { key, filePath, err });
            }
            await this.deleteEncryptionKey(trc, key);
        }
        this.secureStorageCache[key] = value;
    }
    async getString(trc, key) {
        if (this.secureStorageCache[key] !== undefined) {
            return this.secureStorageCache[key];
        }
        const filePath = await this.getFilePath(key);
        if (!fs_extra_1.default.existsSync(filePath)) {
            this.secureStorageCache[key] = null;
            return null;
        }
        const { encrKey, newKeyCreated } = await this.getEncryptionKey(trc, key);
        if (newKeyCreated) {
            // new key created now. No point in reading from disk.
            this.secureStorageCache[key] = null;
            return null;
        }
        const encrData = await fs_extra_1.default.readFile(filePath, { encoding: 'utf8' });
        const decrypted = await this.decrypt(trc, encrKey, encrData);
        this.secureStorageCache[key] = decrypted;
        return decrypted;
    }
    // only for tests
    clearSecureStorageCacheForTest() {
        this.secureStorageCache = {};
    }
    clearEncryptionCacheForTest() {
        this.encrKeyCache = {};
    }
}
exports.ElectronMainSecureStorage = ElectronMainSecureStorage;
exports.secureStorage = isMain ? new ElectronMainSecureStorage() : undefined;
function setupSecureStorageIPC() {
    if (!exports.secureStorage) {
        return;
    }
    electron_1.ipcMain.handle(en_conduit_electron_shared_1.ElectronSecureStorageChannel, async (event, message) => {
        switch (message.action) {
            case 'getString':
                return await exports.secureStorage.getString(bridgeTrc, message.key);
            case 'replaceString':
                return await exports.secureStorage.replaceString(bridgeTrc, message.key, message.value);
            default:
                const { action } = message;
                throw conduit_utils_1.absurd(action, `unexpected switch case in Electron Main IPC handler ${action}`);
        }
    });
}
exports.setupSecureStorageIPC = setupSecureStorageIPC;
//# sourceMappingURL=ElectronMainSecureStorage.js.map