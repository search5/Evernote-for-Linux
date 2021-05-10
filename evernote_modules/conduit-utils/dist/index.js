"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowCloneExcluding = exports.clearMutableTimeout = exports.setTimeoutForTimestamp = exports.MemLogger = exports.memoize = exports.timeboxExecution = exports.DefaultWidgetRanker = exports.bytesToUuid = exports.uuid = exports.md5Base64 = exports.md5 = exports.createLCGGenerator = exports.generateRandomString = exports.rateLimitErrorLog = exports.getSessionBlock = exports.logAndDiscardError = exports.getVisibleItems = exports.Priority = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const js_md5_1 = __importDefault(require("js-md5"));
const uuid_1 = __importDefault(require("uuid"));
const bytesToUuid_1 = __importDefault(require("uuid/lib/bytesToUuid"));
const CacheManager_1 = require("./CacheManager");
__exportStar(require("en-ts-utils"), exports);
__exportStar(require("./CacheManager"), exports);
__exportStar(require("./ConduitEventEmitter"), exports);
__exportStar(require("./error"), exports);
__exportStar(require("./Telemetry"), exports);
__exportStar(require("./UserID"), exports);
var Priority;
(function (Priority) {
    Priority[Priority["IMMEDIATE"] = 0] = "IMMEDIATE";
    Priority[Priority["HIGH"] = 10] = "HIGH";
    Priority[Priority["MEDIUM"] = 20] = "MEDIUM";
    Priority[Priority["LOW"] = 30] = "LOW";
})(Priority = exports.Priority || (exports.Priority = {}));
function getVisibleItems(list, expanded = {}) {
    const visible = [];
    let keep = 0;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.indentationLevel < keep) {
            keep = item.indentationLevel;
        }
        if (keep >= item.indentationLevel) {
            visible.push(item);
        }
        else if (expanded.hasOwnProperty(list[i - 1].id) && keep >= list[i - 1].indentationLevel) {
            keep++;
            visible.push(item);
        }
    }
    return visible;
}
exports.getVisibleItems = getVisibleItems;
async function logAndDiscardError(p, logMsg) {
    const res = await en_ts_utils_1.withError(p);
    if (res.err && !(res.err instanceof en_ts_utils_1.RetryError)) {
        en_ts_utils_1.logger.error(logMsg !== null && logMsg !== void 0 ? logMsg : 'caught error', res.err);
    }
    return res.data;
}
exports.logAndDiscardError = logAndDiscardError;
function getSessionBlock(time) {
    const fifteenMinutes = en_ts_utils_1.MILLIS_IN_ONE_MINUTE * 15;
    return Math.floor(time / (fifteenMinutes)) * fifteenMinutes;
}
exports.getSessionBlock = getSessionBlock;
function rateLimitErrorLog(durationInMinutes, msg = '') {
    let lastRecordedError = 0;
    return (e) => {
        const now = Date.now();
        if (now > lastRecordedError + (durationInMinutes * en_ts_utils_1.MILLIS_IN_ONE_MINUTE)) {
            lastRecordedError = now;
            en_ts_utils_1.logger.error(msg, e);
        }
    };
}
exports.rateLimitErrorLog = rateLimitErrorLog;
function generateRandomString(prefix = '') {
    return prefix + Math.random().toString(36).substring(8) + Date.now();
}
exports.generateRandomString = generateRandomString;
// A linear congruential generator to deterministically generate NON-cryptographically secure random numbers.
// output = (a * seed + c) mod m
// a and m are picked from "Tables of Linear Congruential Generators of Different Sizes and Good Lattice Structure."
function createLCGGenerator(seed) {
    const a = 2891336453;
    const c = 1;
    const m = Math.pow(2, 32);
    return () => {
        seed = (a * seed + c) % m;
        return seed;
    };
}
exports.createLCGGenerator = createLCGGenerator;
function md5(data) {
    return js_md5_1.default(data);
}
exports.md5 = md5;
function md5Base64(data) {
    return js_md5_1.default.base64(data);
}
exports.md5Base64 = md5Base64;
function uuid(options) {
    return uuid_1.default.v4(options);
}
exports.uuid = uuid;
function bytesToUuid(bytes) {
    return bytesToUuid_1.default(bytes);
}
exports.bytesToUuid = bytesToUuid;
// Only allow sort weights of length 50 or less.
exports.DefaultWidgetRanker = new en_ts_utils_1.LexoRankHandler(50);
async function throwRetryErrorAfter(after, msg, timeout) {
    await en_ts_utils_1.sleep(after);
    throw new en_ts_utils_1.RetryError(msg, timeout);
}
async function timeboxExecution(p, timebox, msg, timeout) {
    return await Promise.race([throwRetryErrorAfter(timebox, msg, timeout), p]);
}
exports.timeboxExecution = timeboxExecution;
function memoize(debugName, f, key, lifetime = 1000, maxWait = 10000) {
    let store = {};
    async function memoizedFunc(...args) {
        const k = key(...args);
        if (store[k]) {
            return store[k];
        }
        const { promise, resolve, reject } = en_ts_utils_1.allocPromise();
        store[k] = promise;
        const res = await en_ts_utils_1.withError(timeboxExecution(f(...args), maxWait, `Memoized function "${debugName}" runs too long`, 500));
        if (res.err) {
            reject(res.err);
            delete store[k];
            throw res.err;
        }
        setTimeout(() => delete store[k], lifetime);
        resolve(res.data);
        return res.data;
    }
    function reset() {
        store = {};
    }
    return [memoizedFunc, reset];
}
exports.memoize = memoize;
class MemLogger {
    constructor(maxKeys = 10, maxEntriesPerKey = 50) {
        this.maxEntriesPerKey = maxEntriesPerKey;
        this.keyedRingBuffers = new CacheManager_1.CacheTable({
            // maintain logs in memory for the last maxKeys (LRU cache)
            softCap: maxKeys,
            hardCap: maxKeys,
            excludeAll: false,
            excludeKeys: [],
        });
    }
    logEvent(key, event, data) {
        let ringBuffer = this.keyedRingBuffers.get(key);
        if (!ringBuffer) {
            // create ring buffer
            ringBuffer = new en_ts_utils_1.RingBuffer(this.maxEntriesPerKey);
        }
        // always do the put() call here to maintain the LRU cache of ring buffers
        this.keyedRingBuffers.put(key, ringBuffer);
        // add the event to the ring buffer
        ringBuffer.push({
            event,
            timestamp: Date.now(),
            data,
        });
    }
    dumpEventsForKey(level, key) {
        const ringBuffer = this.keyedRingBuffers.get(key);
        if (!ringBuffer) {
            return;
        }
        en_ts_utils_1.logger[level](key, ringBuffer.getAll());
        ringBuffer.clear();
    }
}
exports.MemLogger = MemLogger;
const MAX_SET_TIMEOUT_DELAY_MS = 0x7FFFFFFF;
/**
 * Utility function for executing a function at an arbitrary timestamp.  Intended
 * for uses where setTimeout is insufficient due to limit of signed int32 max (ms)
 * or ~24.855 days. Timestamps in the past result in immediate execution.  Returns
 * an object containing a setTimeout id that continually updates as new setTimeouts
 * are invoked.
 *
 * To cancel, simply store the result and call clearMutableTimeout(result)
 *
 * @param fn function to call at specified time
 * @param unixTimeMs unix time in milliseconds
 */
function setTimeoutForTimestamp(fn, unixTimeMs) {
    return setTimeoutForTimestampHelper(fn, unixTimeMs, { value: -1 });
}
exports.setTimeoutForTimestamp = setTimeoutForTimestamp;
function clearMutableTimeout(mutableTimeoutID) {
    clearTimeout(mutableTimeoutID.value);
}
exports.clearMutableTimeout = clearMutableTimeout;
function setTimeoutForTimestampHelper(fn, unixTimeMs, mutableTimeoutId) {
    const now = Date.now();
    const timeUntilExecution = unixTimeMs - now;
    const timeout = Math.max(timeUntilExecution, 0);
    if (timeout > MAX_SET_TIMEOUT_DELAY_MS) {
        mutableTimeoutId.value = setTimeout(() => setTimeoutForTimestampHelper(fn, unixTimeMs, mutableTimeoutId), MAX_SET_TIMEOUT_DELAY_MS);
    }
    else {
        mutableTimeoutId.value = setTimeout(fn, timeout);
    }
    return mutableTimeoutId;
}
function shallowCloneExcluding(obj, fields) {
    const ret = Object.assign({}, obj);
    for (const field of fields) {
        delete ret[field];
    }
    return ret;
}
exports.shallowCloneExcluding = shallowCloneExcluding;
//# sourceMappingURL=index.js.map