"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskUserSettingsIndexConfig = exports.taskUserSettingsDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
exports.taskUserSettingsDef = {
    name: en_data_model_1.EntityTypes.TaskUserSettings,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Tasks',
    fieldValidation: {},
    schema: Object.assign(Object.assign({}, conduit_utils_1.shallowCloneExcluding(en_tasks_data_model_1.TaskUserSettingsEntitySchema.fields, ['defaultTaskNoteID'])), { created: 'timestamp', updated: 'timestamp' }),
    edges: {
        defaultTaskNote: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: {
                type: en_core_entity_types_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
                denormalize: 'taskUserSettingsForDefaultNote',
            },
        },
    },
};
exports.taskUserSettingsIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.taskUserSettingsDef, {
    indexResolvers: {
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.taskUserSettingsDef, ['label']),
    },
    indexes: {
        label: {
            index: [
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
    },
});
//# sourceMappingURL=TaskUserSettings.js.map