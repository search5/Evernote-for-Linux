"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocale = void 0;
const electron_1 = require("electron");
const MessageTypes_1 = require("./MessageTypes");
async function getLocale() {
    return electron_1.ipcRenderer.invoke(MessageTypes_1.ElectronLocaleFetchChannel);
}
exports.getLocale = getLocale;
//# sourceMappingURL=MiscRendererIPC.js.map