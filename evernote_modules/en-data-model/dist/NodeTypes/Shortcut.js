"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcutIndexConfig = exports.shortcutTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.shortcutTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Shortcut,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        sortOrder: 'string',
    },
    edges: {
        source: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            from: {
                type: [
                    EntityConstants_1.CoreEntityTypes.Note,
                    EntityConstants_1.CoreEntityTypes.Notebook,
                    EntityConstants_1.CoreEntityTypes.Stack,
                    EntityConstants_1.CoreEntityTypes.Workspace,
                    EntityConstants_1.CoreEntityTypes.Tag,
                    EntityConstants_1.CoreEntityTypes.SavedSearch,
                ],
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'shortcut',
            },
        },
    },
};
exports.shortcutIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.shortcutTypeDef, {
    indexResolvers: {
        sortOrder: conduit_storage_1.getIndexByResolverForPrimitives(exports.shortcutTypeDef, ['NodeFields', 'sortOrder']),
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.shortcutTypeDef, ['label']),
        source: conduit_storage_1.getIndexByResolverForEdge(exports.shortcutTypeDef, ['edges', 'source']),
    },
    queries: {
        Shortcuts: {
            sort: [{ field: 'sortOrder', order: 'ASC' }, { field: 'label', order: 'ASC' }],
            params: {},
            includeFields: ['source'],
        },
    },
});
//# sourceMappingURL=Shortcut.js.map