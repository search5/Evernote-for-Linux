"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexerForType = exports.getListResolverParams = exports.resolveUnindexedPaths = exports.graphqlPathForIndexComponents = exports.resolveNodesFromList = exports.indexedSortsCongruencyCheck = exports.IndexOrderTypeSchema = exports.IndexRangeSchema = exports.IndexMatchSchema = exports.PageInfoSchema = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const SimplyImmutable = __importStar(require("simply-immutable"));
const index_1 = require("../../index");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const GraphQLFields_1 = require("../GraphQLFields");
const AutoResolvers_1 = require("./AutoResolvers");
exports.PageInfoSchema = conduit_utils_1.Struct({
    startKey: conduit_utils_1.NullableString,
    startIndex: conduit_utils_1.NullableInt,
    pageSize: 'int',
}, 'PageInfo');
exports.IndexMatchSchema = conduit_utils_1.NullableStruct({
    string: conduit_utils_1.NullableString,
    int: conduit_utils_1.NullableNumber,
    boolean: conduit_utils_1.NullableBoolean,
    node: conduit_utils_1.NullableEntityRef,
}, 'IndexMatch');
exports.IndexRangeSchema = conduit_utils_1.NullableStruct({
    string: conduit_utils_1.NullableString,
    int: conduit_utils_1.NullableNumber,
}, 'IndexRange');
exports.IndexOrderTypeSchema = conduit_utils_1.Enum(['ASC', 'DESC'], 'IndexOrderType');
function walkSchema(schema, basePath = '', enumValues = []) {
    for (const key in schema) {
        if (key.startsWith('internal_')) {
            continue;
        }
        const subschema = conduit_utils_1.fieldTypeToNonNull(schema[key]);
        if (conduit_utils_1.fieldTypeIsStruct(subschema)) {
            walkSchema(subschema.fields, `${basePath}${key}_`, enumValues);
        }
        else {
            enumValues.push(`${basePath}${key}`);
        }
    }
    return enumValues;
}
function buildIndexArgs(type, definition, indexer) {
    const args = Object.keys(indexer.config[type].indexResolvers).concat([...walkSchema(definition.schema), 'label']);
    const filterType = conduit_utils_1.Enum(args, `${type}FilterField`);
    const sortType = conduit_utils_1.Enum(args, `${type}SortField`);
    const filters = conduit_utils_1.NullableListOf(conduit_utils_1.Struct({
        field: filterType,
        isSet: conduit_utils_1.NullableBoolean,
        min: exports.IndexRangeSchema,
        max: exports.IndexRangeSchema,
        match: exports.IndexMatchSchema,
        prefix: conduit_utils_1.NullableString,
    }, `${type}Filter`));
    const sorts = conduit_utils_1.NullableListOf(conduit_utils_1.Struct({
        field: sortType,
        order: exports.IndexOrderTypeSchema,
    }, `${type}Sort`));
    return {
        pageInfo: conduit_utils_1.Nullable(exports.PageInfoSchema),
        filters,
        sorts,
    };
}
function indexedSortsCongruencyCheck(type, sorts, filters, indexer, indexUsed) {
    function logIncongruentStoredOrders() {
        conduit_utils_1.logger.perf(`You are querying with sorts that are incongruent between their requested orders and stored orders`, {
            type,
            sorts,
            indexUsed: indexUsed.map(e => e.field),
        });
    }
    function logIncongruentSortOrders() {
        conduit_utils_1.logger.perf(`You are querying with sorts that are in an incongruent order to the order of the index used`, {
            type,
            sorts,
            indexUsed: indexUsed.map(e => e.field),
        });
    }
    if (!indexer.config.hasOwnProperty(type)) {
        throw new Error(`Type: ${type} does not have configured indexes`);
    }
    let isSortedSameAsStoredOrder;
    let maxIndex = -1;
    const filterLength = filters.length;
    for (const sort of sorts) {
        const sortField = sort.field.split('_').pop();
        if (!sortField) {
            conduit_utils_1.logger.error(`Failed to parse sort field in list resolver: ${sort.field}`);
            continue;
        }
        const indexField = indexUsed.find(comp => comp.field === sortField);
        if (!indexField) {
            conduit_utils_1.logger.error(`Failed to find indexed field in list resolver: ${sortField}`);
            continue;
        }
        if (indexField.order !== sort.order) {
            if (isSortedSameAsStoredOrder) {
                logIncongruentStoredOrders();
                return false;
            }
            isSortedSameAsStoredOrder = false;
        }
        else {
            if (isSortedSameAsStoredOrder === false) {
                logIncongruentStoredOrders();
                return false;
            }
            isSortedSameAsStoredOrder = true;
        }
        const componentIndex = indexUsed.indexOf(indexField);
        if (sorts[0] && sorts[0].field === sortField && componentIndex > filterLength) {
            logIncongruentSortOrders();
            return false;
        }
        if (sorts[0] && sorts[0].field !== sortField && componentIndex !== maxIndex + 1) {
            logIncongruentSortOrders();
            return false;
        }
        if (componentIndex < 0) {
            throw new Error(`This function should only handle indexed sorts`);
        }
        if (componentIndex < maxIndex) {
            logIncongruentSortOrders();
            return false;
        }
        else {
            maxIndex = componentIndex;
        }
    }
    return true;
}
exports.indexedSortsCongruencyCheck = indexedSortsCongruencyCheck;
async function resolveNodesFromList(list, context, filters, sorts, info) {
    const subinfo = info ? Object.assign(Object.assign({}, info), { path: { key: 'list', prev: info.path } }) : undefined;
    const originalFields = context.querySelectionFields;
    if (info) {
        for (const filter of filters) {
            context = SimplyImmutable.updateImmutable(context, ['querySelectionFields', info.fieldName, 'list', ...filter.field.split('_')], {});
        }
        for (const sort of sorts) {
            context = SimplyImmutable.updateImmutable(context, ['querySelectionFields', info.fieldName, 'list', ...sort.field.split('_')], {});
        }
        if (originalFields !== context.querySelectionFields) {
            context = SimplyImmutable.updateImmutable(context, ['querySelectionFields'], { __cloned: true });
        }
    }
    index_1.validateDB(context);
    const nodes = await conduit_utils_1.allSettled(list.map(item => AutoResolvers_1.resolveNode({ id: item.id, type: item.type }, context, subinfo)));
    const merged = nodes.map((node, i) => {
        return Object.assign(Object.assign({}, node), list[i]);
    });
    return merged.filter(node => !!node && context.indexer.filter(node, filters));
}
exports.resolveNodesFromList = resolveNodesFromList;
function resolveUnindexedPathsInternal(allowed, selection, doValidation, illegalFieldMessageLookup) {
    const includedInSelection = [];
    const unIncludedInSelection = [];
    const paths = GraphQLFields_1.convertSelectionToPaths(selection);
    for (const path of paths) {
        if (!path.length) {
            continue;
        }
        const field = path[path.length - 1];
        if (illegalFieldMessageLookup && illegalFieldMessageLookup.hasOwnProperty(field)) {
            throw new Error(`Illegal field used: ${illegalFieldMessageLookup[field]}`);
        }
        if (doValidation) {
            if (field.startsWith('__')) {
                throw new Error(`Should never include internal graphql fields in indexed/unindexed paths calculations`);
            }
        }
        let isAllowed = false;
        for (const allowedPath of allowed) {
            if (conduit_utils_1.isEqual(path, allowedPath.graphqlPath)) {
                includedInSelection.push(path);
                isAllowed = true;
            }
        }
        if (!isAllowed) {
            unIncludedInSelection.push(path);
        }
    }
    return {
        includedInSelection,
        unIncludedInSelection,
    };
}
function graphqlPathForIndexComponents(config, index) {
    const ret = [];
    for (const component of index) {
        const field = typeof component === 'string' ? component : component.field;
        if (!config.indexResolvers.hasOwnProperty(field)) {
            throw new Error(`Tried to get graphql path for non-existent index component: ${field}`);
        }
        const resolverDef = config.indexResolvers[field];
        ret.push({ resolverField: field, graphqlPath: resolverDef.graphqlPath });
        const coreType = conduit_utils_1.fieldTypeToCore(resolverDef.schemaType);
        if (coreType === 'EntityRef') {
            ret.push({ resolverField: field, graphqlPath: resolverDef.graphqlPath.concat('id') });
            ret.push({ resolverField: field, graphqlPath: resolverDef.graphqlPath.concat('type') });
        }
    }
    return ret;
}
exports.graphqlPathForIndexComponents = graphqlPathForIndexComponents;
function resolveUnindexedPaths(indexPaths, graphqlSelection, doValidation, explicitlyAllowed = [], illegalFieldMessageLookup) {
    const selection = graphqlSelection.list || graphqlSelection;
    const normalizedPaths = [
        { resolverField: 'id', graphqlPath: ['id'] },
        { resolverField: 'type', graphqlPath: ['type'] },
    ];
    const allowed = indexPaths.concat(normalizedPaths).concat(explicitlyAllowed);
    const { unIncludedInSelection } = resolveUnindexedPathsInternal(allowed, selection, doValidation, illegalFieldMessageLookup);
    return {
        unIndexedPaths: unIncludedInSelection,
    };
}
exports.resolveUnindexedPaths = resolveUnindexedPaths;
function partitionFilterSorts(type, args, context, info, requestedIndexPathsFunc) {
    const indexedFilters = (args.filters || []).slice(0);
    const indexedSorts = (args.sorts || []).slice(0);
    const indexes = Object.keys(context.indexer.config[type].indexResolvers);
    const indexPaths = graphqlPathForIndexComponents(context.indexer.config[type], indexes);
    const graphqlSelection = info ? GraphQLFields_1.getFieldsForResolver(context.querySelectionFields, info.path, type) : {};
    const unIndexedFilters = [];
    const unIndexedSorts = [];
    if (args.filters) {
        for (const filter of args.filters) {
            const index = indexes.find(e => {
                const path = context.indexer.config[type].indexResolvers[e].graphqlPath;
                if (e === filter.field) {
                    return true;
                }
                else if (path && conduit_utils_1.isEqual(filter.field.split('_'), path)) {
                    return true;
                }
                return false;
            });
            if (!index) {
                const filterIndex = indexedFilters.indexOf(filter);
                unIndexedFilters.push(indexedFilters.splice(filterIndex, 1)[0]);
            }
        }
    }
    if (args.sorts) {
        for (const sort of args.sorts) {
            const index = indexes.find(e => {
                const path = context.indexer.config[type].indexResolvers[e].graphqlPath;
                if (e === sort.field) {
                    return true;
                }
                else if (path && conduit_utils_1.isEqual(sort.field.split('_'), path)) {
                    return true;
                }
                return false;
            });
            if (!index) {
                const sortIndex = indexedSorts.indexOf(sort);
                unIndexedSorts.push(indexedSorts.splice(sortIndex, 1)[0]);
            }
        }
    }
    const { includedInSelection } = resolveUnindexedPathsInternal(indexPaths, graphqlSelection.list || graphqlSelection, context.indexer.doValidation);
    const requestedIndexPaths = requestedIndexPathsFunc ? requestedIndexPathsFunc(includedInSelection) : includedInSelection;
    const selectedIndexFields = [];
    for (const requestedIndexPath of requestedIndexPaths) {
        const indexPath = indexPaths.find(e => conduit_utils_1.isEqual(e.graphqlPath, requestedIndexPath));
        if (!indexPath) {
            throw new Error(`resolveUnindexedPathsInternal returned an incorrectly included index, shouldn't happen`);
        }
        selectedIndexFields.push(indexPath.resolverField);
    }
    return {
        indexedFilters,
        indexedSorts,
        unIndexedFilters,
        unIndexedSorts,
        graphqlSelection,
        selectedIndexFields,
    };
}
function finalizeFilterSorts(type, context, indexUsed, indexedFilters, unIndexedFilters, indexedSorts, unIndexedSorts) {
    for (let i = 0; i < indexedFilters.length; i++) {
        const filterField = indexedFilters[i].field;
        const index = indexUsed.index.find(e => {
            const path = context.indexer.config[type].indexResolvers[e.field].graphqlPath;
            if (e.field === filterField) {
                return true;
            }
            else if (path && conduit_utils_1.isEqual(filterField.split('_'), path)) {
                return true;
            }
            else if (conduit_storage_1.indexHasConditionFilterParam(indexUsed, indexedFilters[i])) {
                return true;
            }
            return false;
        });
        if (!index) {
            const filter = indexedFilters.splice(i, 1)[0];
            unIndexedFilters.push(filter);
            i--;
        }
    }
    for (let i = 0; i < indexedSorts.length; i++) {
        const index = indexUsed.index.find(e => {
            const path = context.indexer.config[type].indexResolvers[e.field].graphqlPath;
            if (e.field === indexedSorts[i].field) {
                return true;
            }
            else if (path && conduit_utils_1.isEqual(indexedSorts[i].field.split('_'), path)) {
                return true;
            }
            return false;
        });
        if (!index) {
            const sort = indexedSorts.splice(i, 1)[0];
            unIndexedSorts.push(sort);
            i--;
        }
    }
}
function getListResolverParams(type, args, context, info, requestedIndexPathsFunc) {
    var _a;
    // First partition the filters / sorts according to the config
    const { indexedFilters, indexedSorts, unIndexedFilters, unIndexedSorts, graphqlSelection, selectedIndexFields, } = partitionFilterSorts(type, args, context, info, requestedIndexPathsFunc);
    // Next select the best index
    const indexUsed = context.indexer.indexForQuery(type, indexedFilters, indexedSorts, selectedIndexFields, []);
    // Finalize filters and sorts based on the index
    finalizeFilterSorts(type, context, indexUsed, indexedFilters, unIndexedFilters, indexedSorts, unIndexedSorts);
    // Determine if enough filters were provided
    const filtersCopy = indexedFilters.slice().filter(f => !conduit_storage_1.indexHasConditionFilterParam(indexUsed, f));
    for (const component of indexUsed.index) {
        if (!filtersCopy.length) {
            break;
        }
        const filterIdx = filtersCopy.findIndex(e => e.field.endsWith(component.field));
        if (filterIdx < 0) {
            throw new Error(`For an index with 1, 2... N ordered components and filters 1, 2... M where M <= N
        filters must map 1:1 to the corresponding index components starting at the first index component with no missing filters between 1...M\n
        Expected a filter for field: ${component.field} but got none.
        Index used: ${conduit_utils_1.safeStringify(indexUsed.index)}`);
        }
        filtersCopy.splice(filterIdx, 1);
    }
    // Determine if the query needs to resolve full nodes based on field selection
    const usingIndexPaths = graphqlPathForIndexComponents(context.indexer.config[type], indexUsed.index);
    const { unIndexedPaths } = resolveUnindexedPaths(usingIndexPaths, graphqlSelection, context.indexer.doValidation);
    return {
        graphqlSelection,
        indexedFilters,
        indexedSorts,
        selectedIndexFields,
        unIndexedFilters,
        unIndexedSorts,
        unIndexedPaths,
        indexUsed,
        reverseOrder: false,
        pageInfo: args.pageInfo ? {
            startKey: args.pageInfo.startKey && conduit_utils_1.safeParse(args.pageInfo.startKey),
            startIndex: (_a = args.pageInfo) === null || _a === void 0 ? void 0 : _a.startIndex,
            pageSize: args.pageInfo.pageSize,
        } : undefined,
    };
}
exports.getListResolverParams = getListResolverParams;
function indexResolverForType(type, definition) {
    return async (parent, args, context, info) => {
        const perfStart = Date.now();
        if (!context.db) {
            throw new Error('Unable to subscribe without a GraphDB');
        }
        if (!context.indexer.config[type]) {
            throw new Error(`No configured indexes for type: ${type}`);
        }
        const isSetFilter = args.filters && args.filters.find(e => e.isSet);
        const rangeFilter = args.filters && args.filters.find(e => e.max || e.min);
        if (isSetFilter && rangeFilter) {
            throw new Error(`Doing a range filter and an isSet filter leads to unperformant behavior for which a known solution exists.
        Ask the Conduit team to add a boolean index component: ${isSetFilter.field}Exists which you will switch to a boolean match filter.`);
        }
        const params = getListResolverParams(type, args, context, info);
        const { graphqlSelection, indexedSorts, indexedFilters, unIndexedFilters, unIndexedSorts, unIndexedPaths, indexUsed, pageInfo, } = params;
        const tree = await context.db.readonlyIndexingTreeForTypeAndIndex(context.trc, type, indexUsed);
        if (!graphqlSelection.list) {
            if (!unIndexedFilters.length) {
                const count = await context.indexer.getCount(context.trc, context.watcher, tree, type, indexUsed, indexedFilters);
                return {
                    count,
                    indexUsed: indexUsed.index,
                };
            }
            else {
                conduit_utils_1.logger.perf(`${type}List query tried to fetch count performantly, but received unindexed filters`, unIndexedFilters);
            }
        }
        const results = await context.indexer.getList(context.trc, context.watcher, tree, type, definition, params, true);
        let list = results.list;
        if (pageInfo && (unIndexedFilters.length || unIndexedSorts.length)) {
            throw new Error(`Unindexed filters and sorts are prohibitted when using pagination`);
        }
        const isUnIndexedQuery = Boolean(unIndexedPaths.length || unIndexedFilters.length || unIndexedSorts.length);
        if (isUnIndexedQuery) {
            list = await resolveNodesFromList(list, context, unIndexedFilters, unIndexedSorts, info);
        }
        const congruencyCheck = indexedSortsCongruencyCheck(type, indexedSorts, indexedFilters, context.indexer, indexUsed.index);
        if (unIndexedSorts.length || !congruencyCheck) {
            list = context.indexer.sort(type, list, args.sorts);
        }
        const perfElapsed = Date.now() - perfStart;
        if (isUnIndexedQuery) {
            const actions = [
                ...(unIndexedFilters.length ? ['filtering'] : []),
                ...(unIndexedSorts.length ? ['sorting'] : []),
                ...(unIndexedPaths.length ? ['querying'] : []),
            ];
            conduit_utils_1.logger.perf(`You are either filtering, sorting, and/or querying on unindexed paths`, {
                actions,
                type,
                queryName: info === null || info === void 0 ? void 0 : info.fieldName,
                unIndexedFilters,
                unIndexedSorts,
                unIndexedPaths,
                timeElapsed: perfElapsed,
            });
        }
        if (perfElapsed >= 2000) {
            const message = `Unperformant resolver detected. Query name: ${info === null || info === void 0 ? void 0 : info.fieldName}. Unindexed paths: ${conduit_utils_1.safeStringify(unIndexedPaths)}. Time elapsed: ${perfElapsed}.`;
            conduit_utils_1.logger.debug(`WHOOPS ${message}`);
            conduit_utils_1.recordException({ message }).catch(e => conduit_utils_1.logger.error(e));
        }
        return Object.assign({ list, count: list.length, indexUsed: indexUsed.index.map(e => e.field) }, results.clientPageInfo);
    };
}
function indexerForType(autoResolverData, type, indexer, definition) {
    return {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
            name: `${type}ListResults`,
            fields: {
                count: { type: DataSchemaGQL_1.schemaToGraphQLType('int') },
                indexUsed: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.ListOf('string')) },
                prevPageKey: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableString) },
                nextPageKey: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableString) },
                numPriorItems: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableNumber) },
                numRemainingItems: { type: DataSchemaGQL_1.schemaToGraphQLType(conduit_utils_1.NullableNumber) },
                list: {
                    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(autoResolverData.NodeGraphQLTypes[type]))),
                },
            },
        })),
        args: DataSchemaGQL_1.schemaToGraphQLArgs(buildIndexArgs(type, definition, indexer)),
        resolve: indexResolverForType(type, definition),
        deprecationReason: 'Use custom query APIs now',
    };
}
exports.indexerForType = indexerForType;
//# sourceMappingURL=ListResolvers.js.map