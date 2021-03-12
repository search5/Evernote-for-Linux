"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionMarkShown = exports.promotionOptOut = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
exports.promotionOptOut = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        promotion: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.promotion, type: EntityConstants_1.CoreEntityTypes.Promotion };
        const node = await ctx.fetchEntity(trc, nodeRef);
        if (!node) {
            throw new conduit_utils_1.NotFoundError(params.promotion, `Failed to find Promotion node ${params.promotion}`);
        }
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Promotion, { optedOut: true }),
                    nodeRef,
                }],
        };
        return plan;
    },
};
exports.promotionMarkShown = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        promotion: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const nodeRef = { id: params.promotion, type: EntityConstants_1.CoreEntityTypes.Promotion };
        const node = await ctx.fetchEntity(trc, nodeRef);
        if (!node) {
            throw new conduit_utils_1.NotFoundError(params.promotion, `Failed to find Promotion node ${params.promotion}`);
        }
        const fields = {
            shownCount: node.NodeFields.shownCount + 1,
            timeLastShown: ctx.timestamp,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Promotion, fields),
                    nodeRef,
                }],
        };
        return plan;
    },
};
//# sourceMappingURL=PromotionMutators.js.map