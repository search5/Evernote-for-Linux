"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
/* eslint-disable no-bitwise */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageWatcher = exports.StorageWatchTree = void 0;
const conduit_utils_1 = require("conduit-utils");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
const logger = conduit_utils_1.createLogger('conduit:StorageWatcher');
let gDebounceTime = conduit_utils_1.registerDebugSetting('WatchDebounce', 10, v => gDebounceTime = v);
let gLongDebounceTime = conduit_utils_1.registerDebugSetting('WatchLongDebounce', 500, v => gLongDebounceTime = v);
function triggerWatches(watches, event) {
    watches.forEach((watch, watcher) => {
        if (watch.mask & event.type) {
            watcher.debugTrace && logger.trace(`triggerWatches([${event.path.join(',')}], ${event.type})`);
            watcher.triggerUpdate();
        }
        else if (watcher.debugTrace) {
            logger.trace(`triggerWatches([${event.path.join(',')}], ${event.type}) watch did not match mask ${watch.mask}`);
        }
    });
}
class StorageWatchTree {
    constructor() {
        // split watch tree by depth of watches, to avoid name collisions between watches and subtrees
        this.depth2 = {};
        this.depth3 = {};
    }
    getWatchesForPath(path) {
        if (path.length < 2 || path.length > 3) {
            throw new Error('Unsupported path length: ' + path.length);
        }
        let obj = path.length === 2 ? this.depth2 : this.depth3;
        for (let i = 0; i < path.length - 1; i++) {
            const p = path[i];
            obj = obj[p] = obj[p] || {};
        }
        const lastP = path[path.length - 1];
        obj[lastP] = obj[lastP] || new Map();
        return obj[lastP];
    }
    handleChangeEvents(events) {
        var _a, _b, _c, _d;
        for (const event of events) {
            // trigger key-level watches (depth3 tree)
            switch (event.path.length) {
                case 1: {
                    if (event.type & StorageEventEmitter_1.StorageChangeMask.Delete) {
                        // trigger all keys on table delete or undo
                        const dbRoot = this.depth3[event.path[0]] || {};
                        for (const tableName in dbRoot) {
                            const tableRoot = dbRoot[tableName];
                            for (const key in tableRoot) {
                                triggerWatches(tableRoot[key], event);
                            }
                        }
                    }
                    break;
                }
                case 2: {
                    if (event.type & StorageEventEmitter_1.StorageChangeMask.Delete) {
                        // trigger all keys on table delete or undo
                        const tableRoot = ((_a = this.depth3[event.path[0]]) === null || _a === void 0 ? void 0 : _a[event.path[1]]) || {};
                        for (const key in tableRoot) {
                            triggerWatches(tableRoot[key], event);
                        }
                    }
                    break;
                }
                case 3: {
                    const keyWatches = (_c = (_b = this.depth3[event.path[0]]) === null || _b === void 0 ? void 0 : _b[event.path[1]]) === null || _c === void 0 ? void 0 : _c[event.path[2]];
                    keyWatches && triggerWatches(keyWatches, event);
                    break;
                }
                default:
                    throw conduit_utils_1.absurd(event.path, 'unhandled delete storage event');
            }
            // trigger table-level watches (depth2 tree)
            if (event.path.length === 1) {
                if (event.type & StorageEventEmitter_1.StorageChangeMask.Delete) {
                    const dbRoot = this.depth2[event.path[0]] || {};
                    for (const key in dbRoot) {
                        triggerWatches(dbRoot[key], event);
                    }
                }
            }
            else {
                const tableWatches = (_d = this.depth2[event.path[0]]) === null || _d === void 0 ? void 0 : _d[event.path[1]];
                tableWatches && triggerWatches(tableWatches, event);
            }
        }
    }
}
exports.StorageWatchTree = StorageWatchTree;
class StorageWatcher {
    constructor(watcherGuid, watchTree, priority) {
        this.watcherGuid = watcherGuid;
        this.watchTree = watchTree;
        this.priority = priority;
        this.debugTrace = false;
        this.longDebounce = false;
        this.triggered = false;
        this.fetchingData = false;
        this.onUpdate = null;
        this.debounceTime = gDebounceTime;
        this.debounceTimer = null;
        this.watches = new Set();
        this.lastTriggerTime = 0;
        this.lastTriggerDelta = Infinity;
        this.curPollDelay = Infinity;
        this.pollTimer = null;
        this.debouncedUpdate = () => {
            this.debounceTimer = null;
            if (this.pollTimer) {
                clearTimeout(this.pollTimer);
                this.pollTimer = null;
            }
            if (this.onUpdate) {
                this.debugTrace && logger.trace(`StorageWatcher.debouncedUpdate() firing onUpdate(${this.watcherGuid})`);
                this.onUpdate();
            }
        };
    }
    destructor() {
        this.debugTrace && logger.trace(`StorageWatcher.destructor()`);
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        this.onUpdate = null;
        this.startDataFetch(this.longDebounce);
        this.endDataFetch();
        this.triggered = true; // prevent triggering after destruction
    }
    setUpdateFunction(onUpdate, debugTrace = false) {
        this.onUpdate = onUpdate;
        this.debugTrace = debugTrace;
    }
    addWatch(path, mask) {
        this.debugTrace && logger.trace(`StorageWatcher.addWatch([${path.join(',')}], ${mask})`);
        const watchMap = this.watchTree.getWatchesForPath(path);
        let watch = watchMap.get(this);
        if (!watch) {
            watch = {
                mask: 0,
                watchMap,
            };
            watchMap.set(this, watch);
            this.watches.add(watch);
        }
        watch.mask = watch.mask | mask;
    }
    startDataFetch(longDebounce) {
        this.debugTrace && logger.trace(`StorageWatcher.startDataFetch()`);
        this.triggered = false;
        this.fetchingData = true;
        this.longDebounce = longDebounce;
        this.debounceTime = gDebounceTime;
        this.watches.forEach(watch => watch.mask = 0);
    }
    endDataFetch() {
        const toDelete = [];
        this.watches.forEach(watch => {
            if (!watch.mask) {
                toDelete.push(watch);
            }
        });
        this.debugTrace && logger.trace(`StorageWatcher.endDataFetch() deleting ${toDelete.length} watches`);
        toDelete.forEach(watch => {
            this.watches.delete(watch);
            watch.watchMap.delete(this);
        });
        this.fetchingData = false;
        return this.triggered;
    }
    triggerAfterTime(delay) {
        if (this.pollTimer && delay < this.curPollDelay) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        if (!this.pollTimer) {
            this.curPollDelay = delay;
            this.pollTimer = setTimeout(() => this.triggerUpdate(), delay);
        }
    }
    setDebounceTime(time) {
        this.debounceTime = time;
    }
    triggerUpdate() {
        if (this.triggered) {
            this.debugTrace && logger.trace(`StorageWatcher.triggerUpdate() already triggered`);
            return;
        }
        this.debugTrace && logger.trace(`StorageWatcher.triggerUpdate()`);
        this.triggered = true;
        if (!this.fetchingData && !this.debounceTimer) {
            this.debounceTimer = setTimeout(this.debouncedUpdate, this.computeDebounceTime());
        }
    }
    computeDebounceTime() {
        // compute new values
        const triggerTime = Date.now();
        const triggerDelta = triggerTime - this.lastTriggerTime;
        const debounceTime = this.longDebounce ? gLongDebounceTime : this.debounceTime;
        const debounceThreshold = this.longDebounce ? (gLongDebounceTime * 2) : (this.debounceTime * 10);
        // store values for next time
        const lastTriggerDelta = this.lastTriggerDelta;
        this.lastTriggerTime = triggerTime;
        this.lastTriggerDelta = triggerDelta;
        if (this.priority === conduit_utils_1.Priority.IMMEDIATE || this.priority === conduit_utils_1.Priority.HIGH) {
            // don't debounce longer for high priority queries
            return debounceTime;
        }
        if (triggerDelta < debounceThreshold && lastTriggerDelta < debounceThreshold) {
            // two consecutive fast triggers, debounce longer
            return debounceThreshold;
        }
        if (triggerDelta < debounceThreshold) {
            // one fast retrigger, just debounce slightly more than usual
            return this.longDebounce ? (gLongDebounceTime * 1.5) : (this.debounceTime * 5);
        }
        // normal debounce time
        return debounceTime;
    }
}
exports.StorageWatcher = StorageWatcher;
//# sourceMappingURL=StorageWatcher.js.map