"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toQueryString = exports.strictEncodeURI = void 0;
const index_1 = require("./index");
/**
 * Encode URI in compliance with RFC 3986.
 *
 * Documentation and original implementation.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 *
 */
function strictEncodeURI(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);
}
exports.strictEncodeURI = strictEncodeURI;
function stringifyKeyValue(key, value, arrayOk = true) {
    const type = index_1.getTypeOf(value);
    switch (type) {
        case 'undefined':
            return null;
        case 'null':
            return strictEncodeURI(key);
        case 'array':
            if (!arrayOk) {
                throw new Error('Multi-dimentional arrays are not supported');
            }
            const xs = [];
            for (const v of value) {
                const vv = stringifyKeyValue(key, v, false);
                if (vv) {
                    xs.push(vv);
                }
            }
            return xs.join('&');
        case 'number':
        case 'bigint':
        case 'string':
        case 'boolean':
            return `${strictEncodeURI(key)}=${strictEncodeURI(value)}`;
        case 'symbol':
            throw new Error('Unable to stringify symbol');
        case 'function':
            throw new Error('Unable to stringify function');
        case 'object':
            throw new Error('Unable to stringify object');
        default:
            throw index_1.absurd(type, 'Unknown type');
    }
}
function toQueryString(o) {
    const keys = Object.keys(o);
    keys.sort();
    const xs = [];
    for (const key of keys) {
        const value = o[key];
        const x = stringifyKeyValue(key, value);
        if (x && x.length > 0) {
            xs.push(x);
        }
    }
    return xs.join('&');
}
exports.toQueryString = toQueryString;
//# sourceMappingURL=uri.js.map