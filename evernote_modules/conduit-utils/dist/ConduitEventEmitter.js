"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitEventEmitter = void 0;
const en_ts_utils_1 = require("en-ts-utils");
class ConduitEventEmitter {
    constructor() {
        this.eventListeners = {};
    }
    destructor() {
        for (const event in this.eventListeners) {
            this.eventListeners[event].clear();
        }
    }
    addEventListener(event, func) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = new Set();
        }
        this.eventListeners[event].add(func);
    }
    removeEventListener(event, func) {
        var _a;
        (_a = this.eventListeners[event]) === null || _a === void 0 ? void 0 : _a.delete(func);
    }
    emitEvent(event, data) {
        var _a;
        (_a = this.eventListeners[event]) === null || _a === void 0 ? void 0 : _a.forEach(listener => {
            try {
                listener(data);
            }
            catch (err) {
                en_ts_utils_1.logger.error('Exception occurred in ConduitEventListener: ', err);
            }
        });
    }
}
exports.ConduitEventEmitter = ConduitEventEmitter;
//# sourceMappingURL=ConduitEventEmitter.js.map