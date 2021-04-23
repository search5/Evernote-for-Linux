"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalSettingsMutators = exports.getUserIDFromLocalSettingsArgs = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../Resolvers/ResolverHelpers");
async function getUserIDFromLocalSettingsArgs(context, userIDStr) {
    let userID;
    if (userIDStr) {
        userID = conduit_utils_1.userIDForKeyString(userIDStr);
    }
    else {
        const currentUserID = await context.multiUserProvider.getCurrentUserID(context.trc, context.watcher);
        if (currentUserID === null) {
            throw new Error('No current user for setting local settings');
        }
        userID = currentUserID;
    }
    return userID;
}
exports.getUserIDFromLocalSettingsArgs = getUserIDFromLocalSettingsArgs;
// Can DRY these two up more
async function systemSettingsSetResolver(_, args, context) {
    if (!args || !args.key) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.localSettings.setSystemValue(context.trc, args.key, args.value);
    return { success: true };
}
async function userSettingsSetResolver(_, args, context) {
    if (!args || !args.key) {
        throw new Error('Missing args');
    }
    ResolverHelpers_1.validateDB(context);
    const userID = await getUserIDFromLocalSettingsArgs(context, args.userID);
    await context.localSettings.setUserValue(context.trc, userID, args.key, args.value);
    return { success: true };
}
async function systemSettingsRemoveResolver(_, args, context) {
    if (!args || !args.key) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.localSettings.removeSystemValue(context.trc, args.key);
    return { success: true };
}
async function userSettingsRemoveResolver(_, args, context) {
    if (!args || !args.key) {
        throw new Error('Missing args');
    }
    ResolverHelpers_1.validateDB(context);
    const userID = await getUserIDFromLocalSettingsArgs(context, args.userID);
    await context.localSettings.removeUserValue(context.trc, userID, args.key);
    return { success: true };
}
async function systemSettingsClearResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.localSettings.clearSystemSettings(context.trc);
    return { success: true };
}
async function userSettingsClearResolver(_, args, context) {
    ResolverHelpers_1.validateDB(context);
    const userID = await getUserIDFromLocalSettingsArgs(context, args.userID);
    await context.localSettings.clearUserSettings(context.trc, userID);
    return { success: true };
}
function genArgs(setType, valType) {
    const args = {
        key: 'string',
        value: valType.toLowerCase(),
    };
    if (setType === conduit_view_types_1.LocalSettingsType.User) {
        args.userID = conduit_utils_1.NullableString;
    }
    return DataSchemaGQL_1.schemaToGraphQLArgs(args);
}
function getLocalSettingsMutators() {
    const out = {};
    for (const setType in conduit_view_types_1.LocalSettingsType) {
        for (const valType in conduit_view_types_1.LocalSettingsValueType) {
            out[`${setType.toLowerCase()}SettingsSet${valType}`] = {
                args: genArgs(setType, valType),
                type: ResolverHelpers_1.GenericMutationResult,
                resolve: setType === conduit_view_types_1.LocalSettingsType.System
                    ? systemSettingsSetResolver
                    : userSettingsSetResolver,
            };
        }
    }
    out.systemSettingsRemove = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ key: 'string' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: systemSettingsRemoveResolver,
    };
    out.userSettingsRemove = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ key: 'string', userID: conduit_utils_1.NullableString }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: userSettingsRemoveResolver,
    };
    out.systemSettingsClear = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: systemSettingsClearResolver,
    };
    out.userSettingsClear = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ userID: conduit_utils_1.NullableString }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: userSettingsClearResolver,
    };
    return out;
}
exports.getLocalSettingsMutators = getLocalSettingsMutators;
//# sourceMappingURL=LocalSettingsMutations.js.map