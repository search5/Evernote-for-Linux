"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.before = void 0;
/**
 * Creates a function that invokes `func`, with the `this` binding and arguments
 * of the created function, while it's called less than `callLimit` times. Subsequent
 * calls to the created function return the result of the last `func` invocation.
 *
 * Ref: https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L10617
 */
// tslint:disable-next-line: ban-types
function before(callLimit, func) {
    let result;
    return (() => {
        if (func && --callLimit > 0) {
            result = func.apply(this, arguments);
        }
        if (callLimit <= 1) {
            func = undefined;
        }
        return result;
    });
}
exports.before = before;
// tslint:disable-next-line: ban-types
function once(func) {
    return before(2, func);
}
exports.once = once;
//# sourceMappingURL=Functions.js.map