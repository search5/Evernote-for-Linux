"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLong = exports.isLong = void 0;
const long_1 = __importDefault(require("long"));
const index_1 = require("./index");
function isLong(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const lobj = obj;
    if (!index_1.isNullish(lobj.high) && !index_1.isNullish(lobj.low)) {
        return true;
    }
    return false;
}
exports.isLong = isLong;
function convertLong(longNum) {
    return isLong(longNum) ? long_1.default.fromValue(longNum).toNumber() : (typeof longNum === 'string' ? Number(longNum) : longNum);
}
exports.convertLong = convertLong;
//# sourceMappingURL=LongUtils.js.map