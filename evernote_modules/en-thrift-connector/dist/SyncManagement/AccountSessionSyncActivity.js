"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSessionSyncActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const Auth_1 = require("../Auth");
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
const ACCOUNT_SESSION_SYNC_ACTIVITY_INTERVAL = conduit_utils_1.MILLIS_IN_ONE_MINUTE;
class AccountSessionSyncActivity extends SyncActivity_1.SyncActivity {
    constructor(di, context, subpriority = 0) {
        super(di, context, {
            activityType: SyncActivity_1.SyncActivityType.AccountSessionSyncActivity,
            priority: SyncActivity_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + ACCOUNT_SESSION_SYNC_ACTIVITY_INTERVAL,
        }, {
            syncProgressTableName: null,
        });
    }
    async runSyncImpl(trc) {
        const params = this.initParams('best', null, 0);
        if (!Auth_1.hasNAPData(params.auth) || !this.context.syncEngine.clientCredentials) {
            return;
        }
        const request = new en_conduit_sync_types_1.THasActiveSessionRequest({
            authenticationToken: params.auth.token,
            deviceIdentifier: this.context.syncEngine.clientCredentials.deviceIdentifier,
            clientId: params.auth.napAuthInfo.clientID,
            consumerKey: this.context.syncEngine.clientCredentials.consumerKey,
        });
        const utility = params.thriftComm.getUtilityStore(params.auth.urls.utilityUrl);
        try {
            const sessionCheckRes = await utility.hasActiveSessions(trc, params.auth.token, request);
            if (!sessionCheckRes) {
                throw new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.SESSION_REVOKED, params.auth.token);
            }
        }
        catch (error) {
            if (error instanceof conduit_utils_1.AuthError) {
                throw error;
            }
            // SDMS is disabled. Logging.
            if (error instanceof conduit_utils_1.ServiceError && error.errorCode === en_conduit_sync_types_1.EDAMErrorCode.UNSUPPORTED_OPERATION) {
                conduit_utils_1.logger.debug('Encountered an error when checking session validity: SDMS DISABED');
            }
            else {
                conduit_utils_1.logger.debug('Encountered an error when checking session validity: ', error);
            }
        }
        throw new conduit_utils_1.RetryError('continue', ACCOUNT_SESSION_SYNC_ACTIVITY_INTERVAL);
    }
}
exports.AccountSessionSyncActivity = AccountSessionSyncActivity;
SyncActivityHydration_1.registerSyncActivityType(SyncActivity_1.SyncActivityType.AccountSessionSyncActivity, (di, context, p) => {
    return new AccountSessionSyncActivity(di, context, p.subpriority);
});
//# sourceMappingURL=AccountSessionSyncActivity.js.map