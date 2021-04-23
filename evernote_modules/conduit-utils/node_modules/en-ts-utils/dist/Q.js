"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticPriorityQ = void 0;
function cmp(a, b) {
    return a - b;
}
class StaticPriorityQ {
    constructor(ps) {
        this.itemMap = {};
        this.count = 0;
        if (!ps.length) {
            throw new Error('Invalid argument: priority list must not be empty.');
        }
        ps.sort(cmp);
        this.priorities = ps;
        for (const priority of ps) {
            this.itemMap[priority] = [];
        }
    }
    push(item, priority) {
        this.assertPriority(priority);
        this.itemMap[priority].push(item);
        ++this.count;
    }
    /**
     * Returns the position of the item in the priority queue, -1 if it's not found.
     * @param item the item to find
     * @param mutexPriority priority of the item
     */
    indexOf(item, mutexPriority) {
        let index = 0;
        for (const priority of this.priorities) {
            if (priority === mutexPriority) {
                const items = this.itemMap[priority];
                const currIndex = items.indexOf(item);
                if (currIndex === -1) {
                    return -1;
                }
                index += currIndex;
                return index;
            }
            else {
                const items = this.itemMap[priority];
                index += items.length;
            }
        }
        // not found
        return -1;
    }
    popTop() {
        const items = this.getTopPriorityQueue();
        if (!items) {
            return null;
        }
        --this.count;
        return items.shift();
    }
    peekTop() {
        const items = this.getTopPriorityQueue();
        if (!items) {
            return null;
        }
        return items[0];
    }
    getTopPriorityQueue() {
        for (const priority of this.priorities) {
            if (this.itemMap[priority].length) {
                return this.itemMap[priority];
            }
        }
        return null;
    }
    popBottom() {
        const items = this.getBottomPriorityQueue();
        if (!items) {
            return null;
        }
        --this.count;
        return items.pop();
    }
    peekBottom() {
        const items = this.getBottomPriorityQueue();
        if (!items) {
            return null;
        }
        return items[items.length - 1];
    }
    getBottomPriorityQueue() {
        for (let i = this.priorities.length - 1; i >= 0; --i) {
            const items = this.itemMap[this.priorities[i]];
            if (items.length) {
                return items;
            }
        }
        return null;
    }
    getItemsWithPriority(p) {
        this.assertPriority(p);
        return this.itemMap[p];
    }
    get length() {
        return this.count;
    }
    remove(item) {
        for (const priority of this.priorities) {
            const xs = this.itemMap[priority];
            const idx = xs.indexOf(item);
            if (idx >= 0) {
                xs.splice(idx, 1);
                --this.count;
                break;
            }
        }
    }
    removeItemsWithPriority(p, predicate) {
        this.assertPriority(p);
        if (!predicate) {
            const ret = this.itemMap[p];
            this.count -= ret.length;
            this.itemMap[p] = [];
            return ret;
        }
        else {
            const ret = [];
            const newList = [];
            for (const item of this.itemMap[p]) {
                if (predicate(item)) {
                    ret.push(item);
                }
                else {
                    newList.push(item);
                }
            }
            this.itemMap[p] = newList;
            this.count -= ret.length;
            return ret;
        }
    }
    assertPriority(p) {
        if (!this.itemMap[p]) {
            throw new Error('Unknown priority. All priorities must be passed to constructor.');
        }
    }
}
exports.StaticPriorityQ = StaticPriorityQ;
//# sourceMappingURL=Q.js.map