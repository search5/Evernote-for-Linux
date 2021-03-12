"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryGRPCError = exports.TransportError = exports.LimitError = exports.GraphError = exports.PermissionError = exports.NotFoundError = void 0;
const en_ts_utils_1 = require("en-ts-utils");
class NotFoundError extends Error {
    constructor(id, message = 'not found') {
        super(message);
        this.name = 'NotFoundError';
        this.id = id;
    }
}
exports.NotFoundError = NotFoundError;
class PermissionError extends Error {
    constructor(message = 'Permission Denied') {
        super(message);
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
class GraphError extends Error {
    constructor(id, type, message = 'graph error') {
        super(message);
        this.name = 'GraphError';
        this.ref = { id, type };
    }
}
exports.GraphError = GraphError;
class LimitError extends Error {
    constructor(type, limit, message = 'Limit reached') {
        super(message);
        this.name = 'LimitError';
        this.type = type;
        this.limit = limit;
    }
}
exports.LimitError = LimitError;
// For more granular control over retry attempts.
class TransportError extends Error {
    constructor(message, code, reason) {
        super(message);
        this.code = code;
        this.reason = reason;
    }
}
exports.TransportError = TransportError;
class RetryGRPCError extends en_ts_utils_1.RetryError {
    constructor(message, timeout, reason, code) {
        super(message, timeout, reason);
        this.code = code;
    }
}
exports.RetryGRPCError = RetryGRPCError;
//# sourceMappingURL=Errors.js.map