"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaToGraphQLArgs = exports.schemaToGraphQLInputType = exports.schemaToGraphQLType = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
let gIsMocha = false;
try {
    if ('describe' in global) {
        gIsMocha = true;
    }
}
catch (ex) {
    // noop
}
const gCachedTypes = new Map();
function getFromCache(name, fieldType, isInput) {
    const cached = gCachedTypes.get(name);
    if (!cached) {
        return null;
    }
    if (fieldType && cached.schema !== fieldType && !gIsMocha) {
        throw new Error(`Different schemas defined with the same name "${name}"`);
    }
    if (cached.isInput !== isInput) {
        throw new Error(`The same schema "${name}" is being used as both an input (argument) and a result (type); use ExtendStruct() to give a different name to the input`);
    }
    return cached.type;
}
function validateMapType(type, value) {
    if (conduit_utils_1.getTypeOf(value) !== 'object') {
        throw new Error('Map type must be an object');
    }
    for (const key in value) {
        conduit_utils_1.validateSchemaType(type, key, value[key]);
    }
}
function genGraphQLMap(fieldType) {
    const type = fieldType.mapType;
    const name = `Map_${type}`;
    const cached = getFromCache(name, null, false);
    if (cached) {
        return cached;
    }
    const cacheEntry = {
        isInput: false,
        schema: fieldType,
        type: new graphql_1.GraphQLScalarType({
            name,
            description: `An object mapping from string to ${type}`,
            serialize: value => {
                validateMapType(type, value);
                return value;
            },
            parseValue: value => {
                validateMapType(type, value);
                return value;
            },
            parseLiteral: ast => {
                throw new Error('literal maps not yet supported');
            },
        }),
    };
    gCachedTypes.set(name, cacheEntry);
    return cacheEntry.type;
}
function genCoreTypeLookup() {
    const coreGraphQLTypes = {
        ID: graphql_1.GraphQLString,
        string: graphql_1.GraphQLString,
        url: graphql_1.GraphQLString,
        boolean: graphql_1.GraphQLBoolean,
        number: graphql_1.GraphQLFloat,
        int: graphql_1.GraphQLInt,
        timestamp: graphql_1.GraphQLFloat,
        EntityRef: new graphql_1.GraphQLInputObjectType({
            name: 'EntityRef',
            fields: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                type: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            },
        }),
    };
    const ret = {};
    for (const coreType in coreGraphQLTypes) {
        // ugh, what a stupid cast, thanks TS compiler!
        const gqlType = coreGraphQLTypes[coreType];
        ret[`${coreType}`] = gqlType;
    }
    return ret;
}
const CoreTypeGraphQLLookup = genCoreTypeLookup();
function fixupName(name, suffix) {
    if (name) {
        return conduit_utils_1.toPascalCase([name]);
    }
    else {
        return 'Unnamed' + suffix;
    }
}
function schemaToGraphQLType(fieldType, options = {}) {
    var _a, _b;
    let isNullable = false;
    if (conduit_utils_1.fieldTypeIsNullable(fieldType)) {
        fieldType = conduit_utils_1.fieldTypeToNonNull(fieldType);
        isNullable = true;
    }
    let ret;
    if (conduit_utils_1.fieldTypeIsEnum(fieldType)) {
        const name = fixupName(fieldType.name || options.defaultName, 'Enum');
        const cached = getFromCache(name, fieldType, false);
        if (cached) {
            ret = cached;
        }
        else {
            const values = {};
            for (const key in fieldType.enumMap) {
                values[key] = { value: fieldType.enumMap[key] };
            }
            const cacheEntry = {
                isInput: false,
                schema: fieldType,
                type: new graphql_1.GraphQLEnumType({ name, values }),
            };
            gCachedTypes.set(name, cacheEntry);
            ret = cacheEntry.type;
        }
    }
    else if (conduit_utils_1.fieldTypeIsMap(fieldType)) {
        ret = genGraphQLMap(fieldType);
    }
    else if (conduit_utils_1.fieldTypeIsList(fieldType)) {
        ret = new graphql_1.GraphQLList(schemaToGraphQLType(fieldType.listType, options));
    }
    else if (conduit_utils_1.fieldTypeIsStruct(fieldType)) {
        if (!fieldType.name && !options.defaultName) {
            throw new Error(`Top level struct schema with no name or defaultName, this is not allowed`);
        }
        const name = fixupName(fieldType.name || options.defaultName, 'Object');
        const fields = {};
        for (const key in fieldType.fields) {
            const subtype = fieldType.fields[key];
            fields[key] = {
                type: schemaToGraphQLType(subtype, {
                    defaultName: conduit_utils_1.toPascalCase([name, key]),
                    isInput: options.isInput,
                }),
            };
        }
        const cached = getFromCache(name, fieldType, (_a = options.isInput) !== null && _a !== void 0 ? _a : false);
        if (cached) {
            ret = cached;
        }
        else {
            const cacheEntry = {
                isInput: (_b = options.isInput) !== null && _b !== void 0 ? _b : false,
                schema: fieldType,
                type: (options.isInput ?
                    new graphql_1.GraphQLInputObjectType({ name, fields: fields }) :
                    new graphql_1.GraphQLObjectType({ name, fields })),
            };
            gCachedTypes.set(name, cacheEntry);
            ret = cacheEntry.type;
        }
    }
    else if (CoreTypeGraphQLLookup.hasOwnProperty(fieldType)) {
        ret = CoreTypeGraphQLLookup[fieldType];
    }
    else {
        throw new Error(`Unhandled schema type ${conduit_utils_1.safeStringify(fieldType)}`);
    }
    return isNullable ? ret : new graphql_1.GraphQLNonNull(ret);
}
exports.schemaToGraphQLType = schemaToGraphQLType;
function schemaToGraphQLInputType(fieldType, options = {}) {
    return schemaToGraphQLType(fieldType, Object.assign(Object.assign({}, options), { isInput: true }));
}
exports.schemaToGraphQLInputType = schemaToGraphQLInputType;
function schemaToGraphQLArgs(args) {
    const ret = {};
    for (const key in args) {
        ret[key] = { type: schemaToGraphQLType(args[key], { isInput: true, defaultName: key }) };
    }
    return ret;
}
exports.schemaToGraphQLArgs = schemaToGraphQLArgs;
//# sourceMappingURL=DataSchemaGQL.js.map