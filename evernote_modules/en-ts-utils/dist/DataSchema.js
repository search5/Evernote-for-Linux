"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseSchema = exports.validateSchemaValue = exports.validateSchemaType = exports.validateSchemaAndPopulateDefaults = exports.getSchemaDefaults = exports.getSchemaTypeDefaultValue = exports.fieldTypeOverrideNullability = exports.fieldTypeToCore = exports.fieldTypeToNonNull = exports.NullableEntityRef = exports.NullableTimestamp = exports.NullableInt = exports.NullableNumber = exports.NullableBoolean = exports.NullableUrl = exports.NullableString = exports.NullableID = exports.ListOfStructs = exports.NullableStruct = exports.NullableMapOf = exports.NullableListOf = exports.NullableEnumWithKeys = exports.NullableEnum = exports.ExtendStruct = exports.Struct = exports.MapOf = exports.ListOf = exports.Nullable = exports.EnumWithKeys = exports.Enum = exports.fieldTypeIsBasic = exports.fieldTypeIsStruct = exports.fieldTypeIsMap = exports.fieldTypeIsList = exports.fieldTypeIsNullable = exports.fieldTypeIsEnum = exports.fieldTypeIsCore = void 0;
const Errors_1 = require("./Errors");
const index_1 = require("./index");
function fieldTypeIsCore(fieldType) {
    return typeof fieldType === 'string';
}
exports.fieldTypeIsCore = fieldTypeIsCore;
function fieldTypeIsEnum(fieldType) {
    return index_1.getTypeOf(fieldType) === 'object' && ('enumMap' in fieldType);
}
exports.fieldTypeIsEnum = fieldTypeIsEnum;
function fieldTypeIsNullable(fieldType) {
    return index_1.getTypeOf(fieldType) === 'object' && ('nullableType' in fieldType);
}
exports.fieldTypeIsNullable = fieldTypeIsNullable;
function fieldTypeIsList(fieldType) {
    return index_1.getTypeOf(fieldType) === 'object' && ('listType' in fieldType);
}
exports.fieldTypeIsList = fieldTypeIsList;
function fieldTypeIsMap(fieldType) {
    return index_1.getTypeOf(fieldType) === 'object' && ('mapType' in fieldType);
}
exports.fieldTypeIsMap = fieldTypeIsMap;
function fieldTypeIsStruct(fieldType) {
    return index_1.getTypeOf(fieldType) === 'object' && ('fields' in fieldType);
}
exports.fieldTypeIsStruct = fieldTypeIsStruct;
function fieldTypeIsBasic(fieldType) {
    if (fieldTypeIsNullable(fieldType)) {
        return fieldTypeIsBasic(fieldType.nullableType);
    }
    return fieldTypeIsEnum(fieldType) || fieldTypeIsCore(fieldType);
}
exports.fieldTypeIsBasic = fieldTypeIsBasic;
function Enum(values, name) {
    values = Array.isArray(values) ? values : Object.values(values);
    return {
        name,
        enumMap: values.reduce((o, v) => {
            o[v] = v;
            return o;
        }, {}),
    };
}
exports.Enum = Enum;
function EnumWithKeys(enumMap, name) {
    return {
        name,
        enumMap,
    };
}
exports.EnumWithKeys = EnumWithKeys;
function Nullable(type) {
    return {
        nullableType: type,
    };
}
exports.Nullable = Nullable;
function ListOf(type) {
    return {
        listType: type,
    };
}
exports.ListOf = ListOf;
function MapOf(type) {
    return {
        mapType: type,
    };
}
exports.MapOf = MapOf;
function Struct(fields, name) {
    return {
        name,
        fields,
    };
}
exports.Struct = Struct;
function ExtendStruct(baseStruct, fields, name) {
    return {
        name,
        fields: Object.assign(Object.assign({}, baseStruct.fields), fields),
    };
}
exports.ExtendStruct = ExtendStruct;
function NullableEnum(values, name) {
    return {
        nullableType: Enum(values, name),
    };
}
exports.NullableEnum = NullableEnum;
function NullableEnumWithKeys(enumMap, name) {
    return {
        nullableType: EnumWithKeys(enumMap, name),
    };
}
exports.NullableEnumWithKeys = NullableEnumWithKeys;
function NullableListOf(type) {
    return {
        nullableType: {
            listType: type,
        },
    };
}
exports.NullableListOf = NullableListOf;
function NullableMapOf(type) {
    return {
        nullableType: {
            mapType: type,
        },
    };
}
exports.NullableMapOf = NullableMapOf;
function NullableStruct(fields, name) {
    return {
        nullableType: {
            name,
            fields,
        },
    };
}
exports.NullableStruct = NullableStruct;
function ListOfStructs(fields, name) {
    return {
        listType: {
            name,
            fields,
        },
    };
}
exports.ListOfStructs = ListOfStructs;
// these constants are for convenience and to save memory
exports.NullableID = Nullable('ID');
exports.NullableString = Nullable('string');
exports.NullableUrl = Nullable('url');
exports.NullableBoolean = Nullable('boolean');
exports.NullableNumber = Nullable('number');
exports.NullableInt = Nullable('int');
exports.NullableTimestamp = Nullable('timestamp');
exports.NullableEntityRef = Nullable('EntityRef');
function fieldTypeToNonNull(fieldType) {
    if (!fieldTypeIsNullable(fieldType)) {
        return fieldType;
    }
    return fieldType.nullableType;
}
exports.fieldTypeToNonNull = fieldTypeToNonNull;
function fieldTypeToCore(fieldType) {
    if (fieldTypeIsEnum(fieldType)) {
        return 'string';
    }
    if (fieldTypeIsNullable(fieldType)) {
        return fieldTypeToCore(fieldType.nullableType);
    }
    if (fieldTypeIsList(fieldType)) {
        return fieldTypeToCore(fieldType.listType);
    }
    if (fieldTypeIsMap(fieldType)) {
        return fieldType.mapType;
    }
    if (fieldTypeIsStruct(fieldType)) {
        // multiple fields, no way to strip this down to just one type
        return null;
    }
    return fieldType;
}
exports.fieldTypeToCore = fieldTypeToCore;
function fieldTypeOverrideNullability(fieldType, shouldBeNullable) {
    if (fieldTypeIsNullable(fieldType)) {
        if (!shouldBeNullable) {
            return fieldTypeToNonNull(fieldType);
        }
    }
    else if (shouldBeNullable) {
        return Nullable(fieldType);
    }
    return fieldType;
}
exports.fieldTypeOverrideNullability = fieldTypeOverrideNullability;
function getSchemaTypeDefaultValue(fieldType) {
    if (fieldTypeIsEnum(fieldType)) {
        return index_1.firstStashEntry(fieldType.enumMap);
    }
    if (fieldTypeIsNullable(fieldType)) {
        return null;
    }
    if (fieldTypeIsList(fieldType)) {
        return [];
    }
    if (fieldTypeIsMap(fieldType)) {
        return {};
    }
    if (fieldTypeIsStruct(fieldType)) {
        return getSchemaDefaults(fieldType.fields);
    }
    switch (fieldType) {
        case 'ID':
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
            throw index_1.absurd(fieldType, 'fieldType');
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
function validateSchemaAndPopulateDefaults(obj, schema) {
    for (const key in schema) {
        if (key in obj) {
            validateSchemaType(schema[key], key, obj[key], false, false, true);
        }
        else {
            obj[key] = getSchemaTypeDefaultValue(schema[key]);
        }
    }
    return obj;
}
exports.validateSchemaAndPopulateDefaults = validateSchemaAndPopulateDefaults;
function validateSchemaType(fieldType, path, value, objectStrictCheck = true, deepObjectStrictCheck = true, fillDefaults = false) {
    if (!fieldType) {
        throw new Error(`Field not in schema: [${path}]`);
    }
    const valType = index_1.getTypeOf(value);
    if (fieldTypeIsEnum(fieldType)) {
        if (!Object.values(fieldType.enumMap).includes(value)) {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        return;
    }
    if (fieldTypeIsNullable(fieldType)) {
        if (index_1.isNullish(value)) {
            return;
        }
        validateSchemaType(fieldType.nullableType, path, value, objectStrictCheck, deepObjectStrictCheck, fillDefaults);
        return;
    }
    if (fieldTypeIsList(fieldType)) {
        if (!Array.isArray(value)) {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        for (let i = 0; i < value.length; ++i) {
            validateSchemaType(fieldType.listType, path.concat('.', i.toString()), value[i], deepObjectStrictCheck, deepObjectStrictCheck, fillDefaults);
        }
        return;
    }
    if (fieldTypeIsMap(fieldType)) {
        if (valType !== 'object') {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        const mapType = fieldType.mapType;
        if (mapType === null) {
            throw new Error(`Unexpected fieldType found while validating against schema: [${path}]`);
        }
        for (const key in value) {
            validateSchemaType(mapType, path.concat('.', key), value[key], deepObjectStrictCheck, deepObjectStrictCheck, fillDefaults);
        }
        return;
    }
    if (fieldTypeIsStruct(fieldType)) {
        if (valType !== 'object') {
            throw new Error(`Field value does not match schema: [${path}]`);
        }
        for (const key in fieldType.fields) {
            if (fillDefaults && !(key in value)) {
                value[key] = getSchemaTypeDefaultValue(fieldType.fields[key]);
            }
            else {
                validateSchemaType(fieldType.fields[key], path.concat('.', key), value[key], deepObjectStrictCheck, deepObjectStrictCheck, fillDefaults);
            }
        }
        if (!objectStrictCheck) {
            return;
        }
        for (const key in value) {
            if (!fieldType.fields.hasOwnProperty(key)) {
                throw new Error(`Field does not exist in schema: [${path.concat('.', key)}]`);
            }
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
        default:
            throw index_1.absurd(fieldType, 'fieldType');
    }
    if (!isValid) {
        throw new Error(`Field value does not match schema: [${path}]`);
    }
}
exports.validateSchemaType = validateSchemaType;
function validateSchemaValue(fieldValidation, path, value) {
    var _a, _b;
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
                const fieldName = (_a = validationBlock.debugName) !== null && _a !== void 0 ? _a : path;
                if (validationBlock.min && value < validationBlock.min) {
                    throw new Errors_1.MalformedDataError(`Validation Failed: ${fieldName} too low`);
                }
                if (validationBlock.max && value > validationBlock.max) {
                    throw new Errors_1.MalformedDataError(`Validation Failed: ${fieldName} too high`);
                }
            }
            break;
        }
        case 'string': {
            const validationBlock = fieldValidation[path];
            const len = value.length;
            if (validationBlock) {
                const fieldName = (_b = validationBlock.debugName) !== null && _b !== void 0 ? _b : path;
                if (validationBlock.min && validationBlock.min > len) {
                    throw new Errors_1.MalformedDataError(`Validation Failed: ${fieldName} too short`);
                }
                if (validationBlock.max && validationBlock.max < len) {
                    throw new Errors_1.MalformedDataError(`Validation Failed: ${fieldName} too long`);
                }
                if (validationBlock.regex && !validationBlock.regex.exec(value)) {
                    throw new Errors_1.MalformedDataError(`Validation Failed: ${fieldName} invalid characters`);
                }
            }
            break;
        }
    }
}
exports.validateSchemaValue = validateSchemaValue;
function traverseSchemaInternal(field, path) {
    if (!field) {
        return null;
    }
    if (!path.length) {
        return field;
    }
    if (fieldTypeIsStruct(field)) {
        return traverseSchemaInternal(field.fields[path[0]], path.slice(1));
    }
    if (fieldTypeIsNullable(field)) {
        return traverseSchemaInternal(field.nullableType, path);
    }
    if (fieldTypeIsList(field)) {
        return traverseSchemaInternal(field.listType, path);
    }
    if (fieldTypeIsMap(field)) {
        return traverseSchemaInternal(field.mapType, path);
    }
    return null;
}
function traverseSchema(schema, path) {
    if (!path.length) {
        throw new Error('Invalid path passed to traverseSchema');
    }
    return traverseSchemaInternal(schema[path[0]], path.slice(1));
}
exports.traverseSchema = traverseSchema;
//# sourceMappingURL=DataSchema.js.map