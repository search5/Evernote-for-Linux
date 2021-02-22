"use strict";
/*!
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
exports.observeV2 = exports.observe = void 0;
const conduit_utils_1 = require("conduit-utils");
const WatcherManager = __importStar(require("./WatcherManager"));
function observe(...args) {
    const [query, vars, priority, debugTrace] = args;
    return observer => {
        const onUpdate = (res) => {
            if (res.error) {
                observer.error(res.error);
            }
            else {
                observer.next(res.data);
            }
        };
        const watcher = WatcherManager.getWatcher({
            query,
            vars,
            priority: priority !== null && priority !== void 0 ? priority : conduit_utils_1.Priority.MEDIUM,
            onUpdate,
            debugTrace,
        });
        return {
            unsubscribe: () => {
                WatcherManager.releaseWatcher(watcher, onUpdate);
            },
        };
    };
}
exports.observe = observe;
function observeV2(...args) {
    const [query, vars, priority, debugTrace] = args;
    return observer => {
        const onUpdate = (res) => {
            observer.next(res);
        };
        const watcher = WatcherManager.getWatcher({
            query,
            vars,
            priority: priority !== null && priority !== void 0 ? priority : conduit_utils_1.Priority.MEDIUM,
            onUpdate,
            debugTrace,
        });
        return {
            unsubscribe: () => {
                WatcherManager.releaseWatcher(watcher, onUpdate);
            },
        };
    };
}
exports.observeV2 = observeV2;
//# sourceMappingURL=Observable.js.map