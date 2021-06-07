"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAutoResolvers = exports.schemaFieldToGraphQL = exports.getEntityUnionType = exports.resolveNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const GraphQLFields_1 = require("../GraphQLFields");
const QueryGraphQLBuilder_1 = require("../QueryGraphQLBuilder");
const EdgeTraversal_1 = require("./EdgeTraversal");
const ListResolvers_1 = require("./ListResolvers");
const ResolverHelpers_1 = require("./ResolverHelpers");
const MAX_TYPE_NAMES_FOR_UNION = 4;
function flattenEdges(edges, fieldSelection, out) {
    if (!edges) {
        return;
    }
    for (const port in edges) {
        const portEdges = edges[port];
        if (!fieldSelection || port in fieldSelection || ResolverHelpers_1.getPortCountName(port) in fieldSelection) {
            // 1. There is a port field in the selection, the edge count will be auto compute
            // 2. There is no port field, but there is edge count in the selection.
            // Then we also add the port field in order to get the edge count auto compute
            out[port] = [];
            for (const child in portEdges) {
                out[port].push(portEdges[child]);
            }
        }
    }
}
function isJustNodeRef(fields) {
    if (!fields) {
        return false;
    }
    for (const f in fields) {
        if (GraphQLFields_1.shouldIgnoreFieldSelection(fields, f)) {
            continue;
        }
        if (f !== 'type' && f !== 'id') {
            return false;
        }
    }
    return true;
}
async function resolveNode(nodeRef, context, info) {
    ResolverHelpers_1.validateDB(context);
    const fieldSelection = info ? GraphQLFields_1.getFieldsForResolver(context.querySelectionFields, info.path, nodeRef.type) : undefined;
    if (isJustNodeRef(fieldSelection)) {
        // early out if the node isn't needed
        return {
            type: nodeRef.type,
            id: nodeRef.id,
        };
    }
    const unboundedQuery = GraphQLFields_1.getUnboundedQuery(context, info);
    if (unboundedQuery) {
        throw new conduit_utils_1.MissingParameterError(`Querying for unindexed data without using paging in ${unboundedQuery} node type ${nodeRef.type}`);
    }
    let node = await context.db.getNode(context, nodeRef);
    if (context.autoResolverData.NodeDataResolvers[nodeRef.type]) {
        node = await context.autoResolverData.NodeDataResolvers[nodeRef.type](context, node || nodeRef, fieldSelection, info);
    }
    if (!node) {
        throw new conduit_utils_1.NotFoundError(nodeRef.id, `Unable to find ${nodeRef.type} with id ${nodeRef.id}`);
    }
    return nodeResolver(node, context, fieldSelection);
}
exports.resolveNode = resolveNode;
async function nodeResolver(node, context, fieldSelection) {
    ResolverHelpers_1.validateDB(context);
    const cacheFields = {};
    const typedef = context.nodeTypes[node.type];
    if (typedef.cache) {
        for (const fieldName in (fieldSelection || typedef.cache)) {
            if (typedef.cache[fieldName]) {
                // fetch cached field if requested and not overridden with a mod
                cacheFields[fieldName] = await context.db.getNodeCachedField(context, node, fieldName);
            }
        }
    }
    const ret = Object.assign(Object.assign({ type: node.type, id: node.id, label: node.label, localChangeTimestamp: node.localChangeTimestamp }, node.NodeFields), cacheFields);
    const indexConfig = context.indexer.config[node.type];
    if (fieldSelection && indexConfig) {
        for (const key in indexConfig.indexResolvers) {
            const resolver = indexConfig.indexResolvers[key];
            const isInSelection = conduit_utils_1.walkObjectPath(fieldSelection, resolver.graphqlPath, null) !== null;
            // Checking against undefined saves us from recalculating things like stackID for notes which is expensive, hence the custom walkObjectPath
            const alreadyResolved = conduit_utils_1.walkObjectPath(ret, resolver.graphqlPath, undefined) !== undefined;
            if (isInSelection && !alreadyResolved) {
                const res = await context.indexer.resolveField(context.trc, node, key, context.db.nodeFieldLookup, node.PropagatedFields || {});
                if (res && res.length) {
                    conduit_utils_1.objectSetField(res[0], resolver.graphqlPath, ret);
                }
            }
        }
    }
    flattenEdges(node.outputs, fieldSelection, ret);
    flattenEdges(node.inputs, fieldSelection, ret);
    return ret;
}
function autoResolverForType(type) {
    return async (parent, args, context, info) => {
        ResolverHelpers_1.validateDB(context);
        return await resolveNode({ id: args.id, type }, context, info);
    };
}
async function meResolver(parent, args, context, info) {
    ResolverHelpers_1.validateDB(context);
    const user = await context.db.getUserNode(context);
    if (!user) {
        throw new conduit_utils_1.NoUserError('no current user');
    }
    try {
        return await resolveNode(user, context, info);
    }
    catch (err) {
        if (err instanceof conduit_utils_1.NotFoundError) {
            throw new conduit_utils_1.NoUserError('no current user');
        }
        throw err;
    }
}
/*
// This checks for some assumptions in the schema that could cause problems
// when converting to a graphQL query due to fields being flattened. Those
// assumptions are:
// type and id are not found on the general schema properties
// All inputs and output root names are unique from each other, and are also
// not found in the general schema properties.
*/
function checkForProblems(nodeTypes, type) {
    const node = nodeTypes[type];
    const reservedNames = ['type', 'id'];
    const flatEdgeNames = [];
    if (node.outputs) {
        flatEdgeNames.push(...Object.getOwnPropertyNames(node.outputs));
    }
    if (node.inputs) {
        flatEdgeNames.forEach(name => {
            if (node.inputs && node.inputs[name]) {
                throw new Error(`Field ${name} found in both inputs and outputs in schema ${type}`);
            }
        });
        flatEdgeNames.push(...Object.getOwnPropertyNames(node.inputs));
    }
    reservedNames.forEach(name => {
        if (node.schema && node.schema[name]) {
            throw new Error(`Using reserved name ${name} as a field in the schema ${type}`);
        }
        if (node.cache && node.cache[name]) {
            throw new Error(`Using reserved name ${name} as a field in the cache ${type}`);
        }
    });
    flatEdgeNames.forEach(name => {
        if (node.schema && node.schema[name]) {
            throw new Error(`Field ${name} in schema ${type} conflicts with flattened input/output of same name`);
        }
        if (node.cache && node.cache[name]) {
            throw new Error(`Field ${name} in cache ${type} conflicts with flattened input/output of same name`);
        }
    });
}
function getEntityUnionType(autoResolverData, entityTypesForRef) {
    if (!entityTypesForRef || !entityTypesForRef.length) {
        entityTypesForRef = Object.keys(autoResolverData.NodeGraphQLTypes);
    }
    if (entityTypesForRef.length === 1) {
        return autoResolverData.NodeGraphQLTypes[entityTypesForRef[0]];
    }
    entityTypesForRef = [...entityTypesForRef].sort();
    let name = entityTypesForRef.join('Or');
    if (entityTypesForRef.length > MAX_TYPE_NAMES_FOR_UNION) {
        name = `EntUnion${conduit_utils_1.md5(name)}`;
    }
    if (!autoResolverData.CachedNodeGraphQLUnionTypes.has(name)) {
        autoResolverData.CachedNodeGraphQLUnionTypes.set(name, new graphql_1.GraphQLUnionType({
            name,
            types: entityTypesForRef.map(type => autoResolverData.NodeGraphQLTypes[type]),
            resolveType: ref => {
                return autoResolverData.NodeGraphQLTypes[ref.type];
            },
        }));
    }
    return autoResolverData.CachedNodeGraphQLUnionTypes.get(name);
}
exports.getEntityUnionType = getEntityUnionType;
function schemaFieldToGraphQL(autoResolverData, fields, field, schemaType, parentName, entityTypesForRef, resolveIntercept) {
    switch (conduit_utils_1.fieldTypeToNonNull(schemaType)) {
        case 'EntityRef': {
            const connectedType = getEntityUnionType(autoResolverData, entityTypesForRef);
            fields[field] = {
                type: conduit_utils_1.fieldTypeIsNullable(schemaType) ? connectedType : new graphql_1.GraphQLNonNull(connectedType),
                resolve: async (parent, args, context, info) => {
                    const nodeRef = resolveIntercept ? await resolveIntercept(parent, args, context, info) : parent[field];
                    if (!nodeRef) {
                        return null;
                    }
                    return resolveNode(nodeRef, context, info);
                },
            };
            return;
        }
        case 'ID': {
            if (!entityTypesForRef || entityTypesForRef.length !== 1) {
                break;
            }
            const connectedType = autoResolverData.NodeGraphQLTypes[entityTypesForRef[0]];
            fields[field] = {
                type: conduit_utils_1.fieldTypeIsNullable(schemaType) ? connectedType : new graphql_1.GraphQLNonNull(connectedType),
                resolve: async (parent, args, context, info) => {
                    const id = parent[field];
                    if (id === null) {
                        return null;
                    }
                    return resolveNode({ id, type: entityTypesForRef[0] }, context, info);
                },
            };
            return;
        }
    }
    const gqlFieldType = schemaType ? DataSchemaGQL_1.schemaToGraphQLType(schemaType, { defaultName: conduit_utils_1.toPascalCase([parentName, field]) }) : undefined;
    if (gqlFieldType) {
        fields[field] = { type: gqlFieldType };
    }
}
exports.schemaFieldToGraphQL = schemaFieldToGraphQL;
function buildFields(autoResolverData, nodeTypes, type, indexer) {
    checkForProblems(nodeTypes, type);
    return () => {
        var _a, _b;
        const node = nodeTypes[type];
        const fields = {};
        fields.type = { type: DataSchemaGQL_1.schemaToGraphQLType('string') };
        fields.id = { type: DataSchemaGQL_1.schemaToGraphQLType('ID') };
        fields.label = { type: DataSchemaGQL_1.schemaToGraphQLType('string') };
        fields.localChangeTimestamp = { type: DataSchemaGQL_1.schemaToGraphQLType('timestamp') };
        const fieldNames = Object.keys(node.schema || {}).concat(Object.keys(node.cache || {}));
        for (const field of fieldNames) {
            if (field.startsWith('internal_')) {
                continue;
            }
            if (!field.includes('.')) {
                const schemaType = (node.schema && node.schema[field]) || (node.cache && node.cache[field] && node.cache[field].type);
                if (!schemaType) {
                    throw new Error(`Undefined schema found for NodeType ${type}.${field}`);
                }
                schemaFieldToGraphQL(autoResolverData, fields, field, schemaType, type, undefined);
            }
        }
        EdgeTraversal_1.buildEdgeResolvers(autoResolverData, fields, node, indexer);
        if (type in indexer.config) {
            const unSyncedResolvers = Object.values(indexer.config[type].indexResolvers).filter(e => e.isUnSyncedField);
            for (const resolver of unSyncedResolvers) {
                if (resolver.graphqlPath.length !== 1) {
                    throw new Error(`Unsynced index resolved fields are expected to be at the top level of the node but got path: ${resolver.graphqlPath}`);
                }
                if (!resolver.schemaType) {
                    throw new Error(`Unsynced index resolved fields must declare their schema type`);
                }
                schemaFieldToGraphQL(autoResolverData, fields, resolver.graphqlPath[0], resolver.schemaType, type, undefined);
            }
            for (const field in indexer.traversalConfig[type] || {}) {
                const traversal = indexer.traversalConfig[type][field];
                const dstType = traversal.dstType;
                const query = ((_b = (_a = indexer.config[dstType]) === null || _a === void 0 ? void 0 : _a.queries) !== null && _b !== void 0 ? _b : {})[traversal.dstQuery];
                QueryGraphQLBuilder_1.buildTraversalGraphQLQuery(autoResolverData, fields, field, traversal, query, indexer.config[dstType].indexResolvers, nodeTypes[dstType]);
            }
        }
        return fields;
    };
}
function buildAutoResolvers(trc, autoResolverData, nodeTypes, indexer, dataResolvers = {}) {
    var _a, _b;
    conduit_utils_1.traceEventStart(trc, 'buildAutoResolvers');
    const out = {};
    for (const type in nodeTypes) {
        autoResolverData.NodeDataResolvers[type] = dataResolvers[type];
        autoResolverData.NodeGraphQLTypes[type] = autoResolverData.NodeGraphQLTypes[type] || new graphql_1.GraphQLObjectType({
            name: type,
            fields: buildFields(autoResolverData, nodeTypes, type, indexer),
        });
        out[type] = {
            args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID' }),
            type: autoResolverData.NodeGraphQLTypes[type],
            resolve: autoResolverForType(type),
        };
    }
    for (const type in nodeTypes) {
        if (indexer.config[type]) {
            out[`${type}List`] = ListResolvers_1.indexerForType(autoResolverData, type, indexer, nodeTypes[type]);
        }
        const queries = (_b = (_a = indexer.config[type]) === null || _a === void 0 ? void 0 : _a.queries) !== null && _b !== void 0 ? _b : {};
        for (const queryName in queries) {
            const query = queries[queryName];
            if (query.internalOnly) {
                continue;
            }
            out[queryName] = QueryGraphQLBuilder_1.buildGraphQLQuery(autoResolverData, queryName, queries[queryName], indexer.config[type].indexResolvers, nodeTypes[type]);
        }
    }
    if (nodeTypes.User) {
        out.me = {
            type: autoResolverData.NodeGraphQLTypes.User,
            resolve: meResolver,
        };
    }
    conduit_utils_1.traceEventEnd(trc, 'buildAutoResolvers');
    return out;
}
exports.buildAutoResolvers = buildAutoResolvers;
//# sourceMappingURL=AutoResolvers.js.map