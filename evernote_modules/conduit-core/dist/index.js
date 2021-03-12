"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
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
exports.VAULT_USER_ID = exports.VAULT_USER_CONTEXT = exports.PERSONAL_USER_ID = exports.PERSONAL_USER_CONTEXT = exports.LocalSettings = exports.resolveUnindexedPaths = exports.resolveNodesFromList = exports.graphqlPathForIndexComponents = exports.getListResolverParams = exports.IndexRange = exports.IndexOrderType = exports.IndexMatch = exports.indexedSortsCongruencyCheck = exports.initPlugins = exports.getNsyncAssociationKey = exports.GraphQLWatcher = exports.shouldIgnoreFieldSelection = exports.getUnboundedQuery = exports.getFieldsForResolver = exports.SYNC_DB_VERSION = exports.GraphDB = exports.MutationEngine = exports.MutationContext = exports.schemaFieldToGraphQL = exports.resolveNode = exports.getEntityUnionType = exports.ConduitUserCore = exports.CONDUIT_VERSION = void 0;
var conduit_view_types_1 = require("conduit-view-types");
Object.defineProperty(exports, "CONDUIT_VERSION", { enumerable: true, get: function () { return conduit_view_types_1.CONDUIT_VERSION; } });
var ConduitUserCore_1 = require("./ConduitUserCore");
Object.defineProperty(exports, "ConduitUserCore", { enumerable: true, get: function () { return ConduitUserCore_1.ConduitUserCore; } });
var AutoResolvers_1 = require("./GraphDB/Resolvers/AutoResolvers");
Object.defineProperty(exports, "getEntityUnionType", { enumerable: true, get: function () { return AutoResolvers_1.getEntityUnionType; } });
Object.defineProperty(exports, "resolveNode", { enumerable: true, get: function () { return AutoResolvers_1.resolveNode; } });
Object.defineProperty(exports, "schemaFieldToGraphQL", { enumerable: true, get: function () { return AutoResolvers_1.schemaFieldToGraphQL; } });
var MutationEngine_1 = require("./MutationEngine");
Object.defineProperty(exports, "MutationContext", { enumerable: true, get: function () { return MutationEngine_1.MutationContext; } });
Object.defineProperty(exports, "MutationEngine", { enumerable: true, get: function () { return MutationEngine_1.MutationEngine; } });
var GraphDB_1 = require("./GraphDB/GraphDB");
Object.defineProperty(exports, "GraphDB", { enumerable: true, get: function () { return GraphDB_1.GraphDB; } });
Object.defineProperty(exports, "SYNC_DB_VERSION", { enumerable: true, get: function () { return GraphDB_1.SYNC_DB_VERSION; } });
var GraphQLFields_1 = require("./GraphDB/GraphQLFields");
Object.defineProperty(exports, "getFieldsForResolver", { enumerable: true, get: function () { return GraphQLFields_1.getFieldsForResolver; } });
Object.defineProperty(exports, "getUnboundedQuery", { enumerable: true, get: function () { return GraphQLFields_1.getUnboundedQuery; } });
Object.defineProperty(exports, "shouldIgnoreFieldSelection", { enumerable: true, get: function () { return GraphQLFields_1.shouldIgnoreFieldSelection; } });
var GraphQLTypes_1 = require("./GraphDB/GraphQLTypes");
Object.defineProperty(exports, "GraphQLWatcher", { enumerable: true, get: function () { return GraphQLTypes_1.GraphQLWatcher; } });
__exportStar(require("./GraphDB/Resolvers/ResolverHelpers"), exports);
var pluginManager_1 = require("./pluginManager");
Object.defineProperty(exports, "getNsyncAssociationKey", { enumerable: true, get: function () { return pluginManager_1.getNsyncAssociationKey; } });
Object.defineProperty(exports, "initPlugins", { enumerable: true, get: function () { return pluginManager_1.initPlugins; } });
__exportStar(require("./NotificationManager"), exports);
var ListResolvers_1 = require("./GraphDB/Resolvers/ListResolvers");
Object.defineProperty(exports, "indexedSortsCongruencyCheck", { enumerable: true, get: function () { return ListResolvers_1.indexedSortsCongruencyCheck; } });
Object.defineProperty(exports, "IndexMatch", { enumerable: true, get: function () { return ListResolvers_1.IndexMatch; } });
Object.defineProperty(exports, "IndexOrderType", { enumerable: true, get: function () { return ListResolvers_1.IndexOrderType; } });
Object.defineProperty(exports, "IndexRange", { enumerable: true, get: function () { return ListResolvers_1.IndexRange; } });
Object.defineProperty(exports, "getListResolverParams", { enumerable: true, get: function () { return ListResolvers_1.getListResolverParams; } });
Object.defineProperty(exports, "graphqlPathForIndexComponents", { enumerable: true, get: function () { return ListResolvers_1.graphqlPathForIndexComponents; } });
Object.defineProperty(exports, "resolveNodesFromList", { enumerable: true, get: function () { return ListResolvers_1.resolveNodesFromList; } });
Object.defineProperty(exports, "resolveUnindexedPaths", { enumerable: true, get: function () { return ListResolvers_1.resolveUnindexedPaths; } });
__exportStar(require("./ConduitCore"), exports);
__exportStar(require("./GuidGenerator"), exports);
__exportStar(require("./Types/DataSchemaGQL"), exports);
__exportStar(require("./Types/GraphMutationTypes"), exports);
__exportStar(require("./Types/MiscTypes"), exports);
__exportStar(require("./Types/NotificationTypes"), exports);
__exportStar(require("./Types/SyncEventTypes"), exports);
__exportStar(require("./GraphDB/Helpers"), exports);
__exportStar(require("./EnmlUtils"), exports);
__exportStar(require("./HostResolver"), exports);
var LocalSettings_1 = require("./LocalSettings");
Object.defineProperty(exports, "LocalSettings", { enumerable: true, get: function () { return LocalSettings_1.LocalSettings; } });
exports.PERSONAL_USER_CONTEXT = 'User:personal';
exports.PERSONAL_USER_ID = exports.PERSONAL_USER_CONTEXT;
exports.VAULT_USER_CONTEXT = 'User:vault';
exports.VAULT_USER_ID = exports.VAULT_USER_CONTEXT;
//# sourceMappingURL=index.js.map