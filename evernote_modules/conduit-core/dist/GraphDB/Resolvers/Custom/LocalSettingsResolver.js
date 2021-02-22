"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_view_types_1 = require("conduit-view-types");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
const LocalSettingsMutations_1 = require("../../Mutations/LocalSettingsMutations");
const ResolverHelpers_1 = require("../ResolverHelpers");
// Can DRY these two functions up more.
async function systemSettingsGetResolver(_, args, context) {
    if (!args || !args.key) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    return context.localSettings.getSystemValue(context.trc, context.watcher, args.key);
}
async function userSettingsGetResolver(_, args, context) {
    if (!args || !args.key) {
        throw new Error('Missing args');
    }
    ResolverHelpers_1.validateDB(context);
    const userID = await LocalSettingsMutations_1.getUserIDFromLocalSettingsArgs(context, args.userID);
    return context.localSettings.getUserValue(context.trc, context.watcher, userID, args.key);
}
function genArgs(setType) {
    const args = {
        key: 'string',
    };
    if (setType === conduit_view_types_1.LocalSettingsType.User) {
        args.userID = 'string?';
    }
    return DataSchemaGQL_1.schemaToGraphQLArgs(args);
}
function addQueries(out) {
    for (const setType in conduit_view_types_1.LocalSettingsType) {
        const args = genArgs(setType);
        for (const valType in conduit_view_types_1.LocalSettingsValueType) {
            out[`${setType.toLowerCase()}SettingsGet${valType}`] = {
                args,
                type: DataSchemaGQL_1.schemaToGraphQLType(`${valType.toLowerCase()}?`, `${setType}Get${valType}Schema`, true),
                resolve: setType === conduit_view_types_1.LocalSettingsType.System
                    ? systemSettingsGetResolver
                    : userSettingsGetResolver,
            };
        }
    }
}
exports.addQueries = addQueries;
//# sourceMappingURL=LocalSettingsResolver.js.map