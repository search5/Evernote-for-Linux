"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerSecureStorage = void 0;
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
class ElectronWorkerSecureStorage {
    async replaceString(trc, key, value) {
        await this.sendMessage({ action: 'replaceString', key, value });
    }
    async getString(trc, key) {
        return await this.sendMessage({ action: 'getString', key });
    }
    async sendMessage(message) {
        const resp = await electron_1.ipcRenderer.invoke(en_conduit_electron_shared_1.ElectronSecureStorageChannel, message);
        conduit_utils_1.logger.trace('Secure storage response ', message.action);
        return resp;
    }
}
exports.workerSecureStorage = new ElectronWorkerSecureStorage();
//# sourceMappingURL=ElectronWorkerSecureStorage.js.map