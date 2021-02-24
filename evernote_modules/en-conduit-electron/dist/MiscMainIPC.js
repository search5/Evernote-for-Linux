"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLocaleFetchingIPC = void 0;
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
function setupLocaleFetchingIPC() {
    electron_1.ipcMain.handle(en_conduit_electron_shared_1.ElectronLocaleFetchChannel, _ => {
        return electron_1.app.getLocale();
    });
}
exports.setupLocaleFetchingIPC = setupLocaleFetchingIPC;
//# sourceMappingURL=MiscMainIPC.js.map