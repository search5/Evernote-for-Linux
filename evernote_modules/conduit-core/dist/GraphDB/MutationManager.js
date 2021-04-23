"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
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
exports.MutationManager = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const MutationRollup_1 = require("../MutationRollup");
const GraphMutationTypes_1 = require("../Types/GraphMutationTypes");
const ROUNDTRIP_AGEOUT_THRESHOLD = conduit_utils_1.MILLIS_IN_ONE_MINUTE;
const CORRUPT_MUTATIONS_TABLE = 'CorruptMutations';
const FAIL_SAFE_TABLE = 'FailedMutations';
const OPTIMISTIC_MUTATIONS_TABLE = 'OptimisticMutations';
const REMOTE_MUTATIONS_TABLE = 'RemoteMutations';
const MUTATION_RESULTS_TABLE = 'MutationUpsyncResults';
// change to 'info' if you want to see the detailed roundtrip logging
const VERBOSE_LEVEL = 'trace';
function validateMutation(m, def) {
    try {
        conduit_utils_1.validateSchemaType(conduit_utils_1.Struct(def.params), 'root', m.params, false);
        return conduit_utils_1.getTypeOf(m.timestamp) === 'number' && conduit_utils_1.getTypeOf(m.guids) === 'object';
    }
    catch (e) {
        conduit_utils_1.logger.warn('Invalid mutation: ', e);
        return false;
    }
}
class MutationManager {
    constructor(storage) {
        this.storage = storage;
        this.optimisticMutations = [];
        this.depToMutationIDs = {};
    }
    async loadMutationsFromTable(trc, mutatorDefs, optimistic) {
        const tableName = optimistic ? OPTIMISTIC_MUTATIONS_TABLE : REMOTE_MUTATIONS_TABLE;
        const mutationIDs = await this.storage.getKeys(trc, null, tableName);
        const mutations = [];
        for (const mutationID of mutationIDs) {
            const mutation = await this.storage.getValidatedValue(trc, null, tableName, mutationID, conduit_storage_1.validateIsObject);
            const mutationDef = mutation ? mutatorDefs[mutation.name] : undefined;
            if (mutation && mutationDef && validateMutation(mutation, mutationDef)) {
                mutations.push(mutation);
            }
            else {
                if (mutation && !mutationDef) {
                    conduit_utils_1.logger.warn(`Unable to find definition of mutation "${mutation.name}"`);
                }
                await this.storage.transact(trc, 'MutationManager.moveCorruptMutations', async (db) => {
                    // remove the corrupt data
                    await db.removeValue(trc, tableName, mutationID);
                    if (mutation) {
                        // if we loaded it but it failed validation, back it up
                        await db.setValue(trc, CORRUPT_MUTATIONS_TABLE, mutationID, mutation);
                    }
                    if (optimistic) {
                        // clean up results entry if there is one
                        await db.removeValue(trc, MUTATION_RESULTS_TABLE, mutationID);
                    }
                    else {
                        // clean up the optimistic copy if the upsync-pending copy is corrupt, as otherwise we are in a bad state
                        await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutationID);
                    }
                });
            }
        }
        mutations.sort((a, b) => a.timestamp - b.timestamp);
        return mutations;
    }
    async addMutationDeps(trc, mutationID, deps, tx) {
        for (const key in deps) {
            const dep = deps[key];
            this.depToMutationIDs[key] = this.depToMutationIDs[key] || [];
            this.depToMutationIDs[key].push(mutationID);
            if (tx && (dep.deletedAssociation || dep.deletedNode)) {
                // a delete needs to update the mutations before it, as we may never receive updates for those if the node is later deleted because of propagation
                for (let i = 0; i < this.depToMutationIDs[key].length - 1; ++i) {
                    const prevMutationID = this.depToMutationIDs[key][i];
                    const results = await tx.getValue(trc, null, MUTATION_RESULTS_TABLE, prevMutationID);
                    if (results && results.deps && results.deps[key]) {
                        await tx.setValue(trc, MUTATION_RESULTS_TABLE, prevMutationID, SimplyImmutable.replaceImmutable(results, ['deps', key], dep));
                    }
                }
            }
        }
    }
    async loadMutations(trc, mutatorDefs) {
        // make sure to load remote (pending-upsync) mutations first so we can clean up optimistic copies if the pending-upsync version is bad
        const remoteMutations = await this.loadMutationsFromTable(trc, mutatorDefs, false);
        this.optimisticMutations = await this.loadMutationsFromTable(trc, mutatorDefs, true);
        for (const mutation of this.optimisticMutations) {
            const results = await this.storage.getValue(trc, null, MUTATION_RESULTS_TABLE, mutation.mutationID);
            if (results && results.deps) {
                await this.addMutationDeps(trc, mutation.mutationID, results.deps);
            }
        }
        return remoteMutations;
    }
    async storeFailSafeMutation(trc, failure) {
        await this.storage.transact(trc, 'storeFailSafeMutation', async (tx) => {
            await tx.setValue(trc, FAIL_SAFE_TABLE, failure.key, failure);
        });
    }
    async loadFailedMutations(trc) {
        const keys = await this.storage.getKeys(trc, null, FAIL_SAFE_TABLE);
        const mutations = await this.storage.batchGetValues(trc, null, FAIL_SAFE_TABLE, keys);
        const res = Object.values(mutations).filter(conduit_utils_1.isNotNullish);
        return res.sort((a, b) => {
            return a.timestamp - b.timestamp;
        });
    }
    async backupFailSafeMutation(trc, failure) {
        await this.storage.transact(trc, 'backupFailSafeMutation', async (tx) => {
            await tx.setValue(trc, CORRUPT_MUTATIONS_TABLE, failure.key, failure);
        });
    }
    async clearFailSafeMutation(trc, failure) {
        await this.storage.transact(trc, 'clearFailSafeMutation', async (tx) => {
            await tx.removeValue(trc, FAIL_SAFE_TABLE, failure.key);
        });
    }
    async clearFailSafeTable(trc) {
        await this.storage.transact(trc, 'clearFailedMutations', async (tx) => {
            await tx.clearTable(trc, FAIL_SAFE_TABLE);
        });
    }
    getOptimisticMutations() {
        return this.optimisticMutations;
    }
    getOptimisticMutationInfo() {
        return {
            optimistic: this.optimisticMutations.length,
            optimisticNames: this.optimisticMutations.map(mutation => mutation.name),
        };
    }
    hasOptimisticMutations() {
        return this.optimisticMutations.length > 0;
    }
    // this function queries the DB directly so that it can trigger a subscription
    async hasPendingMutations(trc, watcher) {
        const remoteMutationKeys = await this.storage.getKeys(trc, watcher, REMOTE_MUTATIONS_TABLE);
        return Boolean(remoteMutationKeys.length);
    }
    async addMutation(trc, mutation) {
        await this.storage.transact(trc, 'MutationManager.addMutation', async (db) => {
            await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutation.mutationID, mutation);
            await db.setValue(trc, REMOTE_MUTATIONS_TABLE, mutation.mutationID, mutation);
        });
        this.optimisticMutations.push(mutation);
    }
    async addMutations(trc, mutations) {
        await this.storage.transact(trc, 'MutationManager.addMutations', async (db) => {
            for (const mutation of mutations) {
                await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutation.mutationID, mutation);
                await db.setValue(trc, REMOTE_MUTATIONS_TABLE, mutation.mutationID, mutation);
            }
        });
        this.optimisticMutations.push(...mutations);
    }
    async rollupForUpsync(trc, mutatorDefs, remoteMutations) {
        const { changes, mutations, errors } = MutationRollup_1.rollupPendingMutations(remoteMutations, mutatorDefs);
        if (errors.length) {
            conduit_utils_1.logger.error('MutationManager.rollupForUpsync errors: ', errors);
        }
        if (!Object.keys(changes).length) {
            // early out if nothing deps
            return mutations;
        }
        // apply changes
        await this.storage.transact(trc, 'MutationManager.rollupForUpsync', async (db) => {
            for (const mutationID in changes) {
                const m = changes[mutationID];
                const oIdx = this.optimisticMutations.findIndex(om => om.mutationID === mutationID);
                if (m) {
                    await db.setValue(trc, REMOTE_MUTATIONS_TABLE, mutationID, m);
                    if (oIdx >= 0) {
                        await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutationID, m);
                        this.optimisticMutations[oIdx] = m;
                    }
                }
                else {
                    await db.removeValue(trc, REMOTE_MUTATIONS_TABLE, mutationID);
                    if (oIdx >= 0) {
                        await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, mutationID);
                        await db.removeValue(trc, MUTATION_RESULTS_TABLE, mutationID);
                        this.optimisticMutations.splice(oIdx, 1);
                    }
                }
            }
        });
        return mutations;
    }
    async processMutationUpsyncResults(trc, mutations, mutationResults) {
        const { successMutations, retryMutations, failedMutations } = conduit_utils_1.multiSplitArray(mutations, m => {
            const e = GraphMutationTypes_1.mutationUpsyncError(mutationResults[m.mutationID]);
            if (e instanceof conduit_utils_1.RetryError) {
                return 'retryMutations';
            }
            if (e) {
                return 'failedMutations';
            }
            return 'successMutations';
        });
        await this.storage.transact(trc, 'MutationManager.processMutationUpsyncResults', async (db) => {
            var _a;
            for (const mIter of (successMutations || [])) {
                let m = mIter;
                await db.removeValue(trc, REMOTE_MUTATIONS_TABLE, m.mutationID);
                // mark as retry because we already ran it; in case of an error after this transaction the DataConsumer will rerun the mutations
                m = SimplyImmutable.updateImmutable(m, ['isRetry'], true);
                // persist any changes to mutation
                const index = this.optimisticMutations.findIndex(om => om.mutationID === m.mutationID);
                if (index >= 0) {
                    this.optimisticMutations[index] = m; // update the cached optimistic mutation since preprocess now clones mutations
                    await db.setValue(trc, OPTIMISTIC_MUTATIONS_TABLE, m.mutationID, m); // save mutation with new timestamp
                }
                else {
                    conduit_utils_1.logger.error('Mutation should still be in optimistic list. This should never happen');
                }
                const res = mutationResults[m.mutationID];
                if (GraphMutationTypes_1.isMutationUpsyncSuccess(res)) {
                    const deps = res.deps;
                    await db.setValue(trc, MUTATION_RESULTS_TABLE, m.mutationID, {
                        deps,
                        timestamp: (_a = res.timestamp) !== null && _a !== void 0 ? _a : Date.now(),
                    });
                    if (deps) {
                        await this.addMutationDeps(trc, m.mutationID, deps, db);
                        conduit_utils_1.logger[VERBOSE_LEVEL]('addMutationDeps', m.mutationID, m.name, deps);
                    }
                }
            }
            for (const m of (failedMutations || [])) {
                await db.removeValue(trc, REMOTE_MUTATIONS_TABLE, m.mutationID);
                await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, m.mutationID);
                await db.removeValue(trc, MUTATION_RESULTS_TABLE, m.mutationID);
                const oIdx = this.optimisticMutations.findIndex(om => om.mutationID === m.mutationID);
                if (oIdx >= 0) {
                    this.optimisticMutations.splice(oIdx, 1);
                }
            }
            if (retryMutations && retryMutations.length) {
                // mutation may have been run by the server successfully but interrupted on response,
                // so mark for correct handling on retry
                const m = retryMutations[0] = SimplyImmutable.updateImmutable(retryMutations[0], ['isRetry'], true);
                await db.setValue(trc, REMOTE_MUTATIONS_TABLE, m.mutationID, m);
            }
        });
        return {
            retryMutations,
            failedMutations,
            successMutations,
        };
    }
    async clearRoundTrippedOptimisticMutations(trc, remoteGraph, lastDownsyncTimestamp) {
        if (!this.optimisticMutations.length) {
            return;
        }
        const count = await this.storage.transact(trc, 'MutationManager.clearRoundTrippedOptimisticMutations', async (db) => {
            for (let i = 0; i < this.optimisticMutations.length; ++i) {
                const m = this.optimisticMutations[i];
                // Mutation has yet to run, don't clear
                if (await db.hasKey(trc, null, REMOTE_MUTATIONS_TABLE, m.mutationID)) {
                    return i;
                }
                if (!(await this.checkRoundtripped(trc, remoteGraph, db, m, lastDownsyncTimestamp))) {
                    // not roundtripped yet
                    return i;
                }
                await db.removeValue(trc, OPTIMISTIC_MUTATIONS_TABLE, m.mutationID);
                await db.removeValue(trc, MUTATION_RESULTS_TABLE, m.mutationID);
            }
            return this.optimisticMutations.length;
        });
        if (count) {
            this.optimisticMutations.splice(0, count);
        }
    }
    async checkRoundtripped(trc, remoteGraph, db, m, lastDownsyncTimestamp) {
        const results = await db.getValue(trc, null, MUTATION_RESULTS_TABLE, m.mutationID);
        if (!results) {
            // unexpected, but just log a warning, mark it as roundtripped, and continue
            conduit_utils_1.logger.warn('MutationManager.checkRoundtripped found no MutationResults', { mutationID: m.mutationID, name: m.name });
            return true;
        }
        const timeSinceUpsync = lastDownsyncTimestamp - results.timestamp;
        if (timeSinceUpsync < 0) {
            // there has been no downsync since the upsync, definitely not roundtripped
            return false;
        }
        if (!results.deps) {
            // never had any unsynced dependencies, timestamp check is sufficient
            return true;
        }
        // check outstanding deps for deletedNode and deletedAssociation
        let depCount = 0;
        for (const key in results.deps) {
            const dep = results.deps[key];
            if (!dep.deletedAssociation && !dep.deletedNode) {
                depCount++;
                continue;
            }
            let needDeleted = (dep.deletedAssociation ? 1 : 0) + (dep.deletedNode ? 1 : 0);
            if (dep.deletedAssociation && !(await remoteGraph.getEdge(trc, null, dep.deletedAssociation))) {
                needDeleted--;
            }
            if (dep.deletedNode && !(await remoteGraph.getNode(trc, null, dep.deletedNode))) {
                needDeleted--;
            }
            if (needDeleted) {
                depCount++;
            }
        }
        // check if mutation has dependencies synced now
        if (!depCount) {
            return true;
        }
        // check if it has been an extended amount of time between upsync and downsync and we still don't have the dependencies
        if (timeSinceUpsync >= ROUNDTRIP_AGEOUT_THRESHOLD) {
            // if so, just mark it as roundtripped; likely the mutation returned bad results
            conduit_utils_1.logger.warn('Timed out waiting for mutation to roundtrip', {
                mutation: m.name,
                waitingFor: results.deps,
            });
            return true;
        }
        conduit_utils_1.logger[VERBOSE_LEVEL]('waiting for roundtrip', m.mutationID, m.name, results.deps);
        return false;
    }
    async markDependencySynced(trc, depKey, depVersion) {
        conduit_utils_1.logger[VERBOSE_LEVEL]('markDependencySynced', depKey, depVersion);
        const mutationIDs = this.depToMutationIDs[depKey];
        if (!mutationIDs) {
            return;
        }
        await this.storage.transact(trc, 'MutationManager.markDependencySynced', async (db) => {
            for (let i = mutationIDs.length - 1; i >= 0; --i) {
                const id = mutationIDs[i];
                const results = await db.getValue(trc, null, MUTATION_RESULTS_TABLE, id);
                if (!results || !results.deps) {
                    continue;
                }
                const dep = results.deps[depKey];
                if (!dep) {
                    continue;
                }
                if (depVersion < dep.version) {
                    // dependency has not been updated to the version we need, don't clear it
                    continue;
                }
                await db.setValue(trc, MUTATION_RESULTS_TABLE, id, SimplyImmutable.deleteImmutable(results, ['deps', depKey]));
                mutationIDs.splice(i, 1);
                conduit_utils_1.logger[VERBOSE_LEVEL]('mutation dependencies synced', id);
            }
        });
        if (mutationIDs.length === 0) {
            delete this.depToMutationIDs[depKey];
        }
    }
}
exports.MutationManager = MutationManager;
//# sourceMappingURL=MutationManager.js.map