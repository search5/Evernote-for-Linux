"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValOverlay = exports.KeyValOverlayReadOnly = exports.KeyValStorage = exports.CorruptDBError = exports.validateIsObject = exports.validateIsString = exports.validateIsBoolean = void 0;
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const StorageEventEmitter_1 = require("./StorageEventEmitter");
const gActiveDatabases = {};
const PERSIST_SEP = ':;;:';
function persistKey(tableName, key) {
    return `${tableName}${PERSIST_SEP}${key}`;
}
function splitPersistKey(key) {
    const idx = key.indexOf(PERSIST_SEP);
    if (idx < 0) {
        return [key, null];
    }
    return [key.slice(0, idx), key.slice(idx + PERSIST_SEP.length)];
}
function validateIsBoolean(val) {
    if (typeof val === 'boolean') {
        return val;
    }
    return false;
}
exports.validateIsBoolean = validateIsBoolean;
function validateIsString(val) {
    if (typeof val === 'string') {
        return val;
    }
    return undefined;
}
exports.validateIsString = validateIsString;
function validateIsObject(val) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        return val;
    }
    return undefined;
}
exports.validateIsObject = validateIsObject;
class CorruptDBError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'CorruptDBError';
    }
}
exports.CorruptDBError = CorruptDBError;
class KeyValStorage extends StorageEventEmitter_1.StorageEventEmitter {
    constructor(dbName, cachePolicy, mutexTimeout, isOverlay = false, globalKey) {
        super();
        this.cachePolicy = cachePolicy;
        this.mutexTimeout = mutexTimeout;
        this.isOverlay = isOverlay;
        this.globalKey = globalKey;
        this.isDestroyed = false;
        if (!this.isOverlay || this.globalKey) {
            if (gActiveDatabases.hasOwnProperty(this.globalKey || dbName)) {
                throw new Error(`A database named "${this.globalKey || dbName}" is already active`);
            }
            gActiveDatabases[this.globalKey || dbName] = true;
        }
        this.dbName = dbName;
        this.mutex = new conduit_utils_1.Mutex('KeyValStorage.' + dbName, mutexTimeout);
    }
    async destructor() {
        if (this.isDestroyed) {
            return;
        }
        await this.mutex.destructor();
        super.destructor();
        if (!this.isOverlay || this.globalKey) {
            delete gActiveDatabases[this.globalKey || this.dbName];
        }
        this.isDestroyed = true;
    }
    isDestructed() {
        return this.isDestroyed;
    }
    resetDestructorInternal() {
        this.mutex = new conduit_utils_1.Mutex('KeyValStorage.' + this.dbName, this.mutexTimeout);
        this.isDestroyed = false;
    }
    get baseStorage() {
        let current = this.underlyingStorage || this;
        while (current.underlyingStorage) {
            current = current.underlyingStorage;
        }
        return current;
    }
    async hasKey(trc, watcher, tableName, key) {
        if (watcher) {
            watcher.addWatch([this.dbName, tableName, key], StorageEventEmitter_1.StorageChangeMask.ExistenceChange);
        }
        return this.hasKeyImpl(trc, tableName, key);
    }
    async getKeys(trc, watcher, tableName) {
        if (watcher) {
            watcher.addWatch([this.dbName, tableName], StorageEventEmitter_1.StorageChangeMask.ExistenceChange);
        }
        return this.getKeysImpl(trc, tableName);
    }
    async getValue(trc, watcher, tableName, key) {
        if (watcher) {
            watcher.addWatch([this.dbName, tableName, key], StorageEventEmitter_1.StorageChangeMask.AllChanges);
        }
        return (await this.getValueImpl(trc, tableName, key, watcher ? watcher.priority : conduit_utils_1.Priority.IMMEDIATE));
    }
    async batchGetValues(trc, watcher, tableName, keys) {
        if (watcher) {
            for (const key of keys) {
                watcher.addWatch([this.dbName, tableName, key], StorageEventEmitter_1.StorageChangeMask.AllChanges);
            }
        }
        return (await this.batchGetValuesImpl(trc, tableName, keys, watcher ? watcher.priority : conduit_utils_1.Priority.IMMEDIATE));
    }
    async getValidatedValue(trc, watcher, tableName, key, validator) {
        return validator(await this.getValue(trc, watcher, tableName, key));
    }
    async transact(trc, transactionName, func, mutexTimeoutOverride) {
        if (this.isDestroyed) {
            throw new Error(`Attempting to transact a destroyed DB "${this.dbName}"`);
        }
        let changeEvents;
        const ret = await this.mutex.runInMutex(trc, 'transact:' + transactionName, async () => {
            const overlay = new KeyValOverlay(this, true);
            const fRes = await conduit_utils_1.withError(func(overlay));
            changeEvents = await overlay.destructAndGenerateChangeEvents(trc);
            if (fRes.err) {
                throw fRes.err;
            }
            if (changeEvents && changeEvents.length) {
                await this.commitTransaction(trc, changeEvents);
            }
            return fRes.data;
        }, mutexTimeoutOverride);
        if (changeEvents && changeEvents.length) {
            setTimeout(this.emitChanges, 0, changeEvents);
        }
        return ret;
    }
    async transactChanges(trc, transactionName, changeEvents) {
        if (!changeEvents.length) {
            return;
        }
        await this.mutex.runInMutex(trc, 'transact:' + transactionName, async () => {
            await this.commitTransaction(trc, changeEvents);
        });
        setTimeout(this.emitChanges, 0, changeEvents);
    }
    async importDatabase(trc, filename) {
        if (this.isDestroyed) {
            throw new Error(`Attempting to import into a destroyed DB "${this.dbName}"`);
        }
        return await this.mutex.runInMutex(trc, 'importDatabase', async () => {
            await this.importDatabaseImpl(trc, filename);
        });
    }
}
exports.KeyValStorage = KeyValStorage;
class KeyValOverlayReadOnly extends KeyValStorage {
    constructor(underlyingStorage, inheritChangeEvents, persistTable) {
        super(underlyingStorage.dbName, undefined, undefined, true, persistTable);
        this.underlyingStorage = underlyingStorage;
        this.persistTable = persistTable;
        this.changes = {};
        this.isInitialized = false;
        if (inheritChangeEvents) {
            this.underlyingStorage.addChangeHandler(this);
        }
        if (!persistTable) {
            // no need for init call if not using persistence
            this.isInitialized = true;
        }
    }
    async initialize(trc) {
        var _a, _b;
        if (this.isInitialized) {
            return;
        }
        if (!this.persistTable) {
            throw new conduit_utils_1.InternalError('Invalid KeyValOverlay state');
        }
        const persistKeys = conduit_utils_1.chunkArray((await this.underlyingStorage.getKeys(trc, null, this.persistTable)).sort(), 100);
        for (const chunk of persistKeys) {
            const values = await this.underlyingStorage.batchGetValues(trc, null, this.persistTable, chunk);
            for (const pkey of chunk) {
                const val = values[pkey];
                if (val === undefined) {
                    continue;
                }
                const [tableName, key] = splitPersistKey(pkey);
                if (key) {
                    if (!this.changes[tableName]) {
                        this.changes[tableName] = {
                            tableCleared: false,
                            values: {},
                        };
                    }
                    this.changes[tableName].values[key] = val ? val.value : SimplyImmutable.REMOVE;
                }
                else {
                    this.changes[tableName] = {
                        tableCleared: Boolean(val === null || val === void 0 ? void 0 : val.value),
                        values: (_b = (_a = this.changes[tableName]) === null || _a === void 0 ? void 0 : _a.values) !== null && _b !== void 0 ? _b : {},
                    };
                }
            }
        }
        this.isInitialized = true;
    }
    async destructor() {
        await super.destructor();
        this.underlyingStorage.removeChangeHandler(this);
    }
    hasDBClear() {
        return Boolean(this.changes['*']);
    }
    async hasKeyImpl(trc, tableName, key) {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('Persisted KeyValOverlay must be initialized before use');
        }
        const tableChanges = this.changes[tableName];
        if (!tableChanges) {
            return this.hasDBClear() ? false : await this.underlyingStorage.hasKey(trc, null, tableName, key);
        }
        if (tableChanges.values.hasOwnProperty(key)) {
            return tableChanges.values[key] !== SimplyImmutable.REMOVE;
        }
        if (!tableChanges.tableCleared && !this.hasDBClear()) {
            return await this.underlyingStorage.hasKey(trc, null, tableName, key);
        }
        return false;
    }
    async getKeysImpl(trc, tableName) {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('Persisted KeyValOverlay must be initialized before use');
        }
        const tableChanges = this.changes[tableName];
        if (!tableChanges) {
            return this.hasDBClear() ? [] : await this.underlyingStorage.getKeys(trc, null, tableName);
        }
        const underlyingKeys = ((tableChanges.tableCleared || this.hasDBClear()) ? [] : await this.underlyingStorage.getKeys(trc, null, tableName))
            .filter(key => !tableChanges.values.hasOwnProperty(key));
        const changedKeys = Object.keys(tableChanges.values).filter(key => tableChanges.values[key] !== SimplyImmutable.REMOVE);
        return underlyingKeys.concat(changedKeys);
    }
    async getValueImpl(trc, tableName, key) {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('Persisted KeyValOverlay must be initialized before use');
        }
        const tableChanges = this.changes[tableName];
        if (!tableChanges) {
            return this.hasDBClear() ? undefined : await this.underlyingStorage.getValue(trc, null, tableName, key);
        }
        if (tableChanges.values.hasOwnProperty(key)) {
            const value = tableChanges.values[key];
            return value === SimplyImmutable.REMOVE ? undefined : value;
        }
        if (!tableChanges.tableCleared && !this.hasDBClear()) {
            return await this.underlyingStorage.getValue(trc, null, tableName, key);
        }
        return undefined;
    }
    async batchGetValuesImpl(trc, tableName, keys) {
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('Persisted KeyValOverlay must be initialized before use');
        }
        const tableChanges = this.changes[tableName];
        if (!tableChanges) {
            return this.hasDBClear() ? {} : await this.underlyingStorage.batchGetValues(trc, null, tableName, keys);
        }
        const pendingKeys = [];
        const values = {};
        for (const key of keys) {
            if (tableChanges.values.hasOwnProperty(key)) {
                const value = tableChanges.values[key];
                values[key] = value === SimplyImmutable.REMOVE ? undefined : value;
            }
            else {
                values[key] = undefined;
                pendingKeys.push(key);
            }
        }
        if (!tableChanges.tableCleared && !this.hasDBClear()) {
            const batchedValues = await this.underlyingStorage.batchGetValues(trc, null, tableName, pendingKeys);
            for (const key in batchedValues) {
                values[key] = batchedValues[key];
            }
        }
        return values;
    }
    async importDatabaseImpl(trc, filename) {
        throw new Error('Cannot import a database file into a KeyValOverlay');
    }
    async commitTransaction(trc, changeEvents) {
        if (this.isDestroyed) {
            throw new Error('Overlay has been destructed');
        }
        if (!this.isInitialized) {
            throw new conduit_utils_1.InternalError('Persisted KeyValOverlay must be initialized before use');
        }
        const persistChanges = this.persistTable ? {} : null;
        for (const event of changeEvents) {
            if (event.path[0] !== this.dbName) {
                conduit_utils_1.logger.error('Unexpected DB name mismatch in KeyValOverlay.commitTransaction', this.dbName, event.path);
                continue;
            }
            if (event.type === StorageEventEmitter_1.StorageChangeType.Delete) {
                switch (event.path.length) {
                    case 1:
                        this.clearAllInternal(persistChanges);
                        break;
                    case 2:
                        this.clearTableInternal(persistChanges, event.path[1]);
                        break;
                    case 3:
                        this.removeValueInternal(persistChanges, event.path[1], event.path[2]);
                        break;
                    default:
                        throw conduit_utils_1.absurd(event.path, 'unhandled delete storage event');
                }
            }
            else if (event.type === StorageEventEmitter_1.StorageChangeType.Undo) {
                throw new Error('Cannot commit an Undo change event');
            }
            else {
                this.setValueInternal(persistChanges, event.path[1], event.path[2], event.value);
            }
        }
        if (persistChanges) {
            await this.underlyingStorage.transact(trc, 'KeyValStorage.persistOverlayChanges', async (tx) => {
                for (const key in persistChanges) {
                    const val = persistChanges[key];
                    if (val === undefined) {
                        await tx.removeValue(trc, this.persistTable, key);
                    }
                    else {
                        await tx.setValue(trc, this.persistTable, key, val);
                    }
                }
            });
        }
    }
    clearAllInternal(persistChanges) {
        if (persistChanges) {
            for (const tableName in this.changes) {
                persistChanges[tableName] = undefined;
                for (const key in this.changes[tableName].values) {
                    persistChanges[persistKey(tableName, key)] = undefined;
                }
            }
        }
        this.changes = {};
        this.clearTableInternal(persistChanges, '*');
    }
    clearTableInternal(persistChanges, tableName) {
        const oldTableChanges = this.changes[tableName];
        this.changes[tableName] = {
            tableCleared: true,
            values: {},
        };
        if (persistChanges) {
            persistChanges[tableName] = { value: true };
            for (const key in (oldTableChanges === null || oldTableChanges === void 0 ? void 0 : oldTableChanges.values) || {}) {
                persistChanges[persistKey(tableName, key)] = undefined;
            }
        }
    }
    setValueInternal(persistChanges, tableName, key, value) {
        if (!this.changes[tableName]) {
            this.changes[tableName] = {
                tableCleared: false,
                values: {},
            };
            if (persistChanges) {
                persistChanges[tableName] = { value: false };
            }
        }
        const tableChanges = this.changes[tableName];
        tableChanges.values[key] = value;
        if (persistChanges) {
            persistChanges[persistKey(tableName, key)] = { value };
        }
    }
    removeValueInternal(persistChanges, tableName, key) {
        if (!this.changes[tableName]) {
            this.changes[tableName] = {
                tableCleared: false,
                values: {},
            };
            if (persistChanges) {
                persistChanges[tableName] = { value: false };
            }
        }
        const tableChanges = this.changes[tableName];
        if (tableChanges.tableCleared && !tableChanges.values.hasOwnProperty(key)) {
            // no value currently exists, so early out
            return false;
        }
        tableChanges.values[key] = SimplyImmutable.REMOVE;
        if (persistChanges) {
            persistChanges[persistKey(tableName, key)] = null;
        }
        return true;
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValOverlay')
], KeyValOverlayReadOnly.prototype, "commitTransaction", null);
exports.KeyValOverlayReadOnly = KeyValOverlayReadOnly;
class KeyValOverlay extends KeyValOverlayReadOnly {
    constructor(underlyingStorage, inheritChangeEvents) {
        super(underlyingStorage, inheritChangeEvents, undefined);
    }
    copyTableChangesFrom(overlay, table) {
        const src = overlay.changes[table];
        if (src) {
            this.changes[table] = {
                tableCleared: src.tableCleared,
                values: Object.assign({}, src.values),
            };
        }
    }
    async destructAndGenerateChangeEvents(trc) {
        const events = [];
        if (this.hasDBClear()) {
            events.push({ type: StorageEventEmitter_1.StorageChangeType.Delete, path: [this.dbName] });
        }
        for (const tableName in this.changes) {
            if (tableName === '*') {
                // handled before the loop by hasDBClear()
                continue;
            }
            const tableChanges = this.changes[tableName];
            if (tableChanges.tableCleared) {
                events.push({ type: StorageEventEmitter_1.StorageChangeType.Delete, path: [this.dbName, tableName] });
            }
            for (const key in tableChanges.values) {
                const value = tableChanges.values[key];
                if (value === SimplyImmutable.REMOVE) {
                    events.push({ type: StorageEventEmitter_1.StorageChangeType.Delete, path: [this.dbName, tableName, key] });
                }
                else if (tableChanges.tableCleared || !await this.underlyingStorage.hasKey(trc, null, tableName, key)) {
                    events.push({ type: StorageEventEmitter_1.StorageChangeType.Create, path: [this.dbName, tableName, key], value });
                }
                else {
                    events.push({ type: StorageEventEmitter_1.StorageChangeType.Replace, path: [this.dbName, tableName, key], value });
                }
            }
        }
        await this.destructor();
        return events;
    }
    reparent(underlyingStorage, inheritChangeEvents) {
        this.underlyingStorage.removeChangeHandler(this);
        this.underlyingStorage = underlyingStorage;
        if (inheritChangeEvents) {
            this.underlyingStorage.addChangeHandler(this);
        }
    }
    generateUndoEvents() {
        const events = [];
        for (const tableName in this.changes) {
            const tableChanges = this.changes[tableName];
            if (tableChanges.tableCleared) {
                // generate table-level undo event, which will trigger all watches for the table
                events.push({ type: StorageEventEmitter_1.StorageChangeType.Undo, path: [this.dbName, tableName] });
            }
            else {
                // otherwise generate events for each changed value (whether removed/created/updated)
                for (const key in tableChanges.values) {
                    events.push({ type: StorageEventEmitter_1.StorageChangeType.Undo, path: [this.dbName, tableName, key] });
                }
            }
        }
        return events;
    }
    async clearAll(trc) {
        if (this.isDestroyed) {
            throw new Error('Overlay has been destructed');
        }
        this.clearAllInternal(null);
        this.emitChanges([{ type: StorageEventEmitter_1.StorageChangeType.Delete, path: [this.dbName] }]);
    }
    async clearTable(trc, tableName) {
        if (this.isDestroyed) {
            throw new Error('Overlay has been destructed');
        }
        this.clearTableInternal(null, tableName);
        this.emitChanges([{ type: StorageEventEmitter_1.StorageChangeType.Delete, path: [this.dbName, tableName] }]);
    }
    async setValue(trc, tableName, key, value, noClone = false) {
        if (this.isDestroyed) {
            throw new Error('Overlay has been destructed');
        }
        if (!noClone) {
            // hang on to a clone of the value
            value = SimplyImmutable.cloneImmutable(value);
        }
        const isCreate = !(await this.hasKey(trc, null, tableName, key));
        this.setValueInternal(null, tableName, key, value);
        if (isCreate) {
            this.emitChanges([{ type: StorageEventEmitter_1.StorageChangeType.Create, path: [this.dbName, tableName, key], value }]);
        }
        else {
            this.emitChanges([{ type: StorageEventEmitter_1.StorageChangeType.Replace, path: [this.dbName, tableName, key], value }]);
        }
    }
    async removeValue(trc, tableName, key) {
        if (this.isDestroyed) {
            throw new Error('Overlay has been destructed');
        }
        if (this.removeValueInternal(null, tableName, key)) {
            this.emitChanges([{ type: StorageEventEmitter_1.StorageChangeType.Delete, path: [this.dbName, tableName, key] }]);
        }
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValOverlay')
], KeyValOverlay.prototype, "destructAndGenerateChangeEvents", null);
exports.KeyValOverlay = KeyValOverlay;
//# sourceMappingURL=KeyValStorage.js.map