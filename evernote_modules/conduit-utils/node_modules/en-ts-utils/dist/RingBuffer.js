"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RingBuffer = void 0;
class RingBuffer {
    constructor(maxLength) {
        this.maxLength = maxLength;
        this.firstIdx = 0;
        this.nextIdx = 0;
        this.count = 0;
        if (maxLength < 2) {
            throw new Error(`Invalid maxLength passed to RingBuffer constructor: ${maxLength}`);
        }
        this.buffer = new Array(maxLength);
    }
    incAndWrap(idx) {
        idx++;
        if (idx >= this.maxLength) {
            idx = 0;
        }
        return idx;
    }
    clear() {
        this.firstIdx = 0;
        this.nextIdx = 0;
        this.count = 0;
    }
    push(entry) {
        const idx = this.nextIdx;
        this.buffer[idx] = entry;
        this.nextIdx = this.incAndWrap(this.nextIdx);
        if (this.count && idx === this.firstIdx) {
            this.firstIdx = this.incAndWrap(this.firstIdx);
        }
        else {
            this.count++;
        }
    }
    get length() {
        return this.count;
    }
    getAll() {
        if (!this.count) {
            return [];
        }
        if (this.nextIdx > this.firstIdx) {
            return this.buffer.slice(this.firstIdx, this.nextIdx);
        }
        return this.buffer.slice(this.firstIdx, this.maxLength).concat(this.buffer.slice(0, this.nextIdx));
    }
}
exports.RingBuffer = RingBuffer;
//# sourceMappingURL=RingBuffer.js.map