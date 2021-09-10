"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityTypeFromNsync = exports.EntityTypeToNsync = exports.EntityTypes = exports.NSyncEntityType = void 0;
// these must match the enum in sync.proto
var NSyncEntityType;
(function (NSyncEntityType) {
    NSyncEntityType[NSyncEntityType["NOTE"] = 0] = "NOTE";
    NSyncEntityType[NSyncEntityType["NOTEBOOK"] = 1] = "NOTEBOOK";
    NSyncEntityType[NSyncEntityType["WORKSPACE"] = 2] = "WORKSPACE";
    NSyncEntityType[NSyncEntityType["ATTACHMENT"] = 3] = "ATTACHMENT";
    NSyncEntityType[NSyncEntityType["TAG"] = 4] = "TAG";
    NSyncEntityType[NSyncEntityType["SAVED_SEARCH"] = 5] = "SAVED_SEARCH";
    NSyncEntityType[NSyncEntityType["SHORTCUT"] = 6] = "SHORTCUT";
    NSyncEntityType[NSyncEntityType["RECIPIENT_SETTINGS"] = 7] = "RECIPIENT_SETTINGS";
    NSyncEntityType[NSyncEntityType["NOTE_TAGS"] = 8] = "NOTE_TAGS";
    NSyncEntityType[NSyncEntityType["NOTE_ATTACHMENTS"] = 9] = "NOTE_ATTACHMENTS";
    NSyncEntityType[NSyncEntityType["ACCESS_INFO"] = 10] = "ACCESS_INFO";
    NSyncEntityType[NSyncEntityType["MUTATION_TRACKER"] = 11] = "MUTATION_TRACKER";
    NSyncEntityType[NSyncEntityType["BOARD"] = 12] = "BOARD";
    NSyncEntityType[NSyncEntityType["WIDGET"] = 13] = "WIDGET";
    NSyncEntityType[NSyncEntityType["NOTE_CONTENT_INFO"] = 14] = "NOTE_CONTENT_INFO";
    NSyncEntityType[NSyncEntityType["TASK"] = 15] = "TASK";
    NSyncEntityType[NSyncEntityType["REMINDER"] = 16] = "REMINDER";
    NSyncEntityType[NSyncEntityType["TASK_USER_SETTINGS"] = 17] = "TASK_USER_SETTINGS";
    NSyncEntityType[NSyncEntityType["WIDGET_CONTENT_CONFLICT"] = 18] = "WIDGET_CONTENT_CONFLICT";
    NSyncEntityType[NSyncEntityType["SCHEDULED_NOTIFICATION"] = 19] = "SCHEDULED_NOTIFICATION";
    NSyncEntityType[NSyncEntityType["GAMIFICATION_SUMMARY"] = 20] = "GAMIFICATION_SUMMARY";
    NSyncEntityType[NSyncEntityType["GAMIFICATION_MILESTONE"] = 21] = "GAMIFICATION_MILESTONE";
    NSyncEntityType[NSyncEntityType["GAMIFICATION_GOAL"] = 22] = "GAMIFICATION_GOAL";
    NSyncEntityType[NSyncEntityType["CALENDAR_SETTINGS"] = 23] = "CALENDAR_SETTINGS";
    NSyncEntityType[NSyncEntityType["CALENDAR_ACCOUNT"] = 24] = "CALENDAR_ACCOUNT";
    NSyncEntityType[NSyncEntityType["USER_CALENDAR_SETTINGS"] = 25] = "USER_CALENDAR_SETTINGS";
    NSyncEntityType[NSyncEntityType["CALENDAR_EVENT"] = 26] = "CALENDAR_EVENT";
    NSyncEntityType[NSyncEntityType["EXAMPLE_PARENT"] = 998] = "EXAMPLE_PARENT";
    NSyncEntityType[NSyncEntityType["EXAMPLE"] = 999] = "EXAMPLE";
})(NSyncEntityType = exports.NSyncEntityType || (exports.NSyncEntityType = {}));
exports.EntityTypes = {
    // Core entities
    Note: 'Note',
    Notebook: 'Notebook',
    Workspace: 'Workspace',
    Attachment: 'Attachment',
    Tag: 'Tag',
    SavedSearch: 'SavedSearch',
    Shortcut: 'Shortcut',
    // Home
    Board: 'Board',
    Widget: 'Widget',
    WidgetContentConflict: 'WidgetContentConflict',
    // Notifications
    ScheduledNotification: 'ScheduledNotification',
    // Tasks
    NoteContentInfo: 'NoteContentInfo',
    Reminder: 'Reminder',
    Task: 'Task',
    TaskUserSettings: 'TaskUserSettings',
    // Gamification
    GamificationSummary: 'GamificationSummary',
    GamificationMilestone: 'GamificationMilestone',
    GamificationGoal: 'GamificationGoal',
    // Calendar 
    CalendarSettings: 'CalendarSettings',
    CalendarAccount: 'CalendarAccount',
    UserCalendarSettings: 'UserCalendarSettings',
    CalendarEvent: 'CalendarEvent',
    // Sample
    ExampleParent: 'ExampleParent',
    Example: 'Example',
};
exports.EntityTypeToNsync = new Map([
    // Core entities
    [exports.EntityTypes.Note, NSyncEntityType.NOTE],
    [exports.EntityTypes.Notebook, NSyncEntityType.NOTEBOOK],
    [exports.EntityTypes.Workspace, NSyncEntityType.WORKSPACE],
    [exports.EntityTypes.Attachment, NSyncEntityType.ATTACHMENT],
    [exports.EntityTypes.Tag, NSyncEntityType.TAG],
    [exports.EntityTypes.SavedSearch, NSyncEntityType.SAVED_SEARCH],
    [exports.EntityTypes.Shortcut, NSyncEntityType.SHORTCUT],
    // Home
    [exports.EntityTypes.Board, NSyncEntityType.BOARD],
    [exports.EntityTypes.Widget, NSyncEntityType.WIDGET],
    [exports.EntityTypes.WidgetContentConflict, NSyncEntityType.WIDGET_CONTENT_CONFLICT],
    // Notifications
    [exports.EntityTypes.ScheduledNotification, NSyncEntityType.SCHEDULED_NOTIFICATION],
    // Tasks
    [exports.EntityTypes.NoteContentInfo, NSyncEntityType.NOTE_CONTENT_INFO],
    [exports.EntityTypes.Reminder, NSyncEntityType.REMINDER],
    [exports.EntityTypes.Task, NSyncEntityType.TASK],
    [exports.EntityTypes.TaskUserSettings, NSyncEntityType.TASK_USER_SETTINGS],
    // Gamification
    [exports.EntityTypes.GamificationSummary, NSyncEntityType.GAMIFICATION_SUMMARY],
    [exports.EntityTypes.GamificationMilestone, NSyncEntityType.GAMIFICATION_MILESTONE],
    [exports.EntityTypes.GamificationGoal, NSyncEntityType.GAMIFICATION_GOAL],
    // Calendar
    [exports.EntityTypes.CalendarSettings, NSyncEntityType.CALENDAR_SETTINGS],
    [exports.EntityTypes.CalendarAccount, NSyncEntityType.CALENDAR_ACCOUNT],
    [exports.EntityTypes.UserCalendarSettings, NSyncEntityType.USER_CALENDAR_SETTINGS],
    [exports.EntityTypes.CalendarEvent, NSyncEntityType.CALENDAR_EVENT],
    // Sample
    [exports.EntityTypes.ExampleParent, NSyncEntityType.EXAMPLE_PARENT],
    [exports.EntityTypes.Example, NSyncEntityType.EXAMPLE],
]);
exports.EntityTypeFromNsync = new Map(Array.from(exports.EntityTypeToNsync, entry => [entry[1], entry[0]]));
//# sourceMappingURL=EntityTypes.js.map