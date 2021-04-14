"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserMigrations = exports.updateUserWithServiceLevelV2 = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const UserConverter_1 = require("../Converters/UserConverter");
const Migrations_1 = require("../SyncFunctions/Migrations");
async function updateUserWithServiceLevelV2(trc, graphTransaction, params) {
    const personalUserRef = { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User };
    const vaultUserRef = { id: conduit_core_1.VAULT_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User };
    const personalUser = await graphTransaction.getNode(trc, null, personalUserRef);
    const vaultUser = await graphTransaction.getNode(trc, null, vaultUserRef);
    if (personalUser) {
        const serviceLevelV2 = UserConverter_1.toServiceLevelV2(personalUser.NodeFields.serviceLevel);
        await graphTransaction.updateNode(trc, conduit_core_1.PERSONAL_USER_CONTEXT, personalUserRef, { NodeFields: { serviceLevelV2 } });
    }
    params.setProgress && params.setProgress(trc, 0.5);
    if (vaultUser) {
        const serviceLevelV2 = UserConverter_1.toServiceLevelV2(vaultUser.NodeFields.serviceLevel);
        await graphTransaction.updateNode(trc, conduit_core_1.VAULT_USER_CONTEXT, vaultUserRef, { NodeFields: { serviceLevelV2 } });
    }
    params.setProgress && params.setProgress(trc, 1);
}
exports.updateUserWithServiceLevelV2 = updateUserWithServiceLevelV2;
function registerUserMigrations() {
    // add migration to add new field for Membership
    Migrations_1.registerMigrationFunctionByName('User.serviceLevelV2-1.32', async (trc, params) => {
        conduit_utils_1.logger.info('User adding new field: serviceLevelV2 1.32');
        await params.syncEngine.transact(trc, 'SchemaMigration: User adding serviceLevelV2 - 1.32', async (graphTransaction) => {
            await updateUserWithServiceLevelV2(trc, graphTransaction, params);
        });
    });
}
exports.registerUserMigrations = registerUserMigrations;
//# sourceMappingURL=UserMigrations.js.map