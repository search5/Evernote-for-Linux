"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlStorage = void 0;
const conduit_utils_1 = require("conduit-utils");
const _1 = require("./");
const SQL_MAX_SIZE = 1024 * 1024;
const SQL_MAX_VARIABLES = 998;
const SQL_MAX_ROWS = SQL_MAX_VARIABLES / 2;
const SQL_MAX_BATCH_FETCH = 200;
class SqlStorage extends _1.KeyValCachedStorage {
    constructor(dbName, cachePolicy) {
        super(dbName, cachePolicy, 15000);
        this.batchGetValuesRaw = async (trc, tableName, keys) => {
            return this.batchGetValuesRawInternal(trc, tableName, keys);
        };
        this.maxBatchSize = SQL_MAX_BATCH_FETCH;
    }
    async executeSql(trc, sql, args) {
        const db = this.getDatabase();
        return db.executeSql(sql, args);
    }
    async commitTransactionRaw(trc, changeEvents) {
        const existingTables = new Set();
        const queries = [];
        function ensureTable(sqlTableName) {
            if (!existingTables.has(sqlTableName)) {
                const sqlIndexName = `IDX_${sqlTableName}_TKey`;
                queries.push([`CREATE TABLE IF NOT EXISTS '${sqlTableName}' (TKey TEXT NOT NULL UNIQUE,TValue TEXT,PRIMARY KEY(TKey));`, []]);
                queries.push([`CREATE UNIQUE INDEX IF NOT EXISTS '${sqlIndexName}' ON ${sqlTableName} ('TKey');`, []]);
                existingTables.add(sqlTableName);
            }
        }
        let lastSqlTableName;
        let lastEventType;
        let multiRowReplaceCount = 0;
        let multiRowReplaceSize = 0;
        for (const event of changeEvents) {
            const tableName = event.path[1] || '';
            const sqlTableName = this.simplifySQLTableName(tableName);
            if (event.type === _1.StorageChangeType.Delete) {
                switch (event.path.length) {
                    case 1:
                        await this.clearDB();
                        existingTables.clear();
                        break;
                    case 2:
                        queries.push([`DROP TABLE IF EXISTS '${sqlTableName}';`, []]);
                        existingTables.delete(sqlTableName);
                        break;
                    case 3:
                        const key = event.path[2];
                        ensureTable(sqlTableName);
                        queries.push([`DELETE FROM '${sqlTableName}' WHERE TKey=?;`, [key]]);
                        break;
                    default:
                        throw conduit_utils_1.absurd(event.path, 'unhandled delete storage event');
                }
            }
            else if (event.type === _1.StorageChangeType.Undo) {
                throw new Error('Cannot commit an Undo change event');
            }
            else {
                const key = event.path[2];
                const value = conduit_utils_1.safeStringify(event.value);
                ensureTable(sqlTableName);
                // Optimize SQL query by multi-row replace
                let sqlStatement;
                let sqlArgs;
                const newMultiRowReplaceCount = multiRowReplaceCount + 1;
                const newMultiRowReplaceSize = multiRowReplaceSize + key.length + value.length + 6; // 6 is the number of characters added to the statement
                if (sqlTableName === lastSqlTableName
                    && lastEventType === event.type
                    && newMultiRowReplaceCount < SQL_MAX_ROWS
                    && newMultiRowReplaceSize < SQL_MAX_SIZE) {
                    const [prevSqlStatement, prevSqlArgs] = queries.pop();
                    sqlStatement = `${prevSqlStatement.slice(0, -1)},(?,?);`;
                    sqlArgs = prevSqlArgs;
                    sqlArgs.push(key, value);
                    multiRowReplaceCount = newMultiRowReplaceCount;
                    multiRowReplaceSize = newMultiRowReplaceSize;
                }
                else {
                    sqlStatement = `REPLACE INTO '${sqlTableName}' (TKey,TValue) VALUES (?,?);`;
                    sqlArgs = [key, value];
                    multiRowReplaceCount = 1;
                    multiRowReplaceSize = sqlStatement.length + key.length + value.length;
                }
                queries.push([sqlStatement, sqlArgs]);
                lastSqlTableName = sqlTableName;
            }
            lastEventType = event.type;
        }
        try {
            const db = this.getDatabase();
            await db.transaction(queries);
        }
        catch (err) {
            conduit_utils_1.logger.error(`Transaction has been rollback: ${err}`);
            this.checkFatalErrorCallback(err);
            throw err;
        }
    }
    async getValueRaw(trc, tableName, key) {
        const item = await this.getItemInternal(trc, tableName, key);
        const ret = item === null ? undefined : conduit_utils_1.safeParse(item);
        return ret;
    }
    async hasKeyRaw(trc, tableName, key) {
        const hasKey = await this.hasKeyInternal(trc, tableName, key);
        return hasKey;
    }
    async getKeysRaw(trc, tableName) {
        const sqlTableName = this.simplifySQLTableName(tableName);
        const items = [];
        let resultSet;
        try {
            [resultSet] = await this.executeSql(trc, `SELECT TKey FROM "${sqlTableName}";`);
        }
        catch (_a) {
            // Fail silently if table does not exist
        }
        if (resultSet !== undefined && resultSet.rows.length > 0) {
            for (let i = 0; i < resultSet.rows.length; i++) {
                const item = resultSet.rows.item(i).TKey;
                items.push(item);
            }
        }
        return items;
    }
    async getItemInternal(trc, tableName, key) {
        const sqlTableName = this.simplifySQLTableName(tableName);
        try {
            const [resultSet] = await this.executeSql(trc, `SELECT TValue FROM "${sqlTableName}" WHERE TKey=? LIMIT 1;`, [key]);
            if (resultSet !== undefined && resultSet.rows.length === 1) {
                return resultSet.rows.item(0).TValue;
            }
        }
        catch (_a) {
            // Fail silently if table does not exist
        }
        return null;
    }
    async hasKeyInternal(trc, tableName, key) {
        const sqlTableName = this.simplifySQLTableName(tableName);
        try {
            const [resultSet] = await this.executeSql(trc, `SELECT TKey FROM "${sqlTableName}" WHERE TKey=? LIMIT 1;`, [key]);
            if (resultSet !== undefined && resultSet.rows.length === 1) {
                return true;
            }
        }
        catch (_a) {
            // Fail silently if table does not exist
        }
        return false;
    }
    simplifySQLTableName(tableName) {
        return tableName.replace(/[\/\-\:'"]/g, '_');
    }
    async batchGetValuesRawInternal(trc, tableName, keys) {
        try {
            const sqlTableName = this.simplifySQLTableName(tableName);
            // Construct query based on number of keys.
            let query;
            if (keys.length > 1) {
                const placeholders = keys.map(key => '?').join();
                query = `SELECT TKey, TValue FROM "${sqlTableName}" WHERE TKey in (${placeholders});`;
            }
            else {
                query = `SELECT TValue FROM "${sqlTableName}" WHERE TKey=?;`;
            }
            const [resultSet] = await this.executeSql(trc, query, keys);
            if (resultSet !== undefined) {
                // For a single key request we just need to extract it's value.
                if (keys.length === 1) {
                    if (resultSet.rows.length === 1) {
                        return [conduit_utils_1.safeParse(resultSet.rows.item(0).TValue)];
                    }
                    else {
                        // No key in the table
                        return [undefined];
                    }
                }
                else {
                    // For multi-key request transform ResultSet object to a hashmap.
                    const resultsMap = new Map();
                    for (let i = 0; i < resultSet.rows.length; i++) {
                        const item = resultSet.rows.item(i);
                        resultsMap.set(item.TKey, item.TValue);
                    }
                    // Now we need to map each row to corresponding key.
                    return keys.map(key => {
                        const item = resultsMap.get(key);
                        return item === null ? undefined : conduit_utils_1.safeParse(item);
                    });
                }
            }
        }
        catch (_a) {
            // Fail silently if table does not exist
        }
        // Return undefined for each key if table does not exist.
        return keys.map(key => undefined);
    }
}
__decorate([
    conduit_utils_1.traceAsync('SqlStorage')
], SqlStorage.prototype, "executeSql", null);
__decorate([
    conduit_utils_1.traceAsync('SqlStorage', 'changeEventsCount')
], SqlStorage.prototype, "commitTransactionRaw", null);
__decorate([
    conduit_utils_1.traceAsync('SqlStorage', 'tableName', 'key')
], SqlStorage.prototype, "getValueRaw", null);
__decorate([
    conduit_utils_1.traceAsync('SqlStorage', 'tableName', 'key')
], SqlStorage.prototype, "hasKeyRaw", null);
__decorate([
    conduit_utils_1.traceAsync('SqlStorage', 'tableName')
], SqlStorage.prototype, "getKeysRaw", null);
__decorate([
    conduit_utils_1.traceAsync('SqlStorage', 'tableName', 'keysCount')
], SqlStorage.prototype, "batchGetValuesRawInternal", null);
exports.SqlStorage = SqlStorage;
//# sourceMappingURL=SqlStorage.js.map