"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLResolver = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const execute_1 = require("graphql/execution/execute");
const iterall_1 = require("iterall");
const pluginManager_1 = require("../pluginManager");
const GraphQLFields_1 = require("./GraphQLFields");
const AutoMutations_1 = require("./Mutations/AutoMutations");
const ErrorMutations_1 = require("./Mutations/ErrorMutations");
const GraphMutations_1 = require("./Mutations/GraphMutations");
const LocalSettingsMutations_1 = require("./Mutations/LocalSettingsMutations");
const MultiUserMutations_1 = require("./Mutations/MultiUserMutations");
const TelemetryMutations_1 = require("./Mutations/TelemetryMutations");
const AutoResolvers_1 = require("./Resolvers/AutoResolvers");
const CustomResolvers_1 = require("./Resolvers/CustomResolvers");
const ResolverHelpers_1 = require("./Resolvers/ResolverHelpers");
const MAX_RETRIES = 10;
const RETRY_DELAY = 50;
let gRecentQueryCount = {};
let gQueryLogTimer = null;
function logQueryCounts() {
    gQueryLogTimer = null;
    const counts = gRecentQueryCount;
    gRecentQueryCount = {};
    conduit_utils_1.logger.debug('Queries in the last 5 seconds:', counts);
}
function validateQuery(schema, document, isIntrospectionQuery) {
    const validationErrors = graphql_1.validate(schema, document);
    if (validationErrors.length > 0) {
        throw new conduit_utils_1.MultiError(validationErrors);
    }
    document.parsedFieldSelection = GraphQLFields_1.parseFieldsSelection(document, isIntrospectionQuery);
    document.queryName = conduit_utils_1.firstStashKey(document.parsedFieldSelection.selections[0]) || '<UnknownQuery>';
}
function isAsyncIterator(obj) {
    return iterall_1.isAsyncIterable(obj) && (typeof obj.next) === 'function';
}
function descendGraphQLType(type) {
    if (type instanceof graphql_1.GraphQLObjectType) {
        return type.getFields();
    }
    if (type instanceof graphql_1.GraphQLNonNull) {
        return descendGraphQLType(type.ofType);
    }
    if (type instanceof graphql_1.GraphQLList) {
        return descendGraphQLType(type.ofType);
    }
    throw new Error(`Unable to apply resolver, unhandled parent type: ${type.toString()}`);
}
function argsFromConfig(argsIn) {
    const ret = [];
    for (const key in (argsIn || {})) {
        ret.push(Object.assign({ name: key }, argsIn[key]));
    }
    return ret;
}
function argsToConfig(argsIn) {
    return argsIn.reduce((args, arg) => {
        args[arg.name] = arg;
        return args;
    }, {});
}
function applyCustomResolvers(autoResolverData, customQueries) {
    const root = {};
    for (const custom of customQueries) {
        for (const key in custom) {
            const resolverThunk = custom[key];
            const resolver = typeof resolverThunk === 'function' ? resolverThunk(autoResolverData) : resolverThunk;
            const resolverPath = key.split('.');
            const pathLength = resolverPath.length;
            let parent = root;
            while (resolverPath.length > 1) {
                const p = resolverPath.shift();
                if (!parent[p]) {
                    throw new Error(`Unable to apply resolver at path ${key}, no parent available at ${p}`);
                }
                parent = descendGraphQLType(parent[p].type);
            }
            parent[resolverPath[0]] = Object.assign(Object.assign(Object.assign(Object.assign({}, parent[resolverPath[0]]), { name: resolverPath[0], description: '' }), resolver), { args: argsFromConfig(resolver.args) });
            if (pathLength > 1 && !('isDeprecated' in parent[resolverPath[0]])) {
                parent[resolverPath[0]].isDeprecated = Boolean(resolver.deprecationReason);
            }
        }
    }
    const out = {};
    const rootKeys = Object.keys(root).sort();
    for (const key of rootKeys) {
        out[key] = Object.assign(Object.assign({}, root[key]), { args: argsToConfig(root[key].args) });
    }
    return out;
}
class GraphQLResolver {
    constructor(di) {
        this.di = di;
        this.autoResolverData = new ResolverHelpers_1.AutoResolverData();
        this.cachePrefix = Date.now();
        this.gCachedQueries = {};
        this.queryCacheMax = 0;
        const schemaDef = {
            query: new graphql_1.GraphQLObjectType({
                name: 'RootQueryType',
                fields: applyCustomResolvers(this.autoResolverData, [
                    AutoResolvers_1.buildAutoResolvers(this.autoResolverData, di.nodeTypes(), di.indexer(), di.dataResolvers()),
                    CustomResolvers_1.buildCustomResolvers(),
                    pluginManager_1.getPluginResolvers(di.plugins, di, 'Queries'),
                ]),
            }),
            mutation: new graphql_1.GraphQLObjectType({
                name: 'RootMutationType',
                fields: applyCustomResolvers(this.autoResolverData, [
                    AutoMutations_1.buildAutoMutators(di.mutatorDefinitions()),
                    ErrorMutations_1.getErrorMutators(),
                    GraphMutations_1.getGraphMutators(),
                    LocalSettingsMutations_1.getLocalSettingsMutators(),
                    MultiUserMutations_1.getMultiUserMutators(),
                    TelemetryMutations_1.getTelemetryMutators(),
                    pluginManager_1.getPluginResolvers(di.plugins, di, 'Mutators'),
                ]),
            }),
        };
        this.rootSchema = new graphql_1.GraphQLSchema(schemaDef);
    }
    getSchema() {
        return this.rootSchema;
    }
    readQuery(query) {
        if (typeof query === 'string') {
            if (query.match(/^\d+-\d+$/)) {
                if (!this.gCachedQueries[query]) {
                    throw new conduit_utils_1.CachedQueryError(query);
                }
                return { doc: this.gCachedQueries[query], cacheID: query };
            }
            const doc = graphql_1.parse(query);
            const isIntrospectionQuery = query.includes('__schema {');
            validateQuery(this.rootSchema, doc, isIntrospectionQuery);
            doc.isMutation = doc.definitions.some(e => e.hasOwnProperty('operation') && e.operation === 'mutation');
            return { doc };
        }
        else {
            let cacheID = query.cacheID;
            if (!cacheID || !this.gCachedQueries[query.cacheID]) {
                validateQuery(this.rootSchema, query, false);
                cacheID = `${this.cachePrefix}-${this.queryCacheMax++}`;
                this.gCachedQueries[cacheID] = query;
                query.cacheID = cacheID;
                query.isMutation = query.definitions.some(e => e.hasOwnProperty('operation') && e.operation === 'mutation');
            }
            // Must return the document that has been cached, and not the original document passed in.
            // ValidateQuery has side effects, and cached queries are the only things we know have
            // been passed though that function.
            return { doc: this.gCachedQueries[query.cacheID], cacheID };
        }
    }
    async getData(doc, vars, context, cacheID) {
        const sels = doc.parsedFieldSelection.selections[0];
        conduit_utils_1.traceEventStart(context.trc, doc.queryName, { vars, sels });
        return conduit_utils_1.traceEventEndWhenSettled(context.trc, doc.queryName, this.getDataInternal(doc, vars, cacheID, context, 0));
    }
    async getDataInternal(doc, vars, cacheID, context, retryCount) {
        const isSlowQuery = doc.queryName.startsWith('Every') || doc.queryName.endsWith('List') || doc.queryName.startsWith('All');
        // HACK: these are frequently erroneously retriggered, don't suppress for them
        const noSuppression = isSlowQuery || doc.queryName === 'Workspace';
        !noSuppression && this.di.suppressSyncForQuery(doc.queryName);
        gRecentQueryCount[doc.queryName] = (gRecentQueryCount[doc.queryName] || 0) + 1;
        if (!gQueryLogTimer) {
            gQueryLogTimer = conduit_utils_1.sleep(5000).then(logQueryCounts).catch(conduit_utils_1.emptyFunc);
        }
        context.unboundedQueryRoots = undefined;
        context.querySelectionFields = GraphQLFields_1.fieldsForVars(doc.parsedFieldSelection, vars);
        const operation = graphql_1.getOperationAST(doc, null);
        context.watcher && context.watcher.startDataFetch(isSlowQuery);
        let result = await (operation && operation.operation !== 'subscription' ?
            execute_1.execute(this.rootSchema, doc, null, context, vars) :
            graphql_1.subscribe({ schema: this.rootSchema, document: doc, variableValues: vars, contextValue: context }));
        if (isAsyncIterator(result)) {
            if (!context.watcher) {
                throw new Error('Unable to subscribe without an OnUpdate function');
            }
            context.watcher.addAsyncIterator('subscription', 'result', result);
            result = {};
        }
        if (context.watcher && context.watcher.endDataFetch()) {
            // watches triggered while fetching data, need to refetch
            context.dataLoaders = {}; // reset loaders so the retry doesn't use cached values
            return this.getDataInternal(doc, vars, cacheID, context, 0);
        }
        if (result.errors) {
            const errors = result.errors.map(e => e.originalError || e);
            for (let i = 0; i < errors.length; ++i) {
                const e = errors[i];
                if (e instanceof conduit_utils_1.AuthError) {
                    // dispatch to the auth failure handler
                    errors[i] = await this.di.handleAuthError(context.trc, e);
                }
            }
            const err = new conduit_utils_1.MultiError(errors);
            const maxRetries = doc.isMutation ? 1 : MAX_RETRIES;
            if (err.isRetryable() && retryCount < maxRetries) {
                await conduit_utils_1.sleep(err.getRetryDelay(RETRY_DELAY));
                context.dataLoaders = {}; // reset loaders so the retry doesn't use cached values
                return this.getDataInternal(doc, vars, cacheID, context, retryCount + 1);
            }
            conduit_utils_1.logger.warn(`Conduit query ${doc.queryName} failed with error `, err);
            throw err;
        }
        return Object.assign({ cacheID }, result);
    }
}
exports.GraphQLResolver = GraphQLResolver;
//# sourceMappingURL=GraphQL.js.map