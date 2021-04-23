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
function buildQueryResultFields(autoResolverData, queryName, query, indexResolvers, definition, traversal) {
    const fieldsConfig = {
        id: { type: DataSchemaGQL_1.schemaToGraphQLType('ID') },
        type: { type: DataSchemaGQL_1.schemaToGraphQLType('string') },
    };
    AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fieldsConfig, 'unindexed', 'EntityRef', '', [definition.name]);
    return new graphql_1.GraphQLObjectType({
        name: conduit_utils_1.toPascalCase([traversal === null || traversal === void 0 ? void 0 : traversal.srcType, queryName, 'ResultFields']),
        fields: query.sharedFields.reduce((fields, f) => {
            const resolver = indexResolvers[f];
            if (!resolver) {
                throw new Error(`Missing index resolver for query "${queryName}" field "${f}"`);
            }
            const entityRefTypes = resolver.entityRefTypes && (Array.isArray(resolver.entityRefTypes) ? resolver.entityRefTypes : resolver.entityRefTypes(definition));
            AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fields, f, resolver.schemaType, queryName, entityRefTypes);
            return fields;
        }, fieldsConfig),
    });
}
function buildQueryArgs(queryName, query, indexResolvers, traversal) {
    const args = {};
    for (const key in query.params) {
        if (traversal && traversal.paramName === key) {
            continue;
        }
        const paramConfig = query.params[key];
        if (conduit_storage_1.isQueryMatchParamConfig(paramConfig)) {
            const field = paramConfig.match.field;
            const isRequired = !paramConfig.optional && paramConfig.defaultValue === undefined;
            const schemaType = conduit_utils_1.fieldTypeOverrideNullability(indexResolvers[field].schemaType, !isRequired);
            args[key] = schemaType;
        }
        else if (conduit_storage_1.isQueryRangeParamConfig(paramConfig)) {
            const field = paramConfig.range.field;
            args[key] = conduit_utils_1.fieldTypeOverrideNullability(conduit_utils_1.Struct({
                min: indexResolvers[field].schemaType,
                max: indexResolvers[field].schemaType,
            }, conduit_utils_1.toPascalCase([traversal === null || traversal === void 0 ? void 0 : traversal.srcType, queryName, key])), Boolean(paramConfig.optional));
        }
        else {
            args[key] = conduit_utils_1.fieldTypeOverrideNullability(conduit_utils_1.Enum(Object.keys(paramConfig.sort), conduit_utils_1.toPascalCase([traversal === null || traversal === void 0 ? void 0 : traversal.srcType, queryName, key])), paramConfig.defaultValue !== undefined);
        }
    }
    args.reverseOrder = conduit_utils_1.NullableBoolean;
    args.pageInfo = conduit_utils_1.Nullable(ListResolvers_1.PageInfoSchema);
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
                prevPageKey: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableString) },
                nextPageKey: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableString) },
                numPriorItems: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableNumber) },
                numRemainingItems: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableNumber) },
                list: {
                    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(buildQueryResultFields(autoResolverData, queryName, query, indexResolvers, definition, null)))),
                },
            },
        })),
        args: DataSchemaGQL_1.schemaToGraphQLArgs(buildQueryArgs(queryName, query, indexResolvers, null)),
        resolve: graphQLQueryResolver(query, definition, null),
    };
}
exports.buildGraphQLQuery = buildGraphQLQuery;
function buildTraversalGraphQLQuery(autoResolverData, fields, fieldName, traversal, query, indexResolvers, definition) {
    if (traversal.dstConstraint && traversal.dstConstraint !== conduit_storage_1.EdgeConstraint.MANY) {
        AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fields, fieldName, conduit_utils_1.fieldTypeOverrideNullability('EntityRef', traversal.dstConstraint === conduit_storage_1.EdgeConstraint.OPTIONAL), '', [definition.name], graphQLQueryResolver(query, definition, traversal));
    }
    else {
        const resType = buildQueryResultFields(autoResolverData, fieldName, query, indexResolvers, definition, traversal);
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
            args: DataSchemaGQL_1.schemaToGraphQLArgs(buildQueryArgs(fieldName, query, indexResolvers, traversal)),
            resolve: graphQLQueryResolver(query, definition, traversal),
        };
    }
}
exports.buildTraversalGraphQLQuery = buildTraversalGraphQLQuery;
//# sourceMappingURL=QueryGraphQLBuilder.js.map