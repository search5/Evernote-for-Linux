"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = exports.CacheTable = void 0;
const en_ts_utils_1 = require("en-ts-utils");
let gCapOffset = en_ts_utils_1.registerDebugSetting('CacheCapOffset', 0, v => gCapOffset = v);
class CacheTable {
    constructor(config) {
        this.config = config;
        this.table = {};
        this.updates = [];
        this.last = null;
        this.first = null;
        this.count = 0;
        this.evictNextFrame = null;
        this.updateNextFrame = null;
    }
    moveNoticeToEnd(notice) {
        if (!this.first) {
            this.first = notice;
            this.last = notice;
            return;
        }
        if (notice.prev) {
            notice.prev.next = notice.next;
        }
        else {
            this.first = notice.next;
            this.first ? this.first.prev = null : null;
        }
        if (notice.next) {
            notice.next.prev = notice.prev;
        }
        this.last.next = notice;
        notice.prev = this.last;
        this.last = notice;
        notice.next = null;
    }
    updateNotice(notice) {
        if (notice.timestamp > 0) {
            this.updates.push(notice);
            notice.timestamp = 0;
            if (!this.updateNextFrame) {
                this.updateNextFrame = setTimeout(() => this.handleUpdates(), 0);
            }
        }
    }
    handleUpdates() {
        const now = Date.now();
        for (const update of this.updates) {
            update.timestamp = now;
            this.moveNoticeToEnd(update);
        }
        this.updates = [];
        this.updateNextFrame = null;
    }
    evict() {
        this.handleUpdates();
        if (this.config.softCap) {
            const evictCount = this.count - this.config.softCap;
            if (evictCount > 0) {
                let currentNotice = this.first;
                for (let i = 0; i < evictCount && currentNotice; i++) {
                    this.destroyEntry(currentNotice.key);
                    delete this.table[currentNotice.key];
                    currentNotice = currentNotice.next;
                    this.count--;
                }
                this.first = currentNotice;
                if (!currentNotice) {
                    this.last = null;
                }
                else {
                    currentNotice.prev = null;
                }
            }
        }
        this.evictNextFrame = null;
    }
    createNotice(key) {
        const notice = {
            timestamp: Date.now(),
            key,
            prev: this.last,
            next: null,
        };
        if (this.last) {
            this.last.next = notice;
        }
        this.last = notice;
        if (!this.first) {
            this.first = notice;
        }
        this.count++;
        if (this.config.hardCap !== undefined && this.count > (this.config.hardCap + gCapOffset)) {
            this.evict();
        }
        else if (this.count > (this.config.softCap + gCapOffset) && this.evictNextFrame === null) {
            this.evictNextFrame = setTimeout(() => this.evict(), 0);
        }
        return notice;
    }
    get(key) {
        const entry = this.table[key];
        if (entry) {
            this.updateNotice(entry.notice);
            return entry.value;
        }
        // Not cached
        return;
    }
    put(key, value) {
        if (this.config.excludeAll) {
            return;
        }
        for (const excludeKey of this.config.excludeKeys) {
            if (key.match(excludeKey)) {
                return;
            }
        }
        if (this.table[key]) {
            this.table[key].value = value;
            this.updateNotice(this.table[key].notice);
        }
        else {
            this.table[key] = {
                value,
                notice: this.createNotice(key),
            };
        }
    }
    destroyEntry(key) {
        const entry = this.table[key];
        // relying on destructor convention over typing here.
        if (entry && entry.value && typeof entry.value.destructor === 'function') {
            entry.value.destructor();
        }
    }
    delete(key, shouldDestroy) {
        if (this.table[key]) {
            const notice = this.table[key].notice;
            if (notice.prev) {
                notice.prev.next = notice.next;
            }
            else {
                this.first = notice.next;
            }
            if (notice.next) {
                notice.next.prev = notice.prev;
            }
            else {
                this.last = notice.prev;
            }
            if (shouldDestroy) {
                this.destroyEntry(key);
            }
            delete this.table[key];
            this.count--;
        }
    }
    empty() {
        for (const key in this.table) {
            this.destroyEntry(key);
        }
        this.table = {};
        this.updates = [];
        this.last = null;
        this.first = null;
        this.count = 0;
        this.evictNextFrame = null;
        this.updateNextFrame = null;
    }
}
exports.CacheTable = CacheTable;
class CacheManager {
    constructor(config) {
        this.config = config;
        this.tables = {};
    }
    createTable(tableName) {
        let excludeAll = false;
        let excludeKeys = [];
        if (this.config.exclude) {
            for (const exclude of this.config.exclude) {
                if (tableName !== exclude.table) {
                    continue;
                }
                if (exclude.keys) {
                    excludeKeys = excludeKeys.concat(exclude.keys);
                }
                else {
                    excludeAll = true;
                }
            }
        }
        this.tables[tableName] = new CacheTable({
            softCap: this.config.softCap || Infinity,
            hardCap: this.config.hardCap || Infinity,
            excludeAll,
            excludeKeys,
        });
    }
    get(tableName, key) {
        if (this.config.noCacheValues) {
            return;
        }
        return this.tables[tableName] && this.tables[tableName].get(key);
    }
    getTable(tableName) {
        return this.tables[tableName];
    }
    put(tableName, key, value) {
        if (this.config.noCacheValues) {
            return;
        }
        if (!this.tables[tableName]) {
            this.createTable(tableName);
        }
        this.tables[tableName].put(key, value);
    }
    delete(tableName, key) {
        this.tables[tableName] && this.tables[tableName].delete(key);
    }
    empty(tableName) {
        if (this.config.noCacheValues) {
            return;
        }
        const table = this.tables[tableName];
        if (table) {
            table.empty();
        }
        else {
            this.createTable(tableName);
        }
    }
    emptyAll() {
        if (this.config.noCacheValues) {
            return;
        }
        for (const tableName in this.tables) {
            this.tables[tableName].empty();
        }
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=CacheManager.js.map