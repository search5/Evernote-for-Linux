"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyWatcherCache = exports.releaseWatcher = exports.getWatcher = void 0;
const conduit_utils_1 = require("conduit-utils");
const Query_1 = require("./Query");
const Watcher_1 = require("./Watcher");
const WATCHER_TABLE = 'Watcher';
const WATCHER_SOFT_CAP = 1000;
const WATCHER_HARD_CAP = 1100;
let gWatcherManager;
class WatcherManager {
    constructor() {
        this.liveWatchers = {}; // note: not a cache, no eviction
        this.undeadWatcherCache = new conduit_utils_1.CacheManager({
            softCap: WATCHER_SOFT_CAP,
            hardCap: WATCHER_HARD_CAP,
        });
    }
    destructor() {
        this.empty();
    }
    get(opts) {
        const key = Query_1.getUniqueQueryKey(opts.query, opts.vars);
        const liveWatcher = this.liveWatchers[key];
        if (liveWatcher) {
            // hop onboard the active watcher
            liveWatcher.addSubscriber(opts.onUpdate, opts.priority);
            return liveWatcher;
        }
        const undeadWatcher = this.undeadWatcherCache.get(WATCHER_TABLE, key);
        if (undeadWatcher) {
            // rise from your grave
            this.undeadWatcherCache.delete(WATCHER_TABLE, key);
            this.liveWatchers[key] = undeadWatcher;
            undeadWatcher.addSubscriber(opts.onUpdate, opts.priority, opts.ownerName);
            return undeadWatcher;
        }
        // else create new and add to live set
        const watcher = new Watcher_1.Watcher(opts);
        this.liveWatchers[key] = watcher;
        return watcher;
    }
    releaseWatcher(watcher, callbackReleased) {
        if (watcher.removeSubscriber(callbackReleased) === 0) {
            this.bury(watcher);
        }
    }
    bury(watcher) {
        const key = watcher.getKey();
        delete this.liveWatchers[key];
        this.undeadWatcherCache.put(WATCHER_TABLE, key, watcher);
    }
    empty() {
        this.undeadWatcherCache.empty(WATCHER_TABLE);
    }
}
function getWatcher(opts) {
    if (!gWatcherManager) {
        gWatcherManager = new WatcherManager();
    }
    return gWatcherManager.get(Object.assign(Object.assign({}, opts), { query: opts.query instanceof Query_1.ConduitQuery ? opts.query.query : opts.query }));
}
exports.getWatcher = getWatcher;
function releaseWatcher(watcher, callbackReleased) {
    if (!gWatcherManager) {
        gWatcherManager = new WatcherManager();
    }
    gWatcherManager.releaseWatcher(watcher, callbackReleased);
}
exports.releaseWatcher = releaseWatcher;
function destroyWatcherCache() {
    if (gWatcherManager) {
        gWatcherManager.empty();
        gWatcherManager = undefined;
    }
}
exports.destroyWatcherCache = destroyWatcherCache;
//# sourceMappingURL=WatcherManager.js.map