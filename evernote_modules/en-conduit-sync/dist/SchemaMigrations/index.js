"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchemaMigrations = void 0;
const BoardWidgetMigrations_1 = require("./BoardWidgetMigrations");
const MembershipMigrations_1 = require("./MembershipMigrations");
const NoteContentInfoRenameTaskGroups_1 = require("./NoteContentInfoRenameTaskGroups");
const ProfileMigrations_1 = require("./ProfileMigrations");
const ScheduledNotificationCachedFields_1 = require("./ScheduledNotificationCachedFields");
const UserMigrations_1 = require("./UserMigrations");
// import { registerTagMigrations } from './TagMigrations';
let isMigrationRegistered = false;
function registerSchemaMigrations() {
    if (!isMigrationRegistered) {
        MembershipMigrations_1.registerMembershipMigrations();
        ProfileMigrations_1.registerProfileMigrations();
        NoteContentInfoRenameTaskGroups_1.registerRenameNoteContentInfoTaskGroups();
        ScheduledNotificationCachedFields_1.registerScheduledNotificationCachedFields();
        // registerTagMigrations();
        UserMigrations_1.registerUserMigrations();
        BoardWidgetMigrations_1.registerBoardWidgetUntitledMigration();
        isMigrationRegistered = true;
    }
}
exports.registerSchemaMigrations = registerSchemaMigrations;
//# sourceMappingURL=index.js.map