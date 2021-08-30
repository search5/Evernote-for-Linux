"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThriftPlugin = void 0;
const MarkedForOffline_1 = require("../Queries/MarkedForOffline");
const NoteThriftQueries_1 = require("../Queries/NoteThriftQueries");
const SyncState_1 = require("../Queries/SyncState");
const Users_1 = require("../Queries/Users");
const Workspace_1 = require("../Queries/Workspace");
const NoteAttachmentUploader_1 = require("./NoteAttachmentUploader");
function getThriftPlugin(resourceManager, offlineContentStrategy) {
    return {
        name: 'ThriftPlugins',
        defineMutators: () => {
            const mutators = {};
            Users_1.addUserMutators(mutators);
            SyncState_1.addSyncStateMutators(mutators);
            NoteThriftQueries_1.addNoteMutators(mutators, offlineContentStrategy);
            MarkedForOffline_1.addMarkedForOfflineMutators(mutators, resourceManager, offlineContentStrategy);
            return mutators;
        },
        defineQueries: () => {
            const queries = {};
            Workspace_1.addWorkspaceQueries(queries);
            Users_1.addUserRequestQueries(queries);
            SyncState_1.addSyncStateQueries(queries);
            return queries;
        },
        defineFileUploaderOverrides: () => {
            return {
                Note: new NoteAttachmentUploader_1.NoteAttachmentUploader(),
            };
        },
    };
}
exports.getThriftPlugin = getThriftPlugin;
//# sourceMappingURL=ThriftPlugin.js.map