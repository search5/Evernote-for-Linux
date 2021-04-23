"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
const ErrorSchema = conduit_utils_1.Struct({
    errorKey: conduit_utils_1.NullableString,
    errorType: conduit_utils_1.NullableString,
    id: 'string',
    marked: 'boolean',
    message: 'string',
    mutationName: 'string',
    mutationID: 'string',
    mutationArgsJson: 'string',
}, 'Error');
function makeErrorReturnObject(errObj) {
    let errorKey = '';
    let errorType = '';
    if (errObj.error instanceof conduit_utils_1.ServiceError) {
        errorKey = errObj.error.errorKey;
        errorType = errObj.error.errorType;
    }
    return {
        id: errObj.id,
        marked: errObj.marked,
        message: errObj.error.message,
        errorKey,
        errorType,
        mutationID: errObj.mutation.mutationID,
        mutationName: errObj.mutation.name,
        mutationArgsJson: conduit_utils_1.safeStringify(errObj.mutation.params),
    };
}
async function errorGetResolver(_, args, context) {
    if (!args || !args.id) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    const errObj = await context.errorManager.getError(context.trc, context.watcher, args.id);
    if (!errObj) {
        return null;
    }
    return makeErrorReturnObject(errObj);
}
async function errorGetListResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    const errorObjs = await context.errorManager.getList(context.trc, context.watcher, args.markedValue);
    const res = [];
    for (const errObj of errorObjs) {
        const e = makeErrorReturnObject(errObj);
        res.push(e);
    }
    return res;
}
function addQueries(out) {
    out.errorGet = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID' }),
        type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.Nullable(ErrorSchema)),
        resolve: errorGetResolver,
    };
    out.errorGetList = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ markedValue: conduit_utils_1.NullableBoolean }),
        type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.ListOf(ErrorSchema)),
        resolve: errorGetListResolver,
    };
}
exports.addQueries = addQueries;
//# sourceMappingURL=ErrorResolver.js.map