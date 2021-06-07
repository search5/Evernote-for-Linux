"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserClientInfo = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
var ConvertedBool;
(function (ConvertedBool) {
    ConvertedBool["FALSE"] = "FALSE";
    ConvertedBool["TRUE"] = "TRUE";
})(ConvertedBool || (ConvertedBool = {}));
// Supported languages for experimental eligibility filtering
const CODE_TO_LANGUAGE = {
    en: 'ENGLISH',
    fr: 'FRENCH',
    de: 'GERMAN',
    it: 'ITALIAN',
    ja: 'JAPANESE',
    ko: 'KOREAN',
};
const CLIENT_VALUE_TO_REQUESTING_PAGE = new Map([
    [6, 'IonHome'],
]);
function isAccountLessThan(created, timespan) {
    return Date.now() - created <= timespan;
}
function isAccountCreatedBefore(created, comparisonDateAsString) {
    return created < Date.parse(comparisonDateAsString);
}
function convertIfBoolean(value) {
    if (typeof value !== 'boolean') {
        return value;
    }
    return value ? ConvertedBool.TRUE : ConvertedBool.FALSE;
}
function getLanguage(languageCode) {
    if (languageCode === null) {
        return 'LANGUAGE_UNKNOWN';
    }
    return (CODE_TO_LANGUAGE[languageCode.slice(0, 2).toLowerCase()] || 'LANGUAGE_CODE_UNKNOWN');
}
function getLanguageCode(languageCode) {
    if (languageCode === null) {
        return 'LANGUAGE_CODE_UNKNOWN';
    }
    return languageCode.replace('-', '_').toLowerCase();
}
function getRequestingEnvironment(host) {
    if (!host) {
        return 'stage';
    }
    if (host.includes('localhost')) {
        return 'localhost';
    }
    else if (host.includes('preprod')) {
        return 'preprod';
    }
    else if (host.includes('stage')) {
        return 'stage';
    }
    else if (host.includes('evernote')) {
        return 'production';
    }
    else if (host.includes('enops.net')) {
        return 'etnc';
    }
    return 'stage';
}
function toUserClientInfo({ clientType, host, platform, user, }) {
    const { NodeFields: { Attributes: { preferredLanguage: languageCode }, businessUserRole, created, serviceLevelV2, Accounting: { premiumServiceStatus }, }, } = user;
    const userInfo = {
        is_account_less_1_day: isAccountLessThan(created, conduit_utils_1.MILLIS_IN_ONE_DAY),
        is_account_less_7_days: isAccountLessThan(created, conduit_utils_1.MILLIS_IN_SEVEN_DAYS),
        is_account_less_14_days: isAccountLessThan(created, conduit_utils_1.MILLIS_IN_FOURTEEN_DAYS),
        is_account_less_30_days: isAccountLessThan(created, conduit_utils_1.MILLIS_IN_THIRTY_DAYS),
        is_account_created_before_2020_06_01: isAccountCreatedBefore(created, '2020-06-01'),
        is_basic_account: serviceLevelV2 === en_data_model_1.ServiceLevelV2.FREE,
        is_business_only_account: serviceLevelV2 === en_data_model_1.ServiceLevelV2.TEAMS,
        is_business_admin: businessUserRole === en_conduit_sync_types_1.BusinessUserRole.ADMIN,
        language: getLanguage(languageCode),
        language_code: getLanguageCode(languageCode),
        platform,
        is_conduit: true,
        requesting_environment: getRequestingEnvironment(host),
        requesting_page: CLIENT_VALUE_TO_REQUESTING_PAGE.get(clientType),
        subscription_level: serviceLevelV2,
        has_been_premium: premiumServiceStatus !== en_core_entity_types_1.PremiumOrderStatus.NONE,
    };
    for (const key in userInfo) {
        userInfo[key] = convertIfBoolean(userInfo[key]);
    }
    return JSON.stringify(userInfo);
}
exports.toUserClientInfo = toUserClientInfo;
//# sourceMappingURL=MaestroHelper.js.map