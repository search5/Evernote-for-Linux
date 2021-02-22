"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexParamsForQueryArgs = void 0;
const conduit_utils_1 = require("conduit-utils");
const QueryDefs_1 = require("./QueryDefs");
function buildFilter(field, value) {
    const filter = {
        field,
    };
    switch (conduit_utils_1.getTypeOf(value)) {
        case 'boolean':
            filter.match = { boolean: value };
            break;
        case 'string':
            filter.match = { string: value };
            break;
        case 'object':
            // NOTE: GraphQL param objects do not have the Object prototype, so we can't use hasOwnProperty here
            if ('id' in value && 'type' in value) {
                filter.match = { node: value };
            }
            else if ('min' in value && 'max' in value) {
                filter.min = {
                    [conduit_utils_1.getTypeOf(value.min) === 'string' ? 'string' : 'int']: value.min,
                };
                filter.max = {
                    [conduit_utils_1.getTypeOf(value.max) === 'string' ? 'string' : 'int']: value.max,
                };
            }
            else {
                throw new conduit_utils_1.InternalError(`Unhandled object filter for field "${field}": ${conduit_utils_1.safeStringify(value)}`);
            }
            break;
        case 'null':
            filter.isSet = false;
            break;
        default:
            throw new conduit_utils_1.InternalError(`Unhandled type passed to buildFilter for field "${field}": ${conduit_utils_1.getTypeOf(value)}`);
    }
    return filter;
}
function getIndexParamsForQueryArgs(query, args, indexer) {
    var _a;
    const filters = [];
    const keyPath = [];
    // process args into keyPath and filters
    for (const key in query.params) {
        const paramConfig = query.params[key];
        if (QueryDefs_1.isQueryMatchParamConfig(paramConfig)) {
            if (args.hasOwnProperty(key)) {
                if (paramConfig.optional) {
                    keyPath.push(key);
                }
                filters.push(buildFilter(paramConfig.match.field, args[key]));
            }
            else if (!paramConfig.optional) {
                filters.push(buildFilter(paramConfig.match.field, paramConfig.defaultValue));
            }
        }
        else if (QueryDefs_1.isQueryRangeParamConfig(paramConfig)) {
            if (args.hasOwnProperty(key)) {
                if (paramConfig.optional) {
                    keyPath.push(key);
                }
                filters.push(buildFilter(paramConfig.range.field, args[key]));
            }
        }
        else if (QueryDefs_1.isQuerySortParamConfig(paramConfig)) {
            let value = args.hasOwnProperty(key) ? args[key] : paramConfig.defaultValue;
            if (!paramConfig.sort.hasOwnProperty(value)) {
                value = conduit_utils_1.firstStashKey(paramConfig.sort);
            }
            keyPath.push(`${key}=${value}`);
        }
        else {
            throw conduit_utils_1.absurd(paramConfig, 'unknown paramConfig');
        }
    }
    const indexes = indexer.indexesForType(query.type);
    const indexKey = query.indexMap[keyPath.sort().join(';')];
    const indexUsed = indexes[indexKey];
    if (!indexUsed) {
        throw new conduit_utils_1.InternalError(`Failed to find an index for query ${query.name}: indexKey=${indexKey}`);
    }
    return {
        reverseOrder: Boolean(args.reverseOrder),
        indexUsed,
        indexedFilters: filters,
        indexedSorts: [],
        pageInfo: !args.pageInfo ? undefined : {
            startKey: args.pageInfo.startKey && conduit_utils_1.safeParse(args.pageInfo.startKey),
            startIndex: (_a = args.pageInfo) === null || _a === void 0 ? void 0 : _a.startIndex,
            pageSize: args.pageInfo.pageSize,
        },
    };
}
exports.getIndexParamsForQueryArgs = getIndexParamsForQueryArgs;
//# sourceMappingURL=QueryExecutor.js.map