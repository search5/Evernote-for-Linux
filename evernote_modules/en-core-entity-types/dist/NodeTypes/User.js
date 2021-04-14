"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTypeDef = exports.UserReminderEmailConfig = exports.PremiumOrderStatus = exports.PremiumOrderStatusSchema = exports.BusinessUserRole = exports.BusinesUserRoleSchema = exports.ServiceLevelV2Schema = exports.ServiceLevelV2 = exports.ServiceLevel = exports.ServiceLevelSchema = exports.PrivilegeLevel = exports.PrivilegeLevelSchema = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const EntityConstants_1 = require("../EntityConstants");
exports.PrivilegeLevelSchema = ['NORMAL', 'PREMIUM', 'VIP', 'MANAGER', 'SUPPORT', 'ADMIN'];
var PrivilegeLevel;
(function (PrivilegeLevel) {
    PrivilegeLevel["NORMAL"] = "NORMAL";
    PrivilegeLevel["PREMIUM"] = "PREMIUM";
    PrivilegeLevel["VIP"] = "VIP";
    PrivilegeLevel["MANAGER"] = "MANAGER";
    PrivilegeLevel["SUPPORT"] = "SUPPORT";
    PrivilegeLevel["ADMIN"] = "ADMIN";
})(PrivilegeLevel = exports.PrivilegeLevel || (exports.PrivilegeLevel = {}));
exports.ServiceLevelSchema = ['BASIC', 'PLUS', 'PREMIUM', 'BUSINESS'];
var ServiceLevel;
(function (ServiceLevel) {
    ServiceLevel["BASIC"] = "BASIC";
    ServiceLevel["PLUS"] = "PLUS";
    ServiceLevel["PREMIUM"] = "PREMIUM";
    ServiceLevel["BUSINESS"] = "BUSINESS";
})(ServiceLevel = exports.ServiceLevel || (exports.ServiceLevel = {}));
var en_data_model_2 = require("en-data-model");
Object.defineProperty(exports, "ServiceLevelV2", { enumerable: true, get: function () { return en_data_model_2.ServiceLevelV2; } });
exports.ServiceLevelV2Schema = Object.values(en_data_model_1.ServiceLevelV2);
exports.BusinesUserRoleSchema = ['ADMIN', 'NORMAL'];
var BusinessUserRole;
(function (BusinessUserRole) {
    BusinessUserRole["ADMIN"] = "ADMIN";
    BusinessUserRole["NORMAL"] = "NORMAL";
})(BusinessUserRole = exports.BusinessUserRole || (exports.BusinessUserRole = {}));
exports.PremiumOrderStatusSchema = ['NONE', 'PENDING', 'ACTIVE', 'FAILED', 'CANCELLATION_PENDING', 'CANCELED'];
var PremiumOrderStatus;
(function (PremiumOrderStatus) {
    PremiumOrderStatus["NONE"] = "NONE";
    PremiumOrderStatus["PENDING"] = "PENDING";
    PremiumOrderStatus["ACTIVE"] = "ACTIVE";
    PremiumOrderStatus["FAILED"] = "FAILED";
    PremiumOrderStatus["CANCELLATION_PENDING"] = "CANCELLATION_PENDING";
    PremiumOrderStatus["CANCELED"] = "CANCELED";
})(PremiumOrderStatus = exports.PremiumOrderStatus || (exports.PremiumOrderStatus = {}));
var UserReminderEmailConfig;
(function (UserReminderEmailConfig) {
    UserReminderEmailConfig["DO_NOT_SEND"] = "DO_NOT_SEND";
    UserReminderEmailConfig["SEND_DAILY_EMAIL"] = "SEND_DAILY_EMAIL";
})(UserReminderEmailConfig = exports.UserReminderEmailConfig || (exports.UserReminderEmailConfig = {}));
exports.userTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.User,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        internal_userID: 'number',
        isVaultUser: 'boolean',
        username: 'string',
        email: 'string',
        name: 'string?',
        timezone: 'string?',
        privilege: exports.PrivilegeLevelSchema,
        serviceLevel: exports.ServiceLevelSchema,
        serviceLevelV2: exports.ServiceLevelV2Schema,
        created: 'timestamp',
        updated: 'timestamp',
        deleted: 'timestamp?',
        active: 'boolean',
        photoUrl: 'url',
        photoLastUpdated: 'timestamp?',
        businessUserRole: exports.BusinesUserRoleSchema,
        businessName: 'string?',
        Accounting: {
            uploadLimit: 'number?',
            uploadLimitEnd: 'number?',
            uploadLimitNextMonth: 'number?',
            premiumServiceStatus: exports.PremiumOrderStatusSchema,
            premiumOrderNumber: 'string?',
            premiumCommerceService: 'string?',
            premiumServiceStart: 'number?',
            premiumServiceSKU: 'string?',
            lastSuccessfulCharge: 'number?',
            lastFailedCharge: 'number?',
            lastFailedChargeReason: 'string?',
            nextPaymentDue: 'number?',
            premiumLockUntil: 'number?',
            updated: 'number?',
            premiumSubscriptionNumber: 'string?',
            lastRequestedCharge: 'number?',
            currency: 'string?',
            unitPrice: 'number?',
            businessId: 'number?',
            businessName: 'string?',
            businessRole: exports.BusinesUserRoleSchema,
            unitDiscount: 'number?',
            nextChargeDate: 'number?',
            availablePoints: 'number?',
            backupPaymentInfo: {
                premiumCommerceService: 'string?',
                premiumServiceSKU: 'string?',
                currency: 'string?',
                unitPrice: 'number?',
                paymentMethodId: 'number?',
                orderNumber: 'string?',
            },
        },
        Attributes: {
            preferredLanguage: 'string?',
            emailAddressLastConfirmed: 'timestamp?',
            passwordUpdated: 'timestamp?',
            incomingEmailAddress: 'string?',
            reminderEmail: Object.values(UserReminderEmailConfig),
        },
        canEmptyTrash: 'boolean',
        subscriptionInfo: {
            updatedTime: 'timestamp?',
            isSubscribed: 'boolean',
            subscriptionRecurring: 'boolean',
            subscriptionExpirationDate: 'timestamp?',
            subscriptionPending: 'boolean',
            subscriptionCancellationPending: 'boolean',
            serviceLevelsEligibleForPurchase: 'string[]',
            currentSku: 'string?',
            validUntil: 'timestamp?',
            itunesReceiptRequested: 'boolean',
        },
    },
    cache: {
        showChoiceScreen: {
            type: 'boolean',
            allowStale: true,
            defaultValue: false,
        },
    },
    edges: {
        accountLimits: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            to: EntityConstants_1.CoreEntityTypes.AccountLimits,
        },
        maestroProps: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            to: EntityConstants_1.CoreEntityTypes.MaestroProps,
        },
        profile: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
        defaultNotebook: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: {
                type: EntityConstants_1.CoreEntityTypes.Notebook,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'userForDefaultNotebook',
            },
        },
        userNotebook: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: {
                type: EntityConstants_1.CoreEntityTypes.Notebook,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'userForUserNotebook',
            },
        },
    },
};
//# sourceMappingURL=User.js.map