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
exports.flushBackgroundWrites = exports.KeyValBackgroundWriter = void 0;
const conduit_utils_1 = require("conduit-utils");
const KeyValStorage_1 = require("./KeyValStorage");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
let gDisableBackgroundWrite = conduit_utils_1.registerDebugSetting('DisableBackgroundWrite', false, v => gDisableBackgroundWrite = v);
let gBackgroundWriteDelay = conduit_utils_1.registerDebugSetting('BackgroundWriteDelay', 1, v => gBackgroundWriteDelay = v);
// this class may be useful independently down the line, so it is kept separate from KeyValBackgroundWriter
class KeyValStorageStack extends KeyValStorage_1.KeyValStorage {
    constructor(underlyingStorage) {
        super(underlyingStorage.dbName, undefined, undefined, true);
        this.underlyingStorage = underlyingStorage;
        this.overlayStack = [];
        underlyingStorage.addChangeHandler(this);
    }
    async destructor() {
        await super.destructor();
        await this.underlyingStorage.destructor();
        for (const overlay of this.overlayStack) {
            await overlay.destructor();
        }
    }
    get length() {
        return this.overlayStack.length;
    }
    getCurrent() {
        return this.length ? this.overlayStack[this.length - 1] : this.underlyingStorage;
    }
    pushOverlay() {
        const prevStorage = this.getCurrent();
        const overlay = new KeyValStorage_1.KeyValOverlay(prevStorage, true);
        this.overlayStack.push(overlay);
        prevStorage.removeChangeHandler(this);
        overlay.addChangeHandler(this);
        return overlay;
    }
    async shiftOverlay(trc) {
        const overlay = this.overlayStack[0];
        if (!overlay) {
            return;
        }
        const changeEvents = await overlay.destructAndGenerateChangeEvents(trc);
        await this.underlyingStorage.transactChanges(trc, 'BackgroundWriter.shiftOverlay', changeEvents);
        this.overlayStack.shift();
        if (this.overlayStack.length) {
            this.overlayStack[0].reparent(this.underlyingStorage, true);
        }
        else {
            this.underlyingStorage.addChangeHandler(this);
        }
    }
    async hasKeyImpl(trc, tableName, key) {
        return this.getCurrent().hasKey(trc, null, tableName, key);
    }
    async getKeysImpl(trc, tableName) {
        return this.getCurrent().getKeys(trc, null, tableName);
    }
    async getValueImpl(trc, tableName, key) {
        return this.getCurrent().getValue(trc, null, tableName, key);
    }
    async batchGetValuesImpl(trc, tableName, keys) {
        return this.getCurrent().batchGetValues(trc, null, tableName, keys);
    }
    async commitTransaction(trc, changeEvents) {
        await this.getCurrent().transactChanges(trc, 'BackgroundWriter.commitTransaction', changeEvents);
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValStorageStack')
], KeyValStorageStack.prototype, "shiftOverlay", null);
const gBackgroundWriters = [];
class KeyValBackgroundWriter extends KeyValStorageStack {
    constructor(underlyingStorage) {
        super(underlyingStorage);
        this.backgroundWritePromise = null;
        this.pendingCommitSleep = null;
        this.errors = [];
        this.trc = conduit_utils_1.createTraceContext('KeyValBackgroundWriter');
        gBackgroundWriters.push(this);
    }
    async destructor() {
        await this.flushCommits(this.trc);
        await super.destructor();
        conduit_utils_1.arrayFindAndDelete(gBackgroundWriters, this);
    }
    fireQueuedErrors() {
        if (this.errors.length) {
            throw new conduit_utils_1.MultiError(this.errors);
        }
    }
    async commitTransaction(trc, changeEvents) {
        this.fireQueuedErrors();
        const desiredOverlayCount = this.backgroundWritePromise ? 2 : 1;
        while (this.length < desiredOverlayCount) {
            this.pushOverlay();
        }
        await super.commitTransaction(trc, changeEvents);
        let shouldFlushImmediately = false;
        for (const event of changeEvents) {
            if (event.type === StorageEventEmitter_1.StorageChangeType.Delete && event.path.length === 1) {
                // flush clearDB immediately
                shouldFlushImmediately = true;
                break;
            }
        }
        if (!this.backgroundWritePromise) {
            this.backgroundWritePromise = this.writePendingCommits();
        }
        if (shouldFlushImmediately || gDisableBackgroundWrite) {
            await this.backgroundWritePromise;
        }
    }
    async importDatabaseImpl(trc, filename) {
        await this.flushCommits(trc);
        await this.underlyingStorage.importDatabase(trc, filename);
    }
    async writePendingCommits(sleepTime = gBackgroundWriteDelay) {
        this.pendingCommitSleep = conduit_utils_1.cancellableSleep(sleepTime);
        await this.pendingCommitSleep.promise;
        this.pendingCommitSleep = null;
        if (!this.length) {
            this.backgroundWritePromise = null;
            return;
        }
        const res = await conduit_utils_1.withError(this.shiftOverlay(this.trc));
        if (res.err) {
            this.errors.push(res.err);
        }
        this.backgroundWritePromise = null;
        if (this.length) {
            // more pending commits waiting, kickoff another background write
            this.backgroundWritePromise = this.writePendingCommits();
        }
    }
    async flushCommits(trc) {
        while (this.length) {
            if (this.backgroundWritePromise) {
                this.pendingCommitSleep && this.pendingCommitSleep.cancel();
                await this.backgroundWritePromise;
            }
            else {
                this.backgroundWritePromise = this.writePendingCommits(1);
                await this.backgroundWritePromise;
            }
            this.fireQueuedErrors();
        }
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValBackgroundWriter')
], KeyValBackgroundWriter.prototype, "commitTransaction", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValBackgroundWriter')
], KeyValBackgroundWriter.prototype, "flushCommits", null);
exports.KeyValBackgroundWriter = KeyValBackgroundWriter;
async function flushBackgroundWrites(trc) {
    for (const w of gBackgroundWriters) {
        await w.flushCommits(trc);
    }
}
exports.flushBackgroundWrites = flushBackgroundWrites;
//# sourceMappingURL=KeyValBackgroundWriter.js.map