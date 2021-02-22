"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferSchemaFieldType = exports.validateSchemaValue = exports.validateSchemaType = exports.getSchemaDefaults = exports.getSchemaTypeDefaultValue = exports.fieldForceRequired = exports.fieldTypeToCore = exports.fieldTypeIsEnum = exports.fieldTypeIsObject = exports.fieldMapTypeToCore = exports.fieldIsMapType = exports.fieldArrayTypeToCore = exports.fieldIsArrayType = exports.fieldTypeToNonNull = exports.isNullableEnum = exports.fieldIsNullable = void 0;
const en_ts_utils_1 = require("en-ts-utils");
function fieldIsNullable(fieldType) {
    return fieldType.slice(-1) === '?';
}
exports.fieldIsNullable = fieldIsNullable;
function isNullableEnum(fieldType) {
    return Array.isArray(fieldType) && fieldType.length > 1 && fieldType[fieldType.length - 1] === '?';
}
exports.isNullableEnum = isNullableEnum;
function fieldTypeToNonNull(fieldType) {
    // strip off '?'
    return fieldType.slice(0, -1);
}
exports.fieldTypeToNonNull = fieldTypeToNonNull;
function fieldIsArrayType(fieldType) {
    return fieldType.slice(-2) === '[]';
}
exports.fieldIsArrayType = fieldIsArrayType;
function fieldArrayTypeToCore(fieldType) {
    // strip off '[]'
    return fieldType.slice(0, -2);
}
exports.fieldArrayTypeToCore = fieldArrayTypeToCore;
function fieldIsMapType(fieldType) {
    if (typeof fieldType !== 'string') {
        return false;
    }
    return fieldType.slice(0, 4) === 'map<';
}
exports.fieldIsMapType = fieldIsMapType;
function fieldMapTypeToCore(fieldType) {
    // strip off 'map<>'
    return fieldType.slice(4, -1);
}
exports.fieldMapTypeToCore = fieldMapTypeToCore;
function fieldTypeIsObject(fieldType) {
    return en_ts_utils_1.getTypeOf(fieldType) === 'object';
}
exports.fieldTypeIsObject = fieldTypeIsObject;
function fieldTypeIsEnum(fieldType) {
    return Array.isArray(fieldType) && fieldType.length > 0 && (typeof fieldType[0] === 'string');
}
exports.fieldTypeIsEnum = fieldTypeIsEnum;
function fieldTypeIsCore(fieldType) {
    return !fieldTypeIsObject(fieldType) && !fieldTypeIsEnum(fieldType) && !fieldIsNullable(fieldType) && !fieldIsArrayType(fieldType) && !fieldIsMapType(fieldType);
}
function fieldTypeToCore(fieldType) {
    if (fieldTypeIsEnum(fieldType)) {
        return 'string';
    }
    const nonNull = fieldIsNullable(fieldType) ? fieldTypeToNonNull(fieldType) : fieldType;
    if (fieldIsMapType(nonNull)) {
        return fieldMapTypeToCore(nonNull);
    }
    if (fieldIsArrayType(nonNull)) {
        return fieldArrayTypeToCore(nonNull);
    }
    return nonNull;
}
exports.fieldTypeToCore = fieldTypeToCore;
function fieldForceRequired(fieldType, isRequired) {
    if (fieldTypeIsEnum(fieldType)) {
        if (isNullableEnum(fieldType)) {
            if (isRequired) {
                return fieldType.slice(0, -1);
            }
        }
        else if (!isRequired) {
            return fieldType.concat('?');
        }
        return fieldType;
    }
    if (fieldIsNullable(fieldType)) {
        if (isRequired) {
            return fieldTypeToNonNull(fieldType);
        }
    }
    else if (!isRequired) {
        return fieldType + '?';
    }
    return fieldType;
}
exports.fieldForceRequired = fieldForceRequired;
function getSchemaTypeDefaultValue(fieldType) {
    if (fieldTypeIsEnum(fieldType)) {
        return isNullableEnum(fieldType) ? null : fieldType[0];
    }
    if (fieldTypeIsObject(fieldType)) {
        return getSchemaDefaults(fieldType);
    }
    if (fieldIsNullable(fieldType)) {
        return null;
    }
    if (fieldIsArrayType(fieldType)) {
        return [];
    }
    if (fieldIsMapType(fieldType)) {
        return {};
    }
    switch (fieldType) {
        case 'ID':
        case 'unknown':
            return null;
        case 'string':
        case 'url':
            return '';
        case 'number':
        case 'int':
        case 'timestamp':
            return 0;
        case 'boolean':
            return false;
        case 'EntityRef':
            return {
                id: '',
                type: '',
            };
        default:
            throw en_ts_utils_1.absurd(fieldType, 'fieldType');
    }
}
exports.getSchemaTypeDefaultValue = getSchemaTypeDefaultValue;
function getSchemaDefaults(schema) {
    const ret = {};
    if (!schema) {
        return ret;
    }
    for (const field in schema) {
        ret[field] = getSchemaTypeDefaultValue(schema[field]);
    }
    return ret;
}
exports.getSchemaDefaults = getSchemaDefaults;
function validateSchemaType(fieldType, path, value, objectStrictCheck = true) {
    if (!fieldType) {
        throw new Error(`Field not in schema: [${path}]`);
    }
    const valType = en_ts_utils_1.getTypeOf(value);
    if (fieldTypeIsEnum(fieldType)) {
        if (isNullableEnum(fieldType) && value === null) {
            return;
        }
        else if (valType !== 'string' || fieldType.indexOf(value) < 0) {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        return;
    }
    if (fieldTypeIsObject(fieldType)) {
        if (valType !== 'object') {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        for (const key in fieldType) {
            validateSchemaType(fieldType[key], path.concat('.', key), value[key]);
        }
        if (!objectStrictCheck) {
            return;
        }
        for (const key in value) {
            if (!fieldType.hasOwnProperty(key)) {
                throw new Error(`Field does not exist in schema: [${path.concat('.', key)}]`);
            }
        }
        return;
    }
    if (typeof fieldType !== 'string') {
        throw new Error(`Field value does not match schema: [${path}]`);
    }
    if (fieldIsNullable(fieldType)) {
        if (valType === 'undefined' || valType === 'null') {
            // isValid = true
            return;
        }
        fieldType = fieldTypeToNonNull(fieldType);
    }
    if (fieldIsArrayType(fieldType)) {
        if (!Array.isArray(value)) {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        const coreType = fieldArrayTypeToCore(fieldType);
        for (let i = 0; i < value.length; ++i) {
            validateSchemaType(coreType, path.concat('.', i.toString()), value[i]);
        }
        return;
    }
    if (fieldIsMapType(fieldType)) {
        if (valType !== 'object') {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        const coreType = fieldMapTypeToCore(fieldType);
        for (const key in value) {
            validateSchemaType(coreType, path.concat('.', key), value[key]);
        }
        return;
    }
    let isValid = false;
    switch (fieldType) {
        case 'ID':
        case 'string':
        case 'url':
            isValid = valType === 'string';
            break;
        case 'number':
            isValid = valType === 'number' && isFinite(value);
            break;
        case 'int':
        case 'timestamp':
            isValid = valType === 'number';
            break;
        case 'boolean':
            isValid = valType === 'boolean';
            break;
        case 'EntityRef':
            isValid = valType === 'object' && typeof value.type === 'string' && typeof value.id === 'string';
            break;
        case 'unknown':
            isValid = true;
            break;
        default:
            throw en_ts_utils_1.absurd(fieldType, 'fieldType');
    }
    if (!isValid) {
        throw new Error(`Field value does not match schema: [${path}]`);
    }
}
exports.validateSchemaType = validateSchemaType;
function validateSchemaValue(fieldValidation, path, value) {
    switch (typeof value) {
        case 'object': {
            if (Array.isArray(value)) {
                for (const key in value) {
                    validateSchemaValue(fieldValidation, path, value[key]);
                }
            }
            else {
                for (const key in value) {
                    validateSchemaValue(fieldValidation, path.concat('.', key), value[key]);
                }
            }
            break;
        }
        case 'number': {
            const validationBlock = fieldValidation[path];
            if (validationBlock) {
                if (validationBlock.min && value < validationBlock.min) {
                    throw new Error(`Validation Failed: ${path} to low`);
                }
                if (validationBlock.max && value > validationBlock.max) {
                    throw new Error(`Validation Failed: ${path} to high`);
                }
            }
            break;
        }
        case 'string': {
            const validationBlock = fieldValidation[path];
            const len = value.length;
            if (validationBlock) {
                if (validationBlock.min && validationBlock.min > len) {
                    throw new Error(`Validation Failed: ${path} to short`);
                }
                if (validationBlock.max && validationBlock.max < len) {
                    throw new Error(`Validation Failed: ${path} to long`);
                }
                if (validationBlock.regex && !validationBlock.regex.exec(value)) {
                    throw new Error(`Validation Failed: ${path} invalid characters`);
                }
            }
            break;
        }
    }
}
exports.validateSchemaValue = validateSchemaValue;
function inferSchemaFieldType(value) {
    const valType = en_ts_utils_1.getTypeOf(value);
    switch (valType) {
        case 'boolean':
        case 'number':
        case 'string':
            return valType;
        case 'null':
        case 'undefined':
            return 'unknown?';
        case 'array': {
            const arrType = inferSchemaFieldType(valType[0]);
            if (fieldTypeIsCore(arrType)) {
                return (arrType + '[]');
            }
            return 'unknown[]';
        }
    }
    return 'unknown';
}
exports.inferSchemaFieldType = inferSchemaFieldType;
//# sourceMappingURL=DataSchema.js.map