"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedSearchDelete = exports.savedSearchSetQuery = exports.savedSearchSetLabel = exports.savedSearchCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const AccountLimits_1 = require("../AccountLimits");
const EntityConstants_1 = require("../EntityConstants");
exports.savedSearchCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        label: 'string',
        query: 'string',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        // Check account limit
        const limits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        if (!limits) {
            throw new conduit_utils_1.NotFoundError(AccountLimits_1.ACCOUNT_LIMITS_REF.id, 'Missing limits');
        }
        const count = limits.NodeFields.Counts.userSavedSearchesCount;
        const max = limits.NodeFields.Limits.userSavedSearchesMax;
        if (count >= max) {
            // TODO: make errors use actual fields once conduit errors are fully separated from thrift errors
            new conduit_utils_1.ServiceError('LIMIT_REACHED', EntityConstants_1.CoreEntityTypes.SavedSearch, 'type=LIMIT_REACHED thriftExceptionParameter=SavedSearch limit=userSavedSearchesMax');
        }
        // SavedSearch is always in the user account, not the vault
        const owner = ctx.userID;
        const savedSearchGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.SavedSearch);
        const savedSearchID = savedSearchGenID[1];
        const savedSearchEntity = ctx.createEntity({ id: savedSearchID, type: EntityConstants_1.CoreEntityTypes.SavedSearch }, {
            label: params.label,
            query: params.query,
        });
        const plan = {
            result: savedSearchID,
            ops: [{
                    changeType: 'Node:CREATE',
                    node: savedSearchEntity,
                    id: savedSearchGenID,
                    remoteFields: {},
                }],
        };
        if (params.label) {
            ctx.updateAnalytics({
                createSavedSearch: {
                    category: 'search',
                    action: 'create-saved-search',
                    label: params.eventLabel,
                    dimensions: {
                        ['search-session-id']: savedSearchID,
                    },
                },
            });
        }
        return plan;
    },
};
exports.savedSearchSetLabel = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        search: 'ID',
        label: 'string',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const searchRef = { id: params.search, type: EntityConstants_1.CoreEntityTypes.SavedSearch };
        const search = await ctx.fetchEntity(trc, searchRef);
        if (!search) {
            throw new conduit_utils_1.NotFoundError(searchRef.id, 'Missing search for setting label');
        }
        const fields = {
            label: params.label,
        };
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: searchRef,
                    node: ctx.assignFields(searchRef.type, fields),
                }],
        };
        return plan;
    },
};
exports.savedSearchSetQuery = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        search: 'ID',
        query: 'string',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const searchRef = { id: params.search, type: EntityConstants_1.CoreEntityTypes.SavedSearch };
        const search = await ctx.fetchEntity(trc, searchRef);
        if (!search) {
            throw new conduit_utils_1.NotFoundError(searchRef.id, 'Missing search for setting query');
        }
        const fields = {
            query: params.query,
        };
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: searchRef,
                    node: ctx.assignFields(searchRef.type, fields),
                }],
        };
        return plan;
    },
};
exports.savedSearchDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        search: 'ID',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        const searchRef = { id: params.search, type: EntityConstants_1.CoreEntityTypes.SavedSearch };
        const savedSearch = await ctx.fetchEntity(trc, searchRef);
        if (!savedSearch) {
            throw new conduit_utils_1.NotFoundError(params.search, 'Missing SavedSearch to delete');
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:DELETE',
                    nodeRef: searchRef,
                }],
        };
        ctx.updateAnalytics({
            createSavedSearch: {
                category: 'search',
                action: 'delete-saved-search',
                label: params.eventLabel,
                dimensions: {
                    ['search-session-id']: searchRef.id,
                },
            },
        });
        return plan;
    },
};
//# sourceMappingURL=SavedSearchMutators.js.map