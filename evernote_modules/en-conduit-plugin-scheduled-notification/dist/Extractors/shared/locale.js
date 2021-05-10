"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalizedYearMonthHour = exports.getLocalizedYearMonth = exports.getLocalizedMonth = exports.getLocalizedHour = exports.getUserLocale = void 0;
const const_1 = require("./const");
function getUserLocale(user) {
    if (!user || !user.NodeFields || !user.NodeFields.Attributes || !user.NodeFields.Attributes.preferredLanguage) {
        return const_1.DEFAULT_LOCALE;
    }
    else {
        return user.NodeFields.Attributes.preferredLanguage;
    }
}
exports.getUserLocale = getUserLocale;
/**
 * @returns Localized hour/minute i.e. 8:57 AM
 */
function getLocalizedHour(timestamp, locale = const_1.DEFAULT_LOCALE) {
    return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric',
    })
        .format(timestamp);
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