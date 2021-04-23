"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENCommEnginePlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const CommEngineSchemaTypes_1 = require("./CommEngineSchemaTypes");
const EnThriftCommEngine_1 = require("./EnThriftCommEngine");
function getENCommEnginePlugin() {
    async function commEngineResolver(parent, args, context) {
        if (!args || args === {}) {
            throw new Error('Missing args for commEngineResolver');
        }
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        const authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        const results = await EnThriftCommEngine_1.syncMessages(context.trc, context.thriftComm, authData, args);
        // Message content is deprecated, remove on next breaking change
        if (results && results.messages) {
            results.messages = results.messages.map(m => (Object.assign(Object.assign({}, m), { messageContent: m.content })));
        }
        return results;
    }
    return {
        name: 'ENCommEngine',
        defineMutators: () => {
            const mutators = {};
            mutators.SyncMessages = {
                args: conduit_core_1.schemaToGraphQLArgs({
                    guid: conduit_utils_1.NullableString,
                    knownMessages: conduit_utils_1.NullableListOf('string'),
                    locale: conduit_utils_1.NullableString,
                    commEngineJsVersion: conduit_utils_1.NullableInt,
                    nativeClientVersion: conduit_utils_1.NullableInt,
                    uiLanguage: conduit_utils_1.NullableString,
                    supportedPlacements: conduit_utils_1.NullableListOf(CommEngineSchemaTypes_1.SupportedPlacementSchema),
                    events: conduit_utils_1.NullableListOf(CommEngineSchemaTypes_1.CommEventSchema),
                    clientType: conduit_utils_1.Nullable(CommEngineSchemaTypes_1.ClientTypeSchema),
                }),
                type: conduit_core_1.schemaToGraphQLType(CommEngineSchemaTypes_1.ResponseSchema),
                resolve: commEngineResolver,
            };
            return mutators;
        },
    };
}
exports.getENCommEnginePlugin = getENCommEnginePlugin;
//# sourceMappingURL=index.js.map