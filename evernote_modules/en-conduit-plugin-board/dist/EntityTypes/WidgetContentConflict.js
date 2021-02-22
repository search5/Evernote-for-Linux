"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgetContentConflictIndexConfig = exports.widgetContentConflictTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("../BoardConstants");
exports.widgetContentConflictTypeDef = {
    name: BoardConstants_1.BoardEntityTypes.WidgetContentConflict,
    nsyncFeatureGroup: 'Home',
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    schema: {
        content: en_data_model_1.BlobV2SchemaWithContent,
        created: 'timestamp',
        updated: 'timestamp',
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY_LINK,
            from: {
                type: BoardConstants_1.BoardEntityTypes.Widget,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'conflicts',
            },
        },
    },
};
exports.widgetContentConflictIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.widgetContentConflictTypeDef, {
    indexResolvers: {
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.widgetContentConflictTypeDef, ['edges', 'parent']),
        // This allows us to subscribe to conflicts as a list and respond to hash changes via individual queries (rather than hitting undindexed fields or indexing content)
        content_hash: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetContentConflictTypeDef, ['NodeFields', 'content', 'hash']),
        updated: conduit_storage_1.getIndexByResolverForPrimitives(exports.widgetContentConflictTypeDef, ['NodeFields', 'updated']),
    },
    queries: {
        ContentConflictsInWidget: {
            traversalName: 'contentConflicts',
            sort: [{ field: 'updated', order: 'ASC' }],
            params: {
                widget: {
                    match: { field: 'parent' },
                },
            },
            includeFields: ['content_hash'],
        },
    },
});
//# sourceMappingURL=WidgetContentConflict.js.map