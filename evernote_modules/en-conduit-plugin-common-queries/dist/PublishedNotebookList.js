"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedNotebookPlugin = exports.PublishedNotebookAccessStatusEnum = exports.PublishedNotebookAccessStatusEnumSchema = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
exports.PublishedNotebookAccessStatusEnumSchema = ['OPEN', 'MEMBER'];
var PublishedNotebookAccessStatusEnum;
(function (PublishedNotebookAccessStatusEnum) {
    PublishedNotebookAccessStatusEnum["OPEN"] = "OPEN";
    PublishedNotebookAccessStatusEnum["MEMBER"] = "MEMBER";
})(PublishedNotebookAccessStatusEnum = exports.PublishedNotebookAccessStatusEnum || (exports.PublishedNotebookAccessStatusEnum = {}));
function buildArgs() {
    return {
        limit: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
        },
        filters: {
            type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
                name: 'PublishedNotebookFilter',
                fields: {
                    field: { type: conduit_core_1.schemaToGraphQLType(['label', 'description'], 'PublishedNotebooksFilterField', false) },
                    search: { type: conduit_core_1.schemaToGraphQLType('string') },
                },
            })),
        },
        sort: {
            type: new graphql_1.GraphQLInputObjectType({
                name: `PublishedNotebookSort`,
                fields: {
                    field: { type: conduit_core_1.schemaToGraphQLType(['label', 'created', 'updated', 'accessStatus'], 'PublishedNotebooksSortField', false) },
                    order: { type: conduit_core_1.IndexOrderType },
                },
            }),
        },
    };
}
async function getAuthDataForSyncContext(context, syncContext) {
    const metadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!metadata || !metadata.authToken) {
        throw new Error('not authorized');
    }
    return en_thrift_connector_1.decodeAuthData(metadata.authToken);
}
async function fetchPublishedNotebooks(thriftComm, context) {
    conduit_core_1.validateDB(context);
    const businessAuth = await getAuthDataForSyncContext(context, conduit_core_1.VAULT_USER_CONTEXT);
    const notestore = thriftComm.getNoteStore(businessAuth.urls.noteStoreUrl);
    const results = await conduit_utils_1.allSettled([
        notestore.listPublishedBusinessNotebooks(context.trc, businessAuth.token),
        getPublishedNotebookCount(context.trc, thriftComm, businessAuth),
    ]);
    const notebooks = results[0];
    const publishedNBs = notebooks ? await conduit_utils_1.allSettled(notebooks.map(async (nb) => {
        var _a, _b;
        const notebook = en_thrift_connector_1.notebookObjectFromService(conduit_core_1.VAULT_USER_CONTEXT, nb);
        const access = ((_a = nb.recipientSettings) === null || _a === void 0 ? void 0 : _a.recipientStatus) !== en_conduit_sync_types_1.TRecipientStatus.NOT_IN_MY_LIST ?
            PublishedNotebookAccessStatusEnum.MEMBER : PublishedNotebookAccessStatusEnum.OPEN;
        let ownerID;
        if (nb.contact && nb.contact.id) {
            ownerID = en_thrift_connector_1.convertGuidFromService(nb.contact.id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
        }
        else {
            const metadata = await context.db.getSyncContextMetadata(context, conduit_core_1.VAULT_USER_CONTEXT);
            if (metadata) {
                ownerID = en_thrift_connector_1.convertGuidFromService(metadata.userID, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
            }
        }
        const workspaceID = nb.workspaceGuid && en_thrift_connector_1.convertGuidFromService(nb.workspaceGuid, en_core_entity_types_1.CoreEntityTypes.Workspace) || null;
        const membersCount = nb.sharedNotebookIds ? nb.sharedNotebookIds.length : 0;
        return {
            id: notebook.id,
            label: notebook.label,
            description: ((_b = nb.businessNotebook) === null || _b === void 0 ? void 0 : _b.notebookDescription) || '',
            created: notebook.NodeFields.created,
            updated: notebook.NodeFields.updated,
            workspaceID,
            membersCount,
            notesCount: results[1][nb.guid || ''] || 0,
            accessStatus: access,
            ownerID,
            businessNotebook: nb.businessNotebook,
        };
    })) : undefined;
    return publishedNBs || [];
}
function filterPublishedNotebooks(pns, filters) {
    if (!filters.length) {
        return pns;
    }
    const labelFilterIdx = filters.findIndex(e => e.field === 'label');
    const descriptionFilterIdx = filters.findIndex(e => e.field === 'description');
    return pns.filter(e => {
        return labelFilterIdx >= 0 && (filters[labelFilterIdx].search === '' || e.label.search(new RegExp(filters[labelFilterIdx].search, 'i')) !== -1) ||
            descriptionFilterIdx >= 0 && (filters[descriptionFilterIdx].search === '' || e.description.search(new RegExp(filters[descriptionFilterIdx].search, 'i')) !== -1);
    });
}
function sortPublishedNotebooks(pnbs, sort) {
    if (!sort) {
        return pnbs;
    }
    const getComparator = (sortField) => {
        const descendingFactor = sortField.order === 'ASC' ? 1 : -1;
        switch (sortField.field) {
            case 'created': return (nb1, nb2) => descendingFactor * (nb1.created - nb2.created);
            case 'updated': return (nb1, nb2) => descendingFactor * (nb1.updated - nb2.updated);
            case 'label': return (nb1, nb2) => descendingFactor * (nb1.label.localeCompare(nb2.label));
            case 'accessStatus': return (nb1, nb2) => descendingFactor * (nb1.accessStatus.localeCompare(nb2.accessStatus));
        }
    };
    return pnbs.sort(getComparator(sort));
}
async function getList(thriftComm, context, filters, limit) {
    const publishedNBs = await fetchPublishedNotebooks(thriftComm, context);
    const filteredPN = filterPublishedNotebooks(publishedNBs, filters);
    return limit ? filteredPN.slice(0, limit) : filteredPN;
}
async function getPublishedNotebookCount(trc, thriftComm, businessAuth) {
    const notestore = thriftComm.getNoteStore(businessAuth.urls.noteStoreUrl);
    const query = {
        includeNotebooks: false,
        includeNotesCounts: true,
        filter: {},
    };
    const result = await notestore.findInBusiness(trc, businessAuth.token, query);
    return result.totalNotesByNotebook || {};
}
function getPublishedNotebookPlugin() {
    async function resolvePublishedNotebookspace(parent, args, context) {
        conduit_core_1.validateDB(context);
        const sort = args.sort;
        const filters = args.filters || [];
        const list = await getList(context.thriftComm, context, filters, args === null || args === void 0 ? void 0 : args.limit);
        if (sort) {
            return sortPublishedNotebooks(list, sort);
        }
        return list;
    }
    async function notebookPublishResolver(parent, args = {}, context) {
        conduit_core_1.validateDB(context);
        const nbID = args.notebook;
        if (!args || !nbID) {
            throw new conduit_utils_1.MissingParameterError('missing notebook id');
        }
        const notebook = await context.db.getNode(context, { id: nbID, type: en_core_entity_types_1.CoreEntityTypes.Notebook });
        if (!notebook) {
            throw new conduit_utils_1.NotFoundError(nbID);
        }
        const businessAuth = await getAuthDataForSyncContext(context, conduit_core_1.VAULT_USER_CONTEXT);
        const serviceData = {
            guid: en_thrift_connector_1.convertGuidToService(nbID, en_core_entity_types_1.CoreEntityTypes.Notebook),
            name: notebook.label,
            published: true,
            businessNotebook: {
                privilege: args.privilegeLevel,
                recommended: Boolean(args.recommended),
                notebookDescription: args.description,
            },
        };
        const notestore = context.thriftComm.getNoteStore(businessAuth.urls.noteStoreUrl);
        await notestore.updateNotebookWithResultSpec(context.trc, businessAuth.token, serviceData, {
            includeNotebookRecipientSettings: false,
            includeNotebookRestrictions: false,
            includeSharedNotebooks: false,
        });
        return { success: true };
    }
    async function notebookJoinResolver(parent, args, context) {
        conduit_core_1.validateDB(context);
        const nbID = args === null || args === void 0 ? void 0 : args.notebook;
        if (!nbID) {
            throw new conduit_utils_1.MissingParameterError('missing notebook id');
        }
        const serviceGuid = en_thrift_connector_1.convertGuidToService(nbID, en_core_entity_types_1.CoreEntityTypes.Notebook);
        // for setNotebookRecipientSettings had to use personal auth
        const auth = await getAuthDataForSyncContext(context, conduit_core_1.PERSONAL_USER_CONTEXT);
        const authToken = auth.token;
        const noteStore = context.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const recipientSettings = new en_conduit_sync_types_1.TNotebookRecipientSettings({ recipientStatus: en_conduit_sync_types_1.TRecipientStatus.IN_MY_LIST });
        await noteStore.setNotebookRecipientSettings(context.trc, authToken, serviceGuid, recipientSettings);
        return { success: true };
    }
    return {
        queries: {
            PublishedNotebookList: {
                type: new graphql_1.GraphQLList(new graphql_1.GraphQLObjectType({
                    name: 'PublishedNotebookList',
                    fields: {
                        id: { type: conduit_core_1.schemaToGraphQLType('ID') },
                        label: { type: conduit_core_1.schemaToGraphQLType('string') },
                        description: { type: conduit_core_1.schemaToGraphQLType('string') },
                        workspaceID: { type: conduit_core_1.schemaToGraphQLType('ID?') },
                        created: { type: conduit_core_1.schemaToGraphQLType('number') },
                        updated: { type: conduit_core_1.schemaToGraphQLType('number') },
                        accessStatus: { type: conduit_core_1.schemaToGraphQLType(exports.PublishedNotebookAccessStatusEnumSchema, 'accessStatus') },
                        membersCount: { type: conduit_core_1.schemaToGraphQLType('number') },
                        ownerID: { type: conduit_core_1.schemaToGraphQLType('ID?') },
                        notesCount: { type: conduit_core_1.schemaToGraphQLType('number') },
                        businessNotebook: { type: new graphql_1.GraphQLObjectType({
                                name: 'BusinessNotebook',
                                fields: {
                                    notebookDescription: { type: conduit_core_1.schemaToGraphQLType('string') },
                                    privilege: { type: conduit_core_1.schemaToGraphQLType('number') },
                                    recommended: { type: conduit_core_1.schemaToGraphQLType('boolean') },
                                }
                            }),
                        },
                    },
                })),
                args: buildArgs(),
                resolve: resolvePublishedNotebookspace,
            },
        },
        mutations: {
            notebookPublish: {
                args: {
                    notebook: {
                        type: conduit_core_1.schemaToGraphQLType('string'),
                    },
                    description: {
                        type: conduit_core_1.schemaToGraphQLType('string'),
                    },
                    recommended: {
                        type: conduit_core_1.schemaToGraphQLType('boolean?'),
                    },
                    privilegeLevel: {
                        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
                            name: 'privilegeLevel',
                            values: {
                                READ_NOTEBOOK: { value: en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.READ_NOTEBOOK },
                                MODIFY_NOTEBOOK_PLUS_ACTIVITY: { value: en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.MODIFY_NOTEBOOK_PLUS_ACTIVITY },
                                READ_NOTEBOOK_PLUS_ACTIVITY: { value: en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.READ_NOTEBOOK_PLUS_ACTIVITY },
                                GROUP: { value: en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.GROUP },
                                FULL_ACCESS: { value: en_conduit_sync_types_1.TSharedNotebookPrivilegeLevel.FULL_ACCESS },
                            },
                        })),
                    },
                },
                type: conduit_core_1.GenericMutationResult,
                resolve: notebookPublishResolver,
            },
            notebookJoin: {
                args: {
                    notebook: {
                        type: conduit_core_1.schemaToGraphQLType('string'),
                    },
                },
                type: conduit_core_1.GenericMutationResult,
                resolve: notebookJoinResolver,
            },
        },
    };
}
exports.getPublishedNotebookPlugin = getPublishedNotebookPlugin;
//# sourceMappingURL=PublishedNotebookList.js.map