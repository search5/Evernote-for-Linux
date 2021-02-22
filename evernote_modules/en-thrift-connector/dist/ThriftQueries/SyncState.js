"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSyncStateQueries = exports.addSyncStateMutators = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const Auth_1 = require("../Auth");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
const SyncActivity_1 = require("../SyncManagement/SyncActivity");
const AdaptiveDownsyncTypeEnum = Object.keys(conduit_view_types_1.AdaptiveDownsyncType);
AdaptiveDownsyncTypeEnum.__enumName = 'AdaptiveDownsyncTypeEnum';
const SyncProgressTypeEnum = Object.keys(conduit_view_types_1.SyncProgressType);
SyncProgressTypeEnum.__enumName = 'SyncProgressTypeEnum';
function addSyncStateMutators(thriftComm, out) {
    async function addSessionResolver(parent, args, context) {
        conduit_core_1.validateDB(context);
        const currentSessionBlock = conduit_utils_1.getSessionBlock(Date.now());
        const sessionState = await context.db.getCustomSyncState(context.trc, null, 'Aux', 'SessionState');
        if (!sessionState || sessionState.lastSession < currentSessionBlock) {
            let sessionCount = sessionState ? sessionState.sessions + 1 : 1;
            const authState = await context.db.getAuthTokenAndState(context.trc, null);
            if (authState === null || authState === void 0 ? void 0 : authState.token) {
                const auth = Auth_1.decodeAuthData(authState.token);
                const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                const result = await conduit_utils_1.withError(noteStore.getSyncStateWithMetrics(context.trc, auth.token, sessionCount));
                if (!result.err) {
                    sessionCount = 0;
                }
            }
            await context.db.transactSyncedStorage(context.trc, 'Update Sync Sessions', async (tx) => {
                await tx.replaceCustomSyncState(context.trc, 'Aux', 'SessionState', { sessions: sessionCount, lastSession: currentSessionBlock });
            });
        }
        return { latestSessionBlock: currentSessionBlock };
    }
    out.recordSession = {
        args: conduit_core_1.schemaToGraphQLArgs({}),
        type: conduit_core_1.schemaToGraphQLType({ latestSessionBlock: 'number' }, 'SyncStateRecordSessionResult', false),
        resolve: addSessionResolver,
    };
}
exports.addSyncStateMutators = addSyncStateMutators;
async function getDownsyncCount(context, tableName) {
    conduit_core_1.validateDB(context);
    let current = 0;
    let total = 0;
    let syncerCount = 0;
    const syncProgressKeys = await context.db.getEphemeralKeys(context.trc, context.watcher, tableName);
    for (const key of syncProgressKeys) {
        const state = await context.db.getEphemeralObject(context.trc, context.watcher, tableName, key);
        if (!state || !state.totalSize) {
            break;
        }
        syncerCount++;
        conduit_utils_1.logger.trace(tableName, state);
        const totalSize = state.totalSize;
        const percentComplete = state.percentComplete || 0; // Will be undefined when setting the initial progress bucket sizes
        total += totalSize;
        current += percentComplete * totalSize;
    }
    return { current, total, syncerCount };
}
function addSyncStateQueries(out) {
    async function syncStateResolver(parent, args, context) {
        var _a;
        conduit_core_1.validateDB(context);
        const lastSyncTime = await context.db.getSyncState(context.trc, context.watcher, ['lastSyncTime']) || 0;
        const syncDisabled = await context.db.getEphemeralFlag(context.trc, context.watcher, 'SyncManager', 'syncDisabled');
        const nsyncDisabled = await context.db.getEphemeralFlag(context.trc, context.watcher, 'SyncManager', 'nsyncDisabled');
        const authState = await context.db.getAuthTokenAndState(context.trc, context.watcher);
        if ((authState === null || authState === void 0 ? void 0 : authState.state) !== conduit_view_types_1.AuthState.Authorized) {
            return {
                progressPercent: 0,
                paused: syncDisabled,
                nsyncEnabled: !nsyncDisabled,
                lastSyncTime,
                backgroundProgressPercent: 0,
                contentFetchSyncProgressPercent: 0,
                adaptiveDownsyncType: conduit_view_types_1.AdaptiveDownsyncType.NONE,
                syncProgressType: conduit_view_types_1.SyncProgressType.NONE,
            };
        }
        const precision = (_a = args === null || args === void 0 ? void 0 : args.precision) !== null && _a !== void 0 ? _a : 10;
        const precUp = precision * 100;
        const precDown = 1 / precision;
        const initialDownsyncCount = await getDownsyncCount(context, SyncActivity_1.INITIAL_DOWNSYNC_PROGRESS_TABLE);
        const backgroundDownsyncCount = await getDownsyncCount(context, SyncActivity_1.BACKGROUND_SYNC_PROGRESS_TABLE);
        const backgroundProgressPercent = backgroundDownsyncCount.syncerCount ? precDown * Math.floor(precUp * backgroundDownsyncCount.current / backgroundDownsyncCount.total) : 100;
        const contentFetchSyncCount = await getDownsyncCount(context, SyncActivity_1.CONTENT_SYNC_PROGRESS_TABLE);
        const contentFetchSyncProgressPercent = contentFetchSyncCount.syncerCount ? precDown * Math.floor(precUp * contentFetchSyncCount.current / contentFetchSyncCount.total) : 100;
        const syncType = await context.db.getSyncState(context.trc, context.watcher, SyncHelpers_1.SYNC_TYPE_SYNC_STATE_PATH) || {};
        const adaptiveDownsyncType = syncType.adaptiveDownsyncType || conduit_view_types_1.AdaptiveDownsyncType.NONE;
        const syncProgressType = syncType.syncProgressType || conduit_view_types_1.SyncProgressType.NONE;
        const ret = {
            paused: syncDisabled,
            nsyncEnabled: !nsyncDisabled,
            lastSyncTime,
            backgroundProgressPercent,
            contentFetchSyncProgressPercent,
            adaptiveDownsyncType,
            syncProgressType,
        };
        if (!initialDownsyncCount.syncerCount) {
            // initial downsync has finished
            conduit_utils_1.logger.trace('SyncState no syncers');
            return Object.assign({ progressPercent: 100 }, ret);
        }
        if (!initialDownsyncCount.total) {
            // no syncers in CatchUp mode, we are all done with initial downsync!
            conduit_utils_1.logger.trace('SyncState CatchUp finished');
            return Object.assign({ progressPercent: 100 }, ret);
        }
        if (initialDownsyncCount.current === initialDownsyncCount.total) {
            conduit_utils_1.logger.trace('SyncState current === total', initialDownsyncCount.current, initialDownsyncCount.total);
            return Object.assign({ progressPercent: 100 }, ret);
        }
        return Object.assign({ progressPercent: precDown * Math.floor(precUp * initialDownsyncCount.current / initialDownsyncCount.total) }, ret);
    }
    out.SyncState = {
        args: conduit_core_1.schemaToGraphQLArgs({
            precision: 'int?',
        }),
        type: conduit_core_1.schemaToGraphQLType({
            progressPercent: 'number',
            backgroundProgressPercent: 'number',
            contentFetchSyncProgressPercent: 'number',
            paused: 'boolean',
            nsyncEnabled: 'boolean',
            lastSyncTime: 'timestamp',
            adaptiveDownsyncType: AdaptiveDownsyncTypeEnum,
            syncProgressType: SyncProgressTypeEnum,
        }, 'SyncState', false),
        resolve: syncStateResolver,
    };
}
exports.addSyncStateQueries = addSyncStateQueries;
//# sourceMappingURL=SyncState.js.map