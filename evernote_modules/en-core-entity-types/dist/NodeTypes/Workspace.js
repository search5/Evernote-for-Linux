"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkspace = exports.workspaceIndexConfig = exports.workspaceTypeDef = exports.pinnedContentDef = exports.PinnedContentTypeSchema = exports.WorkspaceAccessStatusEnum = exports.WorkspaceAccessStatusSchema = exports.PinnedContentTypeEnum = exports.WorkspaceLayoutStyleSchema = exports.WorkspaceLayoutStyle = exports.WorkspaceType = exports.WorkspaceTypeSchema = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
const MembershipPrivilege_1 = require("../MembershipPrivilege");
const PINNED_CONTENTS_TIMEOUT = 5 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
exports.WorkspaceTypeSchema = [
    'INVITE_ONLY',
    'DISCOVERABLE',
    'OPEN',
];
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["INVITE_ONLY"] = "INVITE_ONLY";
    WorkspaceType["DISCOVERABLE"] = "DISCOVERABLE";
    WorkspaceType["OPEN"] = "OPEN";
})(WorkspaceType = exports.WorkspaceType || (exports.WorkspaceType = {}));
var WorkspaceLayoutStyle;
(function (WorkspaceLayoutStyle) {
    WorkspaceLayoutStyle["LIST"] = "LIST";
    WorkspaceLayoutStyle["BOARD"] = "BOARD";
})(WorkspaceLayoutStyle = exports.WorkspaceLayoutStyle || (exports.WorkspaceLayoutStyle = {}));
exports.WorkspaceLayoutStyleSchema = ['LIST', 'BOARD'];
var PinnedContentTypeEnum;
(function (PinnedContentTypeEnum) {
    PinnedContentTypeEnum["NOTE"] = "Note";
    PinnedContentTypeEnum["NOTEBOOK"] = "Notebook";
    PinnedContentTypeEnum["EXTERNAL"] = "External";
})(PinnedContentTypeEnum = exports.PinnedContentTypeEnum || (exports.PinnedContentTypeEnum = {}));
exports.WorkspaceAccessStatusSchema = ['OPEN', 'DISCOVERABLE', 'PENDING', 'MEMBER'];
var WorkspaceAccessStatusEnum;
(function (WorkspaceAccessStatusEnum) {
    WorkspaceAccessStatusEnum["OPEN"] = "OPEN";
    WorkspaceAccessStatusEnum["DISCOVERABLE"] = "DISCOVERABLE";
    WorkspaceAccessStatusEnum["PENDING"] = "PENDING";
    WorkspaceAccessStatusEnum["MEMBER"] = "MEMBER";
})(WorkspaceAccessStatusEnum = exports.WorkspaceAccessStatusEnum || (exports.WorkspaceAccessStatusEnum = {}));
exports.PinnedContentTypeSchema = [EntityConstants_1.CoreEntityTypes.Note, EntityConstants_1.CoreEntityTypes.Notebook, 'External'];
exports.pinnedContentDef = {
    pinID: 'string',
    uri: 'url?',
    label: 'string?',
    entity: 'EntityRef?',
    created: 'number?',
    updated: 'number?',
    sortIndex: 'number',
};
exports.workspaceTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Workspace,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        description: 'string',
        workspaceType: exports.WorkspaceTypeSchema,
        created: 'timestamp',
        updated: 'timestamp',
        viewed: 'boolean',
        defaultRole: [...Object.values(MembershipPrivilege_1.MembershipPrivilege), '?'],
        isSample: 'boolean',
        notesCount: 'number',
        notebooksCount: 'number',
        accessStatus: [...exports.WorkspaceAccessStatusSchema],
        internal_shareCountProfiles: 'map<number>',
    },
    cache: {
        layoutStyle: {
            type: exports.WorkspaceLayoutStyleSchema,
            allowStale: true,
        },
        notebookDisplayOrder: {
            type: 'ID[]?',
            allowStale: true,
        },
        noteDisplayOrder: {
            type: 'ID[]?',
            allowStale: true,
        },
        pinnedContents: {
            type: 'unknown[]',
            allowStale: true,
            cacheTimeout: PINNED_CONTENTS_TIMEOUT,
        },
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