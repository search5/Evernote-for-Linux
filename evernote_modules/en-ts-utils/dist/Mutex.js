"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankedMutex = exports.MutexPriority = exports.Mutex = void 0;
const Errors_1 = require("./Errors");
const EventTracer_1 = require("./EventTracer");
const index_1 = require("./index");
const logger_1 = require("./logger");
const Q_1 = require("./Q");
const MUTEX_DEFAULT_TIMEOUT = 5000;
const MUTEX_LONG_LOCK_TIMEOUT = 5000;
const MUTEX_MAX_TIMEOUT_RETRIES = 1;
class MutexLock {
    constructor(mutex, timeout, traceName, indexOf) {
        this.mutex = mutex;
        this.traceName = traceName;
        this.indexOf = indexOf;
        this.lockRelease = null;
        this.lockReject = null;
        this.retries = 0;
        const p = index_1.allocPromise();
        this.lock = p.promise;
        this.lockRelease = p.resolve;
        this.lockReject = p.reject;
        this.scheduleTimeout(timeout);
    }
    scheduleTimeout(timeout) {
        this.timeoutSleep = index_1.cancellableSleep(timeout);
        this.timeoutSleep.promise.then(() => {
            var _a, _b;
            if (this.lockReject === null) {
                return;
            }
            if (this.retries < MUTEX_MAX_TIMEOUT_RETRIES) {
                this.retries++;
                // the index of the mutex adds timeout necessary to wait for previously enqueued mutexes
                const index = this.indexOf(this);
                const newTimeout = timeout / 2.0 * (index + 1);
                logger_1.logger.info(`Retrying mutex cancellation "${((_a = this.mutex.currentLock) === null || _a === void 0 ? void 0 : _a.traceName) || '<none>'}"} of mutex at index ${index} with timeout ${newTimeout} ms`);
                this.scheduleTimeout(newTimeout);
                return;
            }
            this.lockReject(new Errors_1.RetryError(`Timed out waiting to acquire mutex "${this.traceName}", currently locked by "${((_b = this.mutex.currentLock) === null || _b === void 0 ? void 0 : _b.traceName) || '<none>'}"`, 500));
        }).catch(err => {
            logger_1.logger.error('sleep error, should not be possible', err);
        });
    }
    async waitForStart() {
        await this.lock;
    }
    start() {
        this.lockRelease && this.lockRelease();
        this.lockRelease = null;
        this.lockReject = null;
        this.timeoutSleep.cancel();
        this.mutex.currentLock = this;
    }
    cancel(err) {
        this.lockReject && this.lockReject(err);
        this.lockRelease = null;
        this.lockReject = null;
        this.timeoutSleep.cancel();
    }
}
class Mutex {
    constructor(debugName, timeout = MUTEX_DEFAULT_TIMEOUT) {
        this.debugName = debugName;
        this.timeout = timeout;
        this.isDestroyed = false;
        this.waitForComplete = null;
        this.locks = [];
        this.logMutexLongLockWarning = (traceName) => {
            logger_1.logger.warn('Long mutex lock', traceName);
        };
    }
    async destructor() {
        return await index_1.logIfSlow(`Mutex:${this.debugName}:destructor`, 5000, async (loggerArgs) => {
            var _a;
            this.isDestroyed = true;
            loggerArgs.currentLock = ((_a = this.currentLock) === null || _a === void 0 ? void 0 : _a.traceName) || 'none';
            loggerArgs.locks = this.locks.map(l => l.traceName);
            if (this.locks.length > 1) {
                for (let i = 1; i < this.locks.length; ++i) {
                    this.locks[i].cancel(new Error('Mutex destructed'));
                }
                // the first lock is active so leave it running
                this.locks.length = 1;
                loggerArgs.waitForCompleteLocks = this.locks.map(l => l.traceName);
                this.waitForComplete = index_1.allocPromise();
                await this.waitForComplete.promise;
                this.waitForComplete = null;
            }
        });
    }
    isLocked() {
        return this.locks.length > 0;
    }
    isRetrying() {
        var _a, _b;
        return ((_b = (_a = this.currentLock) === null || _a === void 0 ? void 0 : _a.retries) !== null && _b !== void 0 ? _b : 0) > 0;
    }
    async acquireLock(trc, timeout, traceName) {
        if (this.isDestroyed) {
            throw new Error(`Attempted to acquire lock to a destructed mutex "${this.debugName}"`);
        }
        // allocate lock and add to the queue
        const lock = new MutexLock(this, timeout, traceName, (lock) => this.locks.indexOf(lock));
        this.locks.push(lock);
        if (this.locks[0] === lock) {
            // this is the only lock in the queue, unlock it
            lock.start();
        }
        else {
            logger_1.logger.trace(`mutex ${this.debugName} has ${this.locks.length} locks waiting...`);
        }
        // now wait for the lock
        EventTracer_1.traceEventStart(trc, 'acquireLock:' + traceName);
        const res = await index_1.withError(EventTracer_1.traceEventEndWhenSettled(trc, 'acquireLock:' + traceName, lock.waitForStart()));
        if (res.err) {
            await this.release(lock);
            throw res.err;
        }
        return () => {
            try {
                this.release(lock);
            }
            catch (err) {
                logger_1.logger.error('Mutex release error', err);
            }
        };
    }
    release(lock) {
        if (this.locks[0] === lock) {
            // releasing the currently active lock, remove from queue and start the next lock
            this.locks.shift();
            const nextLock = this.locks[0];
            if (nextLock) {
                nextLock.start();
            }
            else {
                this.currentLock = undefined;
                if (this.waitForComplete) {
                    this.waitForComplete.resolve();
                }
            }
        }
        else {
            const idx = this.locks.indexOf(lock);
            if (idx > 0) {
                this.locks.splice(idx, 1);
            }
            lock.cancel(new Error('mutex lock released before start'));
        }
    }
    async runInMutex(trc, name, func, timeoutOverride) {
        const traceName = `${this.debugName}.${name}`;
        const release = await this.acquireLock(trc, typeof timeoutOverride === 'number' ? timeoutOverride : this.timeout, traceName);
        const start = Date.now();
        const timer = setTimeout(this.logMutexLongLockWarning, MUTEX_LONG_LOCK_TIMEOUT, traceName);
        EventTracer_1.traceEventStart(trc, 'mutexLock:' + traceName);
        const res = await index_1.withError(EventTracer_1.traceEventEndWhenSettled(trc, 'mutexLock:' + traceName, func()));
        clearTimeout(timer);
        const delta = Date.now() - start;
        if (delta > MUTEX_LONG_LOCK_TIMEOUT) {
            logger_1.logger.warn('Mutex lock finished', traceName, (delta / 1000).toFixed(2) + 's');
        }
        release();
        return index_1.unwrapErrOrData(res);
    }
}
exports.Mutex = Mutex;
var MutexPriority;
(function (MutexPriority) {
    MutexPriority[MutexPriority["BEFORE_DESTRUCTION"] = 10] = "BEFORE_DESTRUCTION";
    MutexPriority[MutexPriority["HIGH"] = 20] = "HIGH";
    MutexPriority[MutexPriority["MED"] = 30] = "MED";
    MutexPriority[MutexPriority["LOW"] = 40] = "LOW";
})(MutexPriority = exports.MutexPriority || (exports.MutexPriority = {}));
const PRIORITIES = [
    MutexPriority.BEFORE_DESTRUCTION,
    MutexPriority.HIGH,
    MutexPriority.MED,
    MutexPriority.LOW,
];
class RankedMutex {
    constructor(debugName, timeout = MUTEX_DEFAULT_TIMEOUT) {
        this.debugName = debugName;
        this.timeout = timeout;
        this.isDestroyed = false;
        this.waitForComplete = null;
        this.logMutexLongLockWarning = (traceName) => {
            logger_1.logger.warn('Long mutex lock', traceName);
        };
        this.locks = new Q_1.StaticPriorityQ(PRIORITIES);
    }
    getLocksLoggerArgs() {
        return PRIORITIES.map(p => `pri: ${p} locks: ${this.locks.getItemsWithPriority(p).map(l => l.traceName)}`);
    }
    async destructor() {
        return await index_1.logIfSlow(`RankedMutex:${this.debugName}:destructor`, 5000, async (loggerArgs) => {
            var _a;
            this.isDestroyed = true;
            loggerArgs.currentLock = ((_a = this.currentLock) === null || _a === void 0 ? void 0 : _a.traceName) || 'none';
            loggerArgs.locks = this.getLocksLoggerArgs();
            if (this.locks.length > 1) {
                // cancel all locks but BEFORE_DESTRUCTION and current one.
                const currLock = this.currentLock;
                for (const p of PRIORITIES) {
                    if (p === MutexPriority.BEFORE_DESTRUCTION) {
                        continue;
                    }
                    const lockList = this.locks.removeItemsWithPriority(p, lock => lock !== currLock);
                    for (const lock of lockList) {
                        lock.cancel(new Error('Mutex destructed'));
                    }
                }
                loggerArgs.waitForCompleteLocks = this.getLocksLoggerArgs();
                this.waitForComplete = index_1.allocPromise();
                await this.waitForComplete.promise;
                this.waitForComplete = null;
            }
        });
    }
    isLocked() {
        return this.locks.length > 0;
    }
    async acquireLock(trc, timeout, traceName, priority = MutexPriority.MED) {
        if (this.isDestroyed) {
            throw new Error(`Attempted to acquire lock to a destructed mutex "${this.debugName}"`);
        }
        // allocate lock and add to the queue
        const lock = new MutexLock(this, timeout, traceName, (lock) => this.locks.indexOf(lock, priority));
        this.locks.push(lock, priority);
        if (this.locks.length === 1) {
            // this is the only lock in the queue, unlock it
            lock.start();
        }
        else {
            logger_1.logger.trace(`mutex ${this.debugName} has ${this.locks.length} locks waiting...`);
        }
        // now wait for the lock
        EventTracer_1.traceEventStart(trc, 'acquireLock:' + traceName);
        const res = await index_1.withError(EventTracer_1.traceEventEndWhenSettled(trc, 'acquireLock:' + traceName, lock.waitForStart()));
        if (res.err) {
            await this.release(lock);
            throw res.err;
        }
        return () => {
            try {
                this.release(lock);
            }
            catch (err) {
                logger_1.logger.error('Mutex release error', err);
            }
        };
    }
    isRetrying() {
        var _a, _b;
        return ((_b = (_a = this.currentLock) === null || _a === void 0 ? void 0 : _a.retries) !== null && _b !== void 0 ? _b : 0) > 0;
    }
    release(lock) {
        if (this.locks.peekTop() === lock) {
            this.locks.popTop();
        }
        else {
            this.locks.remove(lock);
        }
        if (this.currentLock === lock) {
            const nextLock = this.locks.peekTop();
            if (nextLock) {
                nextLock.start();
            }
            else {
                this.currentLock = undefined;
                if (this.waitForComplete) {
                    this.waitForComplete.resolve();
                }
            }
        }
    }
    async runInMutex(trc, name, func, timeoutOverride, priority = MutexPriority.MED) {
        const traceName = `${this.debugName}.${name}`;
        const release = await this.acquireLock(trc, typeof timeoutOverride === 'number' ? timeoutOverride : this.timeout, traceName, priority);
        const start = Date.now();
        const timer = setTimeout(this.logMutexLongLockWarning, MUTEX_LONG_LOCK_TIMEOUT, traceName);
        EventTracer_1.traceEventStart(trc, 'mutexLock:' + traceName);
        const res = await index_1.withError(EventTracer_1.traceEventEndWhenSettled(trc, 'mutexLock:' + traceName, func()));
        clearTimeout(timer);
        const delta = Date.now() - start;
        if (delta > MUTEX_LONG_LOCK_TIMEOUT) {
            logger_1.logger.warn('Mutex lock finished', traceName, (delta / 1000).toFixed(2) + 's');
        }
        release();
        return index_1.unwrapErrOrData(res);
    }
}
exports.RankedMutex = RankedMutex;
//# sourceMappingURL=Mutex.js.map