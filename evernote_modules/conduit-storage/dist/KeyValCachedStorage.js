"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValCachedStorage = void 0;
const conduit_utils_1 = require("conduit-utils");
const KeyValStorage_1 = require("./KeyValStorage");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
const gTrcPool = new conduit_utils_1.AsyncTracePool('KVStorage');
function batchCompare(a, b) {
    const d = a.priority - b.priority;
    if (d) {
        return d;
    }
    return a.timestamp - b.timestamp;
}
async function combineFetchResults(ps) {
    const fetchResults = await conduit_utils_1.allSettled(ps);
    const combinedResults = {};
    for (const res of fetchResults) {
        for (const key in res) {
            combinedResults[key] = res[key];
        }
    }
    return combinedResults;
}
class KeyValCachedStorage extends KeyValStorage_1.KeyValStorage {
    constructor(dbName, cachePolicy, mutexTimeout, useMap) {
        super(dbName, cachePolicy, mutexTimeout);
        this.cachePolicy = cachePolicy;
        this.useMap = useMap;
        this.keys = {};
        this.maxBatchSize = 100;
        this.batchQueue = [];
        this.pendingBatches = new Map();
        this.isFetching = false;
        this.cacheManager = new conduit_utils_1.CacheManager(this.cachePolicy || {});
    }
    allocBatch(tableName, priority) {
        const { promise, resolve } = conduit_utils_1.allocPromise();
        const batch = {
            timestamp: Date.now(),
            priority,
            tableName,
            keys: {},
            keyCount: 0,
            promise,
            resolve,
        };
        this.pendingBatches.set(tableName, batch);
        this.batchQueue.push(batch);
        return batch;
    }
    fetchNextBatch() {
        this.isFetching = true;
        const cur = this.batchQueue.shift();
        if (!cur) {
            this.isFetching = false;
            return;
        }
        if (this.pendingBatches.get(cur.tableName) === cur) {
            this.pendingBatches.delete(cur.tableName);
        }
        const keyArray = Object.keys(cur.keys);
        const trc = gTrcPool.alloc();
        this.batchGetValuesRaw(trc, cur.tableName, keyArray).then(valueArray => {
            gTrcPool.release(trc);
            const values = {};
            for (let i = 0; i < keyArray.length; ++i) {
                values[keyArray[i]] = valueArray[i];
            }
            cur.resolve(values);
            this.fetchNextBatch();
        }).catch(err => {
            gTrcPool.release(trc);
            conduit_utils_1.logger.error('Unexpected error from batchGetValuesRaw', err);
            cur.resolve({});
            this.fetchNextBatch();
        });
    }
    getValuesQueued(tableName, keys, priority) {
        let needSort = false;
        let batch = this.pendingBatches.get(tableName);
        if (!batch) {
            batch = this.allocBatch(tableName, priority);
            needSort = true;
        }
        if (priority < batch.priority) {
            batch.priority = priority;
            needSort = true;
        }
        const batchPromises = [batch.promise];
        for (const key of keys) {
            if (batch.keys[key] === true) {
                continue;
            }
            batch.keys[key] = true;
            batch.keyCount++;
            if (batch.keyCount >= this.maxBatchSize) {
                batch = this.allocBatch(tableName, priority);
                needSort = true;
                batchPromises.push(batch.promise);
            }
        }
        if (needSort) {
            // TODO this could be a heap sort and be much faster, but the queue probably won't be big enough for that to matter
            this.batchQueue.sort(batchCompare);
        }
        if (!this.isFetching) {
            this.fetchNextBatch();
        }
        if (batchPromises.length === 1) {
            return batchPromises[0];
        }
        return combineFetchResults(batchPromises);
    }
    async fetchKeysLookup(trc, tableName) {
        const keysArray = await this.getKeysRaw(trc, tableName);
        return this.initKeysLookup(trc, keysArray);
    }
    getTableKeysLoader(tableName) {
        if (!this.keys[tableName]) {
            this.keys[tableName] = new conduit_utils_1.DemandLoader(() => {
                const trc = gTrcPool.alloc();
                return gTrcPool.releaseWhenSettled(trc, this.fetchKeysLookup(trc, tableName));
            });
        }
        return this.keys[tableName];
    }
    getTableKeysLookup(trc, tableName) {
        return this.getTableKeysLoader(tableName).getData(trc);
    }
    async hasKeyImpl(trc, tableName, key) {
        const tableKeys = await this.getTableKeysLookup(trc, tableName);
        return this.getKeysLookupValue(tableKeys, key);
    }
    async getKeysImpl(trc, tableName) {
        const tableKeys = await this.getTableKeysLookup(trc, tableName);
        return this.keysLookupToKeys(tableKeys);
    }
    async getValueImpl(trc, tableName, key, priority) {
        const tableKeys = await this.getTableKeysLookup(trc, tableName);
        if (!this.getKeysLookupValue(tableKeys, key)) {
            return undefined;
        }
        const cachedValue = this.cacheManager.get(tableName, key);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        // fetch value
        const value = (await this.getValuesQueued(tableName, [key], priority))[key];
        if (value !== undefined) {
            // update cache
            this.cacheManager.put(tableName, key, value);
        }
        return value;
    }
    async batchGetValuesImpl(trc, tableName, keys, priority) {
        const tableKeys = await this.getTableKeysLookup(trc, tableName);
        const pendingKeys = [];
        const values = {};
        for (const key of keys) {
            if (!this.getKeysLookupValue(tableKeys, key)) {
                values[key] = undefined;
                continue;
            }
            const cachedValue = this.cacheManager.get(tableName, key);
            if (cachedValue !== undefined) {
                values[key] = cachedValue;
                continue;
            }
            values[key] = undefined; // will get filled in below, but add the property here so the keys stay in order
            pendingKeys.push(key);
        }
        if (!pendingKeys.length) {
            return values;
        }
        const fetchedResults = await this.getValuesQueued(tableName, pendingKeys, priority);
        for (const key of pendingKeys) {
            const value = fetchedResults[key];
            values[key] = value;
            if (value !== undefined) {
                this.cacheManager.put(tableName, key, value);
            }
        }
        return values;
    }
    async commitTransaction(trc, changeEvents) {
        // apply to DB
        const asyncTrc = gTrcPool.alloc();
        await gTrcPool.releaseWhenSettled(asyncTrc, this.commitTransactionRaw(asyncTrc, changeEvents));
        // update caching layer
        const keys = {};
        const tableNames = {};
        for (const event of changeEvents) {
            const tableName = event.path[1] || '';
            if (tableName && !tableNames[tableName]) {
                tableNames[tableName] = true;
                if (!keys[tableName] && this.keys[tableName]) {
                    keys[tableName] = await this.keys[tableName].getData(trc);
                }
            }
            if (event.type === StorageEventEmitter_1.StorageChangeType.Delete) {
                switch (event.path.length) {
                    case 1:
                        this.cacheManager.emptyAll();
                        for (const table in this.keys) {
                            keys[table] = this.getEmptyKeysLookup();
                            this.getTableKeysLoader(table).setData(keys[table]);
                        }
                        break;
                    case 2:
                        this.cacheManager.empty(tableName);
                        keys[tableName] = this.getEmptyKeysLookup();
                        this.getTableKeysLoader(tableName).setData(keys[tableName]);
                        break;
                    case 3:
                        const key = event.path[2];
                        this.cacheManager.delete(tableName, key);
                        if (keys[tableName]) {
                            this.deleteKeysLookupEntry(keys[tableName], key);
                        }
                        break;
                    default:
                        throw conduit_utils_1.absurd(event.path, 'unhandled delete storage event');
                }
            }
            else if (event.type === StorageEventEmitter_1.StorageChangeType.Undo) {
                throw new Error('Cannot commit an Undo change event');
            }
            else {
                const key = event.path[2];
                this.cacheManager.put(tableName, key, event.value);
                if (keys[tableName]) {
                    this.setKeysLookupValue(keys[tableName], key, true);
                }
            }
        }
    }
    async importDatabaseImpl(trc, filename) {
        await this.importDatabaseRaw(trc, filename);
        this.cacheManager.emptyAll();
        this.keys = {};
    }
    initKeysLookup(trc, keysArray) {
        conduit_utils_1.traceEventStart(trc, 'initKeysLookup', { numKeys: keysArray.length });
        if (this.useMap) {
            const ret = new Map();
            for (const key of keysArray) {
                ret.set(key, true);
            }
            conduit_utils_1.traceEventEnd(trc, 'initKeysLookup');
            return ret;
        }
        const ret = {};
        for (const key of keysArray) {
            ret[key] = true;
        }
        conduit_utils_1.traceEventEnd(trc, 'initKeysLookup');
        return ret;
    }
    keysLookupToKeys(tableKeys) {
        return tableKeys instanceof Map ? Array.from(tableKeys.keys()) : Object.keys(tableKeys);
    }
    getKeysLookupValue(tableKeys, key) {
        return (tableKeys instanceof Map ? tableKeys.get(key) : tableKeys[key]) || false;
    }
    setKeysLookupValue(tableKeys, key, val) {
        tableKeys instanceof Map ? tableKeys.set(key, val) : tableKeys[key] = val;
    }
    deleteKeysLookupEntry(tableKeys, key) {
        tableKeys instanceof Map ? tableKeys.delete(key) : delete tableKeys[key];
    }
    getEmptyKeysLookup() {
        return this.useMap ? new Map() : {};
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValCachedStorage', 'tableName')
], KeyValCachedStorage.prototype, "fetchKeysLookup", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValCachedStorage', 'tableName', 'key')
], KeyValCachedStorage.prototype, "hasKeyImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValCachedStorage', 'tableName')
], KeyValCachedStorage.prototype, "getKeysImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValCachedStorage', 'tableName', 'key')
], KeyValCachedStorage.prototype, "getValueImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValCachedStorage', 'tableName', 'keysCount')
], KeyValCachedStorage.prototype, "batchGetValuesImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValCachedStorage', 'changeEventsCount')
], KeyValCachedStorage.prototype, "commitTransaction", null);
exports.KeyValCachedStorage = KeyValCachedStorage;
//# sourceMappingURL=KeyValCachedStorage.js.map