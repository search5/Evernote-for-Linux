"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.membershipIndexConfig = exports.membershipTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const EntityConstants_1 = require("../EntityConstants");
exports.membershipTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Membership,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        privilege: en_conduit_sync_types_1.MembershipPrivilegeSchema,
        recipientType: conduit_utils_1.Enum(en_conduit_sync_types_1.MembershipRecipientType, 'MembershipRecipientType'),
        recipientIsMe: 'boolean',
        created: 'timestamp',
        updated: 'timestamp',
        invitedTime: conduit_utils_1.NullableTimestamp,
        internal_sharedNotebookID: conduit_utils_1.NullableInt,
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.MEMBERSHIP,
            from: {
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                type: [],
                // TODO switch to traversalQuery using MembershipsInParent, when we are ready to take the client conversion hit
                denormalize: 'memberships',
            },
        },
        sharer: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
        owner: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
        recipient: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.LINK,
            to: EntityConstants_1.CoreEntityTypes.Profile,
        },
    },
};
exports.membershipIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.membershipTypeDef, {
    indexResolvers: {
        created: conduit_storage_1.getIndexByResolverForPrimitives(exports.membershipTypeDef, ['NodeFields', 'created']),
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.membershipTypeDef, ['label']),
        invitedTime: conduit_storage_1.getIndexByResolverForPrimitives(exports.membershipTypeDef, ['NodeFields', 'invitedTime']),
        recipientIsMe: conduit_storage_1.getIndexByResolverForPrimitives(exports.membershipTypeDef, ['NodeFields', 'recipientIsMe']),
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.membershipTypeDef, ['edges', 'parent']),
    },
    indexes: {
        label: {
            index: [
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
        created: {
            index: [
                { field: 'recipientIsMe', order: 'ASC', isMatchField: true },
                { field: 'created', order: 'DESC', isMatchField: false },
            ],
        },
        recipientIsMe: {
            index: [
                { field: 'recipientIsMe', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
    },
    queries: {
        MembershipsForMe: {
            filter: [{
                    field: 'recipientIsMe',
                    value: true,
                }],
            params: {
                orderBy: {
                    sort: {
                        invitedTime: [{ field: 'invitedTime', order: 'DESC' }],
                        created: [{ field: 'created', order: 'DESC' }],
                        label: [{ field: 'label', order: 'ASC' }],
                    },
                },
            },
        },
        MembershipsInParent: {
            // TODO this will replace the memberships denormalization some day
            traversalName: 'allMemberships',
            params: {
                parent: {
                    match: { field: 'parent' },
                },
                orderBy: {
                    sort: {
                        created: [{ field: 'created', order: 'DESC' }],
                        label: [{ field: 'label', order: 'ASC' }],
                    },
                },
            },
        },
        MembershipsForMeInParent: {
            traversalName: 'ownMemberships',
            filter: [{
                    field: 'recipientIsMe',
                    value: true,
                }],
            params: {
                parent: {
                    match: { field: 'parent' },
                },
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
//# sourceMappingURL=Membership.js.map