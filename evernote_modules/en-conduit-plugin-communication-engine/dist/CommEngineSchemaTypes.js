"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseSchemaType = exports.clientTypeEnumType = exports.supportedPlacementEnumType = exports.eventType = exports.enumToGraphQLEnumValues = void 0;
const conduit_core_1 = require("conduit-core");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const enumToGraphQLEnumValues = enumObject => {
    const obj = {};
    for (const [key, value] of Object.entries(enumObject)) {
        obj[key] = { value };
    }
    return obj;
};
exports.enumToGraphQLEnumValues = enumToGraphQLEnumValues;
exports.eventType = new graphql_1.GraphQLInputObjectType({
    name: 'CommEvent',
    fields: Object.assign({}, conduit_core_1.schemaToGraphQLArgs({
        timeOccurred: 'timestamp',
        messageKey: 'string',
        label: 'string?',
    }), {
        type: { type: new graphql_1.GraphQLEnumType({
                name: 'CommEngineEventType',
                values: exports.enumToGraphQLEnumValues(en_thrift_connector_1.TCommEngineEventType),
            }) },
    }),
});
exports.supportedPlacementEnumType = new graphql_1.GraphQLEnumType({
    name: 'SupportedPlacement',
    values: exports.enumToGraphQLEnumValues(en_thrift_connector_1.TCommEnginePlacement),
});
exports.clientTypeEnumType = new graphql_1.GraphQLEnumType({
    name: 'ClientType',
    values: exports.enumToGraphQLEnumValues(en_thrift_connector_1.TCommEngineClientType),
});
// MessageContent is deprecated, remove on next breaking change
exports.responseSchemaType = conduit_core_1.fromSchema('CommEngineResponseSchema', graphql_tag_1.default `
type MessageContent {
  templateUri: String
  contentVariablesJson: String
}

type InAppMessage {
  key: String
  priority: Int
  content: MessageContent
  messageContent: MessageContent
  placement: Int
  offline: Boolean
  expires: Float
}

type Config {
  cooldownPeriodMillis: Int
}

type CommEngineResponseSchema {
  messages: [InAppMessage]
  messageRequestGuid: String
  config: Config
}
`);
//# sourceMappingURL=CommEngineSchemaTypes.js.map