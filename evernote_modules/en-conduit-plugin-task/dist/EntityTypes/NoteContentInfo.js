"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteContentInfoIndexConfig = exports.noteContentInfoTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_data_model_1 = require("en-data-model");
const TaskConstants_1 = require("../TaskConstants");
exports.noteContentInfoTypeDef = {
    name: TaskConstants_1.TaskEntityTypes.NoteContentInfo,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: {
        taskGroups: 'string[]?',
        created: 'timestamp',
        updated: 'timestamp',
        sourceOfChange: 'string?',
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: en_data_model_1.CoreEntityTypes.Note,
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
    lookups: ['parent'],
});
//# sourceMappingURL=NoteContentInfo.js.map