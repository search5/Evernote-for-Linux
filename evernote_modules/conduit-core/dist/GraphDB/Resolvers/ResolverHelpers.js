"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSchema = exports.retrieveAuthorizedToken = exports.validateDB = exports.GenericMutationResultWithData = exports.GenericMutationResult = exports.AutoResolverData = void 0;
const conduit_view_types_1 = require("conduit-view-types");
const graphql_1 = require("graphql");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
class AutoResolverData {
    constructor() {
        this.NodeGraphQLTypes = {};
        this.CachedNodeGraphQLUnionTypes = new Map();
        this.NodeDataResolvers = {};
    }
}
exports.AutoResolverData = AutoResolverData;
exports.GenericMutationResult = DataSchemaGQL_1.schemaToGraphQLType({ success: 'boolean' }, 'GenericMutationResult', false);
exports.GenericMutationResultWithData = DataSchemaGQL_1.schemaToGraphQLType({ success: 'boolean', result: 'string?' }, 'AutoMutatorRes', true);
function validateDB(context, msg) {
    if (!context || !context.db) {
        throw new Error(msg !== null && msg !== void 0 ? msg : 'Unable to run resolver without valid GraphDB');
    }
}
exports.validateDB = validateDB;
async function retrieveAuthorizedToken(context) {
    validateDB(context);
    const auth = await context.db.getAuthTokenAndState(context.trc, context.watcher);
    if (!(auth === null || auth === void 0 ? void 0 : auth.token) || auth.state !== conduit_view_types_1.AuthState.Authorized) {
        throw new Error('Unauthorized user');
    }
    return auth.token;
}
exports.retrieveAuthorizedToken = retrieveAuthorizedToken;
function fromSchema(name, schemaStr) {
    const Schema = graphql_1.buildASTSchema(schemaStr);
    const schemaType = Schema.getType(name);
    return graphql_1.isOutputType(schemaType) ? schemaType : undefined;
}
exports.fromSchema = fromSchema;
//# sourceMappingURL=ResolverHelpers.js.map