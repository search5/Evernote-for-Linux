"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTraversalGraphQLQuery = exports.buildGraphQLQuery = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const DataSchemaGQL_1 = require("../Types/DataSchemaGQL");
const GraphQLFields_1 = require("./GraphQLFields");
const AutoResolvers_1 = require("./Resolvers/AutoResolvers");
const ListResolvers_1 = require("./Resolvers/ListResolvers");
function buildQueryResultFields(autoResolverData, queryName, query, indexResolvers, nodeType, traversal) {
    const fieldsConfig = {
        id: { type: DataSchemaGQL_1.schemaToGraphQLType('ID') },
        type: { type: DataSchemaGQL_1.schemaToGraphQLType('string') },
    };
    AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fieldsConfig, 'unindexed', 'EntityRef', '', [nodeType]);
    return new graphql_1.GraphQLObjectType({
        name: conduit_utils_1.toPascalCase([traversal === null || traversal === void 0 ? void 0 : traversal.srcType, queryName, 'ResultFields']),
        fields: query.sharedFields.reduce((fields, f) => {
            const resolver = indexResolvers[f];
            if (!resolver) {
                throw new Error(`Missing index resolver for query "${queryName}" field "${f}"`);
            }
            AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fields, f, resolver.schemaType, queryName, resolver.entityRefTypes);
            return fields;
        }, fieldsConfig),
    });
}
function buildQueryArgs(queryName, query, indexResolvers, traversal) {
    var _a;
    const args = {};
    for (const key in query.params) {
        if (traversal && traversal.paramName === key) {
            continue;
        }
        const paramConfig = query.params[key];
        if (conduit_storage_1.isQueryMatchParamConfig(paramConfig)) {
            const field = paramConfig.match.field;
            const isRequired = !paramConfig.optional && paramConfig.defaultValue !== undefined;
            const schemaType = conduit_utils_1.fieldForceRequired(indexResolvers[field].schemaType, isRequired);
            args[key] = { type: DataSchemaGQL_1.schemaToGraphQLType(schemaType, key, true) };
        }
        else if (conduit_storage_1.isQueryRangeParamConfig(paramConfig)) {
            const field = paramConfig.range.field;
            args[key] = { type: new graphql_1.GraphQLInputObjectType({
                    name: conduit_utils_1.toPascalCase([traversal === null || traversal === void 0 ? void 0 : traversal.srcType, queryName, key]),
                    fields: {
                        min: { type: DataSchemaGQL_1.schemaToGraphQLType(indexResolvers[field].schemaType, key, false) },
                        max: { type: DataSchemaGQL_1.schemaToGraphQLType(indexResolvers[field].schemaType, key, false) },
                    },
                }) };
            if (!paramConfig.optional && ((_a = args[key].type) === null || _a === void 0 ? void 0 : _a.toString().slice(-1)) !== '!') {
                args[key].type = new graphql_1.GraphQLNonNull(args[key].type);
            }
        }
        else {
            args[key] = { type: new graphql_1.GraphQLEnumType({
                    name: conduit_utils_1.toPascalCase([traversal === null || traversal === void 0 ? void 0 : traversal.srcType, queryName, key]),
                    values: Object.keys(paramConfig.sort).reduce((obj, value) => {
                        obj[value] = { value };
                        return obj;
                    }, {}),
                }) };
            if (!paramConfig.defaultValue) {
                args[key].type = new graphql_1.GraphQLNonNull(args[key].type);
            }
        }
    }
    args.reverseOrder = { type: graphql_1.GraphQLBoolean };
    args.pageInfo = { type: ListResolvers_1.PageInfoSchema };
    return args;
}
function graphQLQueryResolver(query, nodeDef, traversal) {
    return async (parent, args, context, info) => {
        var _a;
        if (!context.db) {
            throw new Error('Unable to subscribe without a GraphDB');
        }
        let constraint = conduit_storage_1.EdgeConstraint.MANY;
        if (traversal) {
            constraint = traversal.dstConstraint || conduit_storage_1.EdgeConstraint.MANY;
            args = Object.assign({}, args);
            if (traversal.schemaType === 'ID') {
                args[traversal.paramName] = parent.id;
            }
            else {
                args[traversal.paramName] = {
                    id: parent.id,
                    type: traversal.srcType,
                };
            }
        }
        const params = conduit_storage_1.getIndexParamsForQueryArgs(query, args, context.indexer);
        const tree = await context.db.readonlyIndexingTreeForTypeAndIndex(context.trc, query.type, params.indexUsed);
        if (constraint === conduit_storage_1.EdgeConstraint.MANY) {
            const graphqlSelection = info ? GraphQLFields_1.getFieldsForResolver(context.querySelectionFields, info.path, query.type) : {};
            if (!graphqlSelection.list) {
                const count = await context.indexer.getCount(context.trc, context.watcher, tree, query.type, params.indexUsed, params.indexedFilters);
                return {
                    count,
                };
            }
            if (!params.pageInfo) {
                GraphQLFields_1.setUnboundedQuery(context, info, query.name);
            }
        }
        const results = await context.indexer.getList(context.trc, context.watcher, tree, query.type, nodeDef, params, false);
        if (constraint === conduit_storage_1.EdgeConstraint.MANY) {
            return Object.assign({ list: results.list, count: results.list.length }, results.clientPageInfo);
        }
        return (_a = results.list[0]) !== null && _a !== void 0 ? _a : null;
    };
}
function buildGraphQLQuery(autoResolverData, queryName, query, indexResolvers, definition) {
    return {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
            name: conduit_utils_1.toPascalCase([queryName, 'Results']),
            fields: {
                count: { type: DataSchemaGQL_1.schemaToGraphQLType('int') },
                prevPageKey: { type: DataSchemaGQL_1.schemaToGraphQLType('string?') },
                nextPageKey: { type: DataSchemaGQL_1.schemaToGraphQLType('string?') },
                numPriorItems: { type: DataSchemaGQL_1.schemaToGraphQLType('number?') },
                numRemainingItems: { type: DataSchemaGQL_1.schemaToGraphQLType('number?') },
                list: {
                    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(buildQueryResultFields(autoResolverData, queryName, query, indexResolvers, definition.name, null)))),
                },
            },
        })),
        args: buildQueryArgs(queryName, query, indexResolvers, null),
        resolve: graphQLQueryResolver(query, definition, null),
    };
}
exports.buildGraphQLQuery = buildGraphQLQuery;
function buildTraversalGraphQLQuery(autoResolverData, fields, fieldName, traversal, query, indexResolvers, definition) {
    if (traversal.dstConstraint && traversal.dstConstraint !== conduit_storage_1.EdgeConstraint.MANY) {
        AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fields, fieldName, traversal.dstConstraint === conduit_storage_1.EdgeConstraint.OPTIONAL ? 'EntityRef?' : 'EntityRef', '', [definition.name], graphQLQueryResolver(query, definition, traversal));
    }
    else {
        const resType = buildQueryResultFields(autoResolverData, fieldName, query, indexResolvers, definition.name, traversal);
        fields[fieldName] = {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
                name: conduit_utils_1.toPascalCase([traversal.srcType, fieldName, 'Results']),
                fields: {
                    count: { type: DataSchemaGQL_1.schemaToGraphQLType('int') },
                    list: {
                        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(resType))),
                    },
                },
            })),
            args: buildQueryArgs(fieldName, query, indexResolvers, traversal),
            resolve: graphQLQueryResolver(query, definition, traversal),
        };
    }
}
exports.buildTraversalGraphQLQuery = buildTraversalGraphQLQuery;
//# sourceMappingURL=QueryGraphQLBuilder.js.map