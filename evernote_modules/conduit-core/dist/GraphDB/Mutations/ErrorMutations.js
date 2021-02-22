"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMutators = void 0;
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../Resolvers/ResolverHelpers");
async function errorRemoveResolver(_, args, context) {
    if (!args || !args.id) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.errorManager.removeError(context.trc, args.id);
    return { success: true };
}
async function errorMarkResolver(_, args, context) {
    if (!args || !args.id) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.errorManager.setMark(context.trc, args.id, true);
    return { success: true };
}
async function errorUnmarkResolver(_, args, context) {
    if (!args || !args.id) {
        throw new Error('Missing args');
    }
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.errorManager.setMark(context.trc, args.id, false);
    return { success: true };
}
async function errorMarkListResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.errorManager.markAll(context.trc, true);
    return { success: true };
}
async function errorUnmarkListResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.errorManager.markAll(context.trc, false);
    return { success: true };
}
async function errorClearListResolver(_, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    await context.errorManager.clearList(context.trc, args.markedValue);
    return { success: true };
}
function getErrorMutators() {
    const out = {};
    out.errorRemove = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorRemoveResolver,
    };
    out.errorMark = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorMarkResolver,
    };
    out.errorUnmark = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'ID' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorUnmarkResolver,
    };
    out.errorMarkList = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorMarkListResolver,
    };
    out.errorUnmarkList = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorUnmarkListResolver,
    };
    out.errorClearList = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ markedValue: 'boolean?' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorClearListResolver,
    };
    out.errorMark = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ id: 'string' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: errorMarkResolver,
    };
    return out;
}
exports.getErrorMutators = getErrorMutators;
//# sourceMappingURL=ErrorMutations.js.map