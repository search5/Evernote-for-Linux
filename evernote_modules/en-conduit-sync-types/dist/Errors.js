"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSyncConnectionError = exports.SchemaMigrationError = exports.CancelActivityError = void 0;
class CancelActivityError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.CancelActivityError = CancelActivityError;
class SchemaMigrationError extends Error {
    constructor(message = 'migration schema failure') {
        super(message);
    }
}
exports.SchemaMigrationError = SchemaMigrationError;
class NSyncConnectionError extends Error {
    constructor(message = 'NSync Connection error') {
        super(message);
    }
}
exports.NSyncConnectionError = NSyncConnectionError;
//# sourceMappingURL=Errors.js.map