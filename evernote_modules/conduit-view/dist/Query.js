"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.gql = exports.ConduitQuery = exports.getQueryName = exports.getUniqueQueryKey = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const Connector_1 = require("./Connector");
const gTracePool = new conduit_utils_1.AsyncTracePool('execute');
function getUniqueQueryKey(query, vars) {
    if (!query) {
        // no '' query
        throw new Error('Empty query');
    }
    let keyPrefix = query;
    if (typeof query !== 'string') {
        if (query.queryID) {
            keyPrefix = query.queryID;
        }
        else {
            const id = conduit_utils_1.uuid();
            if (!keyPrefix) {
                throw new Error('Invalid uuid');
            }
            query.queryID = id;
            keyPrefix = id;
        }
    }
    return `${keyPrefix}===${conduit_utils_1.safeStringify(vars)}`;
}
exports.getUniqueQueryKey = getUniqueQueryKey;
function getQueryNameInternal(query) {
    if (!query) {
        return '<EmptyQuery>';
    }
    if (typeof query === 'string') {
        const q = query.match(/query\s+(\w+)/);
        if (q) {
            return q[1];
        }
        const m = query.match(/mutation\s+(\w+)/);
        if (m) {
            return m[1];
        }
        return '<UnparsedStringQuery>';
    }
    for (const node of query.definitions) {
        const selections = node.selectionSet ? node.selectionSet.selections : [];
        for (const sel of selections) {
            if (sel.kind === 'Field') {
                return sel.name.value;
            }
        }
    }
    return '<UnparsedQueryDocument>';
}
const gQueryNames = new Map();
function getQueryName(query) {
    const queryID = typeof query === 'string' ? query : query.queryID;
    if (!queryID) {
        return '<EmptyQuery>';
    }
    if (!gQueryNames.has(queryID)) {
        gQueryNames.set(queryID, getQueryNameInternal(query));
    }
    return gQueryNames.get(queryID);
}
exports.getQueryName = getQueryName;
class ConduitQuery {
    constructor(query) {
        this.query = query;
    }
    async execute(...args) {
        const [vars] = args;
        return execute(this.query, (vars || {}));
    }
}
exports.ConduitQuery = ConduitQuery;
function gql(literals, ...placeholders) {
    return new ConduitQuery(graphql_tag_1.default(literals, ...placeholders));
}
exports.gql = gql;
async function execute(...args) {
    const [query, vars] = args;
    const unwrappedQuery = query instanceof ConduitQuery ? query.query : query;
    if (typeof unwrappedQuery !== 'string' && !unwrappedQuery.queryID) {
        unwrappedQuery.queryID = conduit_utils_1.uuid();
    }
    const res = await gTracePool.runTraced(null, async (trc) => {
        const queryName = getQueryName(unwrappedQuery);
        conduit_utils_1.traceEventStart(trc, queryName, vars);
        return conduit_utils_1.traceEventEndWhenSettled(trc, queryName, Connector_1.connector.query(unwrappedQuery, vars || {}));
    });
    if (res.error) {
        throw res.error;
    }
    return conduit_view_types_1.drillDownIntoResponse(res.data);
}
exports.execute = execute;
//# sourceMappingURL=Query.js.map