"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationAccept = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
exports.invitationAccept = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        invitation: 'ID',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const invitationRef = { id: params.invitation, type: EntityConstants_1.CoreEntityTypes.Invitation };
        const invitationEntity = await ctx.fetchEntity(trc, invitationRef);
        if (!invitationEntity) {
            throw new conduit_utils_1.NotFoundError(params.invitation, 'Not found Invitation node');
        }
        return {
            command: 'AcceptInvitation',
            nodeType: EntityConstants_1.CoreEntityTypes.Invitation,
            params,
            owner: invitationRef,
        };
    },
};
//# sourceMappingURL=InvitationMutators.js.map