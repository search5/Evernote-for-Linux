"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSendToThread = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
const Profile_1 = require("./Helpers/Profile");
exports.messageSendToThread = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        thread: 'ID',
        content: 'string',
    },
    derivedParams: {
        creator: conduit_utils_1.NullableID,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        const profile = await Profile_1.getAccountProfileRef(trc, ctx);
        paramsOut.creator = profile === null || profile === void 0 ? void 0 : profile.id;
    },
    execute: async (trc, ctx, params) => {
        const threadNodeRef = { id: params.thread, type: EntityConstants_1.CoreEntityTypes.Thread };
        const threadEntity = await ctx.fetchEntity(trc, threadNodeRef);
        if (!threadEntity) {
            throw new conduit_utils_1.NotFoundError(params.thread, 'Not found Thread in a message creation process');
        }
        const owner = threadNodeRef;
        const messageGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Message);
        const messageID = messageGenID[1];
        const messageEntity = ctx.createEntity({ id: messageID, type: EntityConstants_1.CoreEntityTypes.Message }, {
            label: params.content,
            creator: params.creator,
            created: ctx.timestamp,
            supportedForWorkChat: true,
        });
        const plan = {
            results: {
                result: messageID,
            },
            ops: [
                {
                    changeType: 'Node:CREATE',
                    node: messageEntity,
                    id: messageGenID,
                    remoteFields: { threadID: params.thread },
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: params.thread, srcType: EntityConstants_1.CoreEntityTypes.Thread, srcPort: 'messages',
                            dstID: messageID, dstType: EntityConstants_1.CoreEntityTypes.Message, dstPort: 'thread',
                        }],
                }, {
                    changeType: 'Node:UPDATE',
                    nodeRef: threadNodeRef,
                    node: ctx.assignFields(threadNodeRef.type, {
                        internal_maxMessageID: messageID,
                        maxMessageID: messageID,
                        maxReadMessageID: messageID,
                        lastMessageSentAt: ctx.timestamp,
                    }),
                },
            ],
        };
        return plan;
    },
};
//# sourceMappingURL=MessageMutators.js.map