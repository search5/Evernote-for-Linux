"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitNapCryptoUtils = void 0;
const en_node_appauth_js_1 = require("en-node-appauth-js");
class ConduitNapCryptoUtils extends en_node_appauth_js_1.DefaultCrypto {
    async generateRandomPromisified(size) {
        return this.generateRandom(size);
    }
}
exports.ConduitNapCryptoUtils = ConduitNapCryptoUtils;
//# sourceMappingURL=ConduitNapCryptoUtils.js.map