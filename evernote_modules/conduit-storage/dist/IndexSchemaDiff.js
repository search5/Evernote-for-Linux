"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.extractDiffableIndexConfig = exports.haveStoredIndexesChanged = exports.hasStoredIndexChanged = void 0;
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
function objectKeysAsSet(...args) {
    const keys = new Set();
    for (const obj of args) {
        for (const key in obj) {
            keys.add(key);
        }
    }
    return keys;
}
function isBreakingSchemaChange(oldType, newType) {
    if (conduit_utils_1.isEqual(oldType, newType)) {
        return false;
    }
    // allow going from non-null to nullable
    if (conduit_utils_1.isEqual(conduit_utils_1.fieldForceRequired(oldType, false), newType)) {
        return false;
    }
    return true;
}
function hasIndexItemChanged(oldItem, newItem) {
    if (!oldItem || !newItem) {
        // if one is defined and the other isn't, then that's a change; if they are both undefined then it is not a change
        return Boolean(oldItem || newItem);
    }
    if (!conduit_utils_1.isEqual(oldItem.indexCondition, newItem.indexCondition)) {
        return true;
    }
    if (oldItem.index.length !== newItem.index.length) {
        return true;
    }
    // now for the real special casing
    for (let i = 0; i < newItem.index.length; ++i) {
        const oldField = oldItem.index[i];
        const newField = newItem.index[i];
        if (oldField.field !== newField.field) {
            return true;
        }
        if (oldField.order !== newField.order) {
            return true;
        }
        if (isBreakingSchemaChange(oldField.type, newField.type)) {
            return true;
        }
    }
    return false;
}
function hasStoredIndexChanged(oldIndex, newIndex) {
    if (!oldIndex || !newIndex) {
        // if one is defined and the other isn't, then that's a change; if they are both undefined then it is not a change
        return Boolean(oldIndex || newIndex);
    }
    const keys = objectKeysAsSet(oldIndex, newIndex);
    for (const k of keys.keys()) {
        const key = k;
        if (key === 'indexItem') {
            if (hasIndexItemChanged(oldIndex.indexItem, newIndex.indexItem)) {
                return true;
            }
        }
        else if (!conduit_utils_1.isEqual(oldIndex[key], newIndex[key])) {
            return true;
        }
    }
    return false;
}
exports.hasStoredIndexChanged = hasStoredIndexChanged;
function haveStoredIndexesChanged(oldIndexes, newIndexes) {
    const keys = objectKeysAsSet(oldIndexes, newIndexes);
    for (const key of keys.keys()) {
        if (hasStoredIndexChanged(oldIndexes[key], newIndexes[key])) {
            return true;
        }
    }
    return false;
}
exports.haveStoredIndexesChanged = haveStoredIndexesChanged;
function extractDiffableIndexConfig(config) {
    const res = {};
    const types = Object.keys(config).sort();
    for (const type of types) {
        const typeConfig = config[type];
        const indexes = {};
        const sortedIndexKeys = Object.keys(typeConfig.indexes).sort();
        for (const indexKey of sortedIndexKeys) {
            const indexConfig = SimplyImmutable.cloneMutable(typeConfig.indexes[indexKey]);
            delete indexConfig.inMemoryIndex;
            delete indexConfig.key;
            for (const field of indexConfig.index) {
                delete field.isMatchField;
            }
            indexes[indexKey] = indexConfig;
        }
        res[type] = {
            indexes,
            lookups: typeConfig.lookups,
        };
    }
    return res;
}
exports.extractDiffableIndexConfig = extractDiffableIndexConfig;
//# sourceMappingURL=IndexSchemaDiff.js.map