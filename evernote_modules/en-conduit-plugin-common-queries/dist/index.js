"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonQueryPlugin = void 0;
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
function getCommonQueryPlugin() {
    const notelockPlugin = NoteLock_1.getNoteLockPlugin();
    const publishedNotebooksPlugin = PublishedNotebookList_1.getPublishedNotebookPlugin();
    return {
        name: 'CommonQueries',
        defineMutators: () => ({
            notelockAcquire: notelockPlugin.mutators.notelockAcquire,
            notelockRelease: notelockPlugin.mutators.notelockRelease,
            sendMarketingEmail: SendMarketingEmail_1.sendMarketingEmailPlugin,
            sendVerificationEmail: SendVerificationEmail_1.sendVerificationEmailPlugin,
        }),
        defineQueries: () => {
            const out = {
                AllTagsWithHierarchy: TagHierarchy_1.tagHierarchyPlugin,
                CEDataForTemplates: CEDataForTemplates_1.ceDataForTemplatesPlugin,
                DashboardsData: DashboardsData_1.dashboardsDataPlugin,
                DataForQualtrics: DataForQualtrics_1.dataForQualtricsPlugin,
                HasPendingMutations: PendingMutations_1.hasPendingMutationsPlugin,
                notelockStatus: notelockPlugin.queries.notelockStatus,
                SharedWithMe: SharedWithMe_1.sharedWithMePlugin,
                StackedNotebookList: StackedNotebookList_1.stackedNotebookListPlugin,
                TagsAllowed: TagsAllowed_1.tagsAllowedPlugin,
                WorkspaceDirectory: WorkspaceDirectory_1.workspaceDirectoryPlugin,
                PublishedNotebookList: publishedNotebooksPlugin.queries.PublishedNotebookList,
            };
            return out;
        },
    };
}
exports.getCommonQueryPlugin = getCommonQueryPlugin;
//# sourceMappingURL=index.js.map