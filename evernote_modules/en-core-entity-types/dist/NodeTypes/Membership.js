"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.membershipIndexConfig = exports.membershipTypeDef = exports.MembershipRecipientType = exports.MembershipRecipientTypeSchema = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
const MembershipPrivilege_1 = require("../MembershipPrivilege");
exports.MembershipRecipientTypeSchema = ['USER', 'IDENTITY', 'EMAIL', 'BUSINESS'];
var MembershipRecipientType;
(function (MembershipRecipientType) {
    MembershipRecipientType["USER"] = "USER";
    MembershipRecipientType["IDENTITY"] = "IDENTITY";
    MembershipRecipientType["EMAIL"] = "EMAIL";
    MembershipRecipientType["BUSINESS"] = "BUSINESS";
})(MembershipRecipientType = exports.MembershipRecipientType || (exports.MembershipRecipientType = {}));
exports.membershipTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Membership,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        privilege: Object.values(MembershipPrivilege_1.MembershipPrivilege),
        recipientType: exports.MembershipRecipientTypeSchema,
        recipientIsMe: 'boolean',
        created: 'timestamp',
        updated: 'timestamp',
        invitedTime: 'timestamp?',
        internal_sharedNotebookID: 'int?',
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.MEMBERSHIP,
            from: {
                type: [EntityConstants_1.CoreEntityTypes.Workspace, EntityConstants_1.CoreEntityTypes.Notebook, EntityConstants_1.CoreEntityTypes.Note],
                constraint: conduit_storage_1.EdgeConstraint.MANY,
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
                        created: [{ field: 'created', order: 'DESC' }],
                        label: [{ field: 'label', order: 'ASC' }],
                    },
                },
            },
            includeFields: ['label'],
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
            includeFields: ['label'],
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
            includeFields: ['label'],
        },
    },
});
//# sourceMappingURL=Membership.js.map