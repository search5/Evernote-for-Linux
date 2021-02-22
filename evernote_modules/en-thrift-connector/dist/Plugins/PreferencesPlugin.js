"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferencePlugin = void 0;
const conduit_core_1 = require("conduit-core");
const Auth = __importStar(require("../Auth"));
const ThriftTypes_1 = require("../ThriftTypes");
function getPreferencePlugin(thriftComm) {
    async function getPreferences(trc, auth) {
        const notestore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        return notestore.getPreferences(trc, auth.token, [ThriftTypes_1.EDAM_PREFERENCE_WORKCHATACTIVE]);
    }
    async function hasNoEmptyMessages(trc, auth) {
        const messageStore = thriftComm.getMessageStore(auth.urls.messageStoreUrl);
        const sinceTimestamp = Date.now() - ThriftTypes_1.EDAM_PREFERENCE_WORKCHATACTIVE_TIMESPAN;
        const dateFilter = { sinceTimestamp };
        return messageStore.hasNonEmptyMessages(trc, auth.token, dateFilter);
    }
    async function workChatPreferenceResolver(_1, _2, context) {
        conduit_core_1.validateDB(context);
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        if (authorizedToken) {
            const authData = Auth.decodeAuthData(authorizedToken);
            const isBizUser = Boolean(authData.vaultAuth);
            const results = await getPreferences(context.trc, authData);
            const prefValue = results && results.preferences && results.preferences[ThriftTypes_1.EDAM_PREFERENCE_WORKCHATACTIVE] &&
                results.preferences[ThriftTypes_1.EDAM_PREFERENCE_WORKCHATACTIVE][0];
            let isActive = false;
            // if prefence not set - check if user biz
            // if not biz - check  any non empty message being sent in EDAM_PREFERENCE_WORKCHATACTIVE_TIMESPAN span
            if (!prefValue) {
                if (isBizUser) {
                    isActive = true;
                }
                else {
                    isActive = await hasNoEmptyMessages(context.trc, authData);
                }
            }
            else {
                isActive = prefValue === 'true' ? true : false;
            }
            return { isActive };
        }
        return { isActive: false };
    }
    async function setWorkChatPreferenceResolver(_, args, context) {
        conduit_core_1.validateDB(context);
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        if (authorizedToken) {
            const authData = Auth.decodeAuthData(authorizedToken);
            const preferences = {
                [ThriftTypes_1.EDAM_PREFERENCE_WORKCHATACTIVE]: [args.isActive.toString()],
            };
            const notestore = thriftComm.getNoteStore(authData.urls.noteStoreUrl);
            await notestore.updatePreferences(context.trc, authData.token, preferences);
            return { success: true };
        }
    }
    return {
        name: 'workchatactive',
        defineQueries: () => ({
            preferenceGetWorkChatActive: {
                args: conduit_core_1.schemaToGraphQLArgs({}),
                type: conduit_core_1.schemaToGraphQLType({ isActive: 'boolean' }, 'preferenceGetWorkChatActiveResult', false),
                resolve: workChatPreferenceResolver,
            },
        }),
        defineMutators: () => ({
            preferencesSetWorkChatActive: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    isActive: 'boolean',
                }),
                type: conduit_core_1.GenericMutationResult,
                resolve: setWorkChatPreferenceResolver,
            },
        }),
    };
}
exports.getPreferencePlugin = getPreferencePlugin;
//# sourceMappingURL=PreferencesPlugin.js.map