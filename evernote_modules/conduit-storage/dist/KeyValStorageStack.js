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
exports.KeyValStorageStack = void 0;
const conduit_utils_1 = require("conduit-utils");
const KeyValStorage_1 = require("./KeyValStorage");
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
    pushOverlay(inheritChangeEvents = true, persistTable) {
        const prevStorage = this.getCurrent();
        const overlay = new KeyValStorage_1.KeyValOverlayReadOnly(prevStorage, inheritChangeEvents, persistTable);
        this.overlayStack.push(overlay);
        prevStorage.removeChangeHandler(this);
        overlay.addChangeHandler(this);
        return overlay;
    }
    async shiftOverlay(trc, bottomOverlayInheritChangeEvents = true) {
        const overlay = this.overlayStack[0];
        if (!overlay) {
            return;
        }
        const changeEvents = await overlay.destructAndGenerateChangeEvents(trc);
        await this.underlyingStorage.transactChanges(trc, 'KeyValStorageStack.shiftOverlay', changeEvents);
        this.overlayStack.shift();
        if (this.overlayStack.length) {
            this.overlayStack[0].reparent(this.underlyingStorage, bottomOverlayInheritChangeEvents);
        }
        else {
            this.underlyingStorage.addChangeHandler(this);
        }
    }
    async collapseTopOverlay(trc) {
        if (!this.length) {
            return;
        }
        this.getCurrent().removeChangeHandler(this);
        const currTop = this.overlayStack.pop();
        const changes = await currTop.destructAndGenerateChangeEvents(trc);
        const nextTop = this.getCurrent();
        await nextTop.transactChanges(trc, 'KeyValStorageStack.collapseTopOverlay', changes);
        nextTop.addChangeHandler(this);
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
        await this.getCurrent().transactChanges(trc, 'KeyValStorageStack.commitTransaction', changeEvents);
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValStorageStack')
], KeyValStorageStack.prototype, "shiftOverlay", null);
exports.KeyValStorageStack = KeyValStorageStack;
//# sourceMappingURL=KeyValStorageStack.js.map