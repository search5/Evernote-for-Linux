"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../ResolverHelpers");
const ErrorSchema_1 = require("./schemas/ErrorSchema");
async function mutationStatusResolver(_, args, context) {
    ResolverHelpers_1.validateDB(context);
    const mutationStatus = await context.db.getMutationStatus(context.trc, context.watcher, args.mutationID);
    return Object.assign(Object.assign({}, mutationStatus), { error: mutationStatus.error ? ErrorSchema_1.makeErrorReturnObject(mutationStatus.error) : null });
}
function addQueries(out) {
    out.MutationStatus = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ mutationID: 'string' }),
        type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.Struct({
            isUpsynced: 'boolean',
            isRoundtripped: 'boolean',
            error: conduit_utils_1.Nullable(ErrorSchema_1.ErrorSchema),
        }, 'mutationStatusResult')),
        resolve: mutationStatusResolver,
    };
}
exports.addQueries = addQueries;
//# sourceMappingURL=MutationStatusResolver.js.map