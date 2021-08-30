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
exports.nsyncInitActivityHydrator = exports.NSyncInitActivity = void 0;
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const Auth = __importStar(require("../Auth"));
const ENSyncActivity_1 = require("./ENSyncActivity");
class NSyncInitActivity extends ENSyncActivity_1.ENSyncActivity {
    constructor(di, context, priority = en_conduit_sync_types_1.SyncActivityPriority.INITIAL_DOWNSYNC, subpriority = 0, timeout = 0) {
        super(di, context, {
            activityType: en_conduit_sync_types_1.SyncActivityType.NSyncInitActivity,
            priority,
            subpriority,
            runAfter: Date.now() + timeout,
        }, {
            priority,
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
        const napAuthInfo = Auth.hasNapAuthInfo(auth) ? auth.napAuthInfo : null;
        if (this.di.initSyncEventManager) {
            this.context.syncEventManager = await this.di.initSyncEventManager(trc, auth.urlHost, auth.token, (napAuthInfo === null || napAuthInfo === void 0 ? void 0 : napAuthInfo.jwt) || '', (napAuthInfo === null || napAuthInfo === void 0 ? void 0 : napAuthInfo.clientID) || '', this.context.usedPrebuilt);
        }
    }
}
exports.NSyncInitActivity = NSyncInitActivity;
function nsyncInitActivityHydrator(di, context, p, timeout) {
    return new NSyncInitActivity(di, context, p.options.priority, p.subpriority, timeout);
}
exports.nsyncInitActivityHydrator = nsyncInitActivityHydrator;
//# sourceMappingURL=NSyncInitActivity.js.map