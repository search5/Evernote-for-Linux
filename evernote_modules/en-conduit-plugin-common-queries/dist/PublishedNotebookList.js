"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedNotebookPlugin = exports.PublishedNotebookAccessStatusEnumSchema = exports.PublishedNotebookAccessStatusEnum = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
var PublishedNotebookAccessStatusEnum;
(function (PublishedNotebookAccessStatusEnum) {
    PublishedNotebookAccessStatusEnum["OPEN"] = "OPEN";
    PublishedNotebookAccessStatusEnum["MEMBER"] = "MEMBER";
})(PublishedNotebookAccessStatusEnum = exports.PublishedNotebookAccessStatusEnum || (exports.PublishedNotebookAccessStatusEnum = {}));
exports.PublishedNotebookAccessStatusEnumSchema = conduit_utils_1.Enum(PublishedNotebookAccessStatusEnum, 'PublishedNotebookAccessStatus');
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
    return {
        queries: {
            PublishedNotebookList: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.ListOfStructs({
                    id: 'ID',
                    label: 'string',
                    description: 'string',
                    workspaceID: conduit_utils_1.NullableID,
                    created: 'number',
                    updated: 'number',
                    accessStatus: exports.PublishedNotebookAccessStatusEnumSchema,
                    membersCount: 'number',
                    ownerID: conduit_utils_1.NullableID,
                    notesCount: 'number',
                    businessNotebook: conduit_utils_1.NullableStruct({
                        notebookDescription: 'string',
                        privilege: 'number',
                        recommended: 'boolean',
                    }, 'BusinessNotebook'),
                }, 'PublishedNotebookList')),
                args: conduit_core_1.schemaToGraphQLArgs({
                    limit: conduit_utils_1.NullableNumber,
                    filters: conduit_utils_1.NullableListOf(conduit_utils_1.Struct({
                        field: conduit_utils_1.Enum(['label', 'description'], 'PublishedNotebooksFilterField'),
                        search: 'string',
                    }, 'PublishedNotebookFilter')),
                    sort: conduit_utils_1.NullableStruct({
                        field: conduit_utils_1.Enum(['label', 'created', 'updated', 'accessStatus'], 'PublishedNotebooksSortField'),
                        order: conduit_utils_1.Nullable(conduit_core_1.IndexOrderTypeSchema),
                    }, 'PublishedNotebookSort'),
                }),
                resolve: resolvePublishedNotebookspace,
            },
        },
    };
}
exports.getPublishedNotebookPlugin = getPublishedNotebookPlugin;
//# sourceMappingURL=PublishedNotebookList.js.map