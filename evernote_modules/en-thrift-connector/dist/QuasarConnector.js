"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuasarConnectorAndExecutor = exports.RETRY_STATUS_CODES = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const Auth_1 = require("./Auth");
const QuasarMinusAuthHandler_1 = require("./QuasarMinusAuthHandler");
const QuasarMutationBatchBroker_1 = require("./QuasarMutationBatchBroker");
const Types_1 = require("./Types");
const MUTATION_BATCH_SIZE = 1;
const SHAPE_BLOCKED_CODE = '429';
const SHAPE_HEADER_NAME = 'X-EN-SHAPE';
exports.RETRY_STATUS_CODES = {
    429: true,
    500: true,
    502: true,
    503: true,
    504: true,
};
class QuasarConnectorAndExecutor extends conduit_core_1.RemoteMutationExecutor {
    constructor(di, hostResolver, nSyncEventManager) {
        super();
        this.di = di;
        this.hostResolver = hostResolver;
        this.nSyncEventManager = nSyncEventManager;
        this.commandServiceVersion = 'v1';
        this.fileServiceVersion = 'v1';
        this.logger = conduit_utils_1.createLogger('conduit:CommandServiceConnector');
        this.backoffManager = new conduit_utils_1.ExponentialBackoffManager(60000);
        this.dispatchCustomCommand = async (trc, auth, mutation, commandName, params) => {
            var _a, _b, _c;
            if (!this.isAvailable()) {
                return;
            }
            const singleMutation = {
                id: mutation.mutationID,
                name: commandName,
                params,
                guids: Types_1.convertMutationGuids(mutation.guids),
                timestamp: mutation.timestamp,
                isRetry: mutation.isRetry,
            };
            const batchRequest = {
                id: conduit_utils_1.uuid(),
                mutations: [singleMutation],
                timestamp: Date.now(),
                clientID: Auth_1.hasNapAuthInfo(auth) && auth.napAuthInfo.clientID || 'null',
            };
            this.logger.debug('Executing custom command', {
                name: singleMutation.name,
                params: Object.keys(singleMutation.params),
            });
            const response = await this.makeBatchRequest(trc, auth, batchRequest);
            if (response.error) {
                throw response.error;
            }
            else if (((_a = response.mutationResponseBatch) === null || _a === void 0 ? void 0 : _a.mutations[0].wasSuccessful) === false) {
                throw ((_b = response.mutationResponseBatch) === null || _b === void 0 ? void 0 : _b.mutations[0].data.error) || new Error('Unknown error running custom mutation');
            }
            return (_c = response.mutationResponseBatch) === null || _c === void 0 ? void 0 : _c.timestamp;
        };
        this.fetchFileFromService = async (trc, auth, url) => {
            throw new Error('unable to fetch');
        };
        this.uploadFileToService = async (trc, auth, entityType, entityID, fileSeed, data, owner) => {
            if (!this.isAvailable()) {
                throw new conduit_utils_1.InternalError('Unable to upload to service');
            }
            if (!this.di.getHttpTransport) {
                throw new conduit_utils_1.InternalError('no HTTPTransport client present in CommandService');
            }
            const host = await this.hostResolver.getServiceHost(trc, auth.urlHost, 'File');
            const ownerParam = owner && auth.userID !== owner ? `o=${owner}` : '';
            const fullPath = `${host}/${this.fileServiceVersion}/create/${entityType}/${entityID}/${fileSeed}${ownerParam}`;
            const params = {
                method: 'PUT',
                url: fullPath,
                headers: Object.assign(Object.assign({ 'Content-Type': typeof data === 'string' ? 'text/plain' : 'application/octet-stream', 'Digest': `md5=${conduit_utils_1.md5Base64(data)}` }, QuasarMinusAuthHandler_1.QuasarMinusAuthHandler.getAuthHeaders(auth)), this.di.customHeaders),
                body: typeof data === 'string' ? data : data.buffer,
            };
            const response = await this.di.getHttpTransport().request(trc, params);
            return this.handleResponse(response);
        };
        this.makeBatchRequest = async (trc, auth, request) => {
            if (!this.di.getHttpTransport) {
                return { error: new conduit_utils_1.InternalError('no HTTPTransport client present in CommandService') };
            }
            request.timestamp = Date.now();
            const host = await this.hostResolver.getServiceHost(trc, auth.urlHost, 'Command');
            request.timestamp = Date.now();
            if (!host || host.length === 0) {
                return { error: new conduit_utils_1.InternalError(`no QuasarMinusHost available for ${auth.urlHost}`) };
            }
            try {
                const params = {
                    method: 'POST',
                    url: `${host}/${this.commandServiceVersion}/batch`,
                    headers: Object.assign(Object.assign({ 'Content-Type': 'application/json' }, QuasarMinusAuthHandler_1.QuasarMinusAuthHandler.getAuthHeaders(auth)), this.di.customHeaders),
                    body: conduit_utils_1.safeStringify(request),
                };
                const response = await this.di.getHttpTransport().request(trc, params);
                const resultOrError = this.handleResponse(response);
                if (resultOrError.result) {
                    const body = {
                        id: request.id,
                        timestamp: request.timestamp,
                        mutations: conduit_utils_1.safeParse(resultOrError.result) || {},
                    };
                    return { mutationResponseBatch: body };
                }
                else {
                    return { error: resultOrError.error };
                }
            }
            catch (error) {
                return { error };
            }
        };
    }
    isAvailable() {
        if (!this.di.getHttpTransport) {
            return false;
        }
        if (!this.nSyncEventManager.isEnabled()) {
            return false;
        }
        return true;
    }
    async runMutations(trc, authData, userID, vaultUserID, mutations, opts) {
        const auth = Auth_1.decodeAuthData(authData);
        const mutationBatchBroker = new QuasarMutationBatchBroker_1.MutationBatchBroker(mutations, MUTATION_BATCH_SIZE, Auth_1.hasNapAuthInfo(auth) && auth.napAuthInfo.clientID || '', opts);
        while (mutationBatchBroker.hasNextBatch()) {
            if (opts.stopConsumer) {
                this.logger.info('Stopping Quasar runMutations execution as stopConsumer is true');
                mutationBatchBroker.markRemainingMutationsForRetry();
                break;
            }
            const mutationRequestBatch = mutationBatchBroker.getNextBatch();
            this.logger.debug('Executing mutation batch', mutationRequestBatch.mutations.map(mutation => ({
                name: mutation.name,
                params: Object.keys(mutation.params),
            })));
            const { mutationResponseBatch, error } = await this.makeBatchRequest(trc, auth, mutationRequestBatch);
            if (error) {
                let errorFromHandle = null;
                if (error instanceof conduit_utils_1.GWAuthError) {
                    errorFromHandle = await this.di.handleAuthError(trc, new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.JWT_AUTH_EXPIRED, auth.token));
                }
                // reinsert the batch to mark with whatever error needed
                mutationBatchBroker.reinsertBatchAtHead(mutationRequestBatch);
                if (errorFromHandle && !(errorFromHandle instanceof conduit_utils_1.RetryError)) {
                    // some non-retryable error. Mark all remaining mutations with whatever we got back from the handler and do not process anymore batches
                    mutationBatchBroker.markRemainingMutationsWithError(errorFromHandle);
                }
                else {
                    // either a RetryError from the handle or an unknown error. In either case we want to retry the batch
                    mutationBatchBroker.markRemainingMutationsForRetry(500);
                }
                continue;
            }
            if (!mutationResponseBatch) {
                throw new conduit_utils_1.InternalError('No error and empty response body from command service. This should not happen');
            }
            mutationBatchBroker.processMutationResponseBatchErrors(mutationResponseBatch);
        }
        return mutationBatchBroker.getErrorsAndTimestampsKeyedByMutationID();
    }
    handleResponse(response) {
        if (response.status === 200 || response.status === 201) {
            this.backoffManager.resetDelay();
            return { result: response.result };
        }
        else if (response.status === 401 || response.status === 403) {
            this.backoffManager.resetDelay();
            return { error: new conduit_utils_1.GWAuthError() };
        }
        else if (exports.RETRY_STATUS_CODES[response.status]) {
            const shapeHeaderKey = Object.keys(response.headers).find(x => x.toUpperCase() === SHAPE_HEADER_NAME);
            if (String(response.status) === SHAPE_BLOCKED_CODE && shapeHeaderKey && response.headers[shapeHeaderKey] === 'true') {
                return { error: new conduit_utils_1.AccessBlockedError(response.status, response.statusText) };
            }
            this.backoffManager.bumpDelayTime();
            return { error: new conduit_utils_1.RetryError(response.statusText, this.backoffManager.getDelayDuration()) };
        }
        else {
            this.backoffManager.resetDelay();
            return { error: new conduit_utils_1.InternalError('Unknown error in response from the service. Error: ' + response.statusText + 'Status: ' + response.status) };
        }
    }
    validateToken(auth) {
        if (!auth.urlHost) {
            throw new conduit_utils_1.InternalError('QuasarMinus host URL not found in decoded token');
        }
        if (!auth.token) {
            throw new conduit_utils_1.InternalError('Monolith Token not found in decoded token');
        }
        if (!Auth_1.hasNapAuthInfo(auth) || !auth.napAuthInfo.jwt) {
            this.logger.warn('JWT Token not found in decoded token. The request will fail if going through the API Gateway');
        }
        if (!Auth_1.hasNapAuthInfo(auth) || !auth.napAuthInfo.clientID) {
            this.logger.warn('ClientID not found in decoded token. This may cause bugs in mutation round trips');
        }
    }
}
exports.QuasarConnectorAndExecutor = QuasarConnectorAndExecutor;
//# sourceMappingURL=QuasarConnector.js.map