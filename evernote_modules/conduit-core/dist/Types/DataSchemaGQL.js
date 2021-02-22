"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaToGraphQLArgs = exports.schemaToGraphQLType = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
function validateMapType(type, value) {
    if (conduit_utils_1.getTypeOf(value) !== 'object') {
        throw new Error('Map type must be an object');
    }
    for (const key in value) {
        conduit_utils_1.validateSchemaType(type, key, value[key]);
    }
}
function genGraphQLMap(type) {
    return new graphql_1.GraphQLScalarType({
        name: `Map_${type}`,
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
    });
}
function wrappedGqlType(type, nullable) {
    return (nullable ? type : new graphql_1.GraphQLNonNull(type));
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
        ret[`${coreType}`] = wrappedGqlType(gqlType, false);
        ret[`${coreType}?`] = wrappedGqlType(gqlType, true);
        ret[`${coreType}[]`] = wrappedGqlType(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(gqlType)), false);
        ret[`${coreType}[]?`] = wrappedGqlType(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(gqlType)), true);
        const mapType = genGraphQLMap(coreType);
        ret[`map<${coreType}>`] = wrappedGqlType(mapType, false);
        ret[`map<${coreType}>?`] = wrappedGqlType(mapType, true);
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
const gCachedEnums = {};
function schemaToGraphQLType(fieldType, name, nullable = false, isInput = false) {
    if (conduit_utils_1.fieldTypeIsEnum(fieldType)) {
        let enumNullable = false;
        let nameSuffix = 'Enum';
        if (nullable && fieldType[fieldType.length - 1] !== '?') {
            enumNullable = true;
            nameSuffix = 'NullableEnum';
        }
        const values = {};
        for (const enumValue of fieldType) {
            // ignore optional symbol
            if (enumValue === '?') {
                enumNullable = true;
                continue;
            }
            values[enumValue] = { value: enumValue };
        }
        if (typeof fieldType.__enumName === 'string') {
            name = fieldType.__enumName;
        }
        name = fixupName(name, nameSuffix);
        if (!gCachedEnums[name]) {
            gCachedEnums[name] = wrappedGqlType(new graphql_1.GraphQLEnumType({ name, values }), enumNullable);
        }
        return gCachedEnums[name];
    }
    if (conduit_utils_1.fieldTypeIsObject(fieldType)) {
        const fields = {};
        for (const key in fieldType) {
            const subtype = fieldType[key];
            fields[key] = { type: schemaToGraphQLType(subtype, conduit_utils_1.toPascalCase([name || '', key]), false) };
        }
        name = fixupName(name, 'Object');
        const gqlType = isInput ? new graphql_1.GraphQLInputObjectType({ name, fields: fields }) : new graphql_1.GraphQLObjectType({ name, fields });
        return wrappedGqlType(gqlType, nullable);
    }
    if (nullable && !conduit_utils_1.fieldIsNullable(fieldType)) {
        fieldType += '?';
    }
    return CoreTypeGraphQLLookup[fieldType];
}
exports.schemaToGraphQLType = schemaToGraphQLType;
function schemaToGraphQLArgs(args) {
    const ret = {};
    for (const key in args) {
        ret[key] = { type: schemaToGraphQLType(args[key], key, false) };
    }
    return ret;
}
exports.schemaToGraphQLArgs = schemaToGraphQLArgs;
//# sourceMappingURL=DataSchemaGQL.js.map