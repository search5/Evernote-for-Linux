"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../ResolverHelpers");
async function auxResolver(parent, args, context) {
    if (!args || !args.id) {
        throw new Error('Missing id for AuxData');
    }
    ResolverHelpers_1.validateDB(context);
    let val;
    switch (args.id) {
        case 'Auth':
            val = await context.db.getAuthTokenAndState(context.trc, context.watcher);
            break;
        case 'SyncState':
            val = await context.db.getSyncState(context.trc, context.watcher);
            break;
        case 'SyncContexts':
            val = await context.db.getAllSyncContextMetadata(context.trc, context.watcher);
            break;
    }
    return {
        id: args.id,
        jsonStr: conduit_utils_1.safeStringify(val),
    };
}
function addQueries(out) {
    out.AuxData = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'string' }),
        type: DataSchemaGQL_1.schemaToGraphQLType({ id: 'string', jsonStr: 'string?' }, 'AuxSchema', true),
        resolve: auxResolver,
    };
}
exports.addQueries = addQueries;
//# sourceMappingURL=AuxResolver.js.map