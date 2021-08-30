"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserMutators = exports.addUserRequestQueries = void 0;
const conduit_auth_shared_1 = require("conduit-auth-shared");
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const Auth_1 = require("../Auth");
const TSD_VARIATION_ENUM = [
    'DIALOG_VAR1',
    'FULLSCREEN1BUTTON_DISMISS',
    'FULLSCREEN1BUTTON_NODISMISS',
    'FULLSCREEN1BUTTON_TIERPATH',
    'FULLSCREEN1BUTTON_VAR2',
    'FULLSCREEN3BUTTONS_DEFAULT',
    'FULLSCREEN3BUTTONS_DISMISS',
    'FULLSCREEN3BUTTONS_NODISMISS',
    'FULLSCREEN3BUTTONS_BEFOREFLE',
    'MODAL_DEFAULT',
    'NOTIFICATION_ASPIRATIONAL',
    'NOTIFICATION_STORAGE',
    'SHEET_ASPIRATIONAL',
    'SHEET_STORAGE',
    'BANNER_LEARNMORE',
    'BANNER_UPGRADE',
    'FULLSCREEN_SINGLESDAY',
    'FULLSCREEN_DISCOUNT',
    'FULLSCREEN_NEWYEAR',
    'TEST_UNSUPPORTED',
];
const TsdVariationSchema = conduit_utils_1.Enum(TSD_VARIATION_ENUM, 'TsdVariation');
var TsdType;
(function (TsdType) {
    TsdType["REGULAR_TSD"] = "REGULAR_TSD";
    TsdType["TARGETED_UPSELL"] = "TARGETED_UPSELL";
})(TsdType || (TsdType = {}));
const TsdTypeSchema = conduit_utils_1.Enum(TsdType, 'TsdType');
const TSD_TYPE_THRIFT_TO_ENUM = {
    [en_conduit_sync_types_1.TTsdType.REGULAR_TSD]: TsdType.REGULAR_TSD,
    [en_conduit_sync_types_1.TTsdType.TARGETED_UPSELL]: TsdType.TARGETED_UPSELL,
};
const TSD_VARIATION_THRIFT_TO_ENUM = {
    [en_conduit_sync_types_1.TTsdVariation.DIALOG_VAR1]: 'DIALOG_VAR1',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN1BUTTON_DISMISS]: 'FULLSCREEN1BUTTON_DISMISS',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN1BUTTON_NODISMISS]: 'FULLSCREEN1BUTTON_NODISMISS',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN1BUTTON_TIERPATH]: 'FULLSCREEN1BUTTON_TIERPATH',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN1BUTTON_VAR2]: 'FULLSCREEN1BUTTON_VAR2',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN3BUTTONS_DEFAULT]: 'FULLSCREEN3BUTTONS_DEFAULT',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN3BUTTONS_DISMISS]: 'FULLSCREEN3BUTTONS_DISMISS',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN3BUTTONS_NODISMISS]: 'FULLSCREEN3BUTTONS_NODISMISS',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN3BUTTONS_BEFOREFLE]: 'FULLSCREEN3BUTTONS_BEFOREFLE',
    [en_conduit_sync_types_1.TTsdVariation.MODAL_DEFAULT]: 'MODAL_DEFAULT',
    [en_conduit_sync_types_1.TTsdVariation.NOTIFICATION_ASPIRATIONAL]: 'NOTIFICATION_ASPIRATIONAL',
    [en_conduit_sync_types_1.TTsdVariation.NOTIFICATION_STORAGE]: 'NOTIFICATION_STORAGE',
    [en_conduit_sync_types_1.TTsdVariation.SHEET_ASPIRATIONAL]: 'SHEET_ASPIRATIONAL',
    [en_conduit_sync_types_1.TTsdVariation.SHEET_STORAGE]: 'SHEET_STORAGE',
    [en_conduit_sync_types_1.TTsdVariation.BANNER_LEARNMORE]: 'BANNER_LEARNMORE',
    [en_conduit_sync_types_1.TTsdVariation.BANNER_UPGRADE]: 'BANNER_UPGRADE',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN_SINGLESDAY]: 'FULLSCREEN_SINGLESDAY',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN_DISCOUNT]: 'FULLSCREEN_DISCOUNT',
    [en_conduit_sync_types_1.TTsdVariation.FULLSCREEN_NEWYEAR]: 'FULLSCREEN_NEWYEAR',
    [en_conduit_sync_types_1.TTsdVariation.TEST_UNSUPPORTED]: 'TEST_UNSUPPORTED',
};
function addUserRequestQueries(out) {
    async function userGetTsdEligibilityResolver(parent, args, context) {
        conduit_core_1.validateDB(context);
        if (!args) {
            throw new Error('Lacking args');
        }
        const authState = await context.db.getAuthTokenAndState(context.trc, null);
        if (!authState || !authState.token || authState.state !== conduit_view_types_1.AuthState.Authorized) {
            throw new Error('Not logged in');
        }
        const auth = conduit_auth_shared_1.decodeAuthData(authState.token);
        const store = context.comm.getUtilityStore(auth.urls.utilityUrl);
        const res = await store.getTsdEligibility(context.trc, auth.token, {
            numSessionsLast7Days: args.numSessionsLast7Days,
            numSessionsLast30Days: args.numSessionsLast30Days,
            numDaysActiveLast7Days: args.numDaysActiveLast7Days,
            numDaysActiveLast30Days: args.numDaysActiveLast30Days,
        });
        // note: can include more results here, but it looks like we don't actually use most of the other entries
        return {
            shouldShowTsd: res.shouldShowTsd,
            tsdType: (res.tsdType === null || res.tsdType === undefined) ? null : TSD_TYPE_THRIFT_TO_ENUM[res.tsdType],
            tsdVariation: (res.tsdVariation === null || res.tsdVariation === undefined) ? null : TSD_VARIATION_THRIFT_TO_ENUM[res.tsdVariation],
        };
    }
    out.userGetTsdEligibility = {
        type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
            shouldShowTsd: 'boolean',
            tsdType: conduit_utils_1.Nullable(TsdTypeSchema),
            tsdVariation: conduit_utils_1.Nullable(TsdVariationSchema),
        }, 'TierSelectionDisplayResult')),
        args: conduit_core_1.schemaToGraphQLArgs({
            numSessionsLast7Days: conduit_utils_1.NullableInt,
            numSessionsLast30Days: conduit_utils_1.NullableInt,
            numDaysActiveLast7Days: conduit_utils_1.NullableInt,
            numDaysActiveLast30Days: conduit_utils_1.NullableInt,
        }),
        resolve: userGetTsdEligibilityResolver,
    };
}
exports.addUserRequestQueries = addUserRequestQueries;
function addUserMutators(out) {
    async function userAssociateWithOpenIDResolver(_, args, context) {
        conduit_core_1.validateDB(context);
        const authState = await context.db.getAuthTokenAndState(context.trc, null);
        if (!args) {
            throw new Error('No args');
        }
        if (!(authState === null || authState === void 0 ? void 0 : authState.token) || authState.state !== conduit_view_types_1.AuthState.Authorized) {
            throw new Error('Not currently logged in');
        }
        if (!args.tokenPayload) {
            throw new Error('No token payload');
        }
        let prov;
        if (!args.provider || Auth_1.SERVICE_PROVIDER_STRING_TO_ENUM[args.provider] === en_conduit_sync_types_1.TServiceProvider.GOOGLE) {
            prov = en_conduit_sync_types_1.TServiceProvider.GOOGLE;
        }
        else {
            throw new Error('Only google supported as service provider for now');
        }
        const credential = {
            tokenPayload: args.tokenPayload,
            serviceProvider: prov,
        };
        const auth = conduit_auth_shared_1.decodeAuthData(authState.token);
        const utilityStore = context.comm.getUtilityStore(auth.urls.utilityUrl);
        await utilityStore.associateOpenIDWithUser(context.trc, auth.token, credential);
        return { success: true };
    }
    out.userAssociateWithOpenID = {
        args: conduit_core_1.schemaToGraphQLArgs({
            provider: Auth_1.ServiceProviderSchema,
            tokenPayload: 'string',
        }),
        type: conduit_core_1.GenericMutationResult,
        resolve: userAssociateWithOpenIDResolver,
    };
}
exports.addUserMutators = addUserMutators;
//# sourceMappingURL=Users.js.map