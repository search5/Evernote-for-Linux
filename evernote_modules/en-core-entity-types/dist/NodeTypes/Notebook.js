"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notebookIndexConfig = exports.notebookTypeDef = exports.isNotebook = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
const Note_1 = require("./Note");
const DEFAULT_CACHE_TIMEOUT = 30 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
/* The following regexes are created using https://mothereff.in/regexpu#input=/%5Cp%7BLetter%7D/u&unicodePropertyEscape=1
 * and use the regexs defined in the thrift calls to transpile to a ES2015 format */
// tslint:disable: max-line-length
const NOTEBOOK_LABEL_REGEX = /^[!-~\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\u{10FFFF}]([ -~\xA0-\u2027\u202A-\u{10FFFF}]{0,98}[!-~\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\u{10FFFF}])?$/u;
function isNotebook(node) {
    return node.type === EntityConstants_1.CoreEntityTypes.Notebook;
}
exports.isNotebook = isNotebook;
exports.notebookTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Notebook,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        created: 'timestamp',
        updated: 'timestamp',
        isPublished: 'boolean',
        inWorkspace: 'boolean',
        isExternal: 'boolean',
        reminderNotifyEmail: 'boolean',
        reminderNotifyInApp: 'boolean',
        markedForOffline: 'boolean',
        contentDownloaded: conduit_utils_1.NullableBoolean,
        isPartialNotebook: 'boolean',
        internal_shareCountProfiles: conduit_utils_1.MapOf('number'),
        internal_linkedNotebookParams: conduit_utils_1.NullableStruct({
            shardId: conduit_utils_1.NullableString,
            noteStoreUrl: conduit_utils_1.NullableString,
        }),
    },
    fieldValidation: {
        label: {
            regex: NOTEBOOK_LABEL_REGEX,
            min: 1,
            max: 100,
        },
    },
    cache: {
        displayColor: {
            type: conduit_utils_1.NullableInt,
            allowStale: true,
        },
        noteDisplayOrder: {
            type: conduit_utils_1.NullableListOf('ID'),
            allowStale: true,
        },
        internal_membershipsAcceptStatus: {
            type: conduit_utils_1.MapOf('boolean'),
            allowStale: true,
            cacheTimeout: DEFAULT_CACHE_TIMEOUT,
        },
    },
    hasMemberships: {
        constraint: conduit_storage_1.EdgeConstraint.MANY,
        type: conduit_storage_1.EdgeType.MEMBERSHIP,
        to: EntityConstants_1.CoreEntityTypes.Membership,
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: EntityConstants_1.CoreEntityTypes.Workspace,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'children',
            },
        },
        stack: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.VIEW,
            from: {
                type: EntityConstants_1.CoreEntityTypes.Stack,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                // TODO switch to the traversalQuery childNotebooks when ready to take the client conversion hit
                denormalize: 'notebooks',
            },
        },
        creator: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
    },
};
exports.notebookIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.notebookTypeDef, {
    indexResolvers: {
        creator: conduit_storage_1.getIndexByResolverForEdge(exports.notebookTypeDef, ['edges', 'creator']),
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.notebookTypeDef, ['label']),
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.notebookTypeDef, ['NodeFields', 'created']),
        updated: conduit_storage_1.getIndexByResolverForPrimitives(exports.notebookTypeDef, ['NodeFields', 'updated']),
        stack: conduit_storage_1.getIndexByResolverForEdge(exports.notebookTypeDef, ['edges', 'stack']),
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.notebookTypeDef, ['edges', 'parent']),
        childrenCount: conduit_storage_1.getIndexByResolverForDenormalizedEdgeCount(EntityConstants_1.CoreEntityTypes.Notebook, Note_1.noteTypeDef, ['edges', 'parent'], 'children'),
        markedForOffline: conduit_storage_1.getIndexByResolverForPrimitives(exports.notebookTypeDef, ['NodeFields', 'markedForOffline']),
        contentDownloaded: conduit_storage_1.getIndexByResolverForPrimitives(exports.notebookTypeDef, ['NodeFields', 'contentDownloaded']),
        hasStack: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [!conduit_utils_1.isStashEmpty(node.inputs.stack)];
            },
            graphqlPath: ['hasStack'],
        },
    },
    indexes: {
        label: {
            index: [
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'childrenCount', order: 'ASC', isMatchField: false },
            ],
        },
        creator: {
            index: [
                { field: 'creator', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'childrenCount', order: 'ASC', isMatchField: false },
            ],
        },
        stackByLabel: {
            index: [
                { field: 'stack', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'childrenCount', order: 'ASC', isMatchField: false },
            ],
        },
        stackByCreated: {
            index: [
                { field: 'stack', order: 'ASC', isMatchField: true },
                { field: 'created', order: 'DESC', isMatchField: false },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'childrenCount', order: 'ASC', isMatchField: false },
            ],
        },
        stackByUpdated: {
            index: [
                { field: 'stack', order: 'ASC', isMatchField: true },
                { field: 'updated', order: 'DESC', isMatchField: false },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'childrenCount', order: 'ASC', isMatchField: false },
            ],
        },
        parent: {
            index: [
                { field: 'parent', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'childrenCount', order: 'ASC', isMatchField: false },
            ],
        },
    },
    lookups: ['parent', 'stack'],
    queries: {
        Notebooks: {
            params: {
                orderBy: {
                    defaultValue: 'label',
                    sort: {
                        label: [{ field: 'label', order: 'ASC' }, { field: 'updated', order: 'DESC' }],
                        updated: [{ field: 'updated', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                    },
                },
            },
            includeFields: ['childrenCount'],
        },
        NotebooksInWorkspace: {
            traversalName: 'childNotebooks',
            params: {
                workspace: {
                    match: { field: 'parent' },
                },
                orderBy: {
                    defaultValue: 'label',
                    sort: {
                        label: [{ field: 'label', order: 'ASC' }, { field: 'updated', order: 'DESC' }],
                        updated: [{ field: 'updated', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                        created: [{ field: 'created', order: 'ASC' }, { field: 'label', order: 'ASC' }],
                    },
                },
            },
            includeFields: ['childrenCount'],
        },
        NotebooksInStack: {
            traversalName: 'childNotebooks',
            filter: [{
                    field: 'hasStack',
                    value: true,
                }],
            sort: [{ field: 'label', order: 'ASC' }],
            params: {
                stack: {
                    match: { field: 'stack' },
                },
            },
            includeFields: ['childrenCount'],
        },
        NotebooksWithoutStack: {
            filter: [{
                    field: 'hasStack',
                    value: false,
                }],
            sort: [{ field: 'label', order: 'ASC' }],
            params: {},
            includeFields: ['childrenCount'],
        },
        NotebooksParents: {
            cacheInMemory: true,
            params: {},
            includeFields: ['parent', 'id', 'childrenCount'],
        },
        NotebooksStacks: {
            cacheInMemory: true,
            params: {},
            includeFields: ['stack', 'id', 'childrenCount'],
        },
        NotebooksMarkedForOffline: {
            filter: [{
                    field: 'markedForOffline',
                    value: true,
                }],
            params: {},
            includeFields: ['contentDownloaded', 'childrenCount'],
        },
        NotebooksWithLabel: {
            params: {
                label: {
                    match: {
                        field: 'label',
                    },
                },
            },
        },
        NotebooksWithoutStackAndParent: {
            filter: [{
                    field: 'hasStack',
                    value: false,
                }, {
                    field: 'parent',
                    value: null,
                }],
            sort: [{ field: 'label', order: 'ASC' }],
            params: {},
            includeFields: ['childrenCount'],
        },
    },
});
//# sourceMappingURL=Notebook.js.map