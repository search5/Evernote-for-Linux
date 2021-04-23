"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagIndexConfig = exports.tagTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
const Note_1 = require("./Note");
/* The following regexes are created using https://mothereff.in/regexpu#input=/%5Cp%7BLetter%7D/u&unicodePropertyEscape=1
 * and use the regexs defined in the thrift calls to transpile to a ES2015 format */
// tslint:disable: max-line-length
const TAG_LABEL_REGEX = /^[!-\+\x2D-~\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\u{10FFFF}]([ -\+\x2D-~\xA0-\u2027\u202A-\u{10FFFF}]{0,98}[!-\+\x2D-~\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\u{10FFFF}])?$/u;
exports.tagTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Tag,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {},
    fieldValidation: {
        label: {
            regex: TAG_LABEL_REGEX,
            min: 1,
            max: 100,
        },
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            from: {
                type: EntityConstants_1.CoreEntityTypes.Tag,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'children',
            },
        },
    },
};
exports.tagIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.tagTypeDef, {
    indexResolvers: {
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.tagTypeDef, ['label']),
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.tagTypeDef, ['edges', 'parent']),
        // owner: getIndexByResolverForEdge(tagTypeDef, ['edges', 'owner']),
        refsCount: conduit_storage_1.getIndexByResolverForDenormalizedEdgeCount(EntityConstants_1.CoreEntityTypes.Tag, Note_1.noteTypeDef, ['edges', 'tags'], 'refs'),
        syncContext: {
            schemaType: 'string',
            resolver: async (trc, node, _) => {
                return node.syncContexts;
            },
            graphqlPath: ['syncContext'],
        },
    },
    indexes: {
        tagListLabel: {
            index: [
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'refsCount', order: 'DESC', isMatchField: false },
            ],
        },
        tagListRefCount: {
            index: [
                { field: 'refsCount', order: 'DESC', isMatchField: false },
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
        tagsAllowedLabel: {
            index: [
                { field: 'syncContext', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'refsCount', order: 'DESC', isMatchField: false },
            ],
        },
        tagsAllowedRefCount: {
            index: [
                { field: 'syncContext', order: 'ASC', isMatchField: true },
                { field: 'refsCount', order: 'DESC', isMatchField: false },
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
        tagHierarchyLabel: {
            index: [
                { field: 'parent', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'refsCount', order: 'DESC', isMatchField: false },
                { field: 'syncContext', order: 'ASC', isMatchField: false },
            ],
        },
        tagHierarchyRefCount: {
            index: [
                { field: 'parent', order: 'ASC', isMatchField: true },
                { field: 'refsCount', order: 'DESC', isMatchField: false },
                { field: 'label', order: 'ASC', isMatchField: false },
                { field: 'syncContext', order: 'ASC', isMatchField: false },
            ],
        },
    },
    queries: {
        Tags: {
            traversalName: 'childTags',
            params: {
                parent: {
                    optional: true,
                    match: { field: 'parent' },
                },
                orderBy: {
                    sort: {
                        label: [{ field: 'label', order: 'ASC' }, { field: 'refsCount', order: 'DESC' }],
                        refsCount: [{ field: 'refsCount', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                    },
                },
            },
            includeFields: ['syncContext'],
        },
        TagsInSyncContext: {
            internalOnly: true,
            params: {
                syncContext: {
                    match: { field: 'syncContext' },
                },
                label: {
                    optional: true,
                    match: { field: 'label' },
                },
                orderBy: {
                    sort: {
                        label: [{ field: 'label', order: 'ASC' }, { field: 'refsCount', order: 'DESC' }],
                        refsCount: [{ field: 'refsCount', order: 'DESC' }, { field: 'label', order: 'ASC' }],
                    },
                },
            },
        },
    },
});
//# sourceMappingURL=Tag.js.map