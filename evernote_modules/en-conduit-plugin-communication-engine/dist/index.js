"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENCommEnginePlugin = void 0;
const conduit_core_1 = require("conduit-core");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
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
            if (CommEngineSchemaTypes_1.responseSchemaType) {
                mutators.SyncMessages = {
                    type: CommEngineSchemaTypes_1.responseSchemaType,
                    args: Object.assign({}, conduit_core_1.schemaToGraphQLArgs({
                        guid: 'string?',
                        knownMessages: 'string[]?',
                        locale: 'string?',
                        commEngineJsVersion: 'int?',
                        nativeClientVersion: 'int?',
                        uiLanguage: 'string?',
                    }), {
                        supportedPlacements: { type: new graphql_1.GraphQLList(CommEngineSchemaTypes_1.supportedPlacementEnumType) },
                        events: { type: new graphql_1.GraphQLList(CommEngineSchemaTypes_1.eventType) },
                        clientType: { type: CommEngineSchemaTypes_1.clientTypeEnumType },
                    }),
                    resolve: commEngineResolver,
                };
            }
            return mutators;
        },
    };
}
exports.getENCommEnginePlugin = getENCommEnginePlugin;
//# sourceMappingURL=index.js.map