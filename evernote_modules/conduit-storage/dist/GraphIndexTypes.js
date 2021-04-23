"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStoredIndexItem = exports.fromStoredIndexItem = exports.toStoredIndexSchema = exports.fromStoredIndexSchema = exports.isLookup = exports.isIndex = exports.indexesWithAnyParams = exports.indexesWithAllParams = exports.indexHasConditionFilterParam = exports.indexWithTheMostParams = exports.IndexPriority = exports.INDEX_CONFIG_VERSION = void 0;
const conduit_utils_1 = require("conduit-utils");
// increment this number if you make a breaking change to the IndexesItem interface or the stored index tree structure
exports.INDEX_CONFIG_VERSION = 9; // Conor: PropagatedFields
var IndexPriority;
(function (IndexPriority) {
    IndexPriority[IndexPriority["HIGH"] = 0] = "HIGH";
    IndexPriority[IndexPriority["DEFAULT"] = 50] = "DEFAULT";
    IndexPriority[IndexPriority["LOW"] = 100] = "LOW";
})(IndexPriority = exports.IndexPriority || (exports.IndexPriority = {}));
function indexWithTheMostParams(indexes, params) {
    if (!indexes.length) {
        throw new Error('Indexes must be passed to indexWithTheMostParams but got none');
    }
    if (!params.length) {
        conduit_utils_1.logger.warn(`No params sent to indexWithTheMostParams. Choosing the first index in the config.`);
        return indexes[0];
    }
    let max = 0;
    let bestIndex = null;
    for (const index of indexes) {
        const matchCount = index.index.reduce((prevCount, indexField) => {
            return params.includes(indexField.field) ? prevCount + 1 : prevCount;
        }, 0);
        if (matchCount >= max) {
            max = matchCount;
            bestIndex = index;
        }
    }
    if (!bestIndex) {
        throw new Error(`indexWithTheMostParams was unable to choose an index from: ${indexes}`);
    }
    return bestIndex;
}
exports.indexWithTheMostParams = indexWithTheMostParams;
function indexHasConditionFilterParam(index, filter) {
    var _a, _b;
    const match = filter.match;
    if (!match || match.node) {
        return false;
    }
    const filterValue = (_b = (_a = match.boolean) !== null && _a !== void 0 ? _a : match.int) !== null && _b !== void 0 ? _b : match.string;
    return index.indexCondition.find(cond => cond.field === filter.field && cond.value === filterValue);
}
exports.indexHasConditionFilterParam = indexHasConditionFilterParam;
function indexesWithAllParams(indexes, filters, nonFilterParams) {
    return indexes.filter(indexItem => {
        for (const filter of filters) {
            const found = indexItem.index.find(comp => comp.field === filter.field);
            if (!found) {
                const foundCondition = indexHasConditionFilterParam(indexItem, filter);
                if (!foundCondition) {
                    return false;
                }
            }
        }
        for (const param of nonFilterParams) {
            const found = indexItem.index.find(comp => comp.field === param);
            if (!found) {
                return false;
            }
        }
        return true;
    });
}
exports.indexesWithAllParams = indexesWithAllParams;
function indexesWithAnyParams(indexes, params) {
    return indexes.filter(indexItem => {
        if (isLookup(indexItem)) {
            return params.includes(indexItem);
        }
        for (const param of params) {
            let found = indexItem.index.find(comp => comp.field === param);
            if (found) {
                return true;
            }
            found = indexItem.indexCondition.find(comp => comp.field === param);
            if (found) {
                return true;
            }
        }
        return false;
    });
}
exports.indexesWithAnyParams = indexesWithAnyParams;
function isIndex(indexOrLookup) {
    return typeof indexOrLookup !== 'string';
}
exports.isIndex = isIndex;
function isLookup(indexOrLookup) {
    return typeof indexOrLookup === 'string';
}
exports.isLookup = isLookup;
function fromStoredIndexSchema(storedType) {
    if (typeof storedType === 'string') {
        if (storedType.slice(-1) === '?') {
            return conduit_utils_1.Nullable(storedType.slice(0, -1));
        }
        return storedType;
    }
    else if (Array.isArray(storedType)) {
        if (storedType.slice(-1)[0] === '?') {
            return conduit_utils_1.NullableEnum(storedType.slice(0, -1), 'temp');
        }
        else {
            return conduit_utils_1.Enum(storedType, 'temp');
        }
    }
    else {
        return storedType;
    }
}
exports.fromStoredIndexSchema = fromStoredIndexSchema;
function toStoredIndexSchema(runtimeType) {
    if (conduit_utils_1.fieldTypeIsNullable(runtimeType)) {
        const innerType = runtimeType.nullableType;
        if (conduit_utils_1.fieldTypeIsEnum(innerType)) {
            return Object.keys(innerType.enumMap).concat('?');
        }
        return (innerType + '?');
    }
    if (conduit_utils_1.fieldTypeIsEnum(runtimeType)) {
        return Object.keys(runtimeType.enumMap);
    }
    return runtimeType;
}
exports.toStoredIndexSchema = toStoredIndexSchema;
function fromStoredIndexItem(indexItem) {
    if (!indexItem) {
        return undefined;
    }
    return {
        key: indexItem.key,
        index: indexItem.index.map(ind => {
            return {
                field: ind.field,
                order: ind.order,
                type: fromStoredIndexSchema(ind.type),
                isMatchField: ind.isMatchField,
            };
        }),
        indexCondition: indexItem.indexCondition,
        inMemoryIndex: indexItem.inMemoryIndex,
    };
}
exports.fromStoredIndexItem = fromStoredIndexItem;
function toStoredIndexItem(indexItem) {
    return {
        key: indexItem.key,
        index: indexItem.index.map(ind => {
            return {
                field: ind.field,
                order: ind.order,
                type: toStoredIndexSchema(ind.type),
                isMatchField: ind.isMatchField,
            };
        }),
        indexCondition: indexItem.indexCondition,
        inMemoryIndex: indexItem.inMemoryIndex,
    };
}
exports.toStoredIndexItem = toStoredIndexItem;
//# sourceMappingURL=GraphIndexTypes.js.map