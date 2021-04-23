"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMutationDependencies = exports.mutationUpsyncError = exports.isMutationUpsyncSuccess = exports.GraphMutationRuleWhen = exports.GenericMutatorResultsSchema = exports.MutatorRemoteExecutorType = void 0;
const conduit_utils_1 = require("conduit-utils");
var MutatorRemoteExecutorType;
(function (MutatorRemoteExecutorType) {
    MutatorRemoteExecutorType["Thrift"] = "Thrift";
    MutatorRemoteExecutorType["CommandService"] = "CommandService";
    MutatorRemoteExecutorType["Local"] = "Local";
})(MutatorRemoteExecutorType = exports.MutatorRemoteExecutorType || (exports.MutatorRemoteExecutorType = {}));
exports.GenericMutatorResultsSchema = {
    result: conduit_utils_1.NullableString,
};
var GraphMutationRuleWhen;
(function (GraphMutationRuleWhen) {
    GraphMutationRuleWhen[GraphMutationRuleWhen["Optimistic"] = 1] = "Optimistic";
    GraphMutationRuleWhen[GraphMutationRuleWhen["Thrift"] = 2] = "Thrift";
    GraphMutationRuleWhen[GraphMutationRuleWhen["CommandService"] = 4] = "CommandService";
    GraphMutationRuleWhen[GraphMutationRuleWhen["Local"] = 8] = "Local";
    GraphMutationRuleWhen[GraphMutationRuleWhen["Always"] = 15] = "Always";
})(GraphMutationRuleWhen = exports.GraphMutationRuleWhen || (exports.GraphMutationRuleWhen = {}));
function isMutationUpsyncSuccess(res) {
    return Boolean(res && !res.hasOwnProperty('error') && !res.error);
}
exports.isMutationUpsyncSuccess = isMutationUpsyncSuccess;
function mutationUpsyncError(res) {
    return isMutationUpsyncSuccess(res) ? undefined : res === null || res === void 0 ? void 0 : res.error;
}
exports.mutationUpsyncError = mutationUpsyncError;
function mergeMutationDependencies(deps, newDeps) {
    if (!deps || !newDeps) {
        return deps || newDeps;
    }
    for (const key in newDeps) {
        const oldDep = deps[key];
        const newDep = newDeps[key];
        if (!oldDep) {
            deps[key] = newDep;
        }
        else {
            if (newDep.version > oldDep.version) {
                deps[key] = newDep;
            }
        }
    }
    return deps;
}
exports.mergeMutationDependencies = mergeMutationDependencies;
//# sourceMappingURL=GraphMutationTypes.js.map