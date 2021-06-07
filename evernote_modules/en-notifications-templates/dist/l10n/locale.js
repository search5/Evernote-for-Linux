"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalizedYearMonthHour = exports.getLocalizedYearMonth = exports.getLocalizedMonth = exports.getLocalizedHour = void 0;
const const_1 = require("./const");
// TODO: make locale an enum
/**
 * @returns Localized hour/minute i.e. 8:57 AM
 */
function getLocalizedHour(timestamp, locale = const_1.DEFAULT_LOCALE) {
    return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric',
    }).format(timestamp);
}
exports.getLocalizedHour = getLocalizedHour;
/**
 * @returns Localized Month/day i.e. 4/12
 */
function getLocalizedMonth(timestamp, locale = const_1.DEFAULT_LOCALE) {
    return new Intl.DateTimeFormat(locale, {
        month: 'numeric',
        day: 'numeric',
    }).format(timestamp);
}
exports.getLocalizedMonth = getLocalizedMonth;
/**
 * @returns Localized Year/Month i.e. April 12, 2021
 */
function getLocalizedYearMonth(timestamp, locale = const_1.DEFAULT_LOCALE) {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(timestamp);
}
exports.getLocalizedYearMonth = getLocalizedYearMonth;
/**
 * @returns Localized Year/Month/Day i.e. April 12, 2021, 8:57 AM
 */
function getLocalizedYearMonthHour(timestamp, locale = const_1.DEFAULT_LOCALE) {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(timestamp);
}
exports.getLocalizedYearMonthHour = getLocalizedYearMonthHour;
//# sourceMappingURL=locale.js.map