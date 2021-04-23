"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvernoteIndexer = void 0;
const conduit_utils_1 = require("conduit-utils");
const GraphIndexTypes_1 = require("./GraphIndexTypes");
const GraphTypes_1 = require("./GraphTypes");
const IndexingIterator_1 = require("./IndexingIterator");
const LIST_TIMEBOX = 500;
async function dummyNodeFieldLookup(trc, ref, lookupField) {
    throw new Error(`cannot nodeFieldLookup for old version of graph node, fields should already exist in PropagatedFields: ${ref.type}.${lookupField}`);
}
function isMinMaxIndexableType(value) {
    // NOTE: GraphQL param objects do not have the Object prototype, so we can't use hasOwnProperty here
    return typeof (value) === 'object' && value !== null && ('min' in value || 'max' in value);
}
async function getStartKey(trc, watcher, pageInfo, tree, firstKey, lastKey, iterationDirection) {
    if (pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.startIndex) {
        if (pageInfo.startKey) {
            throw new Error(`Passing a startKey and startIndex for pagination is undefined`);
        }
        const numItems = await tree.getNumberOfItemsBetweenKeys(trc, watcher, firstKey, lastKey);
        const index = iterationDirection === 'ASC' ? pageInfo.startIndex : numItems - 1 - pageInfo.startIndex;
        return await tree.getKeyAtIndexBetweenKeys(trc, watcher, firstKey, lastKey, index);
    }
    else {
        return (pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.startKey) || null;
    }
}
const matchAnyKeyLeft = 'com.evernote.any-left';
const matchAnyKeyRight = 'com.evernote.any-right';
class EvernoteIndexer {
    constructor(config, nodeTypes, doValidation) {
        var _a;
        this.config = config;
        this.nodeTypes = nodeTypes;
        this.doValidation = doValidation;
        this.treeOrder = 100;
        this.propagationConfig = {};
        this.traversalConfig = {};
        this.containerizedIndexResolversCache = {};
        this.currentSearchPrefix = null;
        this.compareKeysFactory = (type, index) => {
            var _a;
            const indexResolvers = (_a = this.config[type]) === null || _a === void 0 ? void 0 : _a.indexResolvers;
            return (key1, key2) => {
                if (index.length !== key1.length) {
                    throw new Error(`Key/index mismatch (index: [${index}], key: [${key1}]`);
                }
                for (let i = 0; i < key1.length; ++i) {
                    const component = index[i];
                    const cmp = this.compareWithSort(component.order, indexResolvers ? indexResolvers[component.field] : {}, key1[i], key2[i], true);
                    if (cmp !== 0) {
                        return {
                            cmp,
                            matchesAllRequiredFields: !index[i].isMatchField,
                        };
                    }
                }
                return {
                    cmp: 0,
                    matchesAllRequiredFields: true,
                };
            };
        };
        // denormalize multi-type config settings
        for (const dstTypeStr in config) {
            const dstType = dstTypeStr;
            const typeConfig = config[dstType];
            // denormalize field propagation
            const propagateFrom = typeConfig.denormalizedIndexPropagations;
            if (propagateFrom) {
                for (const srcTypeStr in propagateFrom) {
                    const srcType = srcTypeStr;
                    if (!config[srcType]) {
                        continue;
                    }
                    this.propagationConfig[srcType] = this.propagationConfig[srcType] || {};
                    const propagateTo = this.propagationConfig[srcType];
                    for (const propagateFromIndex in propagateFrom[srcType]) {
                        const from = propagateFrom[srcType];
                        if (from) {
                            if (!propagateTo[propagateFromIndex]) {
                                propagateTo[propagateFromIndex] = { srcField: from[propagateFromIndex].srcField, dstField: from[propagateFromIndex].dstField };
                            }
                            if (!propagateTo[propagateFromIndex][dstType]) {
                                propagateTo[propagateFromIndex][dstType] = {};
                            }
                            for (const edge of (_a = from[propagateFromIndex].traversalToDst) !== null && _a !== void 0 ? _a : []) {
                                const dstPort = edge.edge && edge.edge[0] === 'outputs' && edge.edge[1];
                                if (!dstPort) {
                                    continue;
                                }
                                if (!propagateTo[propagateFromIndex][dstType][dstPort]) {
                                    propagateTo[propagateFromIndex][dstType][dstPort] = [];
                                }
                                propagateTo[propagateFromIndex][dstType][dstPort].push(edge);
                            }
                        }
                    }
                }
            }
            // denormalize traversal queries
            const denormalizedQueries = typeConfig.denormalizeQueries(nodeTypes[dstType]);
            for (const srcTypeStr in denormalizedQueries) {
                const srcType = srcTypeStr;
                const queries = denormalizedQueries[srcType];
                for (const queryName in queries) {
                    const queryConfig = queries[queryName];
                    const traversalName = queryConfig.traversalName || queryName;
                    this.traversalConfig[srcType] = this.traversalConfig[srcType] || {};
                    this.traversalConfig[srcType][traversalName] = Object.assign({ srcType,
                        dstType, dstQuery: queryName, dstConstraint: queryConfig.traversalConstraint || GraphTypes_1.EdgeConstraint.MANY }, queryConfig);
                }
            }
        }
    }
    isIndexParamBoolean(type, param) {
        var _a, _b, _c, _d;
        const typeDef = this.nodeTypes[type];
        if (!typeDef) {
            throw new Error(`No type definition for node type: ${type}`);
        }
        if (typeDef.schema && typeDef.schema.hasOwnProperty(param)) {
            const fieldType = conduit_utils_1.fieldTypeToNonNull(typeDef.schema[param]);
            return fieldType === 'boolean';
        }
        else if ((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a[type]) === null || _b === void 0 ? void 0 : _b.indexResolvers) === null || _c === void 0 ? void 0 : _c[param]) === null || _d === void 0 ? void 0 : _d.schemaType) {
            const fieldType = conduit_utils_1.fieldTypeToNonNull(this.config[type].indexResolvers[param].schemaType);
            return fieldType === 'boolean';
        }
        return false;
    }
    indexedValuesFromKeyFactory(type, index, forLegacyAPI) {
        return (key) => {
            var _a;
            const res = {};
            const indexComponents = index.index;
            for (let i = 0; i < indexComponents.length; ++i) {
                const path = forLegacyAPI ? (_a = this.config[type]) === null || _a === void 0 ? void 0 : _a.indexResolvers[indexComponents[i].field].graphqlPath : undefined;
                if (path) {
                    conduit_utils_1.objectSetField(key[i], path, res);
                }
                else {
                    res[indexComponents[i].field] = key[i];
                }
            }
            for (const condition of index.indexCondition) {
                res[condition.field] = condition.value;
            }
            return res;
        };
    }
    indexesForType(type) {
        if (!this.config[type]) {
            return {};
        }
        return this.config[type].indexes;
    }
    containerizedIndexResolversForType(type) {
        const res = {
            inputs: {},
            outputs: {},
        };
        if (!this.config.hasOwnProperty(type)) {
            return res;
        }
        if (this.containerizedIndexResolversCache.hasOwnProperty(type)) {
            return this.containerizedIndexResolversCache[type];
        }
        const indexResolvers = this.config[type].indexResolvers;
        const definition = this.nodeTypes[type];
        if (!definition) {
            // There is some bad configs.
            throw new conduit_utils_1.InternalError(`Operating on an unknown node type: ${type}`);
        }
        for (const indexParam in indexResolvers) {
            const fetchDirection = this.isContainerizedIndexComponent(indexParam, definition);
            if (fetchDirection) {
                res[fetchDirection][indexParam] = indexResolvers[indexParam];
            }
        }
        this.containerizedIndexResolversCache[type] = res;
        return res;
    }
    isContainerizedIndexComponent(key, definition) {
        if (definition.inputs && Object.keys(definition.inputs).includes(key)) {
            if (definition.inputs[key].constraint !== GraphTypes_1.EdgeConstraint.MANY) {
                return 'inputs';
            }
            else {
                throw new Error(`Cannot index directly on a MANY constraint port, index on ${key}Count instead`);
            }
        }
        if (definition.outputs && Object.keys(definition.outputs).includes(key)) {
            if (definition.outputs[key].constraint !== GraphTypes_1.EdgeConstraint.MANY) {
                return 'outputs';
            }
            else {
                throw new Error(`Cannot index directly on a MANY constraint port, index on ${key}Count instead`);
            }
        }
        return null;
    }
    sort(type, array, sorts) {
        if (!this.config.hasOwnProperty(type)) {
            throw new Error(`Cannot sort on unconfigured index type: ${type}`);
        }
        if (!sorts.length) {
            return array;
        }
        return array.sort((a, b) => {
            for (const currentSort of sorts) {
                const fieldPath = currentSort.field.split('_');
                let aField = conduit_utils_1.walkObjectPathSupportsNumeric(a, fieldPath);
                let bField = conduit_utils_1.walkObjectPathSupportsNumeric(b, fieldPath);
                if (aField === undefined) {
                    aField = null;
                }
                if (bField === undefined) {
                    bField = null;
                }
                const compare = this.compareWithSort(currentSort.order, currentSort, aField, bField);
                if (compare !== 0) {
                    return compare;
                }
            }
            return 0;
        });
    }
    compareWithSort(order, compConfig, a, b, considerAny) {
        const result = this.compare(a, b, compConfig, considerAny);
        if (order === 'DESC') {
            return result * -1;
        }
        else {
            return result;
        }
    }
    compare(a, b, opts, considerAny) {
        if (a === matchAnyKeyLeft && b !== matchAnyKeyLeft) {
            return considerAny ? -1 : 0;
        }
        if (a !== matchAnyKeyLeft && b === matchAnyKeyLeft) {
            return considerAny ? 1 : 0;
        }
        if (a === matchAnyKeyRight && b !== matchAnyKeyRight) {
            return considerAny ? 1 : 0;
        }
        if (a !== matchAnyKeyRight && b === matchAnyKeyRight) {
            return considerAny ? -1 : 0;
        }
        if (!conduit_utils_1.isValuePrimitiveType(a)) {
            if (b === null) {
                return -1;
            }
            if (conduit_utils_1.isValuePrimitiveType(b)) {
                throw new Error('Type mismatch in comparing index fields at the same position!');
            }
            const d = conduit_utils_1.asciiCompare(a.type, b.type);
            if (d !== 0) {
                return d;
            }
            return conduit_utils_1.asciiCompare(a.id, b.id);
        }
        if (!conduit_utils_1.isValuePrimitiveType(b)) {
            if (a === null) {
                return 1;
            }
            throw new Error('Type mismatch in comparing index fields at the same position!');
        }
        return conduit_utils_1.comparatorFactory(opts, this.locale)(a, b);
    }
    async resolveField(trc, node, field, nodeFieldLookup, propagatedFields) {
        const componentResolver = this.config[node.type].indexResolvers[field];
        if (!componentResolver) {
            throw new Error(`Index component: ${field} does not exist in the configured index paths for node type: ${node.type}`);
        }
        let result = [null];
        if (Array.isArray(componentResolver.resolver)) {
            const value = conduit_utils_1.walkObjectPath(node, componentResolver.resolver, null);
            if (componentResolver.resolver[0] === 'inputs' || componentResolver.resolver[0] === 'outputs') {
                result = [value ? Object.keys(value).length : 0];
            }
            else {
                result = [conduit_utils_1.isValuePrimitiveType(value) ? value : null];
            }
        }
        else if (componentResolver.propagatedFrom && field in propagatedFields) {
            result = propagatedFields[field];
        }
        else {
            result = await componentResolver.resolver(trc, node, nodeFieldLookup || dummyNodeFieldLookup);
            if (componentResolver.propagatedFrom) {
                propagatedFields[field] = result;
            }
        }
        return result;
    }
    async resolveAllFields(trc, node, nodeFieldLookup, propagatedFields) {
        if (!this.config[node.type]) {
            return {};
        }
        const fieldNames = Object.keys(this.config[node.type].indexResolvers);
        const fieldValues = await conduit_utils_1.allSettled(fieldNames.map(field => this.resolveField(trc, node, field, nodeFieldLookup, propagatedFields)));
        return fieldNames.reduce((obj, field, idx) => {
            obj[field] = fieldValues[idx];
            return obj;
        }, {});
    }
    checkShouldIndexNode(indexItem, resolvedFields) {
        for (const condition of indexItem.indexCondition) {
            const val1Array = resolvedFields[condition.field];
            for (const val1 of val1Array) {
                if (val1 !== condition.value) {
                    return false;
                }
            }
        }
        return true;
    }
    keysForNodeAndIndex(node, index, resolvedFields) {
        if (!node) {
            return [];
        }
        if (!this.config.hasOwnProperty(node.type)) {
            throw new Error(`Node type: ${node.type} to be indexed but does not exist in config`);
        }
        if (!this.checkShouldIndexNode(index, resolvedFields)) {
            return [];
        }
        let keys = [[]];
        for (const component of index.index) {
            const result = resolvedFields[component.field];
            if (result.length === 1) {
                keys.forEach(e => e.push(result[0]));
            }
            else if (result.length) {
                const currentKey = keys[0];
                let didAddToFirstKey = false;
                for (const item of result) {
                    if (!didAddToFirstKey) {
                        keys = [currentKey.concat(item)];
                        didAddToFirstKey = true;
                    }
                    else {
                        keys.push(currentKey.concat(item));
                    }
                }
            }
            else {
                throw new conduit_utils_1.InternalError(`Failed to index ${component} for ${node.type}, Bad Index Config`);
            }
        }
        return keys;
    }
    flattenField(type, field) {
        const path = field.split('_');
        if (path.length <= 1) {
            return field;
        }
        for (const key in this.config[type].indexResolvers) {
            const graphqlPath = this.config[type].indexResolvers[key].graphqlPath;
            if (graphqlPath && conduit_utils_1.isEqual(path, graphqlPath)) {
                return key;
            }
        }
        throw new Error(`Unable to resolve non-existent index path: ${field}`);
    }
    chooseBestIndex(indexesArray, filters, sortParams, additionalParams) {
        const indexesWithParams = GraphIndexTypes_1.indexesWithAllParams(indexesArray, filters, sortParams.concat(additionalParams));
        if (!indexesWithParams.length) {
            const allParams = filters.map(f => f.field).concat(sortParams).concat(additionalParams);
            return GraphIndexTypes_1.indexWithTheMostParams(indexesArray, allParams);
        }
        let best;
        for (const index of indexesWithParams) {
            const unconditionalFilterParams = filters.filter(f => !GraphIndexTypes_1.indexHasConditionFilterParam(index, f)).map(f => f.field);
            const filterSet = new Set(unconditionalFilterParams);
            const indexFilterSet = new Set(index.index.slice(0, unconditionalFilterParams.length).map(comp => comp.field));
            const indexSortArray = index.index.slice(unconditionalFilterParams.length, unconditionalFilterParams.length + sortParams.length).map(comp => comp.field);
            // we are trying to find an index that starts with the filter fields (in any order) and then is followed by the sort fields (in order)
            if (conduit_utils_1.setEquals(filterSet, indexFilterSet) && conduit_utils_1.isEqual(sortParams, indexSortArray)) {
                // prefer the shortest matching index, and in-memory if available
                if (!best || index.index.length < best.index.length || (index.index.length === best.index.length && index.inMemoryIndex)) {
                    best = index;
                }
            }
        }
        return best || indexesWithParams[0];
    }
    indexForQuery(type, filters, sorts, fallbackFields = [], demandedIndexComponents = []) {
        const sortParams = sorts.map(sort => this.flattenField(type, sort.field));
        const unsortedFilters = filters.filter(f => !sortParams.includes(this.flattenField(type, f.field)));
        const filterParams = unsortedFilters.map(filter => this.flattenField(type, filter.field));
        let additionalParams = demandedIndexComponents.map(field => this.flattenField(type, field)).filter(field => !sortParams.includes(field) && !filterParams.includes(field));
        if (!sortParams.length && !filterParams.length && !additionalParams.length) {
            // When no filters or sorts are provided fallback to the query fields
            additionalParams = fallbackFields;
        }
        const indexes = this.indexesForType(type);
        const indexesArray = Object.values(indexes);
        if (!indexesArray.length) {
            throw new Error(`Shouldn't be able to run a list query on type: ${type} with no indexes defined in the config`);
        }
        const indexesNoConditional = indexesArray.filter(index => this.conditionsMatchFilters(index.indexCondition, filters));
        const best = indexesNoConditional.length ? this.chooseBestIndex(indexesNoConditional, unsortedFilters, sortParams, additionalParams) : undefined;
        if (best) {
            return best;
        }
        return this.chooseBestIndex(indexesArray, unsortedFilters, sortParams, additionalParams);
    }
    conditionsMatchFilters(conditions, filters) {
        for (const condition of conditions) {
            if (condition.ignoreForFiltering) {
                continue;
            }
            if (!filters.find(filter => this.filterMatchesConditional(filter, condition))) {
                return false;
            }
        }
        return true;
    }
    filterMatchesConditional(filter, condition) {
        var _a, _b;
        if (condition.field !== filter.field) {
            return false;
        }
        const match = filter.match;
        if (!match) {
            return false;
        }
        const filterValue = (_b = (_a = match.boolean) !== null && _a !== void 0 ? _a : match.int) !== null && _b !== void 0 ? _b : match.string;
        return condition.value === filterValue;
    }
    keyForQuery(type, iterationDirection, index, filters, firstKey = true) {
        if (!index.length) {
            throw new Error(`Invalid index given to keyForQuery`);
        }
        let minKey;
        let maxKey;
        const key = [];
        for (const indexComponent of index) {
            const filter = filters && filters.find(e => this.flattenField(type, e.field) === indexComponent.field);
            const filterValue = this.componentValueFromFilter(filter, indexComponent.order === 'ASC');
            if (filterValue === undefined) {
                const keyValue = indexComponent.order === iterationDirection ? (!firstKey ? matchAnyKeyRight : matchAnyKeyLeft) : (!firstKey ? matchAnyKeyLeft : matchAnyKeyRight);
                if (minKey && maxKey) {
                    minKey.push(keyValue);
                    maxKey.push(keyValue);
                }
                else {
                    key.push(keyValue);
                }
            }
            else {
                if (!isMinMaxIndexableType(filterValue)) {
                    if (minKey && maxKey) {
                        minKey.push(filterValue);
                        maxKey.push(filterValue);
                    }
                    else {
                        key.push(filterValue);
                    }
                }
                else {
                    if (minKey && maxKey) {
                        minKey.push(filterValue.min);
                        maxKey.push(filterValue.max);
                    }
                    else {
                        minKey = key.concat(filterValue.min);
                        maxKey = key.concat(filterValue.max);
                    }
                }
            }
        }
        if (minKey && maxKey) {
            return {
                min: minKey,
                max: maxKey,
            };
        }
        else {
            return key;
        }
    }
    iterationDirectionForQuery(type, index, sorts, reverseOrder) {
        if (!this.config.hasOwnProperty(type)) {
            throw new Error(`Attempt to query an index on an unconfigured type: ${type}`);
        }
        for (const indexComponent of index) {
            const sort = sorts.find(e => e.field === indexComponent.field);
            if (sort) {
                return indexComponent.order === sort.order ? 'ASC' : 'DESC';
            }
        }
        return reverseOrder ? 'DESC' : 'ASC';
    }
    componentValueFromFilter(filter, storedSortOrderAsc) {
        if (!filter) {
            return undefined;
        }
        if (filter.match) {
            if (filter.match.string !== undefined) {
                return filter.match.string;
            }
            else if (filter.match.int !== undefined) {
                return filter.match.int;
            }
            else if (filter.match.node) {
                return filter.match.node;
            }
            else {
                return filter.match.boolean;
            }
        }
        else if (filter.min || filter.max) {
            let min = filter.min && filter.min.string;
            if (min === undefined) {
                min = storedSortOrderAsc ? filter.min && filter.min.int : filter.max && filter.max.int;
            }
            if (min === undefined) {
                min = storedSortOrderAsc ? matchAnyKeyLeft : matchAnyKeyRight;
            }
            let max = filter.max && filter.max.string;
            if (max === undefined) {
                max = storedSortOrderAsc ? filter.max && filter.max.int : filter.min && filter.min.int;
            }
            if (max === undefined) {
                max = storedSortOrderAsc ? matchAnyKeyRight : matchAnyKeyLeft;
            }
            return {
                min,
                max,
            };
        }
        else if (filter.isSet !== undefined) {
            return filter.isSet ? undefined : null;
        }
        else if (filter.prefix) {
            const min = filter.prefix;
            const max = matchAnyKeyRight;
            return {
                min,
                max,
            };
        }
        else {
            return undefined;
        }
    }
    keyIsRanged(key) {
        return !Array.isArray(key);
    }
    filterValue(value, filter) {
        var _a, _b, _c, _d, _e, _f;
        if (filter.isSet !== undefined) {
            if (filter.isSet) {
                if ((Array.isArray(value) && !value.length) || value === null) {
                    return false;
                }
            }
            else {
                if ((Array.isArray(value) && value.length) || (!Array.isArray(value) && value !== null)) {
                    return false;
                }
            }
        }
        else if (filter.match) {
            if (filter.match.string !== undefined) {
                if (this.compare(value, filter.match.string, filter) !== 0) {
                    return false;
                }
            }
            else if (filter.match.int !== undefined) {
                if (this.compare(value, filter.match.int, filter) !== 0) {
                    return false;
                }
            }
            else if (filter.match.boolean !== undefined) {
                if (this.compare(value, filter.match.boolean, filter) !== 0) {
                    return false;
                }
            }
            else if (filter.match.node !== undefined) {
                if (this.compare(value, filter.match.node, filter) !== 0) {
                    return false;
                }
            }
        }
        else if (filter.min || filter.max) {
            // Range, but value is null
            if (value === null || value === undefined) {
                return false;
            }
            let min;
            let max;
            const valueType = conduit_utils_1.getTypeOf(value);
            if (((_a = filter.min) === null || _a === void 0 ? void 0 : _a.int) || ((_b = filter.max) === null || _b === void 0 ? void 0 : _b.int)) {
                if (valueType !== 'number') {
                    throw new Error(`Was filtering on: ${filter.field} with an integer range filter but encountered type: ${valueType}`);
                }
                min = (_c = filter.min) === null || _c === void 0 ? void 0 : _c.int;
                max = (_d = filter.max) === null || _d === void 0 ? void 0 : _d.int;
            }
            else {
                if (valueType !== 'string') {
                    throw new Error(`Was filtering on: ${filter.field} with a string range filter but encountered type: ${valueType}`);
                }
                min = (_e = filter.min) === null || _e === void 0 ? void 0 : _e.string;
                max = (_f = filter.max) === null || _f === void 0 ? void 0 : _f.string;
            }
            if (min === undefined) {
                min = matchAnyKeyLeft;
            }
            if (max === undefined) {
                max = matchAnyKeyRight;
            }
            if (this.compare(min, value, filter) > 0) {
                return false;
            }
            if (this.compare(max, value, filter) < 0) {
                return false;
            }
        }
        else if (filter.prefix) {
            if (!this.currentSearchPrefix) {
                this.currentSearchPrefix = filter.prefix.toLowerCase();
            }
            return String(value).toLowerCase().startsWith(this.currentSearchPrefix);
        }
        else {
            throw new Error(`Invalid filter: ${filter}`);
        }
        return true;
    }
    filter(obj, filters) {
        for (const filter of filters) {
            const filterPath = filter.field.split('_');
            const value = conduit_utils_1.walkObjectPathSupportsNumeric(obj, filterPath);
            if (!this.filterValue(value, filter)) {
                return false;
            }
        }
        return true;
    }
    keyFilterFactory(type, index, filters) {
        for (const filter of filters) {
            const filterField = filter.field.split('_').pop();
            if (filterField) {
                filter.field = filterField;
            }
        }
        return (key) => {
            if (!key) {
                return false;
            }
            if (!filters.length) {
                return true;
            }
            const indexOrderedFilters = [];
            for (const indexComponent of index) {
                const filter = filters.find(e => e.field === indexComponent.field);
                if (filter) {
                    const indexResolver = this.config[type].indexResolvers[indexComponent.field];
                    indexOrderedFilters.push(Object.assign(Object.assign({}, filter), { useLocaleCompare: indexResolver.useLocaleCompare }));
                }
            }
            if (!indexOrderedFilters.length) {
                return true;
            }
            for (const filter of indexOrderedFilters) {
                const keyIndex = index.findIndex(e => e.field === filter.field);
                if (keyIndex < 0 || keyIndex >= key.length) {
                    conduit_utils_1.logger.warn(`Unable to find component: ${filter.field} in key: ${key}`);
                    return false;
                }
                const keyValue = key[keyIndex];
                if (!this.filterValue(keyValue, filter)) {
                    return false;
                }
            }
            return true;
        };
    }
    valuesForItem(type, definition, indexUsed, key, forLegacyAPI) {
        var _a, _b;
        const fields = this.indexedValuesFromKeyFactory(type, indexUsed, forLegacyAPI)(key);
        fields.type = type;
        if (!forLegacyAPI) {
            fields.unindexed = {
                id: fields.id,
                type,
            };
            return fields;
        }
        const containerizedIndexResolvers = this.containerizedIndexResolversForType(type);
        for (const fetchDirection in containerizedIndexResolvers) {
            for (const container in containerizedIndexResolvers[fetchDirection]) {
                if (fields.hasOwnProperty(container) && fields[container]) {
                    const ID = fields[container].id;
                    if (ID === null) {
                        continue;
                    }
                    if (ID === undefined) {
                        throw new conduit_utils_1.InternalError(`Got undefined id in containerized resolver: ${conduit_utils_1.safeStringify(fields[container])}`);
                    }
                    const isInputEdge = fetchDirection === 'inputs';
                    if (isInputEdge) {
                        if (!definition.inputs || !definition.inputs.hasOwnProperty(container)) {
                            throw new Error(`Mismatch between index config and data model, shouldn't happen`);
                        }
                        fields[container] = [{
                                srcID: ID,
                                srcType: ((_a = fields[container]) === null || _a === void 0 ? void 0 : _a.type) || definition.inputs[container].connections[0][0],
                            }];
                    }
                    else {
                        if (!definition.outputs || !definition.outputs.hasOwnProperty(container)) {
                            throw new Error(`Mismatch between index config and data model, shouldn't happen`);
                        }
                        fields[container] = [{
                                dstID: ID,
                                dstType: ((_b = fields[container]) === null || _b === void 0 ? void 0 : _b.type) || definition.outputs[container].connections[0][0],
                            }];
                    }
                }
            }
        }
        return fields;
    }
    async getIterator(trc, watcher, tree, type, indexItem, filters, sorts, reverseOrder, pageInfo) {
        this.currentSearchPrefix = null;
        const iterationDirection = this.iterationDirectionForQuery(type, indexItem.index, sorts, reverseOrder);
        const firstKeyInSet = this.keyForQuery(type, iterationDirection, indexItem.index, filters, true);
        const lastKeyInSet = this.keyForQuery(type, iterationDirection, indexItem.index, filters, false);
        if (!firstKeyInSet || !lastKeyInSet) {
            throw new conduit_utils_1.InternalError(`Could not build keys for query`);
        }
        if (this.doValidation) {
            await tree.validate();
        }
        let iterator;
        if (this.keyIsRanged(firstKeyInSet)) {
            const firstKey = iterationDirection === 'ASC' ? firstKeyInSet.min : firstKeyInSet.max;
            const lastKey = iterationDirection === 'ASC' ? firstKeyInSet.max : firstKeyInSet.min;
            const startKey = await getStartKey(trc, watcher, pageInfo, tree, firstKey, lastKey, iterationDirection);
            iterator = new IndexingIterator_1.IndexingIterator(trc, watcher, this.keyFilterFactory(type, indexItem.index, filters), tree, iterationDirection === 'ASC', firstKey, lastKey, startKey !== null && startKey !== void 0 ? startKey : undefined, pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.pageSize);
        }
        else {
            const startKey = await getStartKey(trc, watcher, pageInfo, tree, firstKeyInSet, lastKeyInSet, iterationDirection);
            iterator = new IndexingIterator_1.IndexingIterator(trc, watcher, this.keyFilterFactory(type, indexItem.index, filters), tree, iterationDirection === 'ASC', firstKeyInSet, lastKeyInSet, startKey !== null && startKey !== void 0 ? startKey : undefined, pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.pageSize);
        }
        return iterator;
    }
    async getCount(trc, watcher, tree, type, indexItem, filters) {
        let leftKey = this.keyForQuery(type, 'ASC', indexItem.index, filters);
        let rightKey = this.keyForQuery(type, 'DESC', indexItem.index, filters);
        if (!leftKey || !rightKey) {
            throw new Error(`Invalid key`);
        }
        if (this.keyIsRanged(leftKey) || this.keyIsRanged(rightKey)) {
            // If one is ranged then they both are, this is for the compiler
            if (this.keyIsRanged(leftKey)) {
                rightKey = leftKey.max;
                leftKey = leftKey.min;
            }
            else if (this.keyIsRanged(rightKey)) {
                leftKey = rightKey.min;
                rightKey = rightKey.max;
            }
        }
        if (this.doValidation) {
            await tree.validate();
        }
        return tree.getNumberOfItemsBetweenKeys(trc, watcher, leftKey, rightKey);
    }
    async getList(trc, watcher, tree, type, definition, params, forLegacyAPI) {
        var e_1, _a;
        const iterator = await this.getIterator(trc, watcher, tree, type, params.indexUsed, params.indexedFilters, params.indexedSorts, params.reverseOrder, params.pageInfo);
        if (!iterator) {
            throw new Error(`Failed to get iterator`);
        }
        let lastStart = Date.now();
        const list = [];
        try {
            for (var iterator_1 = __asyncValues(iterator), iterator_1_1; iterator_1_1 = await iterator_1.next(), !iterator_1_1.done;) {
                const key = iterator_1_1.value;
                if (!key) {
                    continue;
                }
                if (Date.now() - lastStart > LIST_TIMEBOX) {
                    // yield the CPU for other queries, because in the case where the index tree nodes are all cached in
                    // memory this iteration will not yield otherwise
                    await conduit_utils_1.sleep(5);
                    lastStart = Date.now();
                }
                const fields = this.valuesForItem(type, definition, params.indexUsed, key, forLegacyAPI);
                list.push(Object.assign(Object.assign({}, fields), { key: conduit_utils_1.safeStringify(key) }));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterator_1_1 && !iterator_1_1.done && (_a = iterator_1.return)) await _a.call(iterator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return {
            list,
            clientPageInfo: iterator.clientPageInfo,
        };
    }
}
exports.EvernoteIndexer = EvernoteIndexer;
//# sourceMappingURL=EvernoteIndexer.js.map