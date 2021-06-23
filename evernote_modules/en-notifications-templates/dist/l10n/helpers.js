"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClose = exports.getMultiDay = exports.getTimeRange = exports.getEndedAt = exports.getAllDay = exports.getStartsAt = exports.createNoteUntitled = exports.openNoteUntitled = exports.createNoteTitle = exports.createNote = exports.openNoteTitle = exports.openNote = void 0;
const locale_1 = require("./locale");
const data_1 = require("./data");
function openNote(locale = 'en') {
    return data_1.getTranslator(data_1.Translated.OPEN_NOTE, locale)();
}
exports.openNote = openNote;
function openNoteTitle(eventTitle, locale = 'en') {
    return data_1.getTranslator(data_1.Translated.OPEN_NOTE_TITLE, locale)(eventTitle);
}
exports.openNoteTitle = openNoteTitle;
function createNote(locale = 'en') {
    return data_1.getTranslator(data_1.Translated.CREATE_NOTE, locale)();
}
exports.createNote = createNote;
function createNoteTitle(eventTitle, locale = 'en') {
    return data_1.getTranslator(data_1.Translated.CREATE_NOTE_TITLE, locale)(eventTitle);
}
exports.createNoteTitle = createNoteTitle;
function openNoteUntitled(locale = 'en') {
    return data_1.getTranslator(data_1.Translated.OPEN_NOTE_UNTITLED, locale)();
}
exports.openNoteUntitled = openNoteUntitled;
function createNoteUntitled(locale = 'en') {
    return data_1.getTranslator(data_1.Translated.CREATE_NOTE_UNTITLED, locale)();
}
exports.createNoteUntitled = createNoteUntitled;
function getStartsAt(startTime, locale) {
    const hour = locale_1.getLocalizedHour(startTime, locale);
    return data_1.getTranslator(data_1.Translated.STARTS_AT, locale)(hour);
}
exports.getStartsAt = getStartsAt;
function getAllDay(locale) {
    return data_1.getTranslator(data_1.Translated.ALL_DAY, locale)();
}
exports.getAllDay = getAllDay;
function getEndedAt(endTime, locale) {
    const hour = locale_1.getLocalizedHour(endTime, locale);
    return data_1.getTranslator(data_1.Translated.ENDED_AT, locale)(hour);
}
exports.getEndedAt = getEndedAt;
function getTimeRange(startTime, endTime, locale) {
    const startHour = locale_1.getLocalizedHour(startTime, locale);
    const endHour = locale_1.getLocalizedHour(endTime, locale);
    return data_1.getTranslator(data_1.Translated.TIME_RANGE, locale)(startHour, endHour);
}
exports.getTimeRange = getTimeRange;
function getMultiDay(startTime, endTime, locale) {
    const startDay = locale_1.getLocalizedMonth(startTime, locale);
    const endDay = locale_1.getLocalizedMonth(endTime, locale);
    return data_1.getTranslator(data_1.Translated.TIME_RANGE, locale)(startDay, endDay);
}
exports.getMultiDay = getMultiDay;
function getClose(locale) {
    return data_1.getTranslator(data_1.Translated.CLOSE, locale)();
}
exports.getClose = getClose;
//# sourceMappingURL=helpers.js.map