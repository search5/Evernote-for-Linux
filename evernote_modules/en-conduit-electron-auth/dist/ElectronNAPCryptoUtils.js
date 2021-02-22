"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronNAPCryptoUtils = void 0;
const node_support_1 = require("en-node-appauth-js/built/node_support");
class ElectronNAPCryptoUtils extends node_support_1.NodeCrypto {
    async generateRandomPromisified(size) {
        return this.generateRandom(size);
    }
}
exports.ElectronNAPCryptoUtils = ElectronNAPCryptoUtils;
//# sourceMappingURL=ElectronNAPCryptoUtils.js.map