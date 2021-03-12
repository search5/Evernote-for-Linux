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
exports.ThriftComm = exports.OfflineSearchIndexActivity = exports.ThriftRemoteMutationExecutor = exports.getLastUpdatedNoteFilters = exports.containerLastUpdated = exports.resolveContent = exports.toUserClientInfo = exports.workspaceFromService = exports.generateResourceUrl = exports.profileFromContact = exports.ProfileConverter = exports.notebookObjectFromService = exports.getOfflineNbsFromLocalSettings = exports.membershipFromWorkspace = exports.makeConverterParams = exports.convertGuidToService = exports.convertGuidFromService = exports.RemoteServiceCredentialGQL = exports.hasNapAuthInfo = exports.getScopedGoogleOAuthCredential = exports.encodeAuthData = exports.decodeAuthData = exports.AuthServiceLevel = void 0;
var Auth_1 = require("./Auth");
Object.defineProperty(exports, "AuthServiceLevel", { enumerable: true, get: function () { return Auth_1.AuthServiceLevel; } });
Object.defineProperty(exports, "decodeAuthData", { enumerable: true, get: function () { return Auth_1.decodeAuthData; } });
Object.defineProperty(exports, "encodeAuthData", { enumerable: true, get: function () { return Auth_1.encodeAuthData; } });
Object.defineProperty(exports, "getScopedGoogleOAuthCredential", { enumerable: true, get: function () { return Auth_1.getScopedGoogleOAuthCredential; } });
Object.defineProperty(exports, "hasNapAuthInfo", { enumerable: true, get: function () { return Auth_1.hasNapAuthInfo; } });
var AuthPlugin_1 = require("./Plugins/AuthPlugin");
Object.defineProperty(exports, "RemoteServiceCredentialGQL", { enumerable: true, get: function () { return AuthPlugin_1.RemoteServiceCredentialGQL; } });
var Converters_1 = require("./Converters/Converters");
Object.defineProperty(exports, "convertGuidFromService", { enumerable: true, get: function () { return Converters_1.convertGuidFromService; } });
Object.defineProperty(exports, "convertGuidToService", { enumerable: true, get: function () { return Converters_1.convertGuidToService; } });
var Helpers_1 = require("./Converters/Helpers");
Object.defineProperty(exports, "makeConverterParams", { enumerable: true, get: function () { return Helpers_1.makeConverterParams; } });
var MembershipConverter_1 = require("./Converters/MembershipConverter");
Object.defineProperty(exports, "membershipFromWorkspace", { enumerable: true, get: function () { return MembershipConverter_1.membershipFromWorkspace; } });
var NotebookConverter_1 = require("./Converters/NotebookConverter");
Object.defineProperty(exports, "getOfflineNbsFromLocalSettings", { enumerable: true, get: function () { return NotebookConverter_1.getOfflineNbsFromLocalSettings; } });
Object.defineProperty(exports, "notebookObjectFromService", { enumerable: true, get: function () { return NotebookConverter_1.notebookObjectFromService; } });
var ProfileConverter_1 = require("./Converters/ProfileConverter");
Object.defineProperty(exports, "ProfileConverter", { enumerable: true, get: function () { return ProfileConverter_1.ProfileConverter; } });
Object.defineProperty(exports, "profileFromContact", { enumerable: true, get: function () { return ProfileConverter_1.profileFromContact; } });
var ResourceConverter_1 = require("./Converters/ResourceConverter");
Object.defineProperty(exports, "generateResourceUrl", { enumerable: true, get: function () { return ResourceConverter_1.generateResourceUrl; } });
var WorkspaceConverter_1 = require("./Converters/WorkspaceConverter");
Object.defineProperty(exports, "workspaceFromService", { enumerable: true, get: function () { return WorkspaceConverter_1.workspaceFromService; } });
var MaestroHelper_1 = require("./MaestroHelper");
Object.defineProperty(exports, "toUserClientInfo", { enumerable: true, get: function () { return MaestroHelper_1.toUserClientInfo; } });
var BlobResolver_1 = require("./Resolvers/BlobResolver");
Object.defineProperty(exports, "resolveContent", { enumerable: true, get: function () { return BlobResolver_1.resolveContent; } });
var FolderResolver_1 = require("./Resolvers/FolderResolver");
Object.defineProperty(exports, "containerLastUpdated", { enumerable: true, get: function () { return FolderResolver_1.containerLastUpdated; } });
Object.defineProperty(exports, "getLastUpdatedNoteFilters", { enumerable: true, get: function () { return FolderResolver_1.getLastUpdatedNoteFilters; } });
var ThriftRemoteMutationExecutor_1 = require("./ThriftRemoteMutationExecutor");
Object.defineProperty(exports, "ThriftRemoteMutationExecutor", { enumerable: true, get: function () { return ThriftRemoteMutationExecutor_1.ThriftRemoteMutationExecutor; } });
__exportStar(require("./Types"), exports);
var OfflineSearchIndexActivity_1 = require("./SyncManagement/OfflineSearchIndexActivity");
Object.defineProperty(exports, "OfflineSearchIndexActivity", { enumerable: true, get: function () { return OfflineSearchIndexActivity_1.OfflineSearchIndexActivity; } });
var Thrift_1 = require("./Thrift");
Object.defineProperty(exports, "ThriftComm", { enumerable: true, get: function () { return Thrift_1.ThriftComm; } });
__exportStar(require("./ThriftConnector"), exports);
//# sourceMappingURL=index.js.map