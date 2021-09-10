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
exports.ElectronRendererHttpClient = exports.ConduitRendererIPC = exports.ConduitElectronIPC = exports.getId = exports.ElectronRendererLogger = void 0;
__exportStar(require("./MessageTypes"), exports);
var ElectronRendererLogger_1 = require("./ElectronRendererLogger");
Object.defineProperty(exports, "ElectronRendererLogger", { enumerable: true, get: function () { return ElectronRendererLogger_1.ElectronRendererLogger; } });
var ConduitElectronIPC_1 = require("./ConduitElectronIPC");
Object.defineProperty(exports, "getId", { enumerable: true, get: function () { return ConduitElectronIPC_1.getId; } });
Object.defineProperty(exports, "ConduitElectronIPC", { enumerable: true, get: function () { return ConduitElectronIPC_1.ConduitElectronIPC; } });
Object.defineProperty(exports, "ConduitRendererIPC", { enumerable: true, get: function () { return ConduitElectronIPC_1.ConduitRendererIPC; } });
var ElectronRendererHttpClient_1 = require("./http-client/ElectronRendererHttpClient");
Object.defineProperty(exports, "ElectronRendererHttpClient", { enumerable: true, get: function () { return ElectronRendererHttpClient_1.ElectronRendererHttpClient; } });
//# sourceMappingURL=index.js.map