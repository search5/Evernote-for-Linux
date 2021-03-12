"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitSQLiteStorage = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class ResultSet {
    constructor(rows = []) {
        this.rows = rows;
        this.length = rows.length;
    }
    item(index) {
        return this.rows[index];
    }
}
class SqliteDB {
    constructor(db) {
        this.db = db;
        this.yieldInterval = 5000;
        this.tickTimer = null;
        this.tickTracker = Date.now();
    }
    transaction(changes) {
        const tx = this.db.transaction((queries) => {
            for (const query of queries) {
                const [sql, args] = query;
                const stmt = this.db.prepare(sql);
                args.length ? stmt.run(args) : stmt.run();
            }
        });
        tx(changes);
    }
    async executeSql(sql, args) {
        const now = Date.now();
        if (!this.tickTimer) {
            this.tickTracker = now;
            this.tickTimer = setImmediate(() => {
                this.tickTracker = Date.now();
                this.tickTimer = null;
            });
        }
        if (now - this.yieldInterval > this.tickTracker) {
            // better-sqlite is synchronous causing some tight CPU loops and starving other tasks.
            // sleep if tick hasn't elapsed for 5 seconds to yield CPU.
            await conduit_utils_1.sleep(1);
        }
        const stmt = this.db.prepare(sql);
        const rows = (args === null || args === void 0 ? void 0 : args.length) ? stmt.all(args) : stmt.all();
        return [{ rows: new ResultSet(rows) }];
    }
    async close() {
        this.db.close();
    }
}
class ConduitSQLiteStorage extends conduit_storage_1.SqlStorage {
    constructor(dbPath, dbName, cachePolicy, onFatalErrorCallBack) {
        super(dbName, cachePolicy);
        this.onFatalErrorCallBack = onFatalErrorCallBack;
        this.databaseFile = path_1.default.join(dbPath, this.dbName + '.sql');
    }
    async destructor() {
        var _a;
        await super.destructor();
        (_a = this.database) === null || _a === void 0 ? void 0 : _a.close();
    }
    async init(trc) {
        this.database = await this.openDatabase();
    }
    getDatabase() {
        if (!this.database) {
            throw new Error('Database not initialized');
        }
        return this.database;
    }
    async clearDB() {
        if (this.database) {
            await this.database.close();
            await conduit_utils_1.withError(fs_extra_1.default.remove(this.databaseFile));
        }
        this.database = await this.openDatabase();
        return this.database;
    }
    async importDatabaseRaw(trc, filename) {
        if (this.database) {
            await this.database.close();
            await conduit_utils_1.withError(fs_extra_1.default.remove(this.databaseFile));
            await fs_extra_1.default.move(filename, this.databaseFile);
        }
        this.database = await this.openDatabase();
        try {
            await this.assertIntegrity();
        }
        catch (e) {
            await this.clearDB();
            throw new conduit_storage_1.CorruptDBError(e.toString());
        }
    }
    async openDatabase() {
        try {
            await fs_extra_1.default.ensureFile(this.databaseFile);
            const db = new better_sqlite3_1.default(this.databaseFile);
            return new SqliteDB(db);
        }
        catch (err) {
            this.checkFatalErrorCallback(err);
            throw err;
        }
    }
    async assertIntegrity() {
        if (!this.database) {
            return;
        }
        // https://www.sqlite.org/pragma.html#pragma_quick_check
        // sqlite-only integrity check feature. Skipping index consistency and UNIQUE checks.
        // The pragma can throw error on execution if the database is damaged beyond repair.
        const [resultSet] = await this.database.executeSql('PRAGMA quick_check;');
        const res = resultSet.rows.item(0);
        if (res.quick_check !== 'ok') {
            throw new Error(`Corrupted db: ${JSON.stringify(res)}`);
        }
    }
    checkFatalErrorCallback(err) {
        // sqlite specific error
        if (this.onFatalErrorCallBack && err instanceof better_sqlite3_1.default.SqliteError) {
            const sqlError = err;
            if (sqlError.code === 'SQLITE_CANTOPEN' ||
                sqlError.code === 'SQLITE_FULL' ||
                sqlError.code === 'SQLITE_CORRUPT' ||
                sqlError.code === 'SQLITE_READONLY' ||
                sqlError.message.includes('database or disk is full') ||
                sqlError.message.includes('database disk image is malformed')) {
                conduit_utils_1.logger.error('Encountered fatal sqlite error ', err);
                this.onFatalErrorCallBack(err);
            }
        }
    }
}
exports.ConduitSQLiteStorage = ConduitSQLiteStorage;
//# sourceMappingURL=index.js.map