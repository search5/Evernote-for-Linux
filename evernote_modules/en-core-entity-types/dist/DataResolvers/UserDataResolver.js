"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDataResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
// TODO: remove this file in a few months when we feel that most clients have safely migrated
// and new prebuiltDBs exist
async function UserDataResolver(context, node) {
    var _a;
    conduit_core_1.validateDB(context);
    const user = !conduit_storage_1.isGraphNode(node) ? await context.db.getNode(context, node) : node;
    if (user === null) {
        throw new Error('Missing user sent to data resolver');
    }
    const serviceLevelV1 = user.NodeFields.serviceLevel;
    if (conduit_utils_1.isNullish((_a = user.NodeFields) === null || _a === void 0 ? void 0 : _a.serviceLevelV2)) {
        const serviceLevelV2 = en_conduit_sync_types_1.toServiceLevelV2(serviceLevelV1);
        return await context.db.transactSyncedStorage(context.trc, 'meUpdater', async (graphTransaction) => {
            return await graphTransaction.updateNode(context.trc, user.syncContexts[0], node, { NodeFields: { serviceLevelV2 } });
        });
    }
    return user;
}
exports.UserDataResolver = UserDataResolver;
//# sourceMappingURL=UserDataResolver.js.map