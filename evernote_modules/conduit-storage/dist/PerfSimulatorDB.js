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
exports.PerfSimulatorDB = exports.PerfSimulatorWritesPerTable = void 0;
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const KeyValCachedStorage_1 = require("./KeyValCachedStorage");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
exports.PerfSimulatorWritesPerTable = {};
class PerfSimulatorDB extends KeyValCachedStorage_1.KeyValCachedStorage {
    constructor(dbName, latencies) {
        super(dbName);
        this.latencies = latencies;
        this.data = {};
        this.batchGetValuesRaw = async (trc, tableName, keys) => {
            const values = [];
            if (this.data[tableName]) {
                for (const key of keys) {
                    values.push(SimplyImmutable.cloneImmutable(this.data[tableName][key]));
                }
            }
            await conduit_utils_1.sleep(this.latencies.batchGetValues);
            return values;
        };
    }
    get raw() {
        return this.data;
    }
    async hasKeyRaw(trc, tableName, key) {
        const ret = this.data[tableName] ? this.data[tableName].hasOwnProperty(key) : false;
        await conduit_utils_1.sleep(this.latencies.hasKey);
        return ret;
    }
    async getKeysRaw(trc, tableName) {
        const ret = Object.keys(this.data[tableName] || {});
        await conduit_utils_1.sleep(this.latencies.getKeys);
        return ret;
    }
    async getValueRaw(trc, tableName, key) {
        const ret = this.data[tableName] ? SimplyImmutable.cloneImmutable(this.data[tableName][key]) : undefined;
        await conduit_utils_1.sleep(this.latencies.getValue);
        return ret;
    }
    async commitTransactionRaw(trc, changeEvents) {
        await conduit_utils_1.sleep(this.latencies.commitTransaction);
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
                const writeKey = this.dbName + '/' + tableName;
                exports.PerfSimulatorWritesPerTable[writeKey] = exports.PerfSimulatorWritesPerTable[writeKey] || { count: 0, bytes: 0 };
                exports.PerfSimulatorWritesPerTable[writeKey].count += 1;
                exports.PerfSimulatorWritesPerTable[writeKey].bytes += conduit_utils_1.safeStringify(event.value).length;
            }
        }
        conduit_utils_1.traceCounts(trc, 'changeEvents', counts);
    }
    async importDatabaseRaw(trc, filename) {
        throw new Error('importDatabase not supported for PerfSimulatorDB');
    }
}
__decorate([
    conduit_utils_1.traceAsync('PerfSimulatorDB')
], PerfSimulatorDB.prototype, "commitTransactionRaw", null);
exports.PerfSimulatorDB = PerfSimulatorDB;
//# sourceMappingURL=PerfSimulatorDB.js.map