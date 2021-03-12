"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultiUserMutators = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../Resolvers/ResolverHelpers");
async function setCurrentUserResolver(_, args, context) {
    var _a;
    if (!args || args.userID === undefined) {
        throw new Error('Missing userID');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    // Flushing is best-effort to make account switching work in offline mode.
    const flushing = (_a = context.db) === null || _a === void 0 ? void 0 : _a.flushRemoteMutations();
    flushing && await conduit_utils_1.logAndDiscardError(flushing);
    await context.multiUserProvider.setCurrentUser(context.trc, conduit_utils_1.userIDForKeyString(args.userID));
    return { success: true };
}
async function newCurrentUserResolver(_, args, context) {
    var _a;
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await ((_a = context.db) === null || _a === void 0 ? void 0 : _a.flushRemoteMutations());
    await context.multiUserProvider.setCurrentUser(context.trc, null);
    return { success: true };
}
async function removeUserResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.multiUserProvider.removeAllUsers(context.trc, [conduit_utils_1.userIDForKeyString(args.userID)], args.keepData);
    return { success: true };
}
function getMultiUserMutators() {
    const out = {};
    out.SetCurrentUser = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ userID: 'string' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: setCurrentUserResolver,
    };
    out.NewCurrentUser = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: newCurrentUserResolver,
    };
    out.RemoveUser = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ userID: 'string', keepData: 'boolean' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: removeUserResolver,
    };
    return out;
}
exports.getMultiUserMutators = getMultiUserMutators;
//# sourceMappingURL=MultiUserMutations.js.map