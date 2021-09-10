"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOperation = void 0;
var SyncOperation;
(function (SyncOperation) {
    SyncOperation[SyncOperation["ACCESS_FANOUT"] = 0] = "ACCESS_FANOUT";
    SyncOperation[SyncOperation["CREATE"] = 1] = "CREATE";
    SyncOperation[SyncOperation["UPDATE"] = 2] = "UPDATE";
    SyncOperation[SyncOperation["DELETE"] = 3] = "DELETE";
    SyncOperation[SyncOperation["EXPUNGE"] = 4] = "EXPUNGE";
    SyncOperation[SyncOperation["MIGRATE"] = 5] = "MIGRATE";
    SyncOperation[SyncOperation["WITH_ENTITY_CREATE"] = 6] = "WITH_ENTITY_CREATE";
    SyncOperation[SyncOperation["FORCE_FANOUT"] = 7] = "FORCE_FANOUT";
})(SyncOperation = exports.SyncOperation || (exports.SyncOperation = {}));
//# sourceMappingURL=SyncDocuments.js.map