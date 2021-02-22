"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetRegistrations = exports.getFixUpFunction = exports.getAllMigrations = exports.registerMigrationFunctionByName = exports.SchemaMigrationError = void 0;
const conduit_utils_1 = require("conduit-utils");
const gFixupFunctions = {};
class SchemaMigrationError extends Error {
    constructor(message = 'migration schema failure') {
        super(message);
    }
}
exports.SchemaMigrationError = SchemaMigrationError;
function registerMigrationFunctionByName(migrationName, fixupFunction) {
    if (gFixupFunctions[migrationName]) {
        conduit_utils_1.logger.warn('Fix up function with name already being register: ' + migrationName);
    }
    gFixupFunctions[migrationName] = fixupFunction;
}
exports.registerMigrationFunctionByName = registerMigrationFunctionByName;
function getAllMigrations() {
    return Object.keys(gFixupFunctions);
}
exports.getAllMigrations = getAllMigrations;
function getFixUpFunction(name) {
    return gFixupFunctions[name];
}
exports.getFixUpFunction = getFixUpFunction;
// for tests
function resetRegistrations() {
    Object.keys(gFixupFunctions).forEach(key => {
        delete gFixupFunctions[key];
    });
}
exports.resetRegistrations = resetRegistrations;
//# sourceMappingURL=Migrations.js.map