"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidGenerator = void 0;
const conduit_utils_1 = require("conduit-utils");
const js_base64_1 = require("js-base64");
const sha_256_js_1 = __importDefault(require("sha-256-js"));
const uuidRegEx = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
function uuidToChars(tag, id) {
    const match = id.match(uuidRegEx);
    if (match) {
        return [tag, 16, ...parse(id)];
    }
    const ret = [18, id.length];
    for (let i = 0; i < id.length; ++i) {
        ret.push(id.charCodeAt(i));
    }
    return ret;
}
/* eslint-disable no-bitwise */
function parse(uuid) {
    let v;
    const arr = new Uint8Array(16);
    // Parse ########-....-....-....-............
    arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
    arr[1] = (v >>> 16) & 0xff;
    arr[2] = (v >>> 8) & 0xff;
    arr[3] = v & 0xff;
    // Parse ........-####-....-....-............
    arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 0xff;
    // Parse ........-....-####-....-............
    arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 0xff;
    // Parse ........-....-....-####-............
    arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 0xff;
    // Parse ........-....-....-....-############
    // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
    arr[10] = ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff;
    arr[11] = (v / 0x100000000) & 0xff;
    arr[12] = (v >>> 24) & 0xff;
    arr[13] = (v >>> 16) & 0xff;
    arr[14] = (v >>> 8) & 0xff;
    arr[15] = v & 0xff;
    return arr;
}
exports.GuidGenerator = {
    generateSeededID: (ownerID, entityType, seed) => {
        const hash = sha_256_js_1.default(ownerID + '-' + entityType + '-' + seed);
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; ++i) {
            bytes[i] = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
        }
        return conduit_utils_1.bytesToUuid(bytes);
    },
    generateID: (ownerID, entityType) => {
        // random seed for predictable guid assignment. should probably have at least 128 bits of entropy
        const seed = [...Array(3)].map(() => {
            return Math.random().toString(36).substring(2);
        }).join('');
        return [seed, exports.GuidGenerator.generateSeededID(ownerID, entityType, seed)];
    },
    IDToFileLocation: (entityID, seededID) => {
        const bytes = uuidToChars(10, entityID);
        bytes.push(...uuidToChars(26, seededID));
        return js_base64_1.Base64.fromUint8Array(new Uint8Array(bytes), true);
    },
};
//# sourceMappingURL=GuidGenerator.js.map