"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSyncEventManager = exports.serviceResultsToMutationDeps = exports.CoreEntityNSyncConverters = void 0;
__exportStar(require("./Converters/BaseConverter"), exports);
var NSyncEntityConverter_1 = require("./NSyncEntityConverter");
Object.defineProperty(exports, "CoreEntityNSyncConverters", { enumerable: true, get: function () { return NSyncEntityConverter_1.CoreEntityNSyncConverters; } });
Object.defineProperty(exports, "serviceResultsToMutationDeps", { enumerable: true, get: function () { return NSyncEntityConverter_1.serviceResultsToMutationDeps; } });
var NSyncEventManager_1 = require("./NSyncEventManager");
Object.defineProperty(exports, "NSyncEventManager", { enumerable: true, get: function () { return NSyncEventManager_1.NSyncEventManager; } });
//# sourceMappingURL=index.js.map