"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountSessionActivityHydrator = exports.AccountSessionSyncActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const Auth_1 = require("../Auth");
const ENSyncActivity_1 = require("./ENSyncActivity");
const ACCOUNT_SESSION_SYNC_ACTIVITY_INTERVAL = conduit_utils_1.MILLIS_IN_ONE_MINUTE;
class AccountSessionSyncActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, subpriority = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.AccountSessionSyncActivity,
            priority: en_conduit_sync_types_1.SyncActivityPriority.BACKGROUND,
            subpriority,
            runAfter: Date.now() + ACCOUNT_SESSION_SYNC_ACTIVITY_INTERVAL,
        }, {
            syncProgressTableName: null,
        });
    }
    async runSyncImpl(trc) {
        const params = this.initParams('best', null, 0);
        const clientCredentials = this.context.syncEngine.getClientCredentials();
        if (!Auth_1.hasNAPData(params.auth) || !clientCredentials) {
            return;
        }
        const request = new en_conduit_sync_types_1.THasActiveSessionRequest({
            authenticationToken: params.auth.token,
            deviceIdentifier: clientCredentials.deviceIdentifier,
            clientId: params.auth.napAuthInfo.clientID,
            consumerKey: clientCredentials.consumerKey,
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
function accountSessionActivityHydrator(di, context, p) {
    return new AccountSessionSyncActivity(di, context, p.subpriority);
}
exports.accountSessionActivityHydrator = accountSessionActivityHydrator;
//# sourceMappingURL=AccountSessionSyncActivity.js.map