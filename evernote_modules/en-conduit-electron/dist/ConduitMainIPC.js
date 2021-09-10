"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitMainIPC = void 0;
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
class ConduitMainIPC extends en_conduit_electron_shared_1.ConduitElectronIPC {
    constructor(workerWin) {
        super(workerWin.webContents, electron_1.ipcMain, true, electron_1.webContents);
    }
    // FIXME should a paused ipc buffer up messages when waitng to be resumed with a new worker?
    pause() {
        this.sender = null;
    }
    resume(workerWin) {
        this.sender = workerWin.webContents;
    }
}
exports.ConduitMainIPC = ConduitMainIPC;
//# sourceMappingURL=ConduitMainIPC.js.map