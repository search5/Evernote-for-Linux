"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValStorageReconciler = exports.KeyValOverlayStack = void 0;
const conduit_utils_1 = require("conduit-utils");
const KeyValStorageStack_1 = require("./KeyValStorageStack");
class KeyValOverlayStack extends KeyValStorageStack_1.KeyValStorageStack {
    constructor(underlyingStorage, supportsImport) {
        super(underlyingStorage);
        this.supportsImport = supportsImport;
    }
    async importDatabaseImpl(trc, filename) {
        if (!this.supportsImport) {
            throw new Error('importDatabase not supported on this DB');
        }
        await this.underlyingStorage.importDatabase(trc, filename);
    }
    async flush(trc, bottomOverlayInheritChangeEvents) {
        const changeEvents = [];
        function collectChangeEvents(e) {
            changeEvents.push(e);
        }
        this.underlyingStorage.addChangeHandler(collectChangeEvents);
        await this.shiftOverlay(trc, bottomOverlayInheritChangeEvents);
        await conduit_utils_1.sleep(0); // trigger event emitting.
        this.underlyingStorage.removeChangeHandler(collectChangeEvents);
        return changeEvents;
    }
    async collapseTopOverlay(trc) {
        return super.collapseTopOverlay(trc);
    }
    fireChanges(events) {
        setTimeout(this.emitChanges, 0, events);
    }
}
exports.KeyValOverlayStack = KeyValOverlayStack;
class KeyValStorageReconciler {
    constructor(underlyingStorage) {
        this.isInitialized = false;
        this.optimisticStack = new KeyValOverlayStack(underlyingStorage, false);
        this.remoteStack = new KeyValOverlayStack(underlyingStorage, true);
        this.optimisticPersistentOverlay = this.optimisticStack.pushOverlay(false, 'optimisticChanges');
        this.remoteStack.pushOverlay(false);
    }
    async init(trc) {
        await this.optimisticPersistentOverlay.initialize(trc);
        this.isInitialized = true;
    }
    async destructor() {
        await this.optimisticStack.destructor();
        await this.remoteStack.destructor();
    }
    get optimisticOverlay() {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('KeyValStorageReconciler must be initialized before use');
        }
        return this.optimisticStack;
    }
    get remoteOverlay() {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('KeyValStorageReconciler must be initialized before use');
        }
        return this.remoteStack;
    }
    async reconcile(trc) {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('KeyValStorageReconciler must be initialized before use');
        }
        // create new overlays stacked on the current ones, so we can operate on the current ones without locking
        this.remoteStack.pushOverlay(false);
        this.optimisticStack.pushOverlay(false);
        // transact changes from remoteStack down into underlyingStorage
        const remoteChanges = await this.remoteStack.flush(trc, false);
        // filter out change events where the new values coming in from remoteStack are identical to the changes in optimisticStack
        const remoteOnlyChanges = this.optimisticPersistentOverlay.findDifferentChanges(remoteChanges);
        // remove changes from optimisticStack that are roundtripped through remoteStack's changes
        await this.optimisticPersistentOverlay.discardRedundantChanges(trc);
        await this.optimisticStack.collapseTopOverlay(trc);
        // fire change events into optimisticStack, filtering out those that are overridden by remaining overlay changes
        if (remoteOnlyChanges.length) {
            this.optimisticStack.fireChanges(remoteOnlyChanges);
        }
    }
}
exports.KeyValStorageReconciler = KeyValStorageReconciler;
//# sourceMappingURL=KeyValStorageReconciler.js.map