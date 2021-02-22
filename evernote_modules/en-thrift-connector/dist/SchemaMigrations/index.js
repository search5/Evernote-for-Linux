"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchemaMigrations = void 0;
const ProfileMigrations_1 = require("./ProfileMigrations");
let isMigrationRegistered = false;
function registerSchemaMigrations() {
    if (!isMigrationRegistered) {
        ProfileMigrations_1.registerProfileMigrations();
        isMigrationRegistered = true;
    }
}
exports.registerSchemaMigrations = registerSchemaMigrations;
//# sourceMappingURL=index.js.map