"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.membershipDelete = exports.membershipUpdatePrivilege = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const EntityConstants_1 = require("../EntityConstants");
exports.membershipUpdatePrivilege = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        membership: 'ID',
        privilege: en_conduit_sync_types_1.MembershipPrivilegeSchema,
    },
    execute: async (trc, ctx, params) => {
        const membershipRef = { id: params.membership, type: EntityConstants_1.CoreEntityTypes.Membership };
        const membershipEntity = await ctx.fetchEntity(trc, membershipRef);
        if (!membershipEntity) {
            throw new conduit_utils_1.NotFoundError(params.membership, 'Not found Membership node');
        }
        return {
            results: {},
            ops: [
                {
                    changeType: 'Node:UPDATE',
                    nodeRef: membershipRef,
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Membership, { privilege: params.privilege }),
                },
            ],
        };
    },
};
exports.membershipDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        membership: 'ID',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const membershipRef = { id: params.membership, type: EntityConstants_1.CoreEntityTypes.Membership };
        const membershipEntity = await ctx.fetchEntity(trc, membershipRef);
        if (!membershipEntity) {
            throw new conduit_utils_1.NotFoundError(params.membership, 'Not found Membership node');
        }
        return {
            command: 'RemoveMembership',
            nodeType: EntityConstants_1.CoreEntityTypes.Membership,
            params,
            owner: membershipRef,
        };
    },
};
//# sourceMappingURL=MembershipMutators.js.map