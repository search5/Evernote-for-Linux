"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLWatcher = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
class GraphQLWatcher extends conduit_storage_1.StorageWatcher {
    constructor() {
        super(...arguments);
        this.iterators = {};
    }
    startDataFetch(longDebounce) {
        super.startDataFetch(longDebounce);
        for (const type in this.iterators) {
            for (const key in this.iterators[type]) {
                const watch = this.iterators[type][key];
                watch[1] = 0;
            }
        }
    }
    endDataFetch() {
        for (const type in this.iterators) {
            for (const key in this.iterators[type]) {
                const watch = this.iterators[type][key];
                if (watch && watch[1] <= 0) {
                    this.terminateIterator(watch[0]);
                    delete this.iterators[type][key];
                }
            }
        }
        return super.endDataFetch();
    }
    addAsyncIterator(type, key, iter) {
        this.iterators[type] = this.iterators[type] || {};
        if (this.iterators[type][key]) {
            this.terminateIterator(this.iterators[type][key][0]);
        }
        this.iterators[type][key] = [iter, 1];
        this.watchIterator(iter).catch(e => conduit_utils_1.logger.error('error watching data', e));
    }
    incrementAsyncIteratorRefCount(type, key) {
        this.iterators[type] = this.iterators[type] || {};
        if (this.iterators[type][key]) {
            this.iterators[type][key][1] += 1;
            return true;
        }
        return false;
    }
    terminateIterator(iter) {
        iter.return && iter.return();
    }
    async watchIterator(iter) {
        let val;
        do {
            val = await iter.next();
            if (val.done === false) {
                this.triggerUpdate();
            }
        } while (val.done === false);
    }
}
exports.GraphQLWatcher = GraphQLWatcher;
//# sourceMappingURL=GraphQLTypes.js.map