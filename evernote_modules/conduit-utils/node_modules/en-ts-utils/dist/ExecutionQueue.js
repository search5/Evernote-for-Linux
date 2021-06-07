"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionQueue = void 0;
class ExecutionQueue {
    constructor() {
        this.isRunning = false;
        this.isDestroyed = false;
        this.queue = [];
    }
    destructor() {
        this.isDestroyed = true;
        this.queue = [];
    }
    serialize(func) {
        return (...args) => {
            return this.push(func, args);
        };
    }
    push(func, args) {
        if (this.isDestroyed) {
            throw new Error(`ExecutionQueue: Attempting to push after queue is destructed ${func.name}`);
        }
        return new Promise((resolve, reject) => {
            this.queue.push({
                func,
                args,
                resolve,
                reject,
            });
            if (!this.isRunning) {
                this.runNext();
            }
        });
    }
    runNext() {
        if (this.isDestroyed) {
            return;
        }
        this.isRunning = true;
        const cur = this.queue.shift();
        if (!cur) {
            this.isRunning = false;
            return;
        }
        const p = cur.func.apply(undefined, cur.args);
        p.then(res => {
            cur.resolve(res);
            this.runNext();
        }).catch(err => {
            cur.reject(err);
            this.runNext();
        });
    }
}
exports.ExecutionQueue = ExecutionQueue;
//# sourceMappingURL=ExecutionQueue.js.map