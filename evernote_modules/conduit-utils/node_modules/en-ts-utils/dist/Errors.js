"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MalformedDataError = exports.InvalidParameterError = exports.OutOfRangeError = exports.UnloggableError = exports.RetryError = void 0;
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
    constructor(message) {
        super(message);
        this.name = 'UnloggableError';
    }
}
exports.UnloggableError = UnloggableError;
class OutOfRangeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OutOfRangeError';
    }
}
exports.OutOfRangeError = OutOfRangeError;
class InvalidParameterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidParameterError';
    }
}
exports.InvalidParameterError = InvalidParameterError;
class MalformedDataError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MalformedDataError';
    }
}
exports.MalformedDataError = MalformedDataError;
//# sourceMappingURL=Errors.js.map