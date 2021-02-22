"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareAllowanceResolver = exports.getShareAllowance = exports.UNLIMITED_SHARES = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Auth_1 = require("../Auth");
exports.UNLIMITED_SHARES = -1;
async function getShareAllowance(thriftComm, context) {
    conduit_core_1.validateDB(context);
    const cacheFillFunc = async (node, syncContext) => {
        const metadata = await context.db.getSyncContextMetadata(context, syncContext);
        if (!metadata || !metadata.authToken) {
            throw new Error('not authorized');
        }
        const auth = Auth_1.decodeAuthData(metadata.authToken);
        const utilityStore = thriftComm.getUtilityStore(auth.urls.utilityUrl);
        const restrictions = await utilityStore.getUserRestrictions(context.trc, auth.token);
        let ret = exports.UNLIMITED_SHARES;
        if (restrictions && restrictions.noteAndNotebookSharesAllowance !== undefined && restrictions.noteAndNotebookSharesAllowance !== null) {
            ret = restrictions.noteAndNotebookSharesAllowance;
        }
        await context.db.transactSyncedStorage(context.trc, 'cacheShareAllowance', async (tx) => {
            await tx.setNodeCachedField(context.trc, en_data_model_1.ACCOUNT_LIMITS_REF, 'noteAndNotebookSharesAllowance', ret, { 'Counts.userNoteAndNotebookSharesSentCount': node.NodeFields.Counts.userNoteAndNotebookSharesSentCount });
        });
        return ret;
    };
    const { node: user } = await context.db.getNodeWithContext(context, { id: conduit_core_1.PERSONAL_USER_ID, type: en_data_model_1.CoreEntityTypes.User });
    if (!user) {
        return exports.UNLIMITED_SHARES;
    }
    // if less than a week, check it
    if (user && user.NodeFields.created && (Date.now() - user.NodeFields.created) < conduit_utils_1.MILLIS_IN_SEVEN_DAYS) {
        const limitRef = { id: en_data_model_1.ACCOUNT_LIMITS_ID, type: en_data_model_1.CoreEntityTypes.AccountLimits };
        return await context.db.getNodeCachedField(context, limitRef, 'noteAndNotebookSharesAllowance', cacheFillFunc);
    }
    return exports.UNLIMITED_SHARES;
}
exports.getShareAllowance = getShareAllowance;
function ShareAllowanceResolver(thriftComm) {
    return {
        'AccountLimits.noteAndNotebookSharesAllowance': {
            type: conduit_core_1.schemaToGraphQLType('number'),
            resolve: async (nodeRef, _, context) => {
                return getShareAllowance(thriftComm, context);
            },
        },
    };
}
exports.ShareAllowanceResolver = ShareAllowanceResolver;
//# sourceMappingURL=ShareAllowanceResolver.js.map