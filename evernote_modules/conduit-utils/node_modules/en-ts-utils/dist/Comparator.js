"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparatorFactory = exports.LocaleCompareCollator = exports.asciiCompare = void 0;
const index_1 = require("./index");
function asciiCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
exports.asciiCompare = asciiCompare;
// Collator class used when the system doesn't provide its own Collator implementation (Android, for instance)
class LocaleCompareCollator {
    constructor(locale, options) {
        this.locale = locale;
        this.options = options;
    }
    compare(a, b) {
        return a.localeCompare(b, this.locale, this.options);
    }
}
exports.LocaleCompareCollator = LocaleCompareCollator;
const gIntlCollatorCache = {};
function getCollator(locale, options = { numeric: true, sensitivity: 'variant' }) {
    const key = locale + index_1.safeStringify(options);
    const collator = gIntlCollatorCache[key];
    if (!collator) {
        // If the locale's argument is not provided or is undefined, the runtime's default locale is used.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
        gIntlCollatorCache[key] = global.Intl === undefined ? new LocaleCompareCollator(locale, options) : new Intl.Collator(locale, options);
    }
    return collator || gIntlCollatorCache[key];
}
function comparatorFactory(config, locale) {
    return (a, b) => {
        if (a === b) {
            return 0;
        }
        const aType = typeof a;
        const bType = typeof b;
        if (aType === 'number' && bType === 'number') {
            return a - b;
        }
        if (aType === 'boolean' && bType === 'boolean') {
            return a ? 1 : -1;
        }
        if (a === null && b !== null) {
            return -1;
        }
        if (a !== null && b === null) {
            return 1;
        }
        const stringA = String(a);
        const stringB = String(b);
        return config && config.useLocaleCompare ? getCollator(locale, config.overrideLocaleCompareOptions).compare(stringA, stringB) : asciiCompare(stringA, stringB);
    };
}
exports.comparatorFactory = comparatorFactory;
//# sourceMappingURL=Comparator.js.map