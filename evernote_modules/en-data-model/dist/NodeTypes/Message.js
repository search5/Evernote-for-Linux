"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageIndexConfig = exports.messageTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.messageTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Message,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        created: 'timestamp',
        reshareMessage: 'boolean',
        creator: 'ID',
        hasAttachments: 'boolean',
        supportedForWorkChat: 'boolean',
    },
    edges: {
        thread: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: EntityConstants_1.CoreEntityTypes.Thread,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'messages',
            },
        },
        notes: {
            constraint: conduit_storage_1.EdgeConstraint.MANY,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Note,
        },
        notebooks: {
            constraint: conduit_storage_1.EdgeConstraint.MANY,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Notebook,
        },
    },
};
exports.messageIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.messageTypeDef, {
    indexResolvers: {
        thread: conduit_storage_1.getIndexByResolverForEdge(exports.messageTypeDef, ['edges', 'thread']),
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.messageTypeDef, ['NodeFields', 'created']),
        supportedForWorkChat: conduit_storage_1.getIndexByResolverForPrimitives(exports.messageTypeDef, ['NodeFields', 'supportedForWorkChat']),
    },
    indexes: {
        thread: {
            index: [
                { field: 'thread', order: 'ASC', isMatchField: true },
                { field: 'created', order: 'DESC', isMatchField: false },
            ],
            indexCondition: [{
                    ignoreForFiltering: true,
                    field: 'supportedForWorkChat',
                    value: true,
                }],
        },
    },
    queries: {
        MessagesInThread: {
            traversalName: 'childMessages',
            filter: [{
                    ignoreForFiltering: true,
                    field: 'supportedForWorkChat',
                    value: true,
                }],
            sort: [{ field: 'created', order: 'DESC' }],
            params: {
                thread: {
                    match: { field: 'thread' },
                },
            },
        },
    },
});
//# sourceMappingURL=Message.js.map