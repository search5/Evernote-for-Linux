"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
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
exports.KeyValDatabaseMem = void 0;
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const KeyValStorage_1 = require("./KeyValStorage");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
class KeyValDatabaseMem extends KeyValStorage_1.KeyValStorage {
    constructor() {
        super(...arguments);
        this.data = {};
    }
    get raw() {
        return this.data;
    }
    async hasKeyImpl(trc, tableName, key) {
        if (!this.data[tableName]) {
            return false;
        }
        return this.data[tableName].hasOwnProperty(key);
    }
    async getKeysImpl(trc, tableName) {
        return Object.keys(this.data[tableName] || {});
    }
    async getValueImpl(trc, tableName, key) {
        if (!this.data[tableName]) {
            return undefined;
        }
        return SimplyImmutable.cloneImmutable(this.data[tableName][key]);
    }
    async batchGetValuesImpl(trc, tableName, keys) {
        if (!this.data[tableName]) {
            return {};
        }
        const values = {};
        for (const key of keys) {
            values[key] = SimplyImmutable.cloneImmutable(this.data[tableName][key]);
        }
        return values;
    }
    async importDatabaseImpl(trc, filename) {
        throw new Error('importDatabase not supported for KeyValDatabaseMem');
    }
    async commitTransaction(trc, changeEvents) {
        const counts = {
            dbClear: 0,
            tableDelete: 0,
            valueDelete: 0,
            valueReplace: 0,
        };
        for (const event of changeEvents) {
            const tableName = event.path[1] || '';
            if (event.type === StorageEventEmitter_1.StorageChangeType.Delete) {
                switch (event.path.length) {
                    case 1:
                        counts.dbClear++;
                        this.data = {};
                        break;
                    case 2:
                        counts.tableDelete++;
                        this.data[tableName] = {};
                        break;
                    case 3:
                        counts.valueDelete++;
                        if (this.data[tableName]) {
                            delete this.data[tableName][event.path[2]];
                        }
                        break;
                    default:
                        throw conduit_utils_1.absurd(event.path, 'unhandled delete storage event');
                }
            }
            else if (event.type === StorageEventEmitter_1.StorageChangeType.Undo) {
                throw new Error('Cannot commit an Undo change event');
            }
            else {
                counts.valueReplace++;
                this.data[tableName] = this.data[tableName] || {};
                this.data[tableName][event.path[2]] = event.value;
            }
        }
        conduit_utils_1.traceCounts(trc, 'changeEvents', counts);
    }
}
__decorate([
    conduit_utils_1.traceAsync('KeyValDatabaseMem')
], KeyValDatabaseMem.prototype, "hasKeyImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValDatabaseMem')
], KeyValDatabaseMem.prototype, "getKeysImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValDatabaseMem')
], KeyValDatabaseMem.prototype, "getValueImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValDatabaseMem')
], KeyValDatabaseMem.prototype, "batchGetValuesImpl", null);
__decorate([
    conduit_utils_1.traceAsync('KeyValDatabaseMem')
], KeyValDatabaseMem.prototype, "commitTransaction", null);
exports.KeyValDatabaseMem = KeyValDatabaseMem;
//# sourceMappingURL=KeyValDatabaseMem.js.map