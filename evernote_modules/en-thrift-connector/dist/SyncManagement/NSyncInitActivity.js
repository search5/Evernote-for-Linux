"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSyncInitActivity = void 0;
const Auth = __importStar(require("../Auth"));
const SyncActivity_1 = require("./SyncActivity");
const SyncActivityHydration_1 = require("./SyncActivityHydration");
class NSyncInitActivity extends SyncActivity_1.SyncActivity {
    constructor(di, context, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: SyncActivity_1.SyncActivityType.NSyncInitActivity,
            priority: SyncActivity_1.SyncActivityPriority.INITIAL_DOWNSYNC,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            syncProgressTableName: null,
        });
        this.di = di;
    }
    async runSyncImpl(trc) {
        if (this.context.syncEventManager) {
            // already initialized
            return;
        }
        const auth = this.context.syncManager.getAuth();
        if (!auth) {
            return;
        }
        const storage = {
            transact: (newTrc, name, func) => {
                return this.context.syncEngine.transact(newTrc, name, func);
            },
            getNode: async (newTrc, ref) => {
                return await this.context.syncEngine.graphStorage.getNode(newTrc, null, ref, false);
            },
            getEdge: async (newTrc, ref) => {
                return await this.context.syncEngine.graphStorage.getEdge(newTrc, null, ref);
            },
            getSyncState: (newTrc, watcher, path) => {
                return this.context.syncEngine.graphStorage.getSyncState(newTrc, watcher, path);
            },
            getEphemeralFlag: (newTrc, table, key) => {
                return this.context.syncEngine.getEphemeralFlag(newTrc, table, key);
            },
            getUserID: () => {
                const authInner = this.context.syncManager.getAuth();
                if (!authInner) {
                    throw new Error('Missing auth in initted SyncManager');
                }
                return authInner.userID;
            },
        };
        const napAuthInfo = Auth.hasNapAuthInfo(auth) ? auth.napAuthInfo : null;
        if (this.di.initSyncEventManager) {
            this.context.syncEventManager = await this.di.initSyncEventManager(trc, auth.urlHost, auth.token, (napAuthInfo === null || napAuthInfo === void 0 ? void 0 : napAuthInfo.jwt) || '', (napAuthInfo === null || napAuthInfo === void 0 ? void 0 : napAuthInfo.clientID) || '', storage, this.context.usedPrebuilt, async (newTrc, disable) => {
                await this.context.syncManager.toggleNSync(newTrc, disable);
            });
            await this.context.syncEngine.transactEphemeral(trc, 'InitNSyncDisabled', async (tx) => {
                if (!this.context.syncEventManager) {
                    return;
                }
                await tx.setValue(trc, 'SyncManager', 'nsyncDisabled', !this.context.syncEventManager.isAvailable());
            });
        }
    }
}
exports.NSyncInitActivity = NSyncInitActivity;
SyncActivityHydration_1.registerSyncActivityType(SyncActivity_1.SyncActivityType.NSyncInitActivity, (di, context, p, timeout) => {
    return new NSyncInitActivity(di, context, p.subpriority, timeout);
});
//# sourceMappingURL=NSyncInitActivity.js.map