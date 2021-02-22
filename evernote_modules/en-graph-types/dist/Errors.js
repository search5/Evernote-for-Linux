"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitError = exports.GraphError = exports.PermissionError = exports.NotFoundError = void 0;
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
//# sourceMappingURL=Errors.js.map