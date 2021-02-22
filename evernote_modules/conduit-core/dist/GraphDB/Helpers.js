"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncState = exports.runInTransaction = void 0;
async function runInTransaction(trc, db, transactionName, tx, func) {
    if (tx) {
        return func(tx);
    }
    else if (db) {
        return db.transactSyncedStorage(trc, transactionName, func);
    }
    else {
        throw new Error('No DB or Transaction defined');
    }
}
exports.runInTransaction = runInTransaction;
async function getSyncState(dbOrTx, trc, watcher, path) {
    if (!dbOrTx) {
        throw new Error('No DB or Transaction defined');
    }
    return dbOrTx.getSyncState(trc, watcher, path);
}
exports.getSyncState = getSyncState;
//# sourceMappingURL=Helpers.js.map