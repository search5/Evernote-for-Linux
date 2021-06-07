"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkspace = exports.workspaceIndexConfig = exports.workspaceTypeDef = exports.pinnedContentDef = exports.WorkspaceAccessStatusSchema = exports.WorkspaceAccessStatus = exports.PinnedContentTypeEnum = exports.WorkspaceLayoutStyleSchema = exports.WorkspaceLayoutStyle = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const EntityConstants_1 = require("../EntityConstants");
const PINNED_CONTENTS_TIMEOUT = 5 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
var WorkspaceLayoutStyle;
(function (WorkspaceLayoutStyle) {
    WorkspaceLayoutStyle["LIST"] = "LIST";
    WorkspaceLayoutStyle["BOARD"] = "BOARD";
})(WorkspaceLayoutStyle = exports.WorkspaceLayoutStyle || (exports.WorkspaceLayoutStyle = {}));
exports.WorkspaceLayoutStyleSchema = conduit_utils_1.Enum(WorkspaceLayoutStyle, 'WorkspaceLayoutStyle');
var PinnedContentTypeEnum;
(function (PinnedContentTypeEnum) {
    PinnedContentTypeEnum["NOTE"] = "Note";
    PinnedContentTypeEnum["NOTEBOOK"] = "Notebook";
    PinnedContentTypeEnum["EXTERNAL"] = "External";
})(PinnedContentTypeEnum = exports.PinnedContentTypeEnum || (exports.PinnedContentTypeEnum = {}));
var WorkspaceAccessStatus;
(function (WorkspaceAccessStatus) {
    WorkspaceAccessStatus["OPEN"] = "OPEN";
    WorkspaceAccessStatus["DISCOVERABLE"] = "DISCOVERABLE";
    WorkspaceAccessStatus["PENDING"] = "PENDING";
    WorkspaceAccessStatus["MEMBER"] = "MEMBER";
})(WorkspaceAccessStatus = exports.WorkspaceAccessStatus || (exports.WorkspaceAccessStatus = {}));
exports.WorkspaceAccessStatusSchema = conduit_utils_1.Enum(WorkspaceAccessStatus, 'WorkspaceAccessStatus');
exports.pinnedContentDef = conduit_utils_1.Struct({
    pinID: 'string',
    uri: conduit_utils_1.NullableUrl,
    label: conduit_utils_1.NullableString,
    entity: conduit_utils_1.NullableEntityRef,
    created: conduit_utils_1.NullableTimestamp,
    updated: conduit_utils_1.NullableTimestamp,
    sortIndex: 'number',
});
exports.workspaceTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Workspace,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        accessStatus: exports.WorkspaceAccessStatusSchema,
        description: 'string',
        workspaceType: en_conduit_sync_types_1.WorkspaceTypeSchema,
        created: 'timestamp',
        updated: 'timestamp',
        viewed: 'boolean',
        defaultRole: conduit_utils_1.Nullable(en_conduit_sync_types_1.MembershipPrivilegeSchema),
        isSample: 'boolean',
        notesCount: 'number',
        notebooksCount: 'number',
        internal_shareCountProfiles: conduit_utils_1.MapOf('number'),
    },
    cache: {
        layoutStyle: {
            type: exports.WorkspaceLayoutStyleSchema,
            allowStale: true,
        },
        notebookDisplayOrder: {
            type: conduit_utils_1.NullableListOf('ID'),
            allowStale: true,
        },
        noteDisplayOrder: {
            type: conduit_utils_1.NullableListOf('ID'),
            allowStale: true,
        },
        pinnedContents: {
            type: conduit_utils_1.ListOf(exports.pinnedContentDef),
            allowStale: true,
            cacheTimeout: PINNED_CONTENTS_TIMEOUT,
        },
    },
    hasMemberships: {
        constraint: conduit_storage_1.EdgeConstraint.MANY,
        type: conduit_storage_1.EdgeType.MEMBERSHIP,
        to: EntityConstants_1.CoreEntityTypes.Membership,
    },
    edges: {
        manager: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.VIEW,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
    },
};
exports.workspaceIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.workspaceTypeDef, {
    indexResolvers: {
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.workspaceTypeDef, ['label']),
    },
    queries: {
        Workspaces: {
            cacheInMemory: true,
            sort: [{ field: 'label', order: 'ASC' }],
            params: {},
        },
    },
});
function isWorkspace(node) {
    return node.type === EntityConstants_1.CoreEntityTypes.Workspace;
}
exports.isWorkspace = isWorkspace;
//# sourceMappingURL=Workspace.js.map