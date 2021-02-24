"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
__decorate([
    conduit_utils_1.traceAsync('ElectronWorkerSecureStorage', 'key')
], ElectronWorkerSecureStorage.prototype, "replaceString", null);
__decorate([
    conduit_utils_1.traceAsync('ElectronWorkerSecureStorage', 'key')
], ElectronWorkerSecureStorage.prototype, "getString", null);
exports.workerSecureStorage = new ElectronWorkerSecureStorage();
//# sourceMappingURL=ElectronWorkerSecureStorage.js.map