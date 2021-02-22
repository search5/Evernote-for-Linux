"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThriftRemoteMutationExecutor = exports.generateCustomID = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Converters_1 = require("./Converters/Converters");
const Helpers_1 = require("./Helpers");
const ThriftGraphInterface_1 = require("./ThriftGraphInterface");
const logger = conduit_utils_1.createLogger('conduit:ThriftRemoteMutationExecutor');
function generateCustomID(nodeType, fields, parent) {
    if (nodeType === en_data_model_1.CoreEntityTypes.Stack && fields && fields.label) {
        return Converters_1.convertGuidFromService(fields.label, en_data_model_1.CoreEntityTypes.Stack);
    }
    else if (nodeType === en_data_model_1.CoreEntityTypes.Shortcut && parent) {
        return Converters_1.convertGuidFromService(parent.id, en_data_model_1.CoreEntityTypes.Shortcut);
    }
    return null;
}
exports.generateCustomID = generateCustomID;
class ThriftRemoteMutationExecutor extends conduit_core_1.RemoteMutationExecutor {
    constructor(di, graphStorage, thriftComm, sendMutationMetrics, localSettings, offlineContentStrategy, stagedBlobManager, syncEngine, dispatchCustomCommand) {
        super();
        this.di = di;
        this.graph = new ThriftGraphInterface_1.ThriftGraphInterface(di, {
            graphStorage,
            thriftComm,
            localSettings,
            offlineContentStrategy,
            stagedBlobManager,
            vaultUserProvider: syncEngine,
            dispatchCustomCommand,
        });
        this.mutationEngine = di.MutationEngine(sendMutationMetrics);
    }
    isAvailable() {
        return true;
    }
    async runMutation(trc, userID, vaultUserID, mutation, isFlush) {
        if (Helpers_1.shouldBufferMutation(mutation, isFlush)) {
            // not actually an error, just using the exception catching path to let GraphDB know to rerun this later
            throw new conduit_utils_1.RetryError('buffered mutation', 100);
        }
        return await this.mutationEngine.runMutation(trc, this.graph, false, userID, vaultUserID, mutation);
    }
    async runMutations(trc, authData, userID, vaultUserID, mutations, opts) {
        if (!this.mutationEngine) {
            throw new Error('No mutation engine');
        }
        // apply mutations
        const errors = {};
        const batchTimestamps = {};
        let abortForRetry = false;
        for (const mutation of mutations) {
            if (abortForRetry || opts.stopConsumer) {
                errors[mutation.mutationID] = new conduit_utils_1.RetryError(opts.stopConsumer ? 'stopping execution because stopConsumer is true' : 'abort after previous RetryError', 0);
                continue;
            }
            const res = await conduit_utils_1.withError(this.runMutation(trc, userID, vaultUserID, mutation, opts.isFlush));
            if (res.err instanceof conduit_utils_1.AuthError) {
                logger.info(`Encountered auth error. Need to revalidate auth for mutation ${mutation.name}`);
                res.err = await this.di.handleAuthError(trc, res.err);
                logger.info(`handleAuthError ${res.err instanceof conduit_utils_1.RetryError ? 'refreshed auth. retrying mutation' : `auth still valid err ${res.err}`} ${mutation.name}`);
            }
            if (res.err) {
                errors[mutation.mutationID] = res.err;
                if (res.err instanceof conduit_utils_1.RetryError) {
                    abortForRetry = true;
                    logger.debug('Got retryable error on mutation', { name: mutation.name });
                }
                else {
                    logger.error('Error response for mutation', { name: mutation.name, err: res.err });
                }
            }
            if (!Object.keys(errors).length) {
                await this.graph.replaceSyncState(trc, 'updateSyncTime', ['lastSyncTime'], Date.now());
            }
            if (res.data !== undefined) {
                batchTimestamps[mutation.mutationID] = res.data;
            }
        }
        return {
            batchTimestamps,
            errors,
            retryError: (abortForRetry || opts.stopConsumer) ?
                new conduit_utils_1.RetryError(opts.stopConsumer ? 'stopping execution because stopConsumer is true' : 'abort after previous RetryError', 0) : null,
        };
    }
}
exports.ThriftRemoteMutationExecutor = ThriftRemoteMutationExecutor;
//# sourceMappingURL=ThriftRemoteMutationExecutor.js.map