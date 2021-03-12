"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationBatchBroker = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_nsync_connector_1 = require("en-nsync-connector");
const Helpers_1 = require("./Helpers");
const QuasarConnector_1 = require("./QuasarConnector");
class MutationBatchBroker {
    constructor(di, storage, mutations, batchSize, clientID, opts, ret) {
        this.di = di;
        this.storage = storage;
        this.clientID = clientID;
        this.opts = opts;
        this.ret = ret;
        this.archivedBatches = {};
        this.mutationBatches = [];
        this.logger = conduit_utils_1.createLogger('MutationBatchBroker');
        let count = 0;
        let batch = this.createMutationBatch();
        let abortForRetry = false;
        // check if batch includes a resource upload and return a single mutation batch if that's the case
        for (const mutation of mutations) {
            if (abortForRetry || opts.stopConsumer) {
                this.ret.mutationResults[mutation.mutationID] = {
                    timestamp: Date.now(),
                    error: new conduit_utils_1.RetryError(opts.stopConsumer ? 'stopping execution because stopConsumer is true' : 'abort after previous RetryError', 0),
                };
                continue;
            }
            if (count === batchSize) {
                this.mutationBatches.push(batch);
                batch = this.createMutationBatch();
                count = 0;
            }
            if (Helpers_1.shouldBufferMutation(mutation, opts.isFlush)) {
                this.ret.mutationResults[mutation.mutationID] = {
                    timestamp: Date.now(),
                    error: new conduit_utils_1.RetryError('buffered mutation', 100),
                };
                abortForRetry = true;
                continue;
            }
            const request = this.mutationToMutationRequest(mutation);
            if (request) {
                batch.mutations.push(request);
                count += 1;
            }
        }
        if (batch.mutations.length > 0) {
            this.mutationBatches.push(batch);
        }
    }
    getNextBatch() {
        const batch = this.mutationBatches.shift();
        if (!batch) {
            throw new Error('Mutation batch request broker is empty.');
        }
        this.archivedBatches[batch.id] = { batch, processed: false };
        return batch;
    }
    hasNextBatch() {
        return this.getRemainingBatchCount() > 0;
    }
    reinsertBatchAtHead(batch) {
        if (!this.archivedBatches[batch.id]) {
            throw new Error('Batch has not been archived by this broker and cannot be reinserted.');
        }
        delete this.archivedBatches[batch.id];
        this.mutationBatches.unshift(batch);
    }
    getRemainingBatchCount() {
        return this.mutationBatches.length;
    }
    getArchivedBatchCount() {
        return Object.keys(this.archivedBatches).length;
    }
    hasProcessedAllArchivedBatches() {
        if (this.getRemainingBatchCount() > 0) {
            return false;
        }
        for (const batchID in this.archivedBatches) {
            if (!this.archivedBatches[batchID].processed) {
                return false;
            }
        }
        return true;
    }
    async processMutationResponseBatchErrors(trc, mutationResponseBatch, batchStartTime) {
        if (this.hasProcessedAllArchivedBatches()) {
            throw new Error('All batches archived by this broker have been processed already.');
        }
        const requestBatch = this.archivedBatches[mutationResponseBatch.id];
        if (!requestBatch) {
            throw new Error('Request batch not found in archived batches on this broker.');
        }
        if (requestBatch.processed) {
            throw new Error('Reponse batch has already been processed by this broker.');
        }
        let abortForRetry = false;
        for (const mutationResponse of mutationResponseBatch.mutations) {
            const originalMutationRequest = requestBatch.batch.mutations.find(mutation => mutation.id === mutationResponse.id);
            if (!originalMutationRequest) {
                throw new Error('Mutation response ID does not match any of the mutations in the reuqest batch.');
            }
            this.logger.debug('Mutation Result: ' + conduit_utils_1.safeStringify(mutationResponse));
            // @mmccarry commenting this out until it is determined if we need it
            // if (handledAuthError) {
            //   mutationResponse.data.error = handledAuthError;
            // }
            this.ret.mutationResults[mutationResponse.id] = {
                timestamp: batchStartTime,
                deps: await en_nsync_connector_1.serviceResultsToMutationDeps(trc, this.di, this.storage, mutationResponse.data.result),
                results: null,
            };
            if (!mutationResponse.wasSuccessful && mutationResponse.data.error) {
                let err = mutationResponse.data.error;
                const code = err.code;
                if (code && QuasarConnector_1.RETRY_STATUS_CODES[code]) {
                    err = new conduit_utils_1.RetryError(err.message || err.name, 5000, `mutation batch served back a ${code}`);
                }
                this.ret.mutationResults[mutationResponse.id] = {
                    timestamp: batchStartTime,
                    error: err,
                };
                if (err instanceof conduit_utils_1.RetryError) {
                    this.logger.info('Got retryable error on mutation', { name: originalMutationRequest.name });
                    abortForRetry = true;
                }
                else {
                    this.logger.error('Error response for mutation', {
                        name: originalMutationRequest.name,
                        err,
                        params: conduit_utils_1.safeStringify(originalMutationRequest.params),
                    });
                }
            }
        }
        this.markBatchAsProcessed(mutationResponseBatch.id);
        if (abortForRetry) {
            this.markRemainingMutationsForRetry();
        }
        return abortForRetry;
    }
    markRemainingMutationsForRetry(initialTimeout = 0) {
        let initial = true;
        const errMsg = this.opts.stopConsumer ? 'stopping execution because stopConsumer is true' : 'abort after previous RetryError';
        while (this.hasNextBatch()) {
            const batch = this.getNextBatch();
            for (const mutation of batch.mutations) {
                this.ret.mutationResults[mutation.id] = {
                    timestamp: Date.now(),
                    error: new conduit_utils_1.RetryError(errMsg, (initial ? initialTimeout : 0)),
                };
                initial = false;
            }
            this.markBatchAsProcessed(batch.id);
        }
        if (!this.ret.retryError) {
            this.ret.retryError = new conduit_utils_1.RetryError(errMsg, 0);
        }
    }
    markRemainingMutationsWithError(error) {
        while (this.hasNextBatch()) {
            const batch = this.getNextBatch();
            for (const mutation of batch.mutations) {
                this.ret.mutationResults[mutation.id] = {
                    timestamp: Date.now(),
                    error,
                };
            }
            this.markBatchAsProcessed(batch.id);
        }
    }
    markBatchAsProcessed(batchID) {
        const archivedBatch = this.archivedBatches[batchID];
        if (!archivedBatch) {
            throw new Error(`Batch with ID: ${batchID} has not been archived`);
        }
        archivedBatch.processed = true;
    }
    createMutationBatch() {
        return {
            id: conduit_utils_1.uuid(),
            mutations: [],
            timestamp: 0,
            clientID: this.clientID || 'null',
        };
    }
    mutationToMutationRequest(mutation) {
        if (!this.validateMutation(mutation)) {
            return null;
        }
        // Just to make sure we're not passing anything we don't want to be passing in
        return {
            id: mutation.mutationID,
            name: mutation.name,
            params: mutation.params,
            guids: en_conduit_sync_types_1.convertMutationGuids(mutation.guids),
            timestamp: mutation.timestamp,
            isRetry: mutation.isRetry,
        };
    }
    validateMutation(mutation) {
        if (!mutation.mutationID || !mutation.name || !mutation.params || !mutation.guids) {
            this.ret.mutationResults[mutation.mutationID] = {
                timestamp: Date.now(),
                error: new conduit_utils_1.MissingParameterError(`mutation with missing parameters present in batch - ${conduit_utils_1.safeStringify(mutation)}. Expected id, name, params and guids to be preset`),
            };
            return false;
        }
        return true;
    }
}
exports.MutationBatchBroker = MutationBatchBroker;
//# sourceMappingURL=QuasarMutationBatchBroker.js.map