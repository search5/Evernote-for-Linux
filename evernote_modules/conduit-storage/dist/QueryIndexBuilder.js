"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNodeIndexConfiguration = exports.buildIndexesForQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const simply_immutable_1 = require("simply-immutable");
const GraphTypes_1 = require("./GraphTypes");
const IndexResolverFactories_1 = require("./IndexResolverFactories");
const QueryDefs_1 = require("./QueryDefs");
function extractCommonSortFields(paramConfig) {
    const fieldCount = {};
    let sortCount = 0;
    for (const key in paramConfig.sort) {
        sortCount++;
        for (const s of paramConfig.sort[key]) {
            fieldCount[s.field] = (fieldCount[s.field] || 0) + 1;
        }
    }
    return Object.keys(fieldCount).filter(f => fieldCount[f] === sortCount);
}
function getCommonFieldsForQuery(query) {
    const indexedFields = new Set();
    for (const key in query.params) {
        const paramConfig = query.params[key];
        if (QueryDefs_1.isQueryMatchParamConfig(paramConfig) && !paramConfig.optional) {
            // not actually in the index but can be pulled out of the params
            indexedFields.add(paramConfig.match.field);
        }
        else if (QueryDefs_1.isQueryRangeParamConfig(paramConfig) && !paramConfig.optional) {
            indexedFields.add(paramConfig.range.field);
        }
        else if (QueryDefs_1.isQuerySortParamConfig(paramConfig)) {
            const sortFields = extractCommonSortFields(paramConfig);
            for (const s of sortFields) {
                indexedFields.add(s);
            }
        }
    }
    if (query.sort) {
        for (const s of query.sort) {
            indexedFields.add(s.field);
        }
    }
    if (query.includeFields) {
        for (const f of query.includeFields) {
            indexedFields.add(f);
        }
    }
    // always index id
    indexedFields.add('id');
    return [...indexedFields.keys()];
}
function dedupeSorts(sorts) {
    const fields = {};
    for (let i = sorts.length - 1; i >= 0; i--) {
        const s = sorts[i];
        const existing = fields[s.field];
        if (existing) {
            // if a field is included twice, use the last specified sort order but in the first position
            s.order = existing.order;
            sorts.splice(sorts.indexOf(existing), 1);
        }
        fields[s.field] = s;
    }
}
function buildDesiredIndexesForQuery(name, query, type) {
    const sharedFields = getCommonFieldsForQuery(query);
    const queryDef = {
        name,
        type,
        internalOnly: Boolean(query.internalOnly),
        cacheInMemory: Boolean(query.cacheInMemory),
        params: query.params,
        sharedFields,
        indexMap: {},
    };
    const desired = [{
            queryDef,
            keyPath: [],
            filter: simply_immutable_1.cloneMutable(query.filter || []),
            matchFields: new Set(),
            sort: simply_immutable_1.cloneMutable(query.sort || []),
            allFields: new Set(sharedFields),
        }];
    function split(keys) {
        const orig = [...desired];
        desired.length = 0;
        const ret = [];
        for (const key of keys) {
            const splitEntries = [];
            for (const srcEntry of orig) {
                const newEntry = {
                    queryDef: srcEntry.queryDef,
                    keyPath: key ? srcEntry.keyPath.concat([key]) : srcEntry.keyPath,
                    filter: simply_immutable_1.cloneMutable(srcEntry.filter),
                    matchFields: new Set(srcEntry.matchFields.keys()),
                    sort: simply_immutable_1.cloneMutable(srcEntry.sort),
                    allFields: new Set(srcEntry.allFields.keys()),
                };
                desired.push(newEntry);
                splitEntries.push(newEntry);
            }
            ret.push(splitEntries);
        }
        return ret;
    }
    for (const key in query.params) {
        const paramConfig = query.params[key];
        if (QueryDefs_1.isQueryMatchParamConfig(paramConfig)) {
            const entries = paramConfig.optional ? split([null, key])[1] : desired;
            for (const entry of entries) {
                entry.matchFields.add(paramConfig.match.field);
                entry.allFields.add(paramConfig.match.field);
            }
        }
        else if (QueryDefs_1.isQueryRangeParamConfig(paramConfig)) {
            const entries = paramConfig.optional ? split([null, key])[1] : desired;
            for (const entry of entries) {
                entry.sort.unshift({ field: paramConfig.range.field, order: 'ASC' });
                entry.allFields.add(paramConfig.range.field);
            }
        }
        else if (QueryDefs_1.isQuerySortParamConfig(paramConfig)) {
            const sortOptions = Object.keys(paramConfig.sort);
            const entrySets = split(sortOptions.map(s => `${key}=${s}`));
            for (let i = 0; i < sortOptions.length; ++i) {
                const entries = entrySets[i];
                const sortConfig = paramConfig.sort[sortOptions[i]];
                for (const entry of entries) {
                    entry.sort.push(...sortConfig);
                    for (const s of sortConfig) {
                        entry.allFields.add(s.field);
                    }
                }
            }
        }
        else {
            throw conduit_utils_1.absurd(paramConfig, 'unknown paramConfig');
        }
    }
    for (const entry of desired) {
        entry.keyPath.sort();
        entry.filter.sort(cmpConditionals);
        dedupeSorts(entry.sort);
    }
    return {
        desired,
        queryDef,
    };
}
function conditionalToString(conditional) {
    return `field:${conditional.field}&EQ&value:${conditional.value}`;
}
function cmpConditionals(a, b) {
    // efficient? no. but not called very much.
    return conduit_utils_1.asciiCompare(conditionalToString(a), conditionalToString(b));
}
function genIndexKey(index) {
    const parts = [];
    parts.push(...index.index.map(item => [item.field, item.order].join(':')));
    // assumes indexCondition is sorted, which it should be since we generated it
    parts.push(...index.indexCondition.map(conditionalToString));
    return conduit_utils_1.md5(parts.join(';'));
}
function validateFieldType(field, type) {
    if (!type) {
        throw new Error(`Missing schemaType for field ${field}`);
    }
    if (conduit_utils_1.fieldTypeIsStruct(type) || conduit_utils_1.fieldTypeIsMap(type)) {
        throw new Error(`Currently unable to index on field type ${type} for field ${field}`);
    }
    return true;
}
function buildIndexForDesired(desired, fieldTypes) {
    const index = {
        key: '',
        inMemoryIndex: desired.queryDef.cacheInMemory,
        index: [],
        indexCondition: desired.filter,
    };
    // match, then sort, then additional fields
    const usedFields = new Set();
    // TODO move matchFields to splitFields when that is implemented
    for (const field of desired.matchFields.keys()) {
        const type = fieldTypes[field].schemaType;
        if (validateFieldType(field, type)) {
            index.index.push({ field, order: 'ASC', type, isMatchField: true });
            usedFields.add(field);
        }
    }
    for (const elem of desired.sort) {
        const type = fieldTypes[elem.field].schemaType;
        if (validateFieldType(elem.field, type)) {
            index.index.push({ field: elem.field, order: elem.order, type, isMatchField: false });
            usedFields.add(elem.field);
        }
    }
    for (const field of desired.allFields.keys()) {
        if (usedFields.has(field)) {
            continue;
        }
        const type = fieldTypes[field].schemaType;
        if (validateFieldType(field, type)) {
            index.index.push({ field, order: 'ASC', type, isMatchField: false });
            usedFields.add(field);
        }
    }
    index.indexCondition.sort(cmpConditionals);
    return index;
}
function sortFieldsEqual(a, b) {
    return b && a.field === b.field && a.order === b.order;
}
function isSupersetIndex(check, against) {
    if (!conduit_utils_1.setContains(against.allFields, check.allFields)) {
        return false;
    }
    if (check.filter.length !== against.filter.length) {
        return false;
    }
    for (let i = 0; i < check.filter.length; ++i) {
        if (conditionalToString(check.filter[i]) !== conditionalToString(against.filter[i])) {
            return false;
        }
    }
    if (!conduit_utils_1.setEquals(check.matchFields, against.matchFields)) {
        return false;
    }
    for (let i = 0; i < check.sort.length; ++i) {
        if (!sortFieldsEqual(check.sort[i], against.sort[i])) {
            return false;
        }
    }
    return true;
}
function buildIndexesForQueries(queries, fieldTypes, legacyIndexes, nodeType) {
    const legacyLookup = {};
    for (const key in legacyIndexes) {
        legacyLookup[genIndexKey(legacyIndexes[key])] = key;
    }
    const queryDefs = {};
    const allDesired = [];
    for (const queryName in queries) {
        const { desired, queryDef } = buildDesiredIndexesForQuery(queryName, queries[queryName], nodeType);
        queryDefs[queryName] = queryDef;
        allDesired.push(...desired);
    }
    // find supersets
    const remap = allDesired.reduce((r, desired, i) => {
        r[i] = i;
        for (let j = 0; j < allDesired.length; ++j) {
            if (i === j) {
                continue;
            }
            if (isSupersetIndex(desired, allDesired[j])) {
                desired = allDesired[j];
                r[i] = j;
            }
        }
        return r;
    }, {});
    const indexArray = allDesired.map(desired => buildIndexForDesired(desired, fieldTypes));
    const indexKeys = indexArray.map(genIndexKey);
    const indexStash = Object.assign({}, legacyIndexes);
    for (let i = 0; i < allDesired.length; ++i) {
        const desired = allDesired[i];
        const iRemapped = remap[i];
        const indexKey = indexKeys[iRemapped];
        const legacyKey = legacyLookup[indexKey];
        const index = legacyKey ? legacyIndexes[legacyKey] : indexArray[iRemapped];
        if (!legacyKey) {
            index.key = indexKey;
            indexStash[index.key] = index;
        }
        else {
            i = i;
        }
        desired.queryDef.indexMap[desired.keyPath.join(';')] = index.key;
    }
    return {
        indexes: indexStash,
        queries: queryDefs,
    };
}
exports.buildIndexesForQueries = buildIndexesForQueries;
function convertLegacyIndexes(indexes, fieldTypes) {
    const ret = {};
    for (const key in indexes) {
        const index = indexes[key];
        let hasNodeID = false;
        const indexItem = {
            key,
            inMemoryIndex: false,
            index: index.index.map(v => {
                const field = v.field;
                const type = fieldTypes[field].schemaType;
                if (!validateFieldType(field, type)) {
                    throw new Error('satisfying the compiler');
                }
                if (field === 'id') {
                    hasNodeID = true;
                }
                return Object.assign(Object.assign({}, v), { type });
            }),
            indexCondition: index.indexCondition || [],
        };
        if (!hasNodeID) {
            indexItem.index.push({ field: 'id', order: 'ASC', type: 'ID', isMatchField: false });
        }
        ret[key] = indexItem;
    }
    return ret;
}
function buildNodeIndexConfiguration(nodeTypeDef, params) {
    nodeTypeDef = simply_immutable_1.deepFreeze(nodeTypeDef);
    params = simply_immutable_1.deepFreeze(params);
    const indexResolvers = Object.assign({}, params.indexResolvers);
    if (!indexResolvers.id) {
        indexResolvers.id = IndexResolverFactories_1.getIndexByResolverForPrimitives(nodeTypeDef, ['id']);
    }
    const legacyIndexes = convertLegacyIndexes(params.indexes || {}, indexResolvers);
    const { indexes, queries } = buildIndexesForQueries((params.queries || {}), indexResolvers, legacyIndexes, nodeTypeDef.name);
    const denormalizedIndexPropagations = {};
    for (const dstField in indexResolvers) {
        const propagatedFrom = indexResolvers[dstField].propagatedFrom;
        if (!propagatedFrom) {
            continue;
        }
        denormalizedIndexPropagations[propagatedFrom.srcType] = denormalizedIndexPropagations[propagatedFrom.srcType] || {};
        denormalizedIndexPropagations[propagatedFrom.srcType][propagatedFrom.srcField] = {
            traversalToDst: propagatedFrom.traversalToDst,
            dstField,
            srcField: propagatedFrom.srcField,
        };
    }
    const denormalizeQueries = (def) => {
        const denormalizedQueries = {};
        for (const queryName in queries) {
            const query = queries[queryName];
            for (const paramName in query.params) {
                const param = query.params[paramName];
                if (!QueryDefs_1.isQueryMatchParamConfig(param)) {
                    continue;
                }
                const field = param.match.field;
                const resolver = indexResolvers[field];
                const resolverSchemaType = conduit_utils_1.fieldTypeToNonNull(resolver.schemaType);
                let schemaType = 'ID';
                if (resolverSchemaType === 'ID') {
                    schemaType = 'ID';
                }
                else if (resolverSchemaType === 'EntityRef') {
                    schemaType = 'EntityRef';
                }
                else {
                    continue;
                }
                const entityTypes = resolver.entityRefTypes ? (Array.isArray(resolver.entityRefTypes) ? resolver.entityRefTypes : resolver.entityRefTypes(def)) : [];
                for (const srcType of entityTypes) {
                    denormalizedQueries[srcType] = denormalizedQueries[srcType] || {};
                    denormalizedQueries[srcType][queryName] = {
                        paramName,
                        schemaType,
                        traversalName: params.queries[queryName].traversalName || null,
                        traversalConstraint: params.queries[queryName].traversalConstraint || GraphTypes_1.EdgeConstraint.MANY,
                    };
                }
            }
        }
        return denormalizedQueries;
    };
    const config = simply_immutable_1.deepFreeze({
        priority: params.priority,
        indexResolvers: indexResolvers,
        denormalizedIndexPropagations,
        denormalizeQueries,
        queries,
        indexes,
        lookups: (params.lookups || []),
    });
    // validate
    const resolversUsed = new Set(config.lookups);
    for (const key in indexes) {
        for (const comp of indexes[key].index) {
            resolversUsed.add(comp.field);
        }
        for (const cond of indexes[key].indexCondition) {
            resolversUsed.add(cond.field);
        }
    }
    const resolversDefined = new Set(Object.keys(indexResolvers));
    const resolversUnused = conduit_utils_1.setDiff(resolversDefined, resolversUsed);
    if (resolversUnused.size) {
        throw new Error(`Unused index resolvers for node type ${nodeTypeDef.name}: ${[...resolversUnused.keys()]}`);
    }
    return config;
}
exports.buildNodeIndexConfiguration = buildNodeIndexConfiguration;
//# sourceMappingURL=QueryIndexBuilder.js.map