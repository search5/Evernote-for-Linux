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
const MutatorHelpers_1 = require("./MutatorHelpers");
exports.savedSearchCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        label: 'string',
        query: 'string',
        eventLabel: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        // Check account limit
        const limits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        MutatorHelpers_1.validateAccountLimits(limits, { userSavedSearchesCountChange: 1 });
        // SavedSearch is always in the user account, not the vault
        const owner = ctx.userID;
        const savedSearchGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.SavedSearch);
        const savedSearchID = savedSearchGenID[1];
        const savedSearchEntity = ctx.createEntity({ id: savedSearchID, type: EntityConstants_1.CoreEntityTypes.SavedSearch }, {
            label: params.label,
            query: params.query,
        });
        const plan = {
            results: {
                result: savedSearchID,
            },
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
    params: {
        search: 'ID',
        label: 'string',
    },
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
            results: {},
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
    params: {
        search: 'ID',
        query: 'string',
    },
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
            results: {},
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
    params: {
        search: 'ID',
        eventLabel: conduit_utils_1.NullableString,
    },
    execute: async (trc, ctx, params) => {
        const searchRef = { id: params.search, type: EntityConstants_1.CoreEntityTypes.SavedSearch };
        const savedSearch = await ctx.fetchEntity(trc, searchRef);
        if (!savedSearch) {
            throw new conduit_utils_1.NotFoundError(params.search, 'Missing SavedSearch to delete');
        }
        const plan = {
            results: {},
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