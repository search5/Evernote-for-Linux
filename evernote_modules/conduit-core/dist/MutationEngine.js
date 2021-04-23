"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationEngine = exports.MutationContext = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const GraphMutationTypes_1 = require("./Types/GraphMutationTypes");
function validateAgainstSchema(nodeDef, path, value) {
    var _a, _b, _c;
    if (path === 'label') {
        conduit_utils_1.validateSchemaType('string', path, value);
    }
    else {
        const s = (_a = conduit_utils_1.traverseSchema(nodeDef.schema, path.split('.'))) !== null && _a !== void 0 ? _a : (_c = (_b = nodeDef.cache) === null || _b === void 0 ? void 0 : _b[path]) === null || _c === void 0 ? void 0 : _c.type;
        conduit_utils_1.validateSchemaType(s, path, value);
    }
    if (nodeDef.fieldValidation) {
        conduit_utils_1.validateSchemaValue(nodeDef.fieldValidation, path, value);
    }
}
function stripOwner(owner) {
    if (conduit_utils_1.isUserID(owner)) {
        return owner;
    }
    // strip down to a pure GraphNodeRef before sending to the service, as mutators sometimes pass in full entities
    return {
        id: owner.id,
        type: owner.type,
    };
}
class MutationContext {
    // TODO internal: cache of fetched entities and associations
    constructor(config, graphInterface, isOptimistic, isOptimisticRerun, mutatorName, timestamp, guids, userID, vaultUserID) {
        this.config = config;
        this.graphInterface = graphInterface;
        this.isOptimistic = isOptimistic;
        this.isOptimisticRerun = isOptimisticRerun;
        this.mutatorName = mutatorName;
        this.timestamp = timestamp;
        this.guids = guids;
        this.userID = userID;
        this.vaultUserID = vaultUserID;
        this.eventsToRecord = {};
        this.guidIndexes = {};
        this.generateOptimisticIdInternal = (ownerID, serviceEntityType, prev) => {
            if (prev) {
                const seed = prev[0];
                const nodeID = this.config.guidGenerator.generateSeededID(ownerID, serviceEntityType, seed);
                if (nodeID !== prev[1]) {
                    throw new Error('Client passed a NodeID that does not match the provided seed');
                }
                return [seed, nodeID];
            }
            else {
                const [seed, nodeID] = this.config.guidGenerator.generateID(ownerID, serviceEntityType);
                return [seed, nodeID];
            }
        };
        this.generateDeterministicIdInternal = (ownerID, entityType, prev, custom) => {
            const deterministicId = {
                userID: ownerID,
                entityType,
                leadingSegments: custom.leadingSegments,
            };
            const nodeID = custom.deterministicIdGenerator.createId(deterministicId);
            if (prev && nodeID !== prev[1]) {
                throw new Error('Client passed a NodeID that does not match the previous');
            }
            return ['', nodeID];
        };
        this.generateDeterministicIdInternalWithPrefix = (ownerID, entityType, prev, prefix) => {
            const nodeID = `${prefix}_${entityType}`;
            return ['', nodeID];
        };
        this.thriftTimestamp = 1000 * Math.floor(timestamp * 0.001);
    }
    async fetchEntity(trc, ref) {
        return this.graphInterface.fetchEntity(trc, ref);
    }
    async fetchEntities(trc, nodeType, ids) {
        return this.graphInterface.fetchEntities(trc, nodeType, ids);
    }
    async traverseGraph(trc, nodeRef, traverse) {
        return this.graphInterface.traverseGraph(trc, nodeRef, traverse);
    }
    async queryGraph(trc, nodeType, queryName, queryParams) {
        return this.graphInterface.queryGraph(trc, nodeType, queryName, queryParams);
    }
    async resolveOwnerRef(trc, owner) {
        return this.graphInterface.resolveOwnerRef(trc, owner);
    }
    async generateIdInternal(trc, owner, serviceEntityType, key, custom, generateFunc, ignoreKey) {
        const ownerID = await this.graphInterface.resolveOwnerRef(trc, owner);
        const guidKey = serviceEntityType + (key !== undefined ? `:${key}` : '');
        this.guids[guidKey] = this.guids[guidKey] || [];
        this.guidIndexes[guidKey] = this.guidIndexes[guidKey] || 0;
        const index = this.guidIndexes[guidKey];
        if (!ignoreKey && index > 0) {
            conduit_utils_1.logger.error(`
        Mutator ${this.mutatorName} called generateID for type ${serviceEntityType} more than once with
        ${key ? 'the same key' : 'no key'}, this can lead to mismatched behavior between local and remote
      `);
        }
        const prev = this.guids[guidKey][index];
        const [seed, nodeID] = generateFunc(ownerID, serviceEntityType, prev, custom);
        const ret = [seed, nodeID, ownerID, stripOwner(owner)];
        this.guids[guidKey][index] = ret;
        this.guidIndexes[guidKey]++;
        return SimplyImmutable.deepFreeze(ret);
    }
    async generateID(trc, owner, serviceEntityType, key) {
        return await this.generateIdInternal(trc, owner, serviceEntityType, key, undefined, this.generateOptimisticIdInternal);
    }
    async generateDeterministicID(trc, owner, nodeType, deterministicIdGenerator, leadingSegments) {
        const key = leadingSegments ? leadingSegments.map(seg => seg.parts.join('|')).join(':') : undefined;
        return await this.generateIdInternal(trc, owner, nodeType, key, { deterministicIdGenerator, leadingSegments }, this.generateDeterministicIdInternal);
    }
    async generateFileUrl(trc, owner, serviceEntityType, serviceEntityID) {
        const generatedID = await this.generateID(trc, owner, serviceEntityType);
        return [generatedID[0], this.config.guidGenerator.IDToFileLocation(serviceEntityID, generatedID[1])];
    }
    async generateDeterministicIDWithPrefix(trc, owner, nodeType, prefix, ignoreKey) {
        const key = prefix;
        return await this.generateIdInternal(trc, owner, nodeType, key, prefix, this.generateDeterministicIdInternalWithPrefix, ignoreKey);
    }
    async generateCustomID(trc, owner, nodeType, fields, parent) {
        const nodeID = this.config.generateCustomID ? this.config.generateCustomID(nodeType, fields, parent) : null;
        if (nodeID) {
            const ownerID = await this.graphInterface.resolveOwnerRef(trc, owner);
            return SimplyImmutable.deepFreeze(['', nodeID, ownerID, stripOwner(owner)]);
        }
        return null;
    }
    createEntity(nodeRef, partialFields, ownerID) {
        const typeDef = this.config.nodeTypeDefs[nodeRef.type];
        if (!typeDef) {
            throw new Error(`No node type "${nodeRef.type}" defined`);
        }
        const node = {
            id: nodeRef.id,
            type: nodeRef.type,
            version: 0,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: partialFields.label || '',
            NodeFields: conduit_utils_1.getSchemaDefaults(typeDef.schema),
        };
        if (typeDef.syncSource === conduit_storage_1.SyncSource.NSYNC) {
            if (!ownerID) {
                throw new Error('NSync types require an ownerID');
            }
            node.owner = ownerID;
        }
        return this.assignFields(nodeRef.type, partialFields, node);
    }
    updateAnalytics(analytics) {
        conduit_utils_1.deepUpdateMutable(this.eventsToRecord, analytics);
    }
    assignFields(type, fields, node) {
        if (!node) {
            node = { localChangeTimestamp: this.isOptimistic ? this.timestamp : 0 }; // "default" favored by Node:UPDATE
        }
        else {
            node = Object.assign({}, node);
        }
        const typeDef = this.config.nodeTypeDefs[type];
        if (!typeDef) {
            throw new Error(`No node type "${type}" defined`);
        }
        for (const key in fields) {
            if (fields[key] !== undefined) {
                validateAgainstSchema(typeDef, key, fields[key]);
                // TODO if field is null and schema says it is not nullable, skip assignment (client passed in null as a proxy for undefined)
                if (key === 'label') {
                    node.label = fields.label;
                }
                else if (typeDef.cache && typeDef.cache[key]) {
                    node.CacheFields = SimplyImmutable.deepUpdateImmutable(node.CacheFields || {}, [key], fields[key]);
                }
                else {
                    node.NodeFields = SimplyImmutable.deepUpdateImmutable(node.NodeFields || {}, key.split('.'), fields[key]);
                }
            }
        }
        return node;
    }
    md5(data) {
        return this.config.md5(data);
    }
}
exports.MutationContext = MutationContext;
class MutationEngine {
    constructor(config) {
        this.config = config;
        this.mutators = {};
        // TODO(validate) nodeTypeDefs (especially check for mismatches of connections on ports)
        this.mutators = config.mutatorDefs;
    }
    async runMutator(trc, graphInterface, isOptimistic, clientValues, userID, vaultUserID, name, params) {
        const mutatorDef = this.mutators[name];
        if (!mutatorDef) {
            throw new conduit_utils_1.NotFoundError(name, `No mutator named "${name}"`);
        }
        const timestamp = Date.now();
        const guids = {};
        const ctx = new MutationContext(this.config, graphInterface, isOptimistic, false, name, timestamp, guids, userID, vaultUserID);
        if (mutatorDef.initParams) {
            const paramsOut = Object.assign({}, params);
            await mutatorDef.initParams(trc, ctx, params, paramsOut);
            params = paramsOut;
        }
        const mutation = {
            mutationID: this.config.guidGenerator.generateID(userID, 'Mutation')[1],
            name,
            params,
            guids,
            results: {},
            timestamp,
            isRetry: false,
        };
        if (mutatorDef.buffering) {
            const bufferTime = typeof mutatorDef.buffering.time === 'string' ? clientValues[mutatorDef.buffering.time] : mutatorDef.buffering.time;
            if (typeof bufferTime === 'number') {
                mutation.bufferUntil = mutation.timestamp + bufferTime;
            }
            if (mutatorDef.buffering.rollupFlush) {
                const rollupFlush = typeof mutatorDef.buffering.rollupFlush === 'string' ? clientValues[mutatorDef.buffering.rollupFlush] : mutatorDef.buffering.rollupFlush;
                if (typeof rollupFlush === 'number') {
                    mutation.rollupFlushInterval = rollupFlush;
                }
            }
        }
        const { results } = await this.runMutatorInternal(trc, ctx, mutation);
        mutation.results = results;
        return mutation;
    }
    async runMutation(trc, graphInterface, isOptimistic, userID, vaultUserID, mutation) {
        const ctx = new MutationContext(this.config, graphInterface, isOptimistic, isOptimistic, mutation.name, mutation.timestamp, mutation.guids, userID, vaultUserID);
        return await this.runMutatorInternal(trc, ctx, mutation);
    }
    async runMutatorInternal(trc, ctx, mutation) {
        const mutatorDef = this.mutators[mutation.name];
        if (!mutatorDef) {
            throw new conduit_utils_1.NotFoundError(mutation.name, `No mutator named "${mutation.name}"`);
        }
        let deps = null;
        let results = {};
        if (mutatorDef.execute) {
            const plan = await mutatorDef.execute(trc, ctx, mutation.params);
            // containment and account limit rules applied here
            plan.ops = await this.processOps(trc, ctx, mutatorDef, plan.ops);
            if (plan.lateOps) {
                plan.lateOps = await this.processOps(trc, ctx, mutatorDef, plan.lateOps);
            }
            deps = await ctx.graphInterface.runExecutionPlan(trc, mutation, plan);
            results = Object.assign({}, plan.results);
        }
        else if (ctx.graphInterface.runRemoteCommand) {
            const command = await mutatorDef.executeOnService(trc, ctx, mutation.params);
            const result = await ctx.graphInterface.runRemoteCommand(trc, mutation, command);
            if (result && typeof result === 'object') {
                results.result = result.id;
            }
            else if (typeof result === 'string') {
                results.result = result;
            }
        }
        if (mutatorDef.resultTypes) {
            for (const key in mutatorDef.resultTypes) {
                if (!(key in results)) {
                    // fill in null for missing values, so that they pass GraphQL validation
                    results[key] = null;
                }
                conduit_utils_1.validateSchemaType(mutatorDef.resultTypes[key], key, results[key]);
            }
        }
        if (this.config.sendMutationMetrics && !ctx.isOptimistic && Object.keys(ctx.eventsToRecord).length) {
            for (const key in ctx.eventsToRecord) {
                const event = ctx.eventsToRecord[key];
                this.config.recordEvent(event);
            }
        }
        return { deps, results };
    }
    async processOps(trc, ctx, mutatorDef, opsIn) {
        let lastEdgeModify;
        let opsOut = opsIn;
        for (const op of opsOut) {
            opsOut = opsOut.concat(await this.getRuleOps(trc, ctx, mutatorDef, op));
        }
        for (let i = opsOut.length - 1; i >= 0; --i) {
            const op = opsOut[i];
            if (op.changeType !== 'Edge:MODIFY') {
                continue;
            }
            if (!lastEdgeModify) {
                lastEdgeModify = op;
                continue;
            }
            lastEdgeModify.edgesToCreate = op.edgesToCreate ? op.edgesToCreate.concat(lastEdgeModify.edgesToCreate || []) : lastEdgeModify.edgesToCreate;
            lastEdgeModify.edgesToDelete = op.edgesToDelete ? op.edgesToDelete.concat(lastEdgeModify.edgesToDelete || []) : lastEdgeModify.edgesToDelete;
            opsOut.splice(i, 1);
        }
        return opsOut;
    }
    async getRuleOps(trc, ctx, mutatorDef, op) {
        let ret = [];
        for (const rule of this.config.mutationRules) {
            if (ctx.isOptimistic) {
                // tslint:disable-next-line:no-bitwise
                if (!(rule.when & GraphMutationTypes_1.GraphMutationRuleWhen.Optimistic)) {
                    continue;
                }
            }
            else if (mutatorDef.type === GraphMutationTypes_1.MutatorRemoteExecutorType.Thrift) {
                // tslint:disable-next-line:no-bitwise
                if (!(rule.when & GraphMutationTypes_1.GraphMutationRuleWhen.Thrift)) {
                    continue;
                }
            }
            else if (mutatorDef.type === GraphMutationTypes_1.MutatorRemoteExecutorType.CommandService) {
                // tslint:disable-next-line:no-bitwise
                if (!(rule.when & GraphMutationTypes_1.GraphMutationRuleWhen.CommandService)) {
                    continue;
                }
            }
            else if (mutatorDef.type === GraphMutationTypes_1.MutatorRemoteExecutorType.Local) {
                // tslint:disable-next-line:no-bitwise
                if (!(rule.when & GraphMutationTypes_1.GraphMutationRuleWhen.Local)) {
                    continue;
                }
            }
            if (op.changeType === 'Node:CREATE' && op.changeType === rule.on) {
                if (op.node.type === rule.where.type) {
                    ret = ret.concat(await rule.getExtraOps(trc, ctx, op));
                }
            }
            else if (op.changeType === 'Node:UPDATE' && op.changeType === rule.on) {
                if (op.nodeRef.type === rule.where.type) {
                    ret = ret.concat(await rule.getExtraOps(trc, ctx, op));
                }
            }
            else if (op.changeType === 'Node:DELETE' && op.changeType === rule.on) {
                if (op.nodeRef.type === rule.where.type) {
                    ret = ret.concat(await rule.getExtraOps(trc, ctx, op));
                }
            }
            else if (op.changeType === 'Node:DELETE_MULTI' && rule.on === 'Node:DELETE') {
                const deleteOp = {
                    changeType: 'Node:DELETE',
                    nodeRef: { id: '', type: '' },
                };
                for (const nodeRef of op.nodes) {
                    if (nodeRef.type === rule.where.type) {
                        deleteOp.nodeRef.id = nodeRef.id;
                        deleteOp.nodeRef.type = nodeRef.type;
                        ret = ret.concat(await rule.getExtraOps(trc, ctx, deleteOp));
                    }
                }
            }
        }
        return ret;
    }
}
exports.MutationEngine = MutationEngine;
//# sourceMappingURL=MutationEngine.js.map