"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExponentialBackoffManager = void 0;
class ExponentialBackoffManager {
    constructor(maxBackoff = 64000) {
        this.maxBackoff = 64000; /* milliseconds */
        this.delayState = {
            nAttempts: 0,
            delayUntil: null,
        };
        this.maxBackoff = maxBackoff;
    }
    getDelayDuration() {
        if (this.delayState.delayUntil === null) {
            return 0;
        }
        return Math.max(this.delayState.delayUntil - Date.now(), 0);
    }
    bumpDelayTime() {
        var _a;
        const now = Date.now();
        // TODO: Find lint for this `??` operator.
        // null ?? 2 > 1 (true)
        // 0 ?? 2 > 1 (0)
        if (((_a = this.delayState.delayUntil) !== null && _a !== void 0 ? _a : 0) > now) {
            return;
        }
        const delayDuration = Math.min(
        // delay 2^nAttempts + random_milliseconds
        Math.floor((Math.pow(2, this.delayState.nAttempts) + Math.random()) * 1000), this.maxBackoff + Math.floor(Math.random() * 1000));
        this.delayState.delayUntil = now + delayDuration;
        ++this.delayState.nAttempts;
    }
    resetDelay() {
        this.delayState.nAttempts = 0;
        this.delayState.delayUntil = null;
    }
}
exports.ExponentialBackoffManager = ExponentialBackoffManager;
//# sourceMappingURL=ExponentialBackoffManager.js.map