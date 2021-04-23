"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteContentInfoIndexConfig = exports.noteContentInfoTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const TaskConstants_1 = require("../TaskConstants");
exports.noteContentInfoTypeDef = {
    name: TaskConstants_1.TaskEntityTypes.NoteContentInfo,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: {
        taskGroupNoteLevelIDs: conduit_utils_1.NullableListOf('string'),
        created: 'timestamp',
        updated: 'timestamp',
        sourceOfChange: conduit_utils_1.NullableString,
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_core_entity_types_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'noteContentInfo',
            },
        },
    },
};
exports.noteContentInfoIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.noteContentInfoTypeDef, {
    indexResolvers: {
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.noteContentInfoTypeDef, ['edges', 'parent']),
    },
    indexes: {
        parent: {
            index: [
                { field: 'parent', order: 'ASC', isMatchField: true },
            ],
        },
    },
    queries: {
        NoteContentInfoAll: {
            params: {},
            includeFields: ['parent'],
        },
    },
    lookups: ['parent'],
});
//# sourceMappingURL=NoteContentInfo.js.map