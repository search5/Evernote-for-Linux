"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationIndexConfig = exports.invitationTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.invitationTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Invitation,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        created: 'timestamp?',
        snippet: 'string',
        invitationType: ['UNKNOWN', 'NOTE', 'NOTEBOOK'],
        internal_attachment: {
            guid: 'string',
            shardId: 'string',
            type: 'string',
            title: 'string',
            snippet: 'string',
            noteStoreUrl: 'string',
            userId: 'number',
            webApiUrlPrefix: 'string',
        },
    },
    edges: {
        sharer: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
        owner: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
    },
};
exports.invitationIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.invitationTypeDef, {
    indexResolvers: {
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.invitationTypeDef, ['NodeFields', 'created']),
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.invitationTypeDef, ['label']),
    },
    indexes: {
        created: {
            index: [
                { field: 'created', order: 'DESC', isMatchField: false },
            ],
        },
        label: {
            index: [
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
    },
    queries: {
        InvitationsForMe: {
            params: {
                orderBy: {
                    sort: {
                        created: [{ field: 'created', order: 'DESC' }],
                        label: [{ field: 'label', order: 'ASC' }],
                    },
                },
            },
        },
    },
});
//# sourceMappingURL=Invitation.js.map