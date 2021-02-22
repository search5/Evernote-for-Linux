"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAutoMutators = void 0;
const conduit_view_types_1 = require("conduit-view-types");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
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
        return { success: true, result: mutation.result };
    };
}
function buildMutator(name, def) {
    const args = buildArgs(name, def);
    return {
        type: ResolverHelpers_1.GenericMutationResultWithData,
        resolve: runForMutation(name),
        args,
        deprecationReason: def.deprecationReason,
    };
}
function buildAutoMutators(mutatorDefs) {
    const out = {};
    for (const mutation in mutatorDefs) {
        const def = mutatorDefs[mutation];
        if (def.isInternal) {
            continue;
        }
        const mutationName = def.clientAlias || mutation;
        out[mutationName] = buildMutator(mutation, def);
    }
    return out;
}
exports.buildAutoMutators = buildAutoMutators;
//# sourceMappingURL=AutoMutations.js.map