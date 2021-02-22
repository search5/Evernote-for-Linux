"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrateActivity = exports.registerSyncActivityType = void 0;
const gSyncActivityHydrators = {};
function registerSyncActivityType(type, hydrateFunc) {
    gSyncActivityHydrators[type] = hydrateFunc;
}
exports.registerSyncActivityType = registerSyncActivityType;
function hydrateActivity(di, context, p, timeout) {
    const hydrator = gSyncActivityHydrators[p.type];
    if (!hydrator) {
        throw new Error(`No hydrator found for SyncActivity type ${p.type}`);
    }
    return hydrator(di, context, p, timeout);
}
exports.hydrateActivity = hydrateActivity;
//# sourceMappingURL=SyncActivityHydration.js.map