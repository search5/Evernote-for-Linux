"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserConverter = exports.convertUserFromService = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
const NotebookConverter_1 = require("./NotebookConverter");
const ProfileConverter_1 = require("./ProfileConverter");
function toPremiumServiceStatus(t) {
    switch (t) {
        case null:
        case en_conduit_sync_types_1.TPremiumOrderStatus.NONE:
            return en_core_entity_types_1.PremiumOrderStatus.NONE;
        case en_conduit_sync_types_1.TPremiumOrderStatus.PENDING:
            return en_core_entity_types_1.PremiumOrderStatus.PENDING;
        case en_conduit_sync_types_1.TPremiumOrderStatus.ACTIVE:
            return en_core_entity_types_1.PremiumOrderStatus.ACTIVE;
        case en_conduit_sync_types_1.TPremiumOrderStatus.FAILED:
            return en_core_entity_types_1.PremiumOrderStatus.FAILED;
        case en_conduit_sync_types_1.TPremiumOrderStatus.CANCELLATION_PENDING:
            return en_core_entity_types_1.PremiumOrderStatus.CANCELLATION_PENDING;
        case en_conduit_sync_types_1.TPremiumOrderStatus.CANCELED:
            return en_core_entity_types_1.PremiumOrderStatus.CANCELED;
        default:
            throw new Error(`Invalid PremiumOrderStatus returned from service`);
    }
}
function toBusinessUserRole(t) {
    if (!t) {
        return en_conduit_sync_types_1.BusinessUserRole.NORMAL;
    }
    switch (t) {
        case en_conduit_sync_types_1.TBusinessUserRole.ADMIN:
            return en_conduit_sync_types_1.BusinessUserRole.ADMIN;
        case en_conduit_sync_types_1.TBusinessUserRole.NORMAL:
            return en_conduit_sync_types_1.BusinessUserRole.NORMAL;
        default:
            throw new Error('Unknown business user role');
    }
}
function convertReminderEmailConfig(reminderEmailConfig) {
    switch (reminderEmailConfig) {
        case en_conduit_sync_types_1.TReminderEmailConfig.SEND_DAILY_EMAIL:
            return en_core_entity_types_1.UserReminderEmailConfig.SEND_DAILY_EMAIL;
        default:
            return en_core_entity_types_1.UserReminderEmailConfig.DO_NOT_SEND;
    }
}
async function convertUserFromService(trc, params, syncContext, user, isVaultUser) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41;
    const serviceLevelV2Enum = user.serviceLevelV2;
    const serviceLevelV1String = en_conduit_sync_types_1.toServiceLevelV1(user.serviceLevel || en_conduit_sync_types_1.TServiceLevel.BASIC);
    const serviceLevelV2String = en_conduit_sync_types_1.toServiceLevelV2(serviceLevelV2Enum !== null && serviceLevelV2Enum !== void 0 ? serviceLevelV2Enum : serviceLevelV1String);
    const userOut = {
        id: isVaultUser ? conduit_core_1.VAULT_USER_ID : conduit_core_1.PERSONAL_USER_ID,
        type: en_core_entity_types_1.CoreEntityTypes.User,
        version: user.updated || 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: user.name || user.email || '',
        NodeFields: {
            internal_userID: user.id,
            isVaultUser,
            username: user.username || '',
            email: user.email || '',
            name: user.name || null,
            timezone: user.timezone || null,
            privilege: en_conduit_sync_types_1.toPrivilegeLevel(user.privilege || en_conduit_sync_types_1.TPrivilegeLevel.NORMAL),
            serviceLevel: serviceLevelV1String,
            serviceLevelV2: serviceLevelV2String,
            created: user.created || 0,
            updated: user.updated || 0,
            deleted: user.deleted || null,
            active: user.active || false,
            photoUrl: user.photoUrl || '',
            photoLastUpdated: user.photoLastUpdated || null,
            businessUserRole: toBusinessUserRole((_a = user.businessUserInfo) === null || _a === void 0 ? void 0 : _a.role),
            businessName: user.businessUserInfo && user.businessUserInfo.businessName || null,
            Accounting: {
                availablePoints: (_c = (_b = user.accounting) === null || _b === void 0 ? void 0 : _b.availablePoints) !== null && _c !== void 0 ? _c : null,
                backupPaymentInfo: {
                    currency: (_f = (_e = (_d = user.accounting) === null || _d === void 0 ? void 0 : _d.backupPaymentInfo) === null || _e === void 0 ? void 0 : _e.currency) !== null && _f !== void 0 ? _f : null,
                    orderNumber: (_j = (_h = (_g = user.accounting) === null || _g === void 0 ? void 0 : _g.backupPaymentInfo) === null || _h === void 0 ? void 0 : _h.orderNumber) !== null && _j !== void 0 ? _j : null,
                    paymentMethodId: (_m = (_l = (_k = user.accounting) === null || _k === void 0 ? void 0 : _k.backupPaymentInfo) === null || _l === void 0 ? void 0 : _l.paymentMethodId) !== null && _m !== void 0 ? _m : null,
                    premiumCommerceService: (_q = (_p = (_o = user.accounting) === null || _o === void 0 ? void 0 : _o.backupPaymentInfo) === null || _p === void 0 ? void 0 : _p.premiumCommerceService) !== null && _q !== void 0 ? _q : null,
                    premiumServiceSKU: (_t = (_s = (_r = user.accounting) === null || _r === void 0 ? void 0 : _r.backupPaymentInfo) === null || _s === void 0 ? void 0 : _s.premiumServiceSKU) !== null && _t !== void 0 ? _t : null,
                    unitPrice: (_w = (_v = (_u = user.accounting) === null || _u === void 0 ? void 0 : _u.backupPaymentInfo) === null || _v === void 0 ? void 0 : _v.unitPrice) !== null && _w !== void 0 ? _w : null,
                },
                businessId: (_y = (_x = user.accounting) === null || _x === void 0 ? void 0 : _x.businessId) !== null && _y !== void 0 ? _y : null,
                businessName: (_0 = (_z = user.accounting) === null || _z === void 0 ? void 0 : _z.businessName) !== null && _0 !== void 0 ? _0 : null,
                businessRole: toBusinessUserRole((_1 = user.accounting) === null || _1 === void 0 ? void 0 : _1.businessRole),
                currency: (_3 = (_2 = user.accounting) === null || _2 === void 0 ? void 0 : _2.currency) !== null && _3 !== void 0 ? _3 : null,
                lastFailedCharge: (_5 = (_4 = user.accounting) === null || _4 === void 0 ? void 0 : _4.lastFailedCharge) !== null && _5 !== void 0 ? _5 : null,
                lastFailedChargeReason: (_7 = (_6 = user.accounting) === null || _6 === void 0 ? void 0 : _6.lastFailedChargeReason) !== null && _7 !== void 0 ? _7 : null,
                lastRequestedCharge: (_9 = (_8 = user.accounting) === null || _8 === void 0 ? void 0 : _8.lastRequestedCharge) !== null && _9 !== void 0 ? _9 : null,
                lastSuccessfulCharge: (_11 = (_10 = user.accounting) === null || _10 === void 0 ? void 0 : _10.lastSuccessfulCharge) !== null && _11 !== void 0 ? _11 : null,
                nextChargeDate: (_13 = (_12 = user.accounting) === null || _12 === void 0 ? void 0 : _12.nextChargeDate) !== null && _13 !== void 0 ? _13 : null,
                nextPaymentDue: (_15 = (_14 = user.accounting) === null || _14 === void 0 ? void 0 : _14.nextPaymentDue) !== null && _15 !== void 0 ? _15 : null,
                premiumCommerceService: (_17 = (_16 = user.accounting) === null || _16 === void 0 ? void 0 : _16.premiumCommerceService) !== null && _17 !== void 0 ? _17 : null,
                premiumLockUntil: (_19 = (_18 = user.accounting) === null || _18 === void 0 ? void 0 : _18.premiumLockUntil) !== null && _19 !== void 0 ? _19 : null,
                premiumOrderNumber: (_21 = (_20 = user.accounting) === null || _20 === void 0 ? void 0 : _20.premiumOrderNumber) !== null && _21 !== void 0 ? _21 : null,
                premiumServiceSKU: (_23 = (_22 = user.accounting) === null || _22 === void 0 ? void 0 : _22.premiumServiceSKU) !== null && _23 !== void 0 ? _23 : null,
                premiumServiceStart: (_25 = (_24 = user.accounting) === null || _24 === void 0 ? void 0 : _24.premiumServiceStart) !== null && _25 !== void 0 ? _25 : null,
                premiumServiceStatus: toPremiumServiceStatus((_27 = (_26 = user.accounting) === null || _26 === void 0 ? void 0 : _26.premiumServiceStatus) !== null && _27 !== void 0 ? _27 : null),
                premiumSubscriptionNumber: (_29 = (_28 = user.accounting) === null || _28 === void 0 ? void 0 : _28.premiumSubscriptionNumber) !== null && _29 !== void 0 ? _29 : null,
                unitDiscount: (_31 = (_30 = user.accounting) === null || _30 === void 0 ? void 0 : _30.unitDiscount) !== null && _31 !== void 0 ? _31 : null,
                unitPrice: (_33 = (_32 = user.accounting) === null || _32 === void 0 ? void 0 : _32.unitPrice) !== null && _33 !== void 0 ? _33 : null,
                updated: (_35 = (_34 = user.accounting) === null || _34 === void 0 ? void 0 : _34.updated) !== null && _35 !== void 0 ? _35 : null,
                uploadLimit: (_37 = (_36 = user.accounting) === null || _36 === void 0 ? void 0 : _36.uploadLimit) !== null && _37 !== void 0 ? _37 : null,
                uploadLimitEnd: (_39 = (_38 = user.accounting) === null || _38 === void 0 ? void 0 : _38.uploadLimitEnd) !== null && _39 !== void 0 ? _39 : null,
                uploadLimitNextMonth: (_41 = (_40 = user.accounting) === null || _40 === void 0 ? void 0 : _40.uploadLimitNextMonth) !== null && _41 !== void 0 ? _41 : null,
            },
            Attributes: {
                preferredLanguage: user.attributes && user.attributes.preferredLanguage || null,
                emailAddressLastConfirmed: user.attributes && user.attributes.emailAddressLastConfirmed || null,
                passwordUpdated: user.attributes && user.attributes.passwordUpdated || null,
                incomingEmailAddress: user.attributes && user.attributes.incomingEmailAddress ? user.attributes.incomingEmailAddress.concat('@evernote.com') : null,
                reminderEmail: user.attributes ? convertReminderEmailConfig(user.attributes.reminderEmailConfig) : en_core_entity_types_1.UserReminderEmailConfig.DO_NOT_SEND,
            },
            subscriptionInfo: {
                updatedTime: user.subscriptionInfo && user.subscriptionInfo.currentTime || null,
                isSubscribed: user.subscriptionInfo && user.subscriptionInfo.currentlySubscribed || false,
                subscriptionRecurring: user.subscriptionInfo && user.subscriptionInfo.subscriptionRecurring || false,
                subscriptionExpirationDate: user.subscriptionInfo && user.subscriptionInfo.subscriptionExpirationDate || null,
                subscriptionPending: user.subscriptionInfo && user.subscriptionInfo.subscriptionPending || false,
                subscriptionCancellationPending: user.subscriptionInfo && user.subscriptionInfo.subscriptionCancellationPending || false,
                serviceLevelsEligibleForPurchase: user.subscriptionInfo && en_conduit_sync_types_1.toServiceLevelArray(user.subscriptionInfo.serviceLevelsEligibleForPurchase) || [],
                currentSku: user.subscriptionInfo && user.subscriptionInfo.currentSku || null,
                validUntil: user.subscriptionInfo && user.subscriptionInfo.validUntil || null,
                itunesReceiptRequested: user.subscriptionInfo && user.subscriptionInfo.itunesReceiptRequested || false,
            },
            canEmptyTrash: !user.businessUserInfo,
        },
        inputs: {},
        outputs: {
            accountLimits: {},
            defaultNotebook: {},
            maestroProps: {},
            userNotebook: {},
            profile: {},
        },
    };
    if (!isVaultUser) {
        conduit_storage_1.addOutputEdgeToNode(userOut, 'profile', {
            id: Converters_1.convertGuidFromService(user.id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
        await ProfileConverter_1.ProfileConverter.convertFromService(trc, params, syncContext, ProfileConverter_1.profileFromUser(user, ProfileConverter_1.ProfileSourceConfidence.Source, en_core_entity_types_1.ProfileStatusEnum.ACTIVE));
        conduit_storage_1.addOutputEdgeToNode(userOut, 'accountLimits', {
            id: en_core_entity_types_1.ACCOUNT_LIMITS_ID,
            type: en_core_entity_types_1.CoreEntityTypes.AccountLimits,
            port: null,
        });
        conduit_storage_1.addOutputEdgeToNode(userOut, 'maestroProps', {
            id: en_core_entity_types_1.MAESTRO_PROPS_ID,
            type: en_core_entity_types_1.CoreEntityTypes.MaestroProps,
            port: null,
        });
        // carryover previous defaultNotebook and userNotebook edges, they are unique because of how they are synced
        // see the comment in NotebookConverter.ts@convertNotebookFromServiceImpl
        const prevUserNode = await params.graphTransaction.getNode(trc, null, userOut);
        const defaultNotebookEdge = conduit_utils_1.firstStashEntry(prevUserNode === null || prevUserNode === void 0 ? void 0 : prevUserNode.outputs.defaultNotebook);
        if (defaultNotebookEdge) {
            conduit_storage_1.addOutputEdgeToNode(userOut, 'defaultNotebook', {
                id: defaultNotebookEdge.dstID,
                type: defaultNotebookEdge.dstType,
                port: defaultNotebookEdge.dstPort,
            });
        }
        const userNotebookEdge = conduit_utils_1.firstStashEntry(prevUserNode === null || prevUserNode === void 0 ? void 0 : prevUserNode.outputs.userNotebook);
        if (userNotebookEdge) {
            conduit_storage_1.addOutputEdgeToNode(userOut, 'userNotebook', {
                id: userNotebookEdge.dstID,
                type: userNotebookEdge.dstType,
                port: userNotebookEdge.dstPort,
            });
        }
    }
    await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, userOut);
    return userOut;
}
exports.convertUserFromService = convertUserFromService;
class UserConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.User;
    }
    convertGuidFromService(guid) {
        throw new Error('TUserID cannot be converted from service');
    }
    convertGuidToService(guid) {
        throw new Error('User nodeID cannot be converted to service');
    }
    async convertFromService(trc, params, syncContext, serviceData, isVaultUser) {
        const result = await convertUserFromService(trc, params, syncContext, serviceData, isVaultUser !== null && isVaultUser !== void 0 ? isVaultUser : false);
        if (result) {
            return true;
        }
        return false;
    }
    createOnService() {
        throw new Error('User cannot be created here');
    }
    async deleteFromService() {
        throw new Error('User cannot be deleted here');
    }
    async updateToService() {
        throw new Error('User cannot be updated here');
    }
    async applyEdgeChangesToService(trc, params, _, nodeId, changes) {
        const defaultNotebookChanges = changes['outputs:defaultNotebook'];
        if (!defaultNotebookChanges || !defaultNotebookChanges.creates.length) {
            return false;
        }
        const nbID = defaultNotebookChanges.creates[0].dstID;
        const curNotebook = await params.graphTransaction.getNode(trc, null, { id: nbID, type: en_core_entity_types_1.CoreEntityTypes.Notebook });
        if (!curNotebook) {
            throw new conduit_utils_1.NotFoundError(nbID, `Missing notebook ${nbID} from local graph storage`);
        }
        const { auth, syncContext } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, curNotebook);
        const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
        if (!syncContextMetadata) {
            throw new conduit_utils_1.NotFoundError(syncContext, `Missing syncContextMetadata ${syncContext}`);
        }
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        let recipientSettings;
        let resp;
        const nbGuid = Converters_1.convertGuidToService(nbID, en_core_entity_types_1.CoreEntityTypes.Notebook);
        const serviceData = {
            guid: nbGuid,
        };
        if (syncContextMetadata.isVaultUser || syncContextMetadata.sharedNotebookGlobalID) {
            recipientSettings = new en_conduit_sync_types_1.TNotebookRecipientSettings({ recipientStatus: en_conduit_sync_types_1.TRecipientStatus.IN_MY_LIST_AND_DEFAULT_NOTEBOOK });
        }
        else {
            serviceData.defaultNotebook = true;
            // HACK: thrift's updateNotebookWithResultSpec can reset a stack to null while setting as default notebook.
            // So pass in.
            if (curNotebook.inputs.stack) {
                const edge = conduit_utils_1.firstStashEntry(curNotebook.inputs.stack);
                if (edge) {
                    const stackNode = await params.graphTransaction.getNode(trc, null, { id: edge.srcID, type: en_core_entity_types_1.CoreEntityTypes.Stack });
                    if (stackNode) {
                        serviceData.stack = stackNode.label;
                    }
                }
            }
        }
        let skipShare = false;
        if (recipientSettings) {
            resp = await NotebookConverter_1.notebookSetRecipientSettingsWrapper(trc, noteStore, syncContextMetadata, auth, params.personalAuth, nbGuid, recipientSettings, curNotebook);
            skipShare = true;
        }
        if (Object.keys(serviceData).length > 1) {
            // thrift call fails if name is not added
            serviceData.name = curNotebook.label;
            resp = await noteStore.updateNotebookWithResultSpec(trc, auth.token, serviceData, {
                includeSharedNotebooks: true,
                includeNotebookRestrictions: true,
                includeNotebookRecipientSettings: true,
            });
            skipShare = false; // assign here too because of the order
        }
        if (resp) {
            await NotebookConverter_1.convertNotebookFromServiceImpl(trc, params, syncContext, resp, { skipShare });
        }
        return false;
    }
    async customToService(trc, params, commandRun, syncContext) {
        switch (commandRun.command) {
            case 'UserUpdateReminderSetting':
                if (!params.personalAuth) {
                    throw new Error('Personal auth token needed');
                }
                const auth = params.personalAuth;
                const updateParams = commandRun.params;
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                await noteStore.updateUserSetting(trc, auth.token, en_conduit_sync_types_1.TUserSetting.RECEIVE_REMINDER_EMAIL, updateParams.setting);
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                const user = await utilityStore.getUser(trc, auth.token);
                const isVaultUser = Boolean(auth.vaultAuth);
                await convertUserFromService(trc, params, conduit_core_1.PERSONAL_USER_CONTEXT, user, isVaultUser);
                return null;
            default:
                throw new Error(`Unknown customToService command for User ${commandRun.command}`);
        }
    }
}
exports.UserConverter = new UserConverterClass();
//# sourceMappingURL=UserConverter.js.map