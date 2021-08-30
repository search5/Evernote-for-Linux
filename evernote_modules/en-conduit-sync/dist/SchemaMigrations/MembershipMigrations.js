"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMembershipMigrations = exports.updateMembershipsWithInvitedTime = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Migrations_1 = require("../SyncFunctions/Migrations");
async function updateMembershipsWithInvitedTime(trc, graphTransaction, params) {
    const membershipNodes = await graphTransaction.getGraphNodesByType(trc, null, en_core_entity_types_1.CoreEntityTypes.Membership);
    if (!membershipNodes.length) {
        return;
    }
    // filter out membership to get better progress updates
    const recipientIsMeMemberships = membershipNodes.filter(m => m === null || m === void 0 ? void 0 : m.NodeFields.recipientIsMe);
    for (let i = 0; i < recipientIsMeMemberships.length; i++) {
        const node = recipientIsMeMemberships[i];
        const parentRef = conduit_utils_1.firstStashEntry(node.inputs.parent);
        if (!parentRef || parentRef.srcType === en_core_entity_types_1.CoreEntityTypes.Workspace) {
            continue;
        }
        const recipient = conduit_utils_1.firstStashEntry(node.outputs.recipient);
        const sharer = conduit_utils_1.firstStashEntry(node.outputs.sharer);
        // no need to migrate nb created in business (self shared)
        if (!recipient || !sharer || recipient.dstID === sharer.dstID) {
            continue;
        }
        const ref = { id: node.id, type: node.type };
        const acceptedSharedID = en_thrift_connector_1.convertGuidToService(parentRef.srcID, parentRef.srcType);
        const invitationID = en_thrift_connector_1.convertGuidFromService(acceptedSharedID, 'Invitation');
        const invitation = await graphTransaction.getNode(trc, null, { id: invitationID, type: en_core_entity_types_1.CoreEntityTypes.Invitation });
        if (invitation) {
            await graphTransaction.updateNode(trc, params.syncContext, ref, { NodeFields: { invitedTime: invitation.NodeFields.created } });
        }
        if (i % 3 === 0) {
            // use round to manage ut coverage
            params.setProgress && params.setProgress(trc, Math.round(100 * i / recipientIsMeMemberships.length) / 100);
        }
    }
}
exports.updateMembershipsWithInvitedTime = updateMembershipsWithInvitedTime;
function registerMembershipMigrations() {
    // add migration to add new field for Membership
    Migrations_1.registerMigrationFunctionByName('Membership.invitedTime-1.29', async (trc, params) => {
        conduit_utils_1.logger.info('Membership adding new field: invitedTime 1.29');
        await params.syncEngine.transact(trc, 'SchemaMigration: Membership adding invitedTime - 1.29', async (graphTransaction) => {
            await updateMembershipsWithInvitedTime(trc, graphTransaction, params);
        });
    });
}
exports.registerMembershipMigrations = registerMembershipMigrations;
//# sourceMappingURL=MembershipMigrations.js.map