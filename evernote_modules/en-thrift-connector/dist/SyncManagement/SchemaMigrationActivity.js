"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMigrationActivity = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const Migrations_1 = require("../SyncFunctions/Migrations");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
const MAX_PENDING_MIGRATIONS_LIMIT = 30;
function ensurePendingMigrationsLimit(pendingMutations) {
    if (pendingMutations.length > MAX_PENDING_MIGRATIONS_LIMIT) {
        conduit_utils_1.logger.warn('number of pending mutations exceed limit, perform full resync');
        throw new Migrations_1.SchemaMigrationError('pending mutations exceed limit');
    }
}
class SchemaMigrationActivity extends SyncActivity_1.SyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: SyncActivity_1.SyncActivityType.SchemaMigrationActivity,
            priority: SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: SyncActivity_1.INITIAL_DOWNSYNC_PROGRESS_TABLE,
        });
    }
    get progressBucketSize() {
        return this.params.subpriority > 0 ? 5000 : 1000;
    }
    async runSyncImpl(trc) {
        // don't update syncProgressType if running during initial downsync.
        this.params.subpriority === 0 && await SyncHelpers_1.updateSyncProgressType(trc, this.context.syncEngine, conduit_view_types_1.SyncProgressType.DB_MIGRATION);
        await this.processSchemaMigrations(trc);
    }
    async processSchemaMigrations(trc) {
        const schemaMigrations = Migrations_1.getAllMigrations();
        // if any migration scripts  detected
        if (!schemaMigrations.length) {
            await this.setProgress(trc, 1);
            return;
        }
        const localSchemaMigrations = await this.context.syncEngine.graphStorage.getSyncState(trc, null, ['schemaMigrations']) || {};
        const resultSchemaMigration = Object.assign({}, localSchemaMigrations);
        const pendingMigrations = schemaMigrations.filter(m => !localSchemaMigrations[m]);
        // check if migrations make sense
        ensurePendingMigrationsLimit(pendingMigrations);
        const progressDelta = 1.0 / pendingMigrations.length;
        // now check version and if it was migrated over
        for (let i = 0; i < pendingMigrations.length; ++i) {
            const migrationName = pendingMigrations[i];
            try {
                const syncParams = this.initParams('best', null, 0, progressDelta, i * progressDelta);
                await Migrations_1.getFixUpFunction(migrationName)(trc, syncParams);
                resultSchemaMigration[migrationName] = Date.now();
                await this.context.syncEngine.transact(trc, 'SchemaMigration: ' + migrationName, async (graphTransaction) => {
                    // update migration table
                    await graphTransaction.replaceSyncState(trc, ['schemaMigrations'], resultSchemaMigration);
                });
                syncParams.setProgress && await syncParams.setProgress(trc, 1);
            }
            catch (e) {
                if (e instanceof conduit_utils_1.RetryError || e instanceof conduit_utils_1.AuthError) {
                    throw e;
                }
                else {
                    conduit_utils_1.logger.error('fail to migrate schema: ' + migrationName, e);
                    await conduit_utils_1.recordException(e);
                    throw new Migrations_1.SchemaMigrationError('fail to migrate schema: ' + migrationName);
                }
            }
        }
        await this.setProgress(trc, 1);
    }
}
exports.SchemaMigrationActivity = SchemaMigrationActivity;
SyncActivityHydration_1.registerSyncActivityType(SyncActivity_1.SyncActivityType.SchemaMigrationActivity, (di, context, p, timeout) => {
    return new SchemaMigrationActivity(di, context, p.subpriority, timeout);
});
//# sourceMappingURL=SchemaMigrationActivity.js.map