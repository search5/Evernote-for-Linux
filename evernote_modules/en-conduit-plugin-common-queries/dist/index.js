"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlugin = void 0;
const CEDataForTemplates_1 = require("./CEDataForTemplates");
const DashboardsData_1 = require("./DashboardsData");
const DataForQualtrics_1 = require("./DataForQualtrics");
const NoteLock_1 = require("./NoteLock");
const PendingMutations_1 = require("./PendingMutations");
const PublishedNotebookList_1 = require("./PublishedNotebookList");
const SendMarketingEmail_1 = require("./SendMarketingEmail");
const SendVerificationEmail_1 = require("./SendVerificationEmail");
const SharedWithMe_1 = require("./SharedWithMe");
const StackedNotebookList_1 = require("./StackedNotebookList");
const TagHierarchy_1 = require("./Tags/TagHierarchy");
const TagsAllowed_1 = require("./Tags/TagsAllowed");
const WorkspaceDirectory_1 = require("./WorkspaceDirectory");
function getPlugin(thriftComm, offlineContentStrategy) {
    const notelockPlugin = NoteLock_1.getNoteLockPlugin(thriftComm, offlineContentStrategy);
    const publishedNotebooksPlugin = PublishedNotebookList_1.getPublishedNotebookPlugin(thriftComm);
    return {
        name: 'CommonQueries',
        defineMutators: () => ({
            notelockAcquire: notelockPlugin.mutators.notelockAcquire,
            notelockRelease: notelockPlugin.mutators.notelockRelease,
            sendMarketingEmail: SendMarketingEmail_1.getSendMarketingEmailPlugin(thriftComm),
            sendVerificationEmail: SendVerificationEmail_1.getSendVerificationEmailPlugin(thriftComm),
            notebookPublish: publishedNotebooksPlugin.mutations.notebookPublish,
            notebookJoin: publishedNotebooksPlugin.mutations.notebookJoin,
        }),
        defineQueries: () => {
            const out = {
                AllTagsWithHierarchy: TagHierarchy_1.tagHierarchyPlugin,
                CEDataForTemplates: CEDataForTemplates_1.ceDataForTemplatesPlugin(thriftComm),
                DashboardsData: DashboardsData_1.dashboardsDataPlugin,
                DataForQualtrics: DataForQualtrics_1.dataForQualtricsPlugin(thriftComm),
                HasPendingMutations: PendingMutations_1.hasPendingMutationsPlugin,
                notelockStatus: notelockPlugin.queries.notelockStatus,
                SharedWithMe: SharedWithMe_1.sharedWithMePlugin,
                StackedNotebookList: StackedNotebookList_1.getStackedNotebookListPlugin(),
                TagsAllowed: TagsAllowed_1.tagsAllowedPlugin,
                WorkspaceDirectory: WorkspaceDirectory_1.workspaceDirectoryPlugin(thriftComm),
                PublishedNotebookList: publishedNotebooksPlugin.queries.PublishedNotebookList,
            };
            return out;
        },
    };
}
exports.getPlugin = getPlugin;
//# sourceMappingURL=index.js.map