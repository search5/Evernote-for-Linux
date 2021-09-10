"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocale = void 0;
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
async function getLocale() {
    return electron_1.ipcRenderer.invoke(en_conduit_electron_shared_1.ElectronLocaleFetchChannel);
}
exports.getLocale = getLocale;
//# sourceMappingURL=MiscWorkerIPC.js.map