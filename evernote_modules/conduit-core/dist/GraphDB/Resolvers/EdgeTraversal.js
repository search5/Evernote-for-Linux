"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEdgeResolvers = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const AutoResolvers_1 = require("./AutoResolvers");
function edgeResolver(portConfig, indexer, portName, typeKey, idKey, isList) {
    return async (parent, args, context, info) => {
        const list = [];
        if (!parent[portName] || !parent[portName].length) {
            return isList ? list : null;
        }
        for (const edge of parent[portName]) {
            const res = await conduit_utils_1.withError(AutoResolvers_1.resolveNode({ id: edge[idKey], type: edge[typeKey] }, context, info));
            if (res.err instanceof conduit_utils_1.NotFoundError) {
                conduit_utils_1.logger.debug('edge resolver found edge to dummy node', res.err);
                continue;
            }
            else if (res.err) {
                throw res.err;
            }
            if (!isList) {
                return res.data;
            }
            list.push(res.data);
        }
        if (!isList) {
            return null;
        }
        return list;
    };
}
function edgeCountResolver(portName) {
    return async (parent, args, context, info) => {
        return parent[portName] ? parent[portName].length : 0;
    };
}
function buildEdgeGraphQLType(autoResolverData, fields, type, portName, portConfig, direction, indexer) {
    // extract node types from connections and dedupe
    const connectedType = AutoResolvers_1.getEntityUnionType(autoResolverData, Array.from(new Set(portConfig.connections.map(val => val[0]))));
    const isList = portConfig.constraint === conduit_storage_1.EdgeConstraint.MANY;
    fields[portName] = {
        type: isList ? new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(connectedType))) : connectedType,
        resolve: edgeResolver(portConfig, indexer, portName, `${direction}Type`, `${direction}ID`, isList),
    };
    if (isList) {
        fields[`${portName}Count`] = {
            type: DataSchemaGQL_1.schemaToGraphQLType('int'),
            resolve: edgeCountResolver(portName),
        };
    }
}
function buildEdgeResolvers(autoResolverData, fields, node, indexer) {
    const outputs = node.outputs;
    const inputs = node.inputs;
    for (const port in outputs) {
        if (port.startsWith('internal_')) {
            continue;
        }
        buildEdgeGraphQLType(autoResolverData, fields, node.name, port, outputs[port], 'dst', indexer);
    }
    for (const port in inputs) {
        if (port.startsWith('internal_')) {
            continue;
        }
        buildEdgeGraphQLType(autoResolverData, fields, node.name, port, inputs[port], 'src', indexer);
    }
}
exports.buildEdgeResolvers = buildEdgeResolvers;
//# sourceMappingURL=EdgeTraversal.js.map