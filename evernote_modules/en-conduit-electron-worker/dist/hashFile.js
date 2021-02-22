"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashFile = void 0;
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
async function hashFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto_1.default.createHash('md5');
        const stream = fs_1.default.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
        stream.on('error', reject);
    });
}
exports.hashFile = hashFile;
//# sourceMappingURL=hashFile.js.map