"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphMutationRuleWhen = exports.MutatorRemoteExecutorType = void 0;
var MutatorRemoteExecutorType;
(function (MutatorRemoteExecutorType) {
    MutatorRemoteExecutorType["Thrift"] = "Thrift";
    MutatorRemoteExecutorType["CommandService"] = "CommandService";
    MutatorRemoteExecutorType["Local"] = "Local";
})(MutatorRemoteExecutorType = exports.MutatorRemoteExecutorType || (exports.MutatorRemoteExecutorType = {}));
var GraphMutationRuleWhen;
(function (GraphMutationRuleWhen) {
    GraphMutationRuleWhen[GraphMutationRuleWhen["Optimistic"] = 1] = "Optimistic";
    GraphMutationRuleWhen[GraphMutationRuleWhen["Thrift"] = 2] = "Thrift";
    GraphMutationRuleWhen[GraphMutationRuleWhen["CommandService"] = 4] = "CommandService";
    GraphMutationRuleWhen[GraphMutationRuleWhen["Local"] = 8] = "Local";
    GraphMutationRuleWhen[GraphMutationRuleWhen["Always"] = 15] = "Always";
})(GraphMutationRuleWhen = exports.GraphMutationRuleWhen || (exports.GraphMutationRuleWhen = {}));
//# sourceMappingURL=GraphMutationTypes.js.map