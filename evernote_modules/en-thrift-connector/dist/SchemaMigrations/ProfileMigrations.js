"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProfileMigrations = void 0;
const conduit_utils_1 = require("conduit-utils");
const MessageAttachmentConverter_1 = require("../Converters/MessageAttachmentConverter");
const Migrations_1 = require("../SyncFunctions/Migrations");
const SyncHelpers_1 = require("../SyncFunctions/SyncHelpers");
function registerProfileMigrations() {
    // add migration to update all profiles with blocked status
    Migrations_1.registerMigrationFunctionByName('BlockedProfile-1.12', async (trc, params) => {
        var _a;
        conduit_utils_1.logger.info('Profile fix up function 1.12');
        const threads = await params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl).getThreads(trc, params.personalAuth.token);
        const idsToUpdate = (_a = threads.identities) !== null && _a !== void 0 ? _a : [];
        if (!idsToUpdate.length) {
            return;
        }
        await params.syncEngine.transact(trc, 'SchemaMigration: BlockedProfile-1.12', async (graphTransaction) => {
            const converterParams = await SyncHelpers_1.getConverterParamsFromSyncParams(trc, graphTransaction, params);
            for (const update of idsToUpdate) {
                await MessageAttachmentConverter_1.addNewIdentity(trc, converterParams, params.syncContext, update);
            }
        });
    });
}
exports.registerProfileMigrations = registerProfileMigrations;
//# sourceMappingURL=ProfileMigrations.js.map