"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacePinnedContentsResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const graphql_1 = require("graphql");
const Auth_1 = require("../Auth");
const Converters_1 = require("../Converters/Converters");
const WorkspaceConverter_1 = require("../Converters/WorkspaceConverter");
const PINNED_CONTENTS_RETRY_TIME = 15 * conduit_utils_1.MILLIS_IN_ONE_SECOND;
function WorkspacePinnedContentsResolver() {
    async function resolveWorkspacePinnedContents(workspaceID, context) {
        conduit_core_1.validateDB(context);
        context.watcher && context.watcher.triggerAfterTime(PINNED_CONTENTS_RETRY_TIME);
        const res = await context.db.getNodeCachedField(context, { id: workspaceID, type: en_core_entity_types_1.CoreEntityTypes.Workspace }, WorkspaceConverter_1.PINNED_CONTENTS_FIELD_NAME, async (node, syncContext) => {
            const metadata = await context.db.getSyncContextMetadata(context, syncContext);
            if (!metadata) {
                throw new conduit_utils_1.NotFoundError(node.id, `Not found sync information for current workspace`);
            }
            const auth = Auth_1.decodeAuthData(metadata.authToken);
            const utilityStore = context.thriftComm.getUtilityStore(auth.urls.utilityUrl);
            const pinnedContentsFromServer = await utilityStore.listPinnedContent(context.trc, auth.token, Converters_1.convertGuidToService(node.id, en_core_entity_types_1.CoreEntityTypes.Workspace));
            const pinnedContents = [];
            for (const pContent of pinnedContentsFromServer) {
                const convertResult = WorkspaceConverter_1.convertPinnedContentFromService(pContent);
                if (convertResult) {
                    pinnedContents.push(convertResult);
                }
            }
            await context.db.transactSyncedStorage(context.trc, 'WorkspacePinnedContentsResolver', async (tx) => {
                await tx.setNodeCachedField(context.trc, node, WorkspaceConverter_1.PINNED_CONTENTS_FIELD_NAME, pinnedContents, {});
            });
            return pinnedContents;
        });
        return res !== null && res !== void 0 ? res : [];
    }
    return {
        'Workspace.pinnedContents': autoResolverData => {
            const configMap = {};
            for (const field in en_core_entity_types_1.pinnedContentDef) {
                conduit_core_1.schemaFieldToGraphQL(autoResolverData, configMap, field, en_core_entity_types_1.pinnedContentDef[field], 'pinnedContents', [en_core_entity_types_1.CoreEntityTypes.Note, en_core_entity_types_1.CoreEntityTypes.Notebook]);
            }
            return {
                type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
                    name: 'PinnedContent',
                    fields: configMap,
                })))),
                resolve: async (nodeRef, _, context) => {
                    return resolveWorkspacePinnedContents(nodeRef.id, context);
                },
            };
        },
    };
}
exports.WorkspacePinnedContentsResolver = WorkspacePinnedContentsResolver;
//# sourceMappingURL=WorkspacePinnedContentsResolver.js.map