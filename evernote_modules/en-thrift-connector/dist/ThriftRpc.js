"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
exports.updateThriftBackoffManager = exports.wrapThriftCall = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const ThriftExceptions = __importStar(require("evernote-thrift/node/transport/Exceptions"));
const Auth_1 = require("./Auth");
const SHAPE_HEADER_NAME = 'X-EN-SHAPE';
const UPGRADE_REQUIRED_CODE = '426';
const SHAPE_BLOCKED_CODE = '429';
const DEACTIVATED_BUSINESS_ACCOUNT_PARAMETER = 'businessUserStatus';
const PASSWORD_RESET_REQUIRED_PARAM = 'password';
const RETRY_STATUS_CODES = {
    500: true,
    502: true,
    503: true,
    504: true,
};
const gTrcPool = new conduit_utils_1.AsyncTracePool('ThriftRpc');
let thriftBackoffManager = new conduit_utils_1.ExponentialBackoffManager(16000);
function handleEdamErrorCode(errorCode, authenticationToken, fnName, parameter, message, rateLimitDuration) {
    switch (errorCode) {
        case en_conduit_sync_types_1.EDAMErrorCode.SHARD_UNAVAILABLE:
            return new conduit_utils_1.RetryError('SHARD_UNAVAILABLE', 15000);
        case en_conduit_sync_types_1.EDAMErrorCode.PERMISSION_DENIED:
            // Deactivated Business User - Login with Password
            if (parameter === DEACTIVATED_BUSINESS_ACCOUNT_PARAMETER) {
                return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.BUSINESS_ACCOUNT_DEACTIVATED, authenticationToken, parameter || undefined);
            }
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.PERMISSION_DENIED, authenticationToken, parameter || undefined);
        case en_conduit_sync_types_1.EDAMErrorCode.INVALID_AUTH:
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.INVALID_AUTH, authenticationToken, parameter || undefined);
        case en_conduit_sync_types_1.EDAMErrorCode.AUTH_EXPIRED:
            if (parameter === PASSWORD_RESET_REQUIRED_PARAM) {
                return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.PASSWORD_RESET_REQUIRED, authenticationToken, parameter || undefined);
            }
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.AUTH_EXPIRED, authenticationToken, parameter || undefined);
        case en_conduit_sync_types_1.EDAMErrorCode.BUSINESS_SECURITY_LOGIN_REQUIRED:
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.BUSINESS_SECURITY_LOGIN_REQUIRED, authenticationToken, parameter || undefined);
        case en_conduit_sync_types_1.EDAMErrorCode.SSO_AUTHENTICATION_REQUIRED:
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.SSO_AUTHENTICATION_REQUIRED, authenticationToken, parameter || undefined);
        case en_conduit_sync_types_1.EDAMErrorCode.DATA_REQUIRED:
            if (parameter === 'authenticationToken' && authenticationToken === '') {
                // On web, when cookie is not present or cookie expires, service returns DATA_REQUIRED error instead of INVALID_AUTH
                // We should treat this case as INVALID_AUTH and return AuthError instead of ServiceError.
                return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.INVALID_AUTH, authenticationToken, parameter || undefined);
            }
            return new conduit_utils_1.ServiceError('DATA_REQUIRED', parameter || '', message || undefined, errorCode);
        case en_conduit_sync_types_1.EDAMErrorCode.ACCOUNT_CLEAR:
            // Deactivated Business User - Login with SSO
            // In Thrift Document, This error code is thrown only for deactivated business accounts.
            // 'businessUserStatus' is passed as parameter here like PERMISSION_DENIED.
            return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.BUSINESS_ACCOUNT_DEACTIVATED, authenticationToken, parameter || undefined);
        case en_conduit_sync_types_1.EDAMErrorCode.LIMIT_REACHED:
            return new conduit_utils_1.ServiceError('LIMIT_REACHED', parameter || '', message || undefined, errorCode);
        case en_conduit_sync_types_1.EDAMErrorCode.QUOTA_REACHED:
            return new conduit_utils_1.ServiceError('QUOTA_REACHED', parameter || '', message || undefined, errorCode);
        case en_conduit_sync_types_1.EDAMErrorCode.RATE_LIMIT_REACHED:
            return new conduit_utils_1.RetryError('RATE_LIMIT_REACHED', (rateLimitDuration || 1) * 1000);
        case en_conduit_sync_types_1.EDAMErrorCode.DEVICE_LIMIT_REACHED:
            return new conduit_utils_1.ServiceError('DEVICE_LIMIT_REACHED', parameter || '', message || undefined, errorCode);
        case en_conduit_sync_types_1.EDAMErrorCode.DATA_CONFLICT:
            return new conduit_utils_1.ServiceError('DATA_CONFLICT', parameter || '', message || undefined, errorCode);
        case en_conduit_sync_types_1.EDAMErrorCode.DATA_REQUIRED:
            return new conduit_utils_1.ServiceError('DATA_REQUIRED', parameter || '', message || undefined, errorCode);
        case en_conduit_sync_types_1.EDAMErrorCode.BAD_DATA_FORMAT:
            if (parameter === 'authenticationToken') { // Something wrong with token. we have to make user login again.
                return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.BAD_AUTH_TOKEN, authenticationToken);
            }
            return new conduit_utils_1.ServiceError('BAD_DATA_FORMAT', parameter || '', message || undefined, errorCode);
    }
}
function errToString(err, fallback) {
    if (typeof err === 'string') {
        return err;
    }
    return err.message || conduit_utils_1.safeStringify(err) || fallback || '';
}
function loggableFnWithArgs(fnName, authenticationToken, args) {
    let argStr = conduit_utils_1.safeStringify(args);
    if (authenticationToken) {
        argStr = argStr.replace(authenticationToken, '<authToken>');
    }
    return `${fnName}(${argStr.slice(1, -1)})`;
}
// GraphQL does bad things to Thrift errors, because it is always checking
// `err instanceof Error`, which is false for Thrift errors.
// Convert Thrift errors to our custom error classes here.
function wrapThriftError(err, fnName, authenticationToken, argAuthToken, args) {
    if (err instanceof conduit_utils_1.RetryError) {
        return err;
    }
    if (err instanceof ThriftExceptions.TransportException) {
        if (err.cause instanceof ThriftExceptions.NetworkException) {
            // network problems are retryable, so throw a RetryError instead
            return new conduit_utils_1.RetryError(`NetworkException: ${err.cause.message}`, 30000);
        }
        if (err.cause instanceof ThriftExceptions.HTTPException) {
            if (RETRY_STATUS_CODES.hasOwnProperty(err.cause.statusCode)) {
                // certain HTTP status codes indicate a retryable problem, so throw a RetryError isntead
                return new conduit_utils_1.RetryError(`http.${err.cause.statusCode}`, 30000);
            }
            if (String(err.cause.statusCode) === UPGRADE_REQUIRED_CODE) {
                return new conduit_utils_1.AuthError(conduit_utils_1.AuthErrorCode.CLIENT_NOT_SUPPORTED, authenticationToken, UPGRADE_REQUIRED_CODE);
            }
            if (String(err.cause.statusCode) === SHAPE_BLOCKED_CODE) {
                // service-side security layer can block us if we issue too many requests after a 429 response with X-EN-SHAPE header
                // Throws HTTP Error
                const headers = err.cause.headers || {};
                const shapeHeaderKey = Object.keys(headers).find(x => x.toUpperCase() === SHAPE_HEADER_NAME);
                if (shapeHeaderKey && headers[shapeHeaderKey] === 'true') {
                    return new conduit_utils_1.AccessBlockedError(err.cause.statusCode, err.cause.message);
                }
                thriftBackoffManager.bumpDelayTime();
                return new conduit_utils_1.RetryError('http.429', thriftBackoffManager.getDelayDuration());
            }
            return new conduit_utils_1.AccessBlockedError(err.cause.statusCode, err.cause.message);
        }
        return new conduit_utils_1.ServiceError('TransportException', err.cause, conduit_utils_1.safeStringify(err));
    }
    if (err instanceof Error) {
        if (err.message.startsWith('Unable to receive')) {
            throw new conduit_utils_1.ServiceError('ThriftParseError', fnName, `Failed to parse Thrift response for call to ${loggableFnWithArgs(fnName, argAuthToken, args)}: ${conduit_utils_1.safeStringify(err)}`);
        }
        return err;
    }
    // handle the EDAM error types
    if (err instanceof en_conduit_sync_types_1.EDAMUserException) {
        const wrapped = handleEdamErrorCode(err.errorCode, authenticationToken, fnName, err.parameter, undefined, undefined);
        if (wrapped) {
            return wrapped;
        }
        return new conduit_utils_1.ServiceError('EDAMUserException', err.parameter || '', `errorCode=${err.errorCode} parameter=${err.parameter}`, err.errorCode);
    }
    if (err instanceof en_conduit_sync_types_1.EDAMSystemException) {
        const wrapped = handleEdamErrorCode(err.errorCode, authenticationToken, fnName, undefined, err.message, err.rateLimitDuration);
        if (wrapped) {
            return wrapped;
        }
        return new conduit_utils_1.ServiceError('EDAMSystemException', '', `errorCode=${err.errorCode} message=${err.message} rateLimitDuration=${err.rateLimitDuration}`, err.errorCode);
    }
    if (err instanceof en_conduit_sync_types_1.EDAMNotFoundException) {
        return new conduit_utils_1.ServiceError('EDAMNotFoundException', err.identifier || '', `identifier=${err.identifier} key=${err.key}`);
    }
    return new conduit_utils_1.ServiceError(errToString(err, 'Unknown Thrift error'), '', undefined, err.errorCode);
}
async function wrapThriftCall(trc, authenticationToken, fnName, self, fn, ...args) {
    const delay = thriftBackoffManager.getDelayDuration();
    if (delay > 0) {
        throw new conduit_utils_1.RetryError('Slowing down request', delay);
    }
    const serviceAuthToken = Auth_1.toServiceToken(authenticationToken, args);
    const asyncTrc = gTrcPool.alloc(trc.testEventTracker);
    conduit_utils_1.traceEventStart(asyncTrc, fnName);
    conduit_utils_1.traceEventStart(trc, fnName);
    const res = await conduit_utils_1.withError(conduit_utils_1.promisifyCallUntyped(self, fn, args));
    conduit_utils_1.traceEventEnd(trc, fnName, res.err && errToString(res.err));
    conduit_utils_1.traceEventEnd(asyncTrc, fnName, res.err && errToString(res.err));
    gTrcPool.release(asyncTrc);
    if (res.err) {
        throw wrapThriftError(res.err, fnName, authenticationToken, serviceAuthToken, args);
    }
    thriftBackoffManager.resetDelay();
    return res.data;
}
exports.wrapThriftCall = wrapThriftCall;
function updateThriftBackoffManager(maxBackoffTimeout) {
    if (maxBackoffTimeout < 1000) {
        conduit_utils_1.logger.debug('Max backoff timeout value is too small. Set to default');
        thriftBackoffManager = new conduit_utils_1.ExponentialBackoffManager(16000);
    }
    else {
        thriftBackoffManager = new conduit_utils_1.ExponentialBackoffManager(maxBackoffTimeout);
    }
}
exports.updateThriftBackoffManager = updateThriftBackoffManager;
//# sourceMappingURL=ThriftRpc.js.map