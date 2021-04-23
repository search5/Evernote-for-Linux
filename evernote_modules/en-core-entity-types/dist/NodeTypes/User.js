"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTypeDef = exports.UserReminderEmailConfigSchema = exports.UserReminderEmailConfig = exports.PremiumOrderStatusSchema = exports.PremiumOrderStatus = exports.BusinessUserRole = exports.ServiceLevelV2Schema = exports.ServiceLevelV2 = exports.ServiceLevelSchema = exports.ServiceLevel = exports.PrivilegeLevelSchema = exports.PrivilegeLevel = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const EntityConstants_1 = require("../EntityConstants");
var PrivilegeLevel;
(function (PrivilegeLevel) {
    PrivilegeLevel["NORMAL"] = "NORMAL";
    PrivilegeLevel["PREMIUM"] = "PREMIUM";
    PrivilegeLevel["VIP"] = "VIP";
    PrivilegeLevel["MANAGER"] = "MANAGER";
    PrivilegeLevel["SUPPORT"] = "SUPPORT";
    PrivilegeLevel["ADMIN"] = "ADMIN";
})(PrivilegeLevel = exports.PrivilegeLevel || (exports.PrivilegeLevel = {}));
exports.PrivilegeLevelSchema = conduit_utils_1.Enum(PrivilegeLevel, 'UserPrivilegeLevel');
var ServiceLevel;
(function (ServiceLevel) {
    ServiceLevel["BASIC"] = "BASIC";
    ServiceLevel["PLUS"] = "PLUS";
    ServiceLevel["PREMIUM"] = "PREMIUM";
    ServiceLevel["BUSINESS"] = "BUSINESS";
})(ServiceLevel = exports.ServiceLevel || (exports.ServiceLevel = {}));
exports.ServiceLevelSchema = conduit_utils_1.Enum(ServiceLevel, 'UserServiceLevel');
var en_data_model_2 = require("en-data-model");
Object.defineProperty(exports, "ServiceLevelV2", { enumerable: true, get: function () { return en_data_model_2.ServiceLevelV2; } });
exports.ServiceLevelV2Schema = conduit_utils_1.Enum(en_data_model_1.ServiceLevelV2, 'UserServiceLevelV2');
var BusinessUserRole;
(function (BusinessUserRole) {
    BusinessUserRole["ADMIN"] = "ADMIN";
    BusinessUserRole["NORMAL"] = "NORMAL";
})(BusinessUserRole = exports.BusinessUserRole || (exports.BusinessUserRole = {}));
const BusinessUserRoleSchema = conduit_utils_1.Enum(BusinessUserRole, 'BusinessUserRole');
var PremiumOrderStatus;
(function (PremiumOrderStatus) {
    PremiumOrderStatus["NONE"] = "NONE";
    PremiumOrderStatus["PENDING"] = "PENDING";
    PremiumOrderStatus["ACTIVE"] = "ACTIVE";
    PremiumOrderStatus["FAILED"] = "FAILED";
    PremiumOrderStatus["CANCELLATION_PENDING"] = "CANCELLATION_PENDING";
    PremiumOrderStatus["CANCELED"] = "CANCELED";
})(PremiumOrderStatus = exports.PremiumOrderStatus || (exports.PremiumOrderStatus = {}));
exports.PremiumOrderStatusSchema = conduit_utils_1.Enum(PremiumOrderStatus, 'PremiumOrderStatus');
var UserReminderEmailConfig;
(function (UserReminderEmailConfig) {
    UserReminderEmailConfig["DO_NOT_SEND"] = "DO_NOT_SEND";
    UserReminderEmailConfig["SEND_DAILY_EMAIL"] = "SEND_DAILY_EMAIL";
})(UserReminderEmailConfig = exports.UserReminderEmailConfig || (exports.UserReminderEmailConfig = {}));
exports.UserReminderEmailConfigSchema = conduit_utils_1.Enum(UserReminderEmailConfig, 'UserReminderEmailConfig');
exports.userTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.User,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        internal_userID: 'number',
        isVaultUser: 'boolean',
        username: 'string',
        email: 'string',
        name: conduit_utils_1.NullableString,
        timezone: conduit_utils_1.NullableString,
        privilege: exports.PrivilegeLevelSchema,
        serviceLevel: exports.ServiceLevelSchema,
        serviceLevelV2: exports.ServiceLevelV2Schema,
        created: 'timestamp',
        updated: 'timestamp',
        deleted: conduit_utils_1.NullableTimestamp,
        active: 'boolean',
        photoUrl: 'url',
        photoLastUpdated: conduit_utils_1.NullableTimestamp,
        businessUserRole: BusinessUserRoleSchema,
        businessName: conduit_utils_1.NullableString,
        Accounting: conduit_utils_1.Struct({
            uploadLimit: conduit_utils_1.NullableNumber,
            uploadLimitEnd: conduit_utils_1.NullableNumber,
            uploadLimitNextMonth: conduit_utils_1.NullableNumber,
            premiumServiceStatus: conduit_utils_1.Nullable(exports.PremiumOrderStatusSchema),
            premiumOrderNumber: conduit_utils_1.NullableString,
            premiumCommerceService: conduit_utils_1.NullableString,
            premiumServiceStart: conduit_utils_1.NullableNumber,
            premiumServiceSKU: conduit_utils_1.NullableString,
            lastSuccessfulCharge: conduit_utils_1.NullableNumber,
            lastFailedCharge: conduit_utils_1.NullableNumber,
            lastFailedChargeReason: conduit_utils_1.NullableString,
            nextPaymentDue: conduit_utils_1.NullableNumber,
            premiumLockUntil: conduit_utils_1.NullableNumber,
            updated: conduit_utils_1.NullableNumber,
            premiumSubscriptionNumber: conduit_utils_1.NullableString,
            lastRequestedCharge: conduit_utils_1.NullableNumber,
            currency: conduit_utils_1.NullableString,
            unitPrice: conduit_utils_1.NullableNumber,
            businessId: conduit_utils_1.NullableNumber,
            businessName: conduit_utils_1.NullableString,
            businessRole: conduit_utils_1.Nullable(BusinessUserRoleSchema),
            unitDiscount: conduit_utils_1.NullableNumber,
            nextChargeDate: conduit_utils_1.NullableNumber,
            availablePoints: conduit_utils_1.NullableNumber,
            backupPaymentInfo: conduit_utils_1.Struct({
                premiumCommerceService: conduit_utils_1.NullableString,
                premiumServiceSKU: conduit_utils_1.NullableString,
                currency: conduit_utils_1.NullableString,
                unitPrice: conduit_utils_1.NullableNumber,
                paymentMethodId: conduit_utils_1.NullableNumber,
                orderNumber: conduit_utils_1.NullableString,
            }),
        }),
        Attributes: conduit_utils_1.Struct({
            preferredLanguage: conduit_utils_1.NullableString,
            emailAddressLastConfirmed: conduit_utils_1.NullableTimestamp,
            passwordUpdated: conduit_utils_1.NullableTimestamp,
            incomingEmailAddress: conduit_utils_1.NullableString,
            reminderEmail: exports.UserReminderEmailConfigSchema,
        }),
        canEmptyTrash: 'boolean',
        subscriptionInfo: conduit_utils_1.Struct({
            updatedTime: conduit_utils_1.NullableTimestamp,
            isSubscribed: 'boolean',
            subscriptionRecurring: 'boolean',
            subscriptionExpirationDate: conduit_utils_1.NullableTimestamp,
            subscriptionPending: 'boolean',
            subscriptionCancellationPending: 'boolean',
            serviceLevelsEligibleForPurchase: conduit_utils_1.ListOf('string'),
            currentSku: conduit_utils_1.NullableString,
            validUntil: conduit_utils_1.NullableTimestamp,
            itunesReceiptRequested: 'boolean',
        }),
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