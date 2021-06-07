"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
/* eslint-disable no-bitwise */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageEventEmitter = exports.StorageChangePath = exports.StorageChangeMask = exports.StorageChangeType = void 0;
const conduit_utils_1 = require("conduit-utils");
// these are bits, to do bitwise & for watchers
var StorageChangeType;
(function (StorageChangeType) {
    StorageChangeType[StorageChangeType["Create"] = 1] = "Create";
    StorageChangeType[StorageChangeType["Replace"] = 2] = "Replace";
    StorageChangeType[StorageChangeType["Delete"] = 4] = "Delete";
    StorageChangeType[StorageChangeType["Undo"] = 8] = "Undo";
})(StorageChangeType = exports.StorageChangeType || (exports.StorageChangeType = {}));
var StorageChangeMask;
(function (StorageChangeMask) {
    StorageChangeMask[StorageChangeMask["Create"] = 9] = "Create";
    StorageChangeMask[StorageChangeMask["Replace"] = 10] = "Replace";
    StorageChangeMask[StorageChangeMask["Delete"] = 12] = "Delete";
    StorageChangeMask[StorageChangeMask["ExistenceChange"] = 13] = "ExistenceChange";
    StorageChangeMask[StorageChangeMask["AllChanges"] = 15] = "AllChanges";
})(StorageChangeMask = exports.StorageChangeMask || (exports.StorageChangeMask = {}));
/**
 * Utility enum for proper event handling in storage event receivers.
 */
var StorageChangePath;
(function (StorageChangePath) {
    StorageChangePath[StorageChangePath["DBName"] = 0] = "DBName";
    StorageChangePath[StorageChangePath["TableName"] = 1] = "TableName";
    StorageChangePath[StorageChangePath["Key"] = 2] = "Key";
})(StorageChangePath = exports.StorageChangePath || (exports.StorageChangePath = {}));
const logger = conduit_utils_1.createLogger('conduit:StorageEventEmitter');
class StorageEventEmitter {
    constructor() {
        this.changeHandlers = [];
        this.changeReceivers = [];
        this.emitChanges = (events) => {
            for (const handler of this.changeHandlers) {
                try {
                    for (const event of events) {
                        handler(event);
                    }
                }
                catch (err) {
                    logger.error('StorageChangeHandler threw an exception', err);
                }
            }
            for (const receiver of this.changeReceivers) {
                receiver.handleChangeEvents(events);
            }
        };
    }
    destructor(trc) {
        this.changeHandlers = [];
        this.changeReceivers = [];
    }
    addChangeHandler(handler) {
        if (typeof handler === 'function') {
            conduit_utils_1.arrayPushUnique(this.changeHandlers, handler);
        }
        else {
            conduit_utils_1.arrayPushUnique(this.changeReceivers, handler);
        }
    }
    removeChangeHandler(handler) {
        if (typeof handler === 'function') {
            conduit_utils_1.arrayFindAndDelete(this.changeHandlers, handler);
        }
        else {
            conduit_utils_1.arrayFindAndDelete(this.changeReceivers, handler);
        }
    }
    handleChangeEvents(events) {
        // pipe them through!
        this.emitChanges(events);
    }
}
exports.StorageEventEmitter = StorageEventEmitter;
//# sourceMappingURL=StorageEventEmitter.js.map