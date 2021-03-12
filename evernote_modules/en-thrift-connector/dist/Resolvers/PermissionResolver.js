"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionResolver = void 0;
const conduit_core_1 = require("conduit-core");
const en_core_entity_types_1 = require("en-core-entity-types");
const NoteCommandPolicyGraphQLType = conduit_core_1.schemaToGraphQLType({
    canDuplicate: 'boolean',
    canEditContent: 'boolean',
    canEditLabel: 'boolean',
    canEmail: 'boolean',
    canExpunge: 'boolean',
    canMove: 'boolean',
    canMoveToTrash: 'boolean',
    canRestoreFromTrash: 'boolean',
    canSeeVersionHistory: 'boolean',
    canShare: 'boolean',
    canSharePublicly: 'boolean',
    canTag: 'boolean',
    canCreateTag: 'boolean',
    canUpdateMetadata: 'boolean',
}, 'NoteCommandPolicy', false);
const FolderCommandPolicyGraphQLType = conduit_core_1.schemaToGraphQLType({
    canCreateFolder: 'boolean',
    canCreateNote: 'boolean',
    canEditLabel: 'boolean',
    canExpunge: 'boolean',
    // canJoin: boolean; // needed for space discovery in dashboard
    canLeave: 'boolean',
    canMakeDefault: 'boolean',
    canMove: 'boolean',
    canSetDefaultPrivilege: 'boolean',
    canShare: 'boolean',
    canStack: 'boolean',
    canStore: 'boolean',
    canUpdateDescription: 'boolean',
    canUpdateType: 'boolean',
}, 'FolderCommandPolicy', false);
function PermissionResolver() {
    return {
        'Note.CommandPolicy': {
            type: NoteCommandPolicyGraphQLType,
            resolve: async (n, _, context) => {
                const permissionContext = new en_core_entity_types_1.GraphQLPermissionContext(context);
                return await en_core_entity_types_1.commandPolicyOfNote(n.id, permissionContext);
            },
        },
        'Notebook.CommandPolicy': {
            type: FolderCommandPolicyGraphQLType,
            resolve: async (nb, _, context) => {
                const permissionContext = new en_core_entity_types_1.GraphQLPermissionContext(context);
                return await en_core_entity_types_1.commandPolicyOfNotebook(nb.id, permissionContext);
            },
        },
        'Workspace.CommandPolicy': {
            type: FolderCommandPolicyGraphQLType,
            resolve: async (sp, _, context) => {
                const permissionContext = new en_core_entity_types_1.GraphQLPermissionContext(context);
                return await en_core_entity_types_1.commandPolicyOfSpace(sp.id, permissionContext);
            },
        },
    };
}
exports.PermissionResolver = PermissionResolver;
//# sourceMappingURL=PermissionResolver.js.map