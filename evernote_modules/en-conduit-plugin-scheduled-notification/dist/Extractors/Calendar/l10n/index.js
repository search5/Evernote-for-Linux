"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeRange = exports.getEndedAt = exports.getStartsAt = exports.createNoteTitle = exports.openNoteTitle = void 0;
/**
 * This is a temporary, stop gap solution to support Beta of Calendar Integration
 * longer term solution to follow shortly after.
 * See: https://evernote.jira.com/browse/GRIN-981
 */
const const_1 = require("../const");
const data_1 = require("./data");
function getLocalizedHour(timestamp, locale = const_1.DEFAULT_LOCALE) {
    return new Intl
        .DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric',
    })
        .format(timestamp);
}
function openNoteTitle(eventTitle, locale = 'en') {
    return data_1.getTranslator(data_1.Translated.OPEN_NOTE_TITLE, locale)(eventTitle);
}
exports.openNoteTitle = openNoteTitle;
function createNoteTitle(eventTitle, locale = 'en') {
    return data_1.getTranslator(data_1.Translated.CREATE_NOTE_TITLE, locale)(eventTitle);
}
exports.createNoteTitle = createNoteTitle;
function getStartsAt(startTime, locale) {
    const hour = getLocalizedHour(startTime, locale);
    return data_1.getTranslator(data_1.Translated.STARTS_AT, locale)(hour);
}
exports.getStartsAt = getStartsAt;
function getEndedAt(endTime, locale) {
    const hour = getLocalizedHour(endTime, locale);
    return data_1.getTranslator(data_1.Translated.ENDED_AT, locale)(hour);
}
exports.getEndedAt = getEndedAt;
function getTimeRange(startTime, endTime, locale) {
    const startHour = getLocalizedHour(startTime, locale);
    const endHour = getLocalizedHour(endTime, locale);
    return data_1.getTranslator(data_1.Translated.TIME_RANGE, locale)(startHour, endHour);
}
exports.getTimeRange = getTimeRange;
//# sourceMappingURL=index.js.map