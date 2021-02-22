"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileUpdateBlockStatus = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
const Profile_1 = require("../NodeTypes/Profile");
exports.profileUpdateBlockStatus = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        profile: 'ID',
        blockStatus: 'boolean',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const profileEntity = await ctx.fetchEntity(trc, { id: params.profile, type: EntityConstants_1.CoreEntityTypes.Profile });
        if (!profileEntity) {
            throw new conduit_utils_1.NotFoundError(params.profile, `Not found profile ${params.profile}`);
        }
        if (profileEntity.NodeFields.internal_source !== Profile_1.PROFILE_SOURCE.User) {
            throw new conduit_utils_1.InvalidOperationError(`Can not update blocked status for identity ${params.profile}`);
        }
        if (!profileEntity.NodeFields.isConnected) {
            throw new conduit_utils_1.InvalidOperationError(`Can not update blocked status for not connected ${params.profile}`);
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: profileEntity,
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Profile, {
                        isBlocked: params.blockStatus,
                    }),
                }],
        };
        return plan;
    },
};
//# sourceMappingURL=ProfileMutators.js.map