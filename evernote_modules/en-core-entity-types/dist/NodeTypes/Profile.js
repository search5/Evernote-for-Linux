"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileIndexConfig = exports.profileTypeDef = exports.ProfileStatusSchema = exports.ProfileStatusEnum = exports.PROFILE_SOURCE = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
var PROFILE_SOURCE;
(function (PROFILE_SOURCE) {
    PROFILE_SOURCE["User"] = "USR";
    PROFILE_SOURCE["Identity"] = "IDN";
    PROFILE_SOURCE["Contact"] = "CON";
})(PROFILE_SOURCE = exports.PROFILE_SOURCE || (exports.PROFILE_SOURCE = {}));
var ProfileStatusEnum;
(function (ProfileStatusEnum) {
    ProfileStatusEnum["ACTIVE"] = "ACTIVE";
    ProfileStatusEnum["INACTIVE"] = "INACTIVE";
})(ProfileStatusEnum = exports.ProfileStatusEnum || (exports.ProfileStatusEnum = {}));
exports.ProfileStatusSchema = conduit_utils_1.Enum(ProfileStatusEnum, 'ProfileStatus');
exports.profileTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Profile,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        email: 'string',
        photoLastUpdated: conduit_utils_1.NullableTimestamp,
        photoUrl: 'url',
        name: 'string',
        username: 'string',
        rootID: 'ID',
        isSameBusiness: 'boolean',
        isBlocked: conduit_utils_1.NullableBoolean,
        isConnected: 'boolean',
        internal_source: 'string',
        internal_userId: conduit_utils_1.NullableNumber,
        status: conduit_utils_1.Nullable(exports.ProfileStatusSchema),
    },
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.OPTIONAL,
            type: conduit_storage_1.EdgeType.LINK,
            from: {
                type: EntityConstants_1.CoreEntityTypes.Profile,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: 'relatedIdentities',
            },
        },
    },
};
exports.profileIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.profileTypeDef, {
    indexResolvers: {
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.profileTypeDef, ['label']),
        username: conduit_storage_1.getIndexByResolverForPrimitives(exports.profileTypeDef, ['NodeFields', 'username'], { useLocaleCompare: true }),
        isSameBusiness: conduit_storage_1.getIndexByResolverForPrimitives(exports.profileTypeDef, ['NodeFields', 'isSameBusiness']),
        isRootProfile: {
            schemaType: 'boolean',
            resolver: async (trc, node, _) => {
                return [node.NodeFields.rootID === node.id];
            },
            graphqlPath: ['isRootProfile'],
            isUnSyncedField: true,
        },
    },
    queries: {
        Profiles: {
            // only return root profiles
            filter: [{
                    ignoreForFiltering: true,
                    field: 'isRootProfile',
                    value: true,
                }],
            sort: [{ field: 'label', order: 'ASC' }, { field: 'username', order: 'ASC' }],
            params: {},
            includeFields: ['isSameBusiness'],
        },
    },
});
//# sourceMappingURL=Profile.js.map