"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidParameterError = exports.OutOfRangeError = exports.UnloggableError = exports.RetryError = void 0;
class RetryError extends Error {
    constructor(message, timeout, reason) {
        super(message);
        this.name = 'RetryError';
        this.timeout = 0;
        this.timeout = timeout;
        this.reason = reason;
    }
}
exports.RetryError = RetryError;
class UnloggableError extends Error {
    constructor(message, err) {
        super(message);
        this.name = 'UnloggableError';
    }
}
exports.UnloggableError = UnloggableError;
class OutOfRangeError extends Error {
    constructor(message, err) {
        super(message);
        this.name = 'OutOfRangeError';
    }
}
exports.OutOfRangeError = OutOfRangeError;
class InvalidParameterError extends Error {
    constructor(message, err) {
        super(message);
        this.name = 'InvalidParameterError';
    }
}
exports.InvalidParameterError = InvalidParameterError;
//# sourceMappingURL=Errors.js.map