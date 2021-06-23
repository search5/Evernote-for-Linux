"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMigrationError = exports.CancelActivityError = void 0;
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
//# sourceMappingURL=Errors.js.map