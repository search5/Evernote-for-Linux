"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.NodeBasedHandler = void 0;
__exportStar(require("./ElectronNAPCryptoUtils"), exports);
var node_support_1 = require("en-node-appauth-js/built/node_support");
Object.defineProperty(exports, "NodeBasedHandler", { enumerable: true, get: function () { return node_support_1.NodeBasedHandler; } });
//# sourceMappingURL=index.js.map