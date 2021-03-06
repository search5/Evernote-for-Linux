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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDiff = exports.setEquals = exports.setContains = exports.toPascalCase = exports.basename = exports.deepUpdateMutable = exports.DemandLoader = exports.binarySearch = exports.DataConsumer = exports.runAfter = exports.logIfSlow = exports.logAfter = exports.deleteUndefinedProperties = exports.verifyStash = exports.isStashEmpty = exports.firstStashEntry = exports.firstStashKey = exports.allSettled = exports.allWithError = exports.unwrapErrOrData = exports.withError = exports.fromMaybe = exports.cancellableSleep = exports.allocPromise = exports.convertStashToPaths = exports.objectSetField = exports.walkObjectPathSupportsNumeric = exports.walkObjectPath = exports.sleep = exports.absurd = exports.arrayFindAndDelete = exports.arrayPushUnique = exports.loopArray = exports.multiSplitArray = exports.chunkArray = exports.deepFlattenArray = exports.toArray = exports.isNotNullish = exports.isNullish = exports.isEqual = exports.getTypeOf = exports.safeParse = exports.safeStringify = exports.promisifyCallUntyped = exports.promisifyCall = exports.isValuePrimitiveType = exports.emptyAsyncFunc = exports.emptyFunc = void 0;
const Errors_1 = require("./Errors");
const EventTracer_1 = require("./EventTracer");
const logger_1 = require("./logger");
const TimeConstants_1 = require("./TimeConstants");
const SimplyImmutable = __importStar(require("simply-immutable"));
__exportStar(require("./Comparator"), exports);
__exportStar(require("./DebugSettings"), exports);
__exportStar(require("./DeterministicIdGenerator"), exports);
__exportStar(require("./ExecutionQueue"), exports);
__exportStar(require("./Errors"), exports);
__exportStar(require("./EventTracer"), exports);
__exportStar(require("./EventTracerInterface"), exports);
__exportStar(require("./ExponentialBackoffManager"), exports);
__exportStar(require("./Functions"), exports);
__exportStar(require("./logger"), exports);
__exportStar(require("./LongUtils"), exports);
var Mutex_1 = require("./Mutex");
Object.defineProperty(exports, "Mutex", { enumerable: true, get: function () { return Mutex_1.Mutex; } });
Object.defineProperty(exports, "RankedMutex", { enumerable: true, get: function () { return Mutex_1.RankedMutex; } });
Object.defineProperty(exports, "MutexPriority", { enumerable: true, get: function () { return Mutex_1.MutexPriority; } });
__exportStar(require("./RingBuffer"), exports);
__exportStar(require("./sorting"), exports);
var TestLogger_1 = require("./TestLogger");
Object.defineProperty(exports, "TestLogger", { enumerable: true, get: function () { return TestLogger_1.TestLogger; } });
__exportStar(require("./TimeConstants"), exports);
__exportStar(require("./uri"), exports);
__exportStar(require("./xmlHelpers"), exports);
__exportStar(require("./strings"), exports);
function emptyFunc() {
    // no-op
}
exports.emptyFunc = emptyFunc;
async function emptyAsyncFunc() {
    // no-op
}
exports.emptyAsyncFunc = emptyAsyncFunc;
function isValuePrimitiveType(val) {
    if (val === null) {
        return true;
    }
    const valType = typeof val;
    return (valType === 'number' || valType === 'string' || valType === 'boolean');
}
exports.isValuePrimitiveType = isValuePrimitiveType;
function promisifyCall(self, fn, ...args) {
    return promisifyCallUntyped(self, fn, args);
}
exports.promisifyCall = promisifyCall;
function promisifyCallUntyped(self, fn, args) {
    return new Promise((resolve, reject) => {
        fn.apply(self, args.concat((err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        }));
    });
}
exports.promisifyCallUntyped = promisifyCallUntyped;
function safeStringify(val) {
    if (val === null) {
        return 'null';
    }
    if (val === 'undefined') {
        return 'undefined';
    }
    try {
        return JSON.stringify(val);
    }
    catch (err) {
        return '';
    }
}
exports.safeStringify = safeStringify;
function safeParse(str) {
    if (str === 'null' || str === null) {
        return null;
    }
    if (str === 'undefined' || str === undefined) {
        return undefined;
    }
    try {
        return JSON.parse(str);
    }
    catch (err) {
        return;
    }
}
exports.safeParse = safeParse;
function getTypeOf(v) {
    const type = typeof v;
    if (type === 'object') {
        if (Array.isArray(v)) {
            return 'array';
        }
        if (v === null) {
            return 'null';
        }
    }
    return type;
}
exports.getTypeOf = getTypeOf;
function isEqual(a, b) {
    if (a === b) {
        return true;
    }
    const aType = getTypeOf(a);
    const bType = getTypeOf(b);
    if (aType !== bType) {
        return false;
    }
    if (aType === 'array') {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; ++i) {
            if (!isEqual(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    if (aType === 'object') {
        for (const k in a) {
            if (!Object.prototype.hasOwnProperty.call(b, k) && a[k] !== undefined) {
                return false;
            }
            if (!isEqual(a[k], b[k])) {
                return false;
            }
        }
        for (const k in b) {
            if (!Object.prototype.hasOwnProperty.call(a, k) && b[k] !== undefined) {
                return false;
            }
        }
        return true;
    }
    return false;
}
exports.isEqual = isEqual;
function isNullish(value) {
    return value === null || value === undefined;
}
exports.isNullish = isNullish;
function isNotNullish(value) {
    return value !== null && value !== undefined;
}
exports.isNotNullish = isNotNullish;
function toArray(val) {
    if (Array.isArray(val)) {
        return val;
    }
    if (val === undefined) {
        return [];
    }
    return [val];
}
exports.toArray = toArray;
function deepFlattenArray(arr, out = []) {
    for (const a of arr) {
        if (Array.isArray(a)) {
            deepFlattenArray(a, out);
        }
        else {
            out.push(a);
        }
    }
    return out;
}
exports.deepFlattenArray = deepFlattenArray;
function chunkArray(array, chunkSize) {
    const chunkedArray = [];
    let index = 0;
    while (index < array.length) {
        chunkedArray.push(array.slice(index, chunkSize + index));
        index += chunkSize;
    }
    return chunkedArray;
}
exports.chunkArray = chunkArray;
function multiSplitArray(array, filter) {
    const res = {};
    for (const a of array) {
        const bucket = filter(a);
        res[bucket] = res[bucket] || [];
        res[bucket].push(a);
    }
    return res;
}
exports.multiSplitArray = multiSplitArray;
async function loopArray(array, handler, ascending = true) {
    if (ascending) {
        for (let i = 0; i < array.length; i++) {
            if (await handler(array[i], i, array)) {
                return true;
            }
        }
    }
    else {
        for (let i = array.length - 1; i >= 0; i--) {
            if (await handler(array[i], i, array)) {
                return true;
            }
        }
    }
}
exports.loopArray = loopArray;
// returns the array index of the element
function arrayPushUnique(arr, elem) {
    const idx = arr.indexOf(elem);
    if (idx >= 0) {
        return idx;
    }
    arr.push(elem);
    return arr.length - 1;
}
exports.arrayPushUnique = arrayPushUnique;
function arrayFindAndDelete(arr, elem) {
    const idx = arr.indexOf(elem);
    if (idx >= 0) {
        arr.splice(idx, 1);
    }
}
exports.arrayFindAndDelete = arrayFindAndDelete;
function absurd(p, details) {
    return new Error('Unreachable code path reached: ' + details);
}
exports.absurd = absurd;
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function walkObjectPath(obj, path, defaultValue) {
    for (const key of path) {
        if (obj && key in obj) {
            obj = obj[key];
        }
        else {
            return defaultValue;
        }
    }
    return obj;
}
exports.walkObjectPath = walkObjectPath;
function walkObjectPathSupportsNumeric(obj, path) {
    return path.reduce((o, key) => {
        if (o === SimplyImmutable.REMOVE) {
            return SimplyImmutable.REMOVE;
        }
        const index = Number(key);
        if (o && !isNaN(index)) {
            return Array.isArray(o) ? o[index] : o[Object.keys(o)[index]];
        }
        else {
            return o ? o[key] : null;
        }
    }, obj);
}
exports.walkObjectPathSupportsNumeric = walkObjectPathSupportsNumeric;
function objectSetField(value, path, obj) {
    let i = 0;
    for (i; i < path.length - 1; i++) {
        if (!obj[path[i]]) {
            obj[path[i]] = new Object();
        }
        obj = obj[path[i]];
    }
    obj[path[i]] = value;
}
exports.objectSetField = objectSetField;
function convertStashToPaths(stash) {
    const paths = [];
    for (const key in stash) {
        const child = stash[key];
        if (typeof child === 'object' && !Array.isArray(child) && Object.keys(child).length) {
            const childPaths = convertStashToPaths(child);
            for (const childPath of childPaths) {
                paths.push([key].concat(childPath));
            }
        }
        else {
            paths.push([key]);
        }
    }
    return paths;
}
exports.convertStashToPaths = convertStashToPaths;
function allocPromise() {
    let resolveOuter;
    let rejectOuter;
    const promise = new Promise((resolveInner, rejectInner) => {
        resolveOuter = resolveInner;
        rejectOuter = rejectInner;
    });
    return { promise, resolve: resolveOuter, reject: rejectOuter };
}
exports.allocPromise = allocPromise;
function cancellableSleep(ms) {
    let sleepResolve = null;
    let sleepReject = null;
    let sleepTimer;
    const sleepPromise = new Promise((resolve, reject) => {
        sleepResolve = resolve;
        sleepReject = reject;
        sleepTimer = setTimeout(resolve, ms);
    });
    return {
        cancel: (err) => {
            clearTimeout(sleepTimer);
            if (err) {
                sleepReject && sleepReject(err);
            }
            else {
                sleepResolve && sleepResolve();
            }
            sleepResolve = null;
            sleepReject = null;
        },
        promise: sleepPromise,
    };
}
exports.cancellableSleep = cancellableSleep;
function fromMaybe(defaultValue, wrappedValue) {
    return wrappedValue === null ? defaultValue : wrappedValue;
}
exports.fromMaybe = fromMaybe;
async function withError(p) {
    return new Promise(resolve => {
        p
            .then(data => resolve({ data, err: undefined }))
            .catch(err => resolve({ err, data: undefined }));
    });
}
exports.withError = withError;
function unwrapErrOrData(res) {
    if (res.err) {
        throw res.err;
    }
    return res.data;
}
exports.unwrapErrOrData = unwrapErrOrData;
async function allWithError(ps) {
    return await Promise.all(ps.map(withError));
}
exports.allWithError = allWithError;
async function allSettled(ps) {
    const res = await allWithError(ps);
    return res.map(r => {
        if (r.err) {
            throw r.err;
        }
        return r.data;
    });
}
exports.allSettled = allSettled;
function firstStashKey(obj) {
    if (!obj) {
        return null;
    }
    for (const key in obj) {
        return key;
    }
    return null;
}
exports.firstStashKey = firstStashKey;
function firstStashEntry(obj) {
    if (!obj) {
        return null;
    }
    for (const key in obj) {
        return obj[key];
    }
    return null;
}
exports.firstStashEntry = firstStashEntry;
function isStashEmpty(obj) {
    if (!obj) {
        return true;
    }
    for (const _ in obj) {
        return false;
    }
    return true;
}
exports.isStashEmpty = isStashEmpty;
function verifyStash(obj, param) {
    if (!obj || getTypeOf(obj) !== 'object') {
        throw new Error(`${param} must be type of Stash`);
    }
}
exports.verifyStash = verifyStash;
function deleteUndefinedProperties(obj) {
    Object.keys(obj || {}).forEach(k => obj[k] === undefined && delete obj[k]);
}
exports.deleteUndefinedProperties = deleteUndefinedProperties;
function logAfter(debugName, delay, level = 'warn', msg, ...args) {
    return runAfter(debugName, delay, () => logger_1.logger[level](msg, args));
}
exports.logAfter = logAfter;
async function logIfSlow(debugName, timeout, func) {
    const loggerArgs = {};
    const cancel = runAfter(debugName, timeout, () => {
        logger_1.logger.warn(`Long execution ${debugName} didn't finish after ${timeout} ms.`, loggerArgs);
    });
    const res = await withError(func(loggerArgs));
    if (res.err) {
        loggerArgs._fnErr = res.err;
    }
    cancel(loggerArgs);
    return unwrapErrOrData(res);
}
exports.logIfSlow = logIfSlow;
function runAfter(debugName, delay, f) {
    const start = Date.now();
    let timeoutElapsed = false;
    const delayTimer = setTimeout(() => {
        try {
            timeoutElapsed = true;
            f();
        }
        catch (e) {
            logger_1.logger.warn('Uncaught error in runAfter', e);
        }
    }, delay);
    return function cancel(loggerArgs) {
        clearTimeout(delayTimer);
        if (timeoutElapsed) {
            logger_1.logger.info(`${debugName} finished executing after ${Date.now() - start} ms`, loggerArgs);
        }
    };
}
exports.runAfter = runAfter;
class DataConsumer {
    constructor(props) {
        this.props = props;
        this.pendingData = [];
        this.flushWait = null;
        this.backoffWait = null;
        this.backoff = 0;
        this.isDestroyed = false;
        this.consumerPromise = null;
        this.isPaused = false;
        this.pauseLock = null;
        this.consumerOpts = { isFlush: false, stopConsumer: false };
        this.dataWait = cancellableSleep(60 * 1000);
        this.consumerPromise = this.runConsumer();
        this.consumerPromise.catch(err => {
            logger_1.logger.error('DataConsumer.runConsumer fatal', err);
        });
    }
    async destructor(trc) {
        this.isDestroyed = true;
        this.consumerOpts.stopConsumer = true;
        this.dataWait.cancel();
        if (this.flushWait) {
            this.flushWait.cancel();
            this.flushWait = null;
        }
        if (this.pauseLock) {
            this.pauseLock.resolve();
            this.pauseLock = null;
        }
        this.backoffWait && this.backoffWait.cancel();
        const name = this.props.debugName;
        await logIfSlow(`DataConsumer:${name}:destructor:consumerPromise`, 5000, async (loggerArgs) => {
            if (this.consumerPromise) {
                loggerArgs.isPaused = this.isPaused;
                loggerArgs.pendingData = this.pendingData.length;
                EventTracer_1.traceEventStart(trc, `DataConsumer.destructor:${name}`);
                await withError(EventTracer_1.traceEventEndWhenSettled(trc, `DataConsumer.destructor:${name}`, this.consumerPromise));
                this.consumerPromise = null;
            }
        });
    }
    push(...elems) {
        this.pendingData.push(...elems);
        this.dataWait.cancel();
    }
    async flush(timeout = 10 * TimeConstants_1.MILLIS_IN_ONE_SECOND) {
        if (this.isPaused) {
            return {
                completed: 0,
                pending: this.pendingData.length,
            };
        }
        const startCount = this.pendingData.length;
        if (!this.flushWait) {
            this.flushWait = cancellableSleep(timeout);
        }
        this.dataWait.cancel();
        this.backoffWait && this.backoffWait.cancel();
        try {
            await this.flushWait.promise;
            return {
                completed: startCount - this.pendingData.length,
                pending: this.pendingData.length,
            };
        }
        finally {
            this.flushWait = null;
        }
    }
    async runConsumer() {
        while (!this.isDestroyed) {
            if (!this.pendingData.length || this.isPaused) {
                if (this.flushWait) {
                    this.flushWait.cancel();
                    this.flushWait = null;
                }
                this.pauseLock && this.pauseLock.resolve();
                await this.dataWait.promise;
                if (this.isDestroyed) {
                    continue;
                }
                this.dataWait = cancellableSleep(60 * 1000);
                await sleep(this.props.bufferTime);
            }
            if (!this.pendingData.length || this.isDestroyed || this.isPaused) {
                continue;
            }
            const data = this.pendingData;
            this.pendingData = [];
            this.consumerOpts = { isFlush: this.flushWait !== null, stopConsumer: this.isPaused || this.isDestroyed };
            const res = await withError(this.props.consumer(data, this.consumerOpts));
            const retryData = res.err ? data : res.data;
            if (res.err) {
                logger_1.logger.warn(`DataConsumer.runConsumer (${this.props.debugName}) caught error`, res.err);
            }
            if (retryData && retryData.length && !this.isDestroyed) {
                this.pendingData = retryData.concat(this.pendingData);
                if (this.flushWait) {
                    this.flushWait.cancel(new Errors_1.RetryError('DataConsumer.flush', 100));
                    this.flushWait = null;
                }
                // no need to backoff if consumer is stopped
                if (!this.consumerOpts.stopConsumer) {
                    this.backoff += this.props.backoffIncrement;
                    this.backoff = Math.min(this.backoff, this.props.backoffMax);
                    this.backoffWait = cancellableSleep(this.backoff);
                    await this.backoffWait.promise;
                    this.backoffWait = null;
                }
            }
            else {
                this.backoff = 0;
            }
            this.pauseLock && this.pauseLock.resolve();
        }
    }
    async stopConsumer() {
        if (!this.isPaused) {
            this.pauseLock = allocPromise();
            this.isPaused = true;
            // signal consumer to stop execution.
            this.consumerOpts.stopConsumer = true;
            // unblock consumer if blocked
            this.dataWait.cancel();
            this.backoffWait && this.backoffWait.cancel();
        }
        await logIfSlow(`DataConsumer:${this.props.debugName}:stopConsumer`, 5000, async () => {
            this.pauseLock && await this.pauseLock.promise;
            this.pauseLock = null;
        });
        return {
            completed: 0,
            pending: this.pendingData.length,
        };
    }
    async resumeConsumer(timeout = 10 * TimeConstants_1.MILLIS_IN_ONE_SECOND) {
        this.isPaused = false;
        return await this.flush(timeout);
    }
    getPauseState() {
        return this.isPaused;
    }
}
exports.DataConsumer = DataConsumer;
function binarySearch(compare, data, target) {
    if (!data.length) {
        return { exactMatch: false, index: 0 };
    }
    if (compare(target, data[0]) < 0) {
        return { exactMatch: false, index: 0 };
    }
    const endCompare = compare(target, data[data.length - 1]);
    if (endCompare >= 0) {
        return { exactMatch: endCompare === 0, index: data.length };
    }
    let i = 0;
    let j = data.length;
    let mid = 0;
    while (i < j) {
        mid = Math.floor((i + j) / 2);
        const midCompare = compare(target, data[mid]);
        if (midCompare === 0) {
            return { exactMatch: true, index: mid };
        }
        if (midCompare < 0) {
            if (mid > 0 && compare(target, data[mid - 1]) > 0) {
                return { exactMatch: false, index: mid };
            }
            j = mid;
        }
        else {
            if (mid < data.length - 1 && compare(target, data[mid + 1]) < 0) {
                return { exactMatch: false, index: mid + 1 };
            }
            i = mid + 1;
        }
    }
    return { exactMatch: false, index: mid };
}
exports.binarySearch = binarySearch;
class DemandLoader {
    constructor(fetchFunc) {
        this.fetchFunc = fetchFunc;
    }
    getData(trc) {
        if (this.data) {
            return this.data;
        }
        const p = this.fetchFunc(trc);
        p.then(data => {
            // handle the race condition by checking if this promise is still the active one
            if (this.data === p) {
                this.data = data;
            }
        }).catch(err => {
            // handle the race condition by checking if this promise is still the active one
            if (this.data === p) {
                this.data = undefined;
            }
        });
        this.data = p;
        return p;
    }
    setData(data) {
        this.data = data;
    }
    reset() {
        this.data = undefined;
    }
}
exports.DemandLoader = DemandLoader;
// The following method will concat encountered arrays
function deepUpdateMutable(root, value) {
    if (getTypeOf(value) !== 'object' || getTypeOf(root) !== 'object') {
        throw new Error('deepUpdateMutable only accepts objects');
    }
    for (const key in value) {
        const rootType = getTypeOf(root[key]);
        const valueType = getTypeOf(value[key]);
        if (rootType !== valueType) {
            root[key] = value[key];
        }
        else if (valueType === 'array') {
            root[key] = root[key].concat(value[key]);
        }
        else if (valueType !== 'object') {
            root[key] = value[key];
        }
        else {
            deepUpdateMutable(root[key], value[key]);
        }
    }
}
exports.deepUpdateMutable = deepUpdateMutable;
const CHAR_FORWARD_SLASH = 47;
const CHAR_BACKWARD_SLASH = 92;
// Cribbed from path.basename, simplifying out everything we don't need here.
// For platforms where the path module is not available (react-native), or shared modules used on those platforms.
function basename(filepath) {
    for (let i = filepath.length - 1; i >= 0; --i) {
        const char = filepath.charCodeAt(i);
        if (char === CHAR_FORWARD_SLASH || char === CHAR_BACKWARD_SLASH) {
            return filepath.slice(i + 1);
        }
    }
    return filepath;
}
exports.basename = basename;
function toPascalCase(names) {
    return names.filter(name => Boolean(name)).map(name => name.slice(0, 1).toUpperCase() + name.slice(1)).join('');
}
exports.toPascalCase = toPascalCase;
function setContains(superset, subset) {
    for (const field of subset.keys()) {
        if (!superset.has(field)) {
            return false;
        }
    }
    return true;
}
exports.setContains = setContains;
function setEquals(check, against) {
    for (const field of check.keys()) {
        if (!against.has(field)) {
            return false;
        }
    }
    for (const field of against.keys()) {
        if (!check.has(field)) {
            return false;
        }
    }
    return true;
}
exports.setEquals = setEquals;
function setDiff(set1, set2) {
    const out = new Set();
    for (const field of set1.keys()) {
        if (!set2.has(field)) {
            out.add(field);
        }
    }
    for (const field of set2.keys()) {
        if (!set1.has(field)) {
            out.add(field);
        }
    }
    return out;
}
exports.setDiff = setDiff;
//# sourceMappingURL=index.js.map