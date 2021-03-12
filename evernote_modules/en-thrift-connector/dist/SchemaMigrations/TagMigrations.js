"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
// import { GraphTransactionContext, NodeID } from 'conduit-storage';
// import { logger, Stash, TracingContext } from 'conduit-utils';
// import { CoreEntityTypes, PROFILE_SOURCE, Tag } from 'en-core-entity-types';
// import { convertGuidFromService } from '../Converters/Converters';
// import { getBestSyncContextForNode } from '../Helpers';
// import { registerMigrationFunctionByName } from '../SyncFunctions/Migrations';
// import { SyncParams } from '../SyncFunctions/SyncHelpers';
// import { ThriftSyncContextMetadata } from '../ThriftSyncEngine';
// export async function updateTagOwner(
//   trc: TracingContext,
//   graphTransaction: GraphTransactionContext<ThriftSyncContextMetadata>,
//   params: SyncParams,
// ) {
//   const tagNodes = await graphTransaction.getGraphNodesByType<Tag>(trc, null, CoreEntityTypes.Tag);
//   const ProfileIDCache: Stash<NodeID> = {};
//   for (let i = 0; i < tagNodes.length; i++) {
//     const tagNode = tagNodes[i];
//     const syncContext = await getBestSyncContextForNode(trc, tagNode, null, graphTransaction);
//     let profileID: NodeID;
//     if (ProfileIDCache[syncContext]) {
//       profileID = ProfileIDCache[syncContext];
//     } else {
//       const syncContextMetaData = await graphTransaction.getSyncContextMetadata(trc, null, syncContext);
//       profileID = convertGuidFromService(
//         syncContextMetaData?.userID || params.vaultUserID || params.personalUserID,
//         CoreEntityTypes.Profile,
//         PROFILE_SOURCE.User,
//       );
//       ProfileIDCache[syncContext] = profileID;
//     }
//     const edge = {
//       srcID: profileID,
//       srcType: CoreEntityTypes.Profile,
//       srcPort: 'tags',
//       dstID: tagNode.id,
//       dstType: tagNode.type,
//       dstPort: 'owner',
//     };
//     await graphTransaction.replaceEdges(trc, [], [ edge ]);
//     if (i % 3 === 0) {
//       // use round to manage ut coverage
//       params.setProgress && params.setProgress(trc, Math.round(100 * i / tagNodes.length) / 100);
//     }
//   }
// }
// export function registerTagMigrations() {
//   // add migration to add new edge to Tag
//   registerMigrationFunctionByName('Tag.owner-1.30', async (trc: TracingContext, params: SyncParams) => {
//     logger.info('Tag adding new edge: owner 1.30');
//     await params.syncEngine.transact(trc, 'SchemaMigration: Tag adding edge: owner - 1.30', async graphTransaction => {
//       await updateTagOwner(trc, graphTransaction, params);
//     });
//   });
// }
//# sourceMappingURL=TagMigrations.js.map