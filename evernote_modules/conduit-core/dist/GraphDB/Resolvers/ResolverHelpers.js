"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortCountName = exports.retrieveAuthorizedToken = exports.validateDB = exports.GenericMutationResultWithData = exports.GenericMutationResult = exports.AutoResolverData = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
class AutoResolverData {
    constructor() {
        this.NodeGraphQLTypes = {};
        this.CachedNodeGraphQLUnionTypes = new Map();
        this.NodeDataResolvers = {};
    }
}
exports.AutoResolverData = AutoResolverData;
exports.GenericMutationResult = DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.Struct({ success: 'boolean' }, 'GenericMutationResult'));
exports.GenericMutationResultWithData = DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.Struct({ success: 'boolean', result: conduit_utils_1.NullableString, mutationID: conduit_utils_1.NullableString }, 'AutoMutatorRes'));
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
function getPortCountName(portName) {
    return `${portName}Count`;
}
exports.getPortCountName = getPortCountName;
//# sourceMappingURL=ResolverHelpers.js.map