"use strict";
/*
* Copyright 2020 Evernote Corporation. All rights reserved.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecureStorageKey = exports.SecureStorageMem = void 0;
class SecureStorageMem {
    constructor() {
        this.data = {};
    }
    async replaceString(trc, key, value) {
        this.data[key] = value;
    }
    async getString(trc, key) {
        var _a;
        return (_a = this.data[key]) !== null && _a !== void 0 ? _a : null;
    }
}
exports.SecureStorageMem = SecureStorageMem;
function getSecureStorageKey(userIDString) {
    if (!userIDString.startsWith('User:')) {
        throw new Error(`Expected userID to be in the form 'User:123456' but got: ${userIDString}`);
    }
    return `AuthToken:${userIDString}`;
}
exports.getSecureStorageKey = getSecureStorageKey;
//# sourceMappingURL=SecureStorage.js.map