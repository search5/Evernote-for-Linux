"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserID = exports.userIDForKeyString = exports.keyStringForUserID = exports.NullUserID = void 0;
const en_data_model_1 = require("en-data-model");
var en_data_model_2 = require("en-data-model");
Object.defineProperty(exports, "NullUserID", { enumerable: true, get: function () { return en_data_model_2.NullUserID; } });
function keyStringForUserID(userID) {
    return 'User:' + userID;
}
exports.keyStringForUserID = keyStringForUserID;
function userIDForKeyString(keyUserID) {
    if (keyUserID.length < 6 || keyUserID.slice(0, 5) !== 'User:') {
        throw new Error('Invalid userID key');
    }
    const num = parseInt(keyUserID.slice(5), 10);
    if (isNaN(num)) {
        throw new Error('UserID string not a number');
    }
    if (num === en_data_model_1.NullUserID) {
        throw new Error('Got a NullUserID');
    }
    return num;
}
exports.userIDForKeyString = userIDForKeyString;
function isUserID(val) {
    return typeof val === 'number';
}
exports.isUserID = isUserID;
//# sourceMappingURL=UserID.js.map