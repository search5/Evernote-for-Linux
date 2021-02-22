"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRollupStrategy = exports.rollupPendingMutations = void 0;
const conduit_utils_1 = require("conduit-utils");
const simply_immutable_1 = require("simply-immutable");
function rollupMutationPair(prevM, nextM, mutatorDef) {
    if (!prevM) {
        return false;
    }
    if (prevM.name !== nextM.name) {
        return false;
    }
    if (!mutatorDef || !mutatorDef.rollupStrategy) {
        return false;
    }
    // check to make sure required params match
    for (const paramMatch of mutatorDef.rollupStrategy.ifParamsMatch) {
        if (!conduit_utils_1.isEqual(prevM.params[paramMatch.prev], nextM.params[paramMatch.next])) {
            return false;
        }
    }
    // merge prevM into nextM using rollupStrategy
    for (const paramName in mutatorDef.rollupStrategy.combineParams) {
        const combine = mutatorDef.rollupStrategy.combineParams[paramName];
        const prevValue = prevM.params[paramName];
        let value = nextM.params[paramName];
        const prevType = conduit_utils_1.getTypeOf(prevValue);
        const type = conduit_utils_1.getTypeOf(value);
        switch (combine) {
            case 'first':
                value = prevValue;
                break;
            case 'last':
                // already set to nextM's value
                break;
            case 'concat':
                if (prevType === 'array' && type === 'array') {
                    value = prevValue.concat(value);
                }
                if (prevType === 'string' && type === 'string') {
                    value = prevValue + value;
                }
                break;
            case 'min':
                if (prevType === 'number' && type === 'number') {
                    value = Math.min(value, prevValue);
                }
                break;
            case 'max':
                if (prevType === 'number' && type === 'number') {
                    value = Math.max(value, prevValue);
                }
                break;
            case 'sum':
                if (prevType === 'number' && type === 'number') {
                    value += prevValue;
                }
                break;
            case 'and':
                value = prevValue && value;
                break;
            case 'or':
                value = value || prevValue;
                break;
            case 'activationMap':
                if (prevType === 'object' && type === 'object') {
                    const removed = {};
                    for (const key in value) {
                        const oldSwitch = prevValue[key];
                        const newSwitch = value[key];
                        if ((oldSwitch === false && newSwitch === true) || (oldSwitch === true && newSwitch === false)) {
                            removed[key] = true;
                            delete value[key];
                        }
                    }
                    for (const key in prevValue) {
                        if (!value.hasOwnProperty(key) && !removed.hasOwnProperty(key)) {
                            value[key] = prevValue[key];
                        }
                    }
                }
                break;
            case undefined:
                break;
            default:
                throw conduit_utils_1.absurd(combine, 'unhandled combine value');
        }
        nextM.params[paramName] = value;
    }
    // accumulate rollupInterval
    nextM.rollupInterval = (prevM.rollupInterval || 0) + (nextM.timestamp - prevM.timestamp);
    return true;
}
function rollupPendingMutations(pendingMutations, mutatorDefs) {
    var _a;
    const changes = {};
    const errors = [];
    // rollup mutations where possible
    const rolledUp = [];
    for (const mImmutable of pendingMutations) {
        const prevM = rolledUp[rolledUp.length - 1];
        const m = simply_immutable_1.cloneMutable(mImmutable);
        try {
            const mutatorDef = mutatorDefs[m.name];
            if (rollupMutationPair(prevM, m, mutatorDef)) {
                if ((_a = mutatorDef.rollupStrategy) === null || _a === void 0 ? void 0 : _a.onRollup) {
                    try {
                        mutatorDef.rollupStrategy.onRollup(prevM, mImmutable);
                    }
                    catch (err) {
                        conduit_utils_1.logger.warn('Caught error in muator onRollup function', { mutator: m.name, err });
                    }
                }
                rolledUp.pop();
                changes[prevM.mutationID] = null;
                changes[m.mutationID] = m;
            }
        }
        catch (e) {
            errors.push(e);
        }
        rolledUp.push(m);
    }
    // make sure later mutations flush earlier buffered mutations (ie don't let a buffered mutation stall the pipeline)
    const now = Date.now();
    let minBufferUntil = Infinity;
    for (let i = rolledUp.length - 1; i >= 0; i--) {
        const m = rolledUp[i];
        const bufferUntil = m.bufferUntil || now;
        if (bufferUntil <= minBufferUntil) {
            minBufferUntil = Math.max(bufferUntil, now);
        }
        else if (bufferUntil > now) {
            // adjust bufferUntil so it isn't blocking any subsequent mutations
            m.bufferUntil = minBufferUntil;
            changes[m.mutationID] = m;
        }
    }
    return {
        changes,
        mutations: rolledUp,
        errors,
    };
}
exports.rollupPendingMutations = rollupPendingMutations;
function validateRollupStrategy(name, mutatorDef) {
    if (!mutatorDef.rollupStrategy) {
        return;
    }
    const paramsAvailable = Object.assign(Object.assign(Object.assign({}, mutatorDef.requiredParams), mutatorDef.optionalParams), mutatorDef.derivedParams);
    const paramsUsed = {};
    for (const paramMatch of mutatorDef.rollupStrategy.ifParamsMatch) {
        paramsUsed[paramMatch.prev] = true;
        paramsUsed[paramMatch.next] = true;
        if (!paramsAvailable.hasOwnProperty(paramMatch.prev)) {
            throw new Error(`MutatorDefinition for ${name} specifies ifParamsMatch for ${paramMatch.prev} which does not exist`);
        }
        if (!paramsAvailable.hasOwnProperty(paramMatch.next)) {
            throw new Error(`MutatorDefinition for ${name} specifies ifParamsMatch for ${paramMatch.next} which does not exist`);
        }
    }
    for (const param in mutatorDef.rollupStrategy.combineParams) {
        paramsUsed[param] = true;
        if (!paramsAvailable.hasOwnProperty(param)) {
            throw new Error(`MutatorDefinition for ${name} specifies combineParams for ${param} which does not exist`);
        }
    }
    for (const param in paramsAvailable) {
        if (!paramsUsed.hasOwnProperty(param)) {
            throw new Error(`MutatorDefinition for ${name} missing rollupStrategy for param ${param}`);
        }
    }
}
exports.validateRollupStrategy = validateRollupStrategy;
//# sourceMappingURL=MutationRollup.js.map