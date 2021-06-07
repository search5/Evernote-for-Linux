"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
const ErrorSchema_1 = require("./schemas/ErrorSchema");
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
    return ErrorSchema_1.makeErrorReturnObject(errObj);
}
async function errorGetListResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    const errorObjs = await context.errorManager.getList(context.trc, context.watcher, args.markedValue);
    const res = [];
    for (const errObj of errorObjs) {
        const e = ErrorSchema_1.makeErrorReturnObject(errObj);
        res.push(e);
    }
    return res;
}
function addQueries(out) {
    out.errorGet = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID' }),
        type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.Nullable(ErrorSchema_1.ErrorSchema)),
        resolve: errorGetResolver,
        deprecationReason: 'errorGet is deprecated in favor of MutationStatus',
    };
    out.errorGetList = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ markedValue: conduit_utils_1.NullableBoolean }),
        type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.ListOf(ErrorSchema_1.ErrorSchema)),
        resolve: errorGetListResolver,
    };
}
exports.addQueries = addQueries;
//# sourceMappingURL=ErrorResolver.js.map