"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingIterator = void 0;
const conduit_utils_1 = require("conduit-utils");
class IndexingIterator {
    constructor(trc, watcher, keyFilter, tree, ascending, firstKeyInSet, lastKeyInSet, startKey, pageSize, isChildIterator = false) {
        this.trc = trc;
        this.watcher = watcher;
        this.keyFilter = keyFilter;
        this.tree = tree;
        this.ascending = ascending;
        this.firstKeyInSet = firstKeyInSet;
        this.lastKeyInSet = lastKeyInSet;
        this.startKey = startKey;
        this.pageSize = pageSize;
        this.isChildIterator = isChildIterator;
        this.clientPageInfo = {
            nextPageKey: null,
            prevPageKey: null,
            numPriorItems: 0,
            numRemainingItems: 0,
        };
        this.currentLeaf = null;
        this.currentIndex = -1;
        this.hasSetup = false;
        this.isDone = false;
        this.count = 0;
        this.startKey = startKey || firstKeyInSet;
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    async isWithinPageLimit() {
        if (!this.pageSize || this.count < this.pageSize) {
            return true;
        }
        if (!this.isChildIterator) {
            await this.getNextPageInfo();
        }
        this.isDone = true;
        return false;
    }
    async getNextPageInfo() {
        let current = this.currentLeafData();
        if (this.ascending ? await this.increment() : await this.decrement()) {
            if (!this.validateLeafIndex()) {
                throw new Error(`Increment should always end in a valid state`);
            }
            current = this.currentLeafData();
            if (!current || !this.tree.comparator(current, this.lastKeyInSet).matchesAllRequiredFields) {
                this.clientPageInfo.nextPageKey = null;
                this.clientPageInfo.numRemainingItems = 0;
            }
            else {
                this.clientPageInfo.nextPageKey = conduit_utils_1.safeStringify(current);
                this.clientPageInfo.numRemainingItems = await this.tree.getNumberOfItemsBetweenKeys(this.trc, null, current, this.lastKeyInSet);
            }
        }
        else {
            this.clientPageInfo.nextPageKey = null;
            this.clientPageInfo.numRemainingItems = 0;
        }
    }
    async getPrevPageInfo() {
        var e_1, _a;
        if (!this.pageSize) {
            return;
        }
        const child = new IndexingIterator(this.trc, this.watcher, this.keyFilter, this.tree, !this.ascending, this.firstKeyInSet, this.lastKeyInSet, this.startKey, this.pageSize + 1, true);
        let count = 0;
        let lastKeyInPrevPage = null;
        try {
            for (var child_1 = __asyncValues(child), child_1_1; child_1_1 = await child_1.next(), !child_1_1.done;) {
                const key = child_1_1.value;
                if (!key) {
                    continue;
                }
                if (count === 1) {
                    lastKeyInPrevPage = key;
                }
                else if (count === this.pageSize) {
                    this.clientPageInfo.prevPageKey = conduit_utils_1.safeStringify(key);
                }
                count++;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (child_1_1 && !child_1_1.done && (_a = child_1.return)) await _a.call(child_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.clientPageInfo.numPriorItems = !lastKeyInPrevPage ? 0 : await this.tree.getNumberOfItemsBetweenKeys(this.trc, null, this.firstKeyInSet, lastKeyInPrevPage);
    }
    async next() {
        if (!(await this.isWithinPageLimit())) {
            return {
                done: this.isDone,
                value: null,
            };
        }
        if (!this.ascending) {
            return await this.prev();
        }
        if (!this.hasSetup) {
            return await this.first();
        }
        if (!this.validateLeafIndex()) {
            throw new Error(`Increment should always begin in a valid state`);
        }
        if (await this.increment()) {
            if (!this.validateLeafIndex()) {
                throw new Error(`Increment should always end in a valid state`);
            }
            const current = this.currentLeafData();
            if (current && this.keyFilter(current)) {
                if (this.isEndKey(current)) {
                    this.isDone = true;
                }
                this.count++;
                return {
                    done: this.isDone,
                    value: current,
                };
            }
            else {
                return await this.next();
            }
        }
        else {
            this.count++;
            const current = this.currentLeafData();
            return {
                done: this.isDone,
                value: current,
            };
        }
    }
    async prev() {
        if (this.ascending) {
            return await this.next();
        }
        if (!this.hasSetup) {
            return await this.first();
        }
        if (!this.validateLeafIndex()) {
            throw new Error(`Decrement should always begin in a valid state`);
        }
        if (await this.decrement()) {
            if (!this.validateLeafIndex()) {
                throw new Error(`Decrement should always end in a valid state`);
            }
            const current = this.currentLeafData();
            if (current && this.keyFilter(current)) {
                if (this.isEndKey(current)) {
                    this.isDone = true;
                }
                this.count++;
                return {
                    done: this.isDone,
                    value: current,
                };
            }
            else {
                return await this.prev();
            }
        }
        else {
            this.count++;
            const current = this.currentLeafData();
            return {
                done: this.isDone,
                value: current,
            };
        }
    }
    async first() {
        const traverse = await this.tree.findLeafAndIndex(this.trc, this.watcher, this.startKey);
        if (!traverse) {
            this.isDone = true;
            return {
                done: this.isDone,
                value: null,
            };
        }
        this.currentLeaf = traverse.leaf;
        this.currentIndex = traverse.index;
        const current = this.currentLeafData();
        if (!current) {
            this.isDone = true; // No valid values in tree
            return {
                done: this.isDone,
                value: current,
            };
        }
        if (!this.isChildIterator) {
            await this.getPrevPageInfo();
        }
        this.hasSetup = true;
        if (current && !this.keyFilter(current)) {
            return await this.next(); // For a one off error that comes from the drifting key design
        }
        this.count++;
        return {
            done: this.isDone,
            value: current,
        };
    }
    async allKeys() {
        var e_2, _a;
        const res = [];
        try {
            for (var _b = __asyncValues(this), _c; _c = await _b.next(), !_c.done;) {
                const key = _c.value;
                if (key) {
                    res.push(key);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return res;
    }
    async increment() {
        var _a;
        const current = this.currentLeafData();
        if (current && this.isEndKey(current)) {
            this.isDone = true;
            return false;
        }
        this.currentIndex++;
        if (this.validateLeafIndex()) {
            return true;
        }
        if ((_a = this.currentLeaf) === null || _a === void 0 ? void 0 : _a.next) {
            this.currentLeaf = await this.tree.fetchTreeNode(this.trc, this.watcher, this.currentLeaf.next);
            this.currentIndex = 0;
            return true;
        }
        this.isDone = true;
        return false;
    }
    async decrement() {
        var _a;
        const current = this.currentLeafData();
        if (current && this.isEndKey(current)) {
            this.isDone = true;
            return false;
        }
        this.currentIndex--;
        if (this.validateLeafIndex()) {
            return true;
        }
        if ((_a = this.currentLeaf) === null || _a === void 0 ? void 0 : _a.prev) {
            this.currentLeaf = await this.tree.fetchTreeNode(this.trc, this.watcher, this.currentLeaf.prev);
            this.currentIndex = this.currentLeaf.data.length - 1;
            return true;
        }
        this.isDone = true;
        return false;
    }
    validateLeafIndex() {
        if (!this.currentLeaf) {
            return false;
        }
        if (this.currentIndex < 0 || this.currentIndex >= this.currentLeaf.data.length) {
            return false;
        }
        return true;
    }
    currentLeafData() {
        if (!this.validateLeafIndex()) {
            return null;
        }
        return this.currentLeaf.data[this.currentIndex];
    }
    isEndKey(key) {
        if (!key && !this.lastKeyInSet) {
            return true;
        }
        if (!key || !this.lastKeyInSet) {
            return false;
        }
        return this.tree.comparator(key, this.lastKeyInSet).cmp === 0;
    }
}
exports.IndexingIterator = IndexingIterator;
//# sourceMappingURL=IndexingIterator.js.map