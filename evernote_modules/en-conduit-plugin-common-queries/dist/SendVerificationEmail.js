"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmailPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
async function sendVerificationEmailResolver(parent, args, context) {
    conduit_core_1.validateDB(context);
    const user = await context.db.getUserNode(context);
    if (!user) {
        throw new conduit_utils_1.NotFoundError('', 'user node not found');
    }
    if (user.NodeFields.Attributes && user.NodeFields.Attributes.emailAddressLastConfirmed) {
        throw new Error(`User email already confirmed`);
    }
    const metadata = await context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT);
    if (!metadata || !metadata.authToken) {
        throw new conduit_utils_1.NotFoundError(user.id, 'Sync context metadata not found');
    }
    const auth = en_thrift_connector_1.decodeAuthData(metadata.authToken);
    const utilityStore = context.comm.getUtilityStore(auth.urls.utilityUrl);
    await utilityStore.sendVerificationEmail(context.trc, auth.token);
    return { success: true };
}
exports.sendVerificationEmailPlugin = {
    type: conduit_core_1.GenericMutationResult,
    resolve: sendVerificationEmailResolver,
};
//# sourceMappingURL=SendVerificationEmail.js.map