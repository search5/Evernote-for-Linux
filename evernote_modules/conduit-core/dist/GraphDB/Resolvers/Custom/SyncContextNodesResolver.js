"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
const AutoResolvers_1 = require("../AutoResolvers");
const ResolverHelpers_1 = require("../ResolverHelpers");
async function debugSyncContextResolver(parent, args, context) {
    if (!args || !args.syncContext) {
        throw new Error('Missing syncContext');
    }
    ResolverHelpers_1.validateDB(context);
    return Object.assign({ id: args.syncContext }, (await context.db.getSyncContextMetadata(context, args.syncContext)));
}
function convertEdges(nodeID, val) {
    if (!Array.isArray(val) || !val.length) {
        return val;
    }
    if (!val[0].hasOwnProperty('srcID')) {
        return val;
    }
    const edges = val;
    const res = {};
    for (const edge of edges) {
        if (edge.srcID === nodeID) {
            res[edge.dstID] = {
                id: edge.dstID,
                type: edge.dstType,
            };
        }
        else {
            res[edge.srcID] = {
                id: edge.srcID,
                type: edge.srcType,
            };
        }
    }
    return res;
}
async function debugNodeResolver(parent, args, context) {
    if (!args || !args.id || !args.type) {
        throw new Error('Missing args');
    }
    ResolverHelpers_1.validateDB(context);
    const node = await AutoResolvers_1.resolveNode({ id: args.id, type: args.type }, context);
    if (node) {
        for (const key in node) {
            const field = node[key];
            node[key] = convertEdges(args.id, field);
        }
    }
    return {
        jsonStr: conduit_utils_1.safeStringify(node),
    };
}
function addQueries(out) {
    out.debugSyncContext = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ syncContext: 'string' }),
        type: DataSchemaGQL_1.schemaToGraphQLType({ id: 'string', userID: 'int?' }, 'DebugSyncContextSchema', true),
        resolve: debugSyncContextResolver,
    };
    out.debugNode = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID', type: 'string' }),
        type: DataSchemaGQL_1.schemaToGraphQLType({ jsonStr: 'string?' }, 'DebugNodeSchema', true),
        resolve: debugNodeResolver,
    };
}
exports.addQueries = addQueries;
//# sourceMappingURL=SyncContextNodesResolver.js.map