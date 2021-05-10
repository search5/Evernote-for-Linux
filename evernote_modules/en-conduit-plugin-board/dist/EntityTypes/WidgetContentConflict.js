"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgetContentConflictIndexConfig = exports.widgetContentConflictTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
exports.widgetContentConflictTypeDef = {
    name: en_data_model_1.EntityTypes.WidgetContentConflict,
    nsyncFeatureGroup: 'Home',
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    schema: Object.assign(Object.assign({}, conduit_utils_1.shallowCloneExcluding(en_home_data_model_1.WidgetContentConflictEntitySchema.fields, ['parentID'])), { created: 'timestamp', updated: 'timestamp', content: en_core_entity_types_1.BlobV2WithContentSchema }),
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY_LINK,
            from: {
                type: en_data_model_1.EntityTypes.Widget,
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