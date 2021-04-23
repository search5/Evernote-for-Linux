"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationIndexConfig = exports.invitationTypeDef = exports.InvitationTypeSchema = exports.InvitationType = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
var InvitationType;
(function (InvitationType) {
    InvitationType["UNKNOWN"] = "UNKNOWN";
    InvitationType["NOTE"] = "NOTE";
    InvitationType["NOTEBOOK"] = "NOTEBOOK";
})(InvitationType = exports.InvitationType || (exports.InvitationType = {}));
exports.InvitationTypeSchema = conduit_utils_1.Enum(InvitationType, 'InvitationType');
exports.invitationTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Invitation,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        created: conduit_utils_1.NullableTimestamp,
        snippet: 'string',
        invitationType: exports.InvitationTypeSchema,
        internal_attachment: conduit_utils_1.Struct({
            guid: conduit_utils_1.NullableString,
            shardId: conduit_utils_1.NullableString,
            type: conduit_utils_1.NullableNumber,
            title: conduit_utils_1.NullableString,
            snippet: conduit_utils_1.NullableString,
            noteStoreUrl: conduit_utils_1.NullableString,
            userId: conduit_utils_1.NullableNumber,
            webApiUrlPrefix: conduit_utils_1.NullableString,
        }),
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