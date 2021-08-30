"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.L10N = exports.getLocalizedStringsMap = void 0;
const plurr_1 = __importDefault(require("plurr"));
const locale_1 = require("./locale");
const const_1 = require("./const");
function getLocalizedStringsMap(locale, logger) {
    switch (locale) {
        case 'ar':
            return require('./data/strings_ar.json');
        case 'cs':
            return require('./data/strings_cs.json');
        case 'da':
            return require('./data/strings_da.json');
        case 'de':
            return require('./data/strings_de.json');
        case 'es':
            return require('./data/strings_es.json');
        case 'fi':
            return require('./data/strings_fi.json');
        case 'fr':
            return require('./data/strings_fr.json');
        case 'id':
            return require('./data/strings_id.json');
        case 'it':
            return require('./data/strings_it.json');
        case 'ja':
            return require('./data/strings_ja.json');
        case 'ko':
            return require('./data/strings_ko.json');
        case 'ms':
            return require('./data/strings_ms.json');
        case 'nl':
            return require('./data/strings_nl.json');
        case 'no':
            return require('./data/strings_no.json');
        case 'pl':
            return require('./data/strings_pl.json');
        case 'pt_br':
            return require('./data/strings_pt_BR.json');
        case 'pt':
            return require('./data/strings_pt.json');
        case 'ru':
            return require('./data/strings_ru.json');
        case 'sv':
            return require('./data/strings_sv.json');
        case 'th':
            return require('./data/strings_th.json');
        case 'tr':
            return require('./data/strings_tr.json');
        case 'vi':
            return require('./data/strings_vi.json');
        case 'zh_cn':
            return require('./data/strings_zh_CN.json');
        case 'zh_tw':
            return require('./data/strings_zh_TW.json');
        case 'en':
            return require('./data/strings.json');
        default:
            logger === null || logger === void 0 ? void 0 : logger.warn(`No localized strings file found for locale: ${locale}.  Defaulting to en`);
            return require('./data/strings.json');
    }
}
exports.getLocalizedStringsMap = getLocalizedStringsMap;
class L10N {
    /**
     * Don't call this directly except for inside tests.  Otherwise, please use L10N::getInstance.
     * @param proposedLocale
     * @param logger
     */
    constructor(proposedLocale, logger) {
        var _a;
        this.logger = logger;
        this.locale = L10N.toSupportedLocale(proposedLocale, logger);
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(`Initializing en-notifications-templates localized strings map with locale: ${this.locale}`);
        this.localizedStringsMap = getLocalizedStringsMap(this.locale, logger);
        this.plurr = new plurr_1.default({ locale: this.locale });
    }
    /**
     * Getter for instances of L10N. Lazy loads & caches instances of l10n per language as they become necessary.
     * @param proposedLocale
     * @param logger
     * @returns an instance of L10N for the proposed locale, defaulting to english if it is not valid.
     */
    static getInstance(proposedLocale, logger) {
        const locale = this.toSupportedLocale(proposedLocale, logger);
        if (this.lazyLoadedInstances[locale]) {
            return this.lazyLoadedInstances[locale];
        }
        const l10n = new L10N(locale, logger);
        this.lazyLoadedInstances[locale] = l10n;
        return l10n;
    }
    static toSupportedLocale(proposedLocale, logger) {
        if (const_1.supportedLocales.includes(proposedLocale)) {
            return proposedLocale;
        }
        logger === null || logger === void 0 ? void 0 : logger.warn(`Locale ${proposedLocale} is not supported.  Defaulting to english`);
        return 'en';
    }
    /**
     * Short for 'localize'.  This function should be called to handle any localized content
     * for notifications.
     *
     * @param key identifier to map to translation
     * @param params Map<string, string> of interpolated parameters for translation string
     * @returns a fully localized & translated string for the given key, if it exists. Defaults
     *   to english for strings that have been added but not yet translated.
     * @throws an error if the key does not exist
     */
    l(key, params = {}) {
        var _a;
        const translatedTemplateString = this.localizedStringsMap[key];
        if (!translatedTemplateString) {
            if (this.locale !== 'en') {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`key not found in translations: ${key} for locale: ${this.locale}.  Defaulting to en`);
                return L10N.getInstance('en', this.logger).l(key, params);
            }
            else {
                throw new Error(`Missing translation key ${key} (must be set in english l10n/data/strings.json file)`);
            }
        }
        return this.plurr.format(translatedTemplateString, params);
    }
    /**
     * Returns the localized time for a given case.
     * ex. en, hour => 8:57 AM
     * ex. en, month => 4/12
     * @param time Unix time (ms)
     * @param type hour or month
     * @returns
     */
    t(time, type) {
        switch (type) {
            case 'HourMinute':
                return locale_1.getLocalizedHour(time, this.locale);
            case 'MonthDay':
                return locale_1.getLocalizedMonth(time, this.locale);
            case 'YearMonthDay':
                return locale_1.getLocalizedYearMonth(time, this.locale);
            case 'Full':
                return locale_1.getLocalizedYearMonthHour(time, this.locale);
        }
    }
}
exports.L10N = L10N;
L10N.lazyLoadedInstances = {};
//# sourceMappingURL=l10n.js.map