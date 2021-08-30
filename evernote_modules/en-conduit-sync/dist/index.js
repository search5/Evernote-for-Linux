"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
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
exports.OfflineSearchIndexActivity = exports.getLastUpdatedNoteFilters = exports.containerLastUpdated = exports.resolveContent = exports.init = exports.getScopedGoogleOAuthCredential = void 0;
var Auth_1 = require("./Auth");
Object.defineProperty(exports, "getScopedGoogleOAuthCredential", { enumerable: true, get: function () { return Auth_1.getScopedGoogleOAuthCredential; } });
var ENConnector_1 = require("./ENConnector");
Object.defineProperty(exports, "init", { enumerable: true, get: function () { return ENConnector_1.init; } });
var BlobResolver_1 = require("./Resolvers/BlobResolver");
Object.defineProperty(exports, "resolveContent", { enumerable: true, get: function () { return BlobResolver_1.resolveContent; } });
var FolderResolver_1 = require("./Resolvers/FolderResolver");
Object.defineProperty(exports, "containerLastUpdated", { enumerable: true, get: function () { return FolderResolver_1.containerLastUpdated; } });
Object.defineProperty(exports, "getLastUpdatedNoteFilters", { enumerable: true, get: function () { return FolderResolver_1.getLastUpdatedNoteFilters; } });
var OfflineSearchIndexActivity_1 = require("./SyncManagement/OfflineSearchIndexActivity");
Object.defineProperty(exports, "OfflineSearchIndexActivity", { enumerable: true, get: function () { return OfflineSearchIndexActivity_1.OfflineSearchIndexActivity; } });
__exportStar(require("./Types"), exports);
//# sourceMappingURL=index.js.map