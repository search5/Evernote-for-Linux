"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.threadIndexConfig = exports.threadTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.threadTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Thread,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        snippet: 'string',
        lastMessageSentAt: 'timestamp',
        groupThread: 'boolean',
        maxMessageID: 'ID?',
        maxReadMessageID: 'ID?',
        maxDeletedMessageID: 'ID?',
        internal_participantsID: 'string',
        internal_maxReadMessageID: 'ID?',
        internal_maxMessageID: 'ID?',
    },
    edges: {
        participants: {
            constraint: conduit_storage_1.EdgeConstraint.MANY,
            type: conduit_storage_1.EdgeType.VIEW,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
    },
};
exports.threadIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.threadTypeDef, {
    indexResolvers: {
        lastMessageSentAt: conduit_storage_1.getIndexByResolverForPrimitives(exports.threadTypeDef, ['NodeFields', 'lastMessageSentAt']),
    },
    queries: {
        Threads: {
            sort: [{ field: 'lastMessageSentAt', order: 'DESC' }],
            params: {},
        },
    },
});
//# sourceMappingURL=Thread.js.map