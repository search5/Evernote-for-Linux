"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.threadValidateRecipients = exports.threadDelete = exports.threadUpdateReadStatus = exports.threadCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
exports.threadCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        message: 'string',
    },
    optionalParams: {
        participants: 'ID[]',
        emails: 'string[]',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return {
            command: 'CreateThread',
            nodeType: EntityConstants_1.CoreEntityTypes.Thread,
            params,
            owner: ctx.userID,
        };
    },
};
exports.threadUpdateReadStatus = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        thread: 'ID',
    },
    optionalParams: {},
    derivedParams: {
        maxInternalMessage: 'ID?',
        maxMessage: 'ID?',
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        const threadEntity = await ctx.fetchEntity(trc, { id: paramsIn.thread, type: EntityConstants_1.CoreEntityTypes.Thread });
        if (!threadEntity) {
            throw new conduit_utils_1.NotFoundError(paramsIn.thread, `Not found Thread ${paramsIn.thread}`);
        }
        paramsOut.maxInternalMessage = threadEntity.NodeFields.internal_maxMessageID;
        paramsOut.maxMessage = threadEntity.NodeFields.maxMessageID;
    },
    execute: async (trc, ctx, params) => {
        const threadEntity = await ctx.fetchEntity(trc, { id: params.thread, type: EntityConstants_1.CoreEntityTypes.Thread });
        if (!threadEntity) {
            throw new conduit_utils_1.NotFoundError(params.thread, `Not found Thread ${params.thread}`);
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: threadEntity,
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Thread, {
                        internal_maxReadMessageID: params.maxInternalMessage,
                        maxReadMessageID: params.maxMessage,
                    }),
                }],
        };
        return plan;
    },
};
exports.threadDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        thread: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const threadEntity = await ctx.fetchEntity(trc, { id: params.thread, type: EntityConstants_1.CoreEntityTypes.Thread });
        if (!threadEntity) {
            throw new conduit_utils_1.NotFoundError(params.thread, `Not found Thread ${params.thread}`);
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:DELETE',
                    nodeRef: threadEntity,
                }],
        };
        return plan;
    },
};
exports.threadValidateRecipients = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {},
    optionalParams: {
        participants: 'ID[]',
        emails: 'string[]',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return {
            command: 'validateThreadRecipients',
            nodeType: EntityConstants_1.CoreEntityTypes.Thread,
            params,
            owner: ctx.userID,
        };
    },
};
//# sourceMappingURL=ThreadMutators.js.map