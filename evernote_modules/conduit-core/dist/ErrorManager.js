"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorManager = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const ERROR_DB_NAME = 'ConduitErrorsDB';
const ERROR_TABLE = 'ConduitErrors';
const MUTATION_ERROR_TABLE = 'ConduitErrorLookup';
class ErrorManager {
    constructor(di) {
        this.di = di;
        this.addError = async (trc, error, mutation, extraMutationIDs) => {
            if (!this.errorStore) {
                throw new Error('Error initting the error store');
            }
            const errObj = {
                id: this.di.uuid('ErrorManager'),
                error: conduit_utils_1.serializeError(error),
                mutation,
                marked: false,
            };
            await this.errorStore.transact(trc, 'ErrorManager.addError', async (db) => {
                await db.setValue(trc, ERROR_TABLE, errObj.id, errObj);
                await db.setValue(trc, MUTATION_ERROR_TABLE, mutation.mutationID, errObj.id);
                for (const mutationID of extraMutationIDs) {
                    await db.setValue(trc, MUTATION_ERROR_TABLE, mutationID, errObj.id);
                }
            });
        };
        this.getErrorByMutationID = async (trc, watcher, mutationID) => {
            if (!this.errorStore) {
                throw new Error('Error initting the error store');
            }
            const errID = await this.errorStore.getValidatedValue(trc, watcher, MUTATION_ERROR_TABLE, mutationID, conduit_storage_1.validateIsString);
            if (!errID) {
                return null;
            }
            return await this.getError(trc, watcher, errID);
        };
    }
    async destructor() {
        if (this.errorStore) {
            await this.errorStore.destructor();
            this.errorStore = undefined;
        }
    }
    async init(trc) {
        this.errorStore = this.di.KeyValStorageMem(trc, ERROR_DB_NAME);
        if (!this.errorStore) {
            throw new Error('Error initting the error store');
        }
        this.errorStore.addChangeHandler(this.di.WatchTree);
    }
    async getError(trc, watcher, id) {
        if (!this.errorStore) {
            throw new Error('Error initting the error store');
        }
        const errObj = await this.errorStore.getValue(trc, watcher, ERROR_TABLE, id) || null;
        return !errObj ?
            null : Object.assign(Object.assign({}, errObj), { error: conduit_utils_1.deserializeError(errObj.error) });
    }
    async removeError(trc, id) {
        if (!this.errorStore) {
            throw new Error('Error initting the error store');
        }
        await this.errorStore.transact(trc, 'ErrorManager.removeError', async (db) => {
            await db.removeValue(trc, ERROR_TABLE, id);
        });
    }
    async setMark(trc, errorID, marked) {
        if (!this.errorStore) {
            throw new Error('Error initting the error store');
        }
        const errObj = await this.getError(trc, null, errorID);
        if (!errObj) {
            // no op if not there... maybe throw err if this is a problem
            return;
        }
        const newObj = Object.assign(Object.assign({}, errObj), { error: conduit_utils_1.serializeError(errObj.error), marked });
        await this.errorStore.transact(trc, 'ErrorManager.setMark', async (db) => {
            await db.setValue(trc, ERROR_TABLE, errObj.id, newObj);
        });
    }
    async markAll(trc, markValue) {
        const errs = await this.getList(trc, null, !markValue);
        for (const err of errs) {
            await this.setMark(trc, err.id, markValue);
        }
    }
    async getList(trc, watcher, markedValue) {
        if (!this.errorStore) {
            throw new Error('error store not initted');
        }
        const errorIDs = await this.errorStore.getKeys(trc, watcher, ERROR_TABLE);
        if (!errorIDs) {
            throw new Error('Missing error table');
        }
        const errorList = [];
        for (const errorID of errorIDs) {
            const e = await this.errorStore.getValue(trc, watcher, ERROR_TABLE, errorID);
            if (!e) {
                throw new Error('Found empty entry in error table');
            }
            const errorObj = Object.assign(Object.assign({}, e), { error: conduit_utils_1.deserializeError(e.error) });
            if (markedValue === undefined ||
                (markedValue === true && errorObj.marked) ||
                (markedValue === false && !errorObj.marked)) {
                errorList.push(errorObj);
            }
        }
        return errorList;
    }
    async clearList(trc, markedValue) {
        if (!this.errorStore) {
            throw new Error('error store not initted');
        }
        if (markedValue === undefined) {
            await this.errorStore.transact(trc, 'ErrorManager.clearList', async (db) => {
                await db.clearTable(trc, ERROR_TABLE);
            });
        }
        else {
            const errs = await this.getList(trc, null, markedValue);
            for (const err of errs) {
                await this.removeError(trc, err.id);
            }
        }
    }
}
exports.ErrorManager = ErrorManager;
//# sourceMappingURL=ErrorManager.js.map