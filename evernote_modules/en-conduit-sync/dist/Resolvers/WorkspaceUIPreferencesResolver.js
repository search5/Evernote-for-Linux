"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceUIPreferencesResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
function WorkspaceUIPreferencesResolver() {
    return {
        'Workspace.layoutStyle': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Nullable(en_core_entity_types_1.WorkspaceLayoutStyleSchema)),
            resolve: async (nodeRef, _, context) => {
                return en_thrift_connector_1.resolveWorkspacePreferences(context, nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Workspace, 'layoutStyle');
            },
        },
        'Workspace.notebookDisplayOrder': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableListOf('ID')),
            resolve: async (nodeRef, _, context) => {
                return en_thrift_connector_1.resolveWorkspacePreferences(context, nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Workspace, 'notebookDisplayOrder');
            },
        },
        'Workspace.noteDisplayOrder': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableListOf('ID')),
            resolve: async (nodeRef, _, context) => {
                return en_thrift_connector_1.resolveWorkspacePreferences(context, nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Workspace, 'noteDisplayOrder');
            },
        },
        'Notebook.displayColor': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableInt),
            resolve: async (nodeRef, _, context) => {
                return en_thrift_connector_1.resolveWorkspacePreferences(context, nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Notebook, 'displayColor');
            },
        },
        'Notebook.noteDisplayOrder': {
            type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableListOf('ID')),
            resolve: async (nodeRef, _, context) => {
                return en_thrift_connector_1.resolveWorkspacePreferences(context, nodeRef.id, en_core_entity_types_1.CoreEntityTypes.Notebook, 'noteDisplayOrder');
            },
        },
    };
}
exports.WorkspaceUIPreferencesResolver = WorkspaceUIPreferencesResolver;
//# sourceMappingURL=WorkspaceUIPreferencesResolver.js.map