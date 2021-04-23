"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffError = exports.deserializeError = exports.serializeError = exports.replaceCircular = exports.AccessBlockedError = exports.ServiceNotActiveError = exports.InvalidOperationError = exports.ServiceError = exports.RetryErrorReason = exports.PermissionError = exports.NotFoundError = exports.MissingParameterError = exports.InternalError = exports.CachedQueryError = exports.NoUserError = exports.PartialCreationError = exports.NoAccessError = exports.ConflictError = exports.GraphNodeError = exports.MultiError = exports.SignupError = exports.SignupErrorCode = exports.NAPAuthError = exports.NAPAuthErrorCode = exports.AuthError = exports.GWAuthError = exports.hashTokenForAuthError = exports.AuthErrorCode = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const index_1 = require("./index");
var AuthErrorCode;
(function (AuthErrorCode) {
    AuthErrorCode["NO_USER"] = "NO_USER";
    AuthErrorCode["USER_CHANGED"] = "USER_CHANGED";
    AuthErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    AuthErrorCode["INVALID_AUTH"] = "INVALID_AUTH";
    AuthErrorCode["AUTH_EXPIRED"] = "AUTH_EXPIRED";
    AuthErrorCode["JWT_AUTH_EXPIRED"] = "JWT_AUTH_EXPIRED";
    AuthErrorCode["BUSINESS_SECURITY_LOGIN_REQUIRED"] = "BUSINESS_SECURITY_LOGIN_REQUIRED";
    AuthErrorCode["SSO_AUTHENTICATION_REQUIRED"] = "SSO_AUTHENTICATION_REQUIRED";
    AuthErrorCode["LEGACY_ACCOUNT_NOT_PERMITTED"] = "LEGACY_ACCOUNT_NOT_PERMITTED";
    AuthErrorCode["CLIENT_NOT_SUPPORTED"] = "CLIENT_NOT_SUPPORTED";
    AuthErrorCode["BUSINESS_ACCOUNT_DEACTIVATED"] = "BUSINESS_ACCOUNT_DEACTIVATED";
    AuthErrorCode["EXISTING_ACCOUNT"] = "EXISTING_ACCOUNT";
    AuthErrorCode["SESSION_REVOKED"] = "SESSION_REVOKED";
    AuthErrorCode["BAD_AUTH_TOKEN"] = "BAD_AUTH_TOKEN";
    AuthErrorCode["PASSWORD_RESET_REQUIRED"] = "PASSWORD_RESET_REQUIRED";
})(AuthErrorCode = exports.AuthErrorCode || (exports.AuthErrorCode = {}));
function hashTokenForAuthError(authenticationToken) {
    return authenticationToken ? index_1.md5(authenticationToken) : '';
}
exports.hashTokenForAuthError = hashTokenForAuthError;
class GWAuthError extends Error {
    constructor() {
        super('Auth error from API Gateway');
        this.name = 'GWAuthError';
    }
}
exports.GWAuthError = GWAuthError;
class AuthError extends Error {
    constructor(errorCode, authenticationToken, parameter) {
        // NOTE errorCode and authenticationToken will be undefined when passed in through the deserialize path,
        // but they should be required for all manual constructor calls
        super(errorCode);
        this.name = 'AuthError';
        this.errorCode = errorCode;
        this.tokenHash = hashTokenForAuthError(authenticationToken);
        this.parameter = parameter;
        this.authRevalidated = false;
    }
    getAuthRevalidated() {
        return this.authRevalidated;
    }
    setAuthRevalidated() {
        this.authRevalidated = true;
    }
}
exports.AuthError = AuthError;
// This must follow https://openid.net/specs/openid-connect-core-1_0.html#AuthError
var NAPAuthErrorCode;
(function (NAPAuthErrorCode) {
    NAPAuthErrorCode["InteractionRequired"] = "InteractionRequired";
    NAPAuthErrorCode["LoginRequired"] = "LoginRequired";
    NAPAuthErrorCode["AccountSelectionRequired"] = "AccountSelectionRequired";
    NAPAuthErrorCode["ConsentRequired"] = "ConsentRequired";
    NAPAuthErrorCode["InvalidRequestUri"] = "InvalidRequestUri";
    NAPAuthErrorCode["InvalidRequestObject"] = "InvalidRequestObject";
    NAPAuthErrorCode["RequestNotSupported"] = "RequestNotSupported";
    NAPAuthErrorCode["RequestUriNotSupported"] = "RequestUriNotSupported";
    NAPAuthErrorCode["RegistrationNotSupported"] = "RegistrationNotSupported";
    NAPAuthErrorCode["Unknown"] = "Unknown";
})(NAPAuthErrorCode = exports.NAPAuthErrorCode || (exports.NAPAuthErrorCode = {}));
class NAPAuthError extends Error {
    constructor(errorCode, errorDescription, errorUri, state) {
        // This error will be thrown in Client side
        super(errorCode);
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
        this.errorUri = errorUri;
        this.state = state;
        this.name = 'NAPAuthError';
    }
}
exports.NAPAuthError = NAPAuthError;
var SignupErrorCode;
(function (SignupErrorCode) {
    SignupErrorCode["UNKNOWN"] = "UNKNOWN";
    SignupErrorCode["EMAIL_CONFLICT"] = "EMAIL_CONFLICT";
    SignupErrorCode["CAPTCHA"] = "CAPTCHA";
    SignupErrorCode["ACCOUNT_FAILED"] = "ACCOUNT_FAILED";
    SignupErrorCode["DEACTIVATED"] = "DEACTIVATED";
    SignupErrorCode["USERNAME_OR_EMAIL_INVALID"] = "USERNAME_OR_EMAIL_INVALID";
    SignupErrorCode["CREDENTIALS_INVALID"] = "CREDENTIALS_INVALID";
    SignupErrorCode["OPENID_EMAIL_CONFLICT"] = "OPENID_EMAIL_CONFLICT";
    SignupErrorCode["OPENID_CONFLICT"] = "OPENID_CONFLICT";
    SignupErrorCode["OPENID_ASSOCIATED"] = "OPENID_ASSOCIATED";
    SignupErrorCode["INVALID_PASSWORD"] = "INVALID_PASSWORD";
})(SignupErrorCode = exports.SignupErrorCode || (exports.SignupErrorCode = {}));
class SignupError extends Error {
    constructor(errorCode, message) {
        super(message);
        this.name = 'SignupError';
        this.errorCode = errorCode;
        this.message = message;
    }
}
exports.SignupError = SignupError;
class MultiError extends Error {
    constructor(errorList) {
        // flatten out any MultiErrors in the list
        errorList = (errorList || []).reduce((arr, err) => {
            if (err instanceof MultiError) {
                return arr.concat(err.errorList);
            }
            arr.push(err);
            return arr;
        }, []);
        super((errorList && errorList.length > 0) ? errorList[0].message : 'Unknown Error');
        this.name = 'MultiError';
        this.errorList = errorList || [];
        if (this.errorList && this.errorList.length > 0) {
            this.stack = this.errorList[0].stack;
        }
    }
    isRetryable() {
        for (const err of this.errorList) {
            if (!(err instanceof en_ts_utils_1.RetryError)) {
                return false;
            }
        }
        return true;
    }
    getRetryDelay(minDelay = 0) {
        let delay = minDelay;
        for (const err of this.errorList) {
            if (err instanceof en_ts_utils_1.RetryError) {
                delay = Math.max(delay, err.timeout);
            }
        }
        return delay;
    }
}
exports.MultiError = MultiError;
class GraphNodeError extends Error {
    constructor(id, type, message = 'graph node error') {
        super(message);
        this.name = 'GraphNodeError';
        this.nodeRef = { id, type };
    }
}
exports.GraphNodeError = GraphNodeError;
class ConflictError extends Error {
    constructor(id, type, message = 'conflict detected') {
        super(message);
        this.name = 'ConflictError';
        this.nodeRef = { id, type };
    }
}
exports.ConflictError = ConflictError;
class NoAccessError extends Error {
    constructor(id, message = 'lost access') {
        super(message);
        this.id = id;
    }
}
exports.NoAccessError = NoAccessError;
// This is for nodes that have been partially created on the service but something
// failed in between/during later service calls
class PartialCreationError extends Error {
    constructor(id, nodeType) {
        super(`PartialCreationError on node: ${id}`);
        this.id = id;
        this.nodeType = nodeType;
        this.name = 'PartialCreationError';
    }
}
exports.PartialCreationError = PartialCreationError;
// Not an auth error, just no user.
class NoUserError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoUserError';
    }
}
exports.NoUserError = NoUserError;
class CachedQueryError extends Error {
    constructor(queryID) {
        super(`Cache miss on queryID ${queryID}`);
        this.queryID = queryID;
        this.name = 'CachedQueryError';
    }
}
exports.CachedQueryError = CachedQueryError;
class InternalError extends Error {
    constructor(message = 'not found') {
        super(message);
        this.name = 'InternalError';
    }
}
exports.InternalError = InternalError;
class MissingParameterError extends Error {
    constructor(message = 'missing parameter') {
        super(message);
        this.name = 'MissingParameterError';
    }
}
exports.MissingParameterError = MissingParameterError;
class NotFoundError extends Error {
    constructor(id, message = 'not found') {
        super(message);
        this.name = 'NotFoundError';
        this.id = id;
    }
}
exports.NotFoundError = NotFoundError;
class PermissionError extends Error {
    constructor(message = 'Permission Denied') {
        super(message);
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
var RetryErrorReason;
(function (RetryErrorReason) {
    RetryErrorReason["AUTH_UPDATED"] = "AuthUpdated";
})(RetryErrorReason = exports.RetryErrorReason || (exports.RetryErrorReason = {}));
class ServiceError extends Error {
    constructor(errorType, errorKey, message, errorCode) {
        super(message || `${errorType}: ${errorKey}:${errorCode || ''}`);
        this.name = 'ServiceError';
        this.errorType = errorType;
        this.errorKey = errorKey;
        this.errorCode = errorCode || 0;
    }
}
exports.ServiceError = ServiceError;
class InvalidOperationError extends Error {
    constructor(message = 'Invalid operation') {
        super(message);
        this.name = 'InvalidOperationError';
    }
}
exports.InvalidOperationError = InvalidOperationError;
class ServiceNotActiveError extends Error {
    constructor(service, message = 'Service Not Active') {
        super(`${message}: ${service}`);
        this.service = service;
    }
}
exports.ServiceNotActiveError = ServiceNotActiveError;
class AccessBlockedError extends Error {
    constructor(statusCode, message) {
        super(`Access blocked by server with status code ${statusCode}: ${message}`);
        this.statusCode = statusCode;
        this.name = 'AccessBlockedError';
    }
}
exports.AccessBlockedError = AccessBlockedError;
const commonProps = ['code', 'name', 'message', 'parameter', 'stack'];
const knownErrors = {
    AccessBlockedError,
    AuthError,
    CachedQueryError,
    GraphNodeError,
    InternalError,
    InvalidOperationError,
    MalformedDataError: en_ts_utils_1.MalformedDataError,
    MissingParameterError,
    MultiError,
    NAPAuthError,
    NoAccessError,
    NotFoundError,
    NoUserError,
    PartialCreationError,
    PermissionError,
    RetryError: en_ts_utils_1.RetryError,
    ServiceError,
    SignupError,
    UnloggableError: en_ts_utils_1.UnloggableError,
};
const SkipSymbol = Symbol('SkipSymbol');
// code inspired by github.com/sindresorhus/serialize-error
function replaceCircular(source, seen = []) {
    seen.push(source);
    function mapToOut(val) {
        const type = typeof val;
        if (type === 'function') {
            // ignore funcs
            return SkipSymbol;
        }
        else if (!val || type !== 'object') {
            return val;
        }
        else if (!seen.includes(val)) {
            return replaceCircular(val, seen.slice());
        }
        return '[ReplacedRef]';
    }
    if (Array.isArray(source)) {
        return source.map(mapToOut).filter(val => val !== SkipSymbol);
    }
    const dest = {};
    for (const key of Object.keys(source)) {
        const out = mapToOut(source[key]);
        if (out !== SkipSymbol) {
            dest[key] = out;
        }
    }
    // could be prop not directly on Error object
    for (const key of commonProps) {
        if (typeof source[key] === 'string' || typeof source[key] === 'number') {
            dest[key] = source[key];
        }
    }
    return dest;
}
exports.replaceCircular = replaceCircular;
function serializeError(err) {
    if (typeof err === 'object') {
        return replaceCircular(err);
    }
    return err;
}
exports.serializeError = serializeError;
function deserializeError(errObj) {
    if (!errObj ||
        typeof errObj !== 'object' ||
        typeof errObj.name !== 'string' ||
        typeof errObj.message !== 'string') {
        return errObj;
    }
    else {
        const extra = {};
        if (Array.isArray(errObj.errorList)) {
            extra.errorList = errObj.errorList.map(deserializeError);
        }
        const newError = errObj.name in knownErrors
            // @ts-ignore Ignore type safety to construct an instance of known error.
            // Its properties will be filled by Object.assign.
            ? new knownErrors[errObj.name]()
            : new Error();
        return Object.assign(newError, { stack: undefined }, errObj, extra);
    }
}
exports.deserializeError = deserializeError;
function diffError(a, b) {
    if (a === b) {
        return false;
    }
    if (!a || !b) {
        return true;
    }
    if (a instanceof MultiError && b instanceof MultiError) {
        if (a.errorList.length !== b.errorList.length) {
            return true;
        }
        for (const i in a.errorList) {
            const diff = diffError(a.errorList[i], b.errorList[i]);
            if (diff) {
                return true;
            }
        }
    }
    else if (a instanceof MultiError || b instanceof MultiError) {
        return true;
    }
    else {
        for (const key of Object.getOwnPropertyNames(a)) {
            if (a[key] !== b[key]) {
                return true;
            }
        }
        for (const key of Object.getOwnPropertyNames(b)) {
            if (a[key] !== b[key]) {
                return true;
            }
        }
    }
    return false;
}
exports.diffError = diffError;
//# sourceMappingURL=error.js.map