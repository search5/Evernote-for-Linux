"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAutoMutators = void 0;
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const graphql_1 = require("graphql");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const GraphMutationTypes_1 = require("../../Types/GraphMutationTypes");
const AutoResolvers_1 = require("../Resolvers/AutoResolvers");
const ResolverHelpers_1 = require("../Resolvers/ResolverHelpers");
function buildArgs(mutatorName, def) {
    const out = {};
    const reqParams = def.requiredParams;
    const optParams = def.optionalParams;
    for (const paramName in reqParams) {
        const typedef = reqParams[paramName];
        const gqlType = DataSchemaGQL_1.schemaToGraphQLType(typedef, `${mutatorName}_${paramName}`, false);
        if (!gqlType) {
            throw new Error(`Unsupported type "${typedef}" for arg "${paramName}"`);
        }
        out[paramName] = {
            type: gqlType,
        };
    }
    for (const paramName in optParams) {
        const typedef = optParams[paramName];
        const gqlType = DataSchemaGQL_1.schemaToGraphQLType(typedef, `${mutatorName}_${paramName}`, true);
        if (!gqlType) {
            throw new Error(`Unsupported type "${typedef}" for arg "${paramName}"`);
        }
        out[paramName] = {
            type: gqlType,
        };
    }
    return out;
}
function runForMutation(name) {
    return async (parent, args, context) => {
        ResolverHelpers_1.validateDB(context);
        const auth = await context.db.getAuthTokenAndState(context.trc, null);
        if ((auth === null || auth === void 0 ? void 0 : auth.state) !== conduit_view_types_1.AuthState.Authorized) {
            throw new Error('Not logged in');
        }
        const mutation = await context.db.runMutator(context.trc, name, args);
        return Object.assign(Object.assign({ result: null }, mutation.results), { success: true });
    };
}
function buildMutatorResultType(autoResolverData, name, schema) {
    const fields = {};
    for (const key in schema) {
        AutoResolvers_1.schemaFieldToGraphQL(autoResolverData, fields, key, schema[key], '', undefined);
    }
    fields.success = { type: DataSchemaGQL_1.schemaToGraphQLType('boolean') };
    return new graphql_1.GraphQLObjectType({
        name: conduit_utils_1.toPascalCase([name, 'MutatorRes']),
        fields,
    });
}
function buildMutator(name, def) {
    return (autoResolverData) => {
        // default is to use the legacy mutation result schema, for backwards compatibility
        let type = ResolverHelpers_1.GenericMutationResultWithData;
        if (def.resultTypes && def.resultTypes !== GraphMutationTypes_1.GenericMutatorResultsSchema) {
            // override with custom result types schema
            type = buildMutatorResultType(autoResolverData, name, def.resultTypes);
        }
        return {
            type,
            resolve: runForMutation(name),
            args: buildArgs(name, def),
            deprecationReason: def.deprecationReason,
        };
    };
}
function buildAutoMutators(trc, mutatorDefs) {
    conduit_utils_1.traceEventStart(trc, 'buildAutoMutators');
    const out = {};
    for (const mutation in mutatorDefs) {
        const def = mutatorDefs[mutation];
        if (def.isInternal) {
            continue;
        }
        const mutationName = def.clientAlias || mutation;
        out[mutationName] = buildMutator(mutation, def);
    }
    conduit_utils_1.traceEventEnd(trc, 'buildAutoMutators');
    return out;
}
exports.buildAutoMutators = buildAutoMutators;
//# sourceMappingURL=AutoMutations.js.map