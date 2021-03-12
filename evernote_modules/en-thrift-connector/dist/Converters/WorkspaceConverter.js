"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceConverter = exports.cachePinnedContentsDataFromThrift = exports.convertPinnedContentFromService = exports.removeBackingNotebookNode = exports.updateWorkspaceUiPreferencesToService = exports.workspaceFromService = exports.PINNED_CONTENTS_FIELD_NAME = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Auth = __importStar(require("../Auth"));
const WorkspaceUIPreferencesResolver_1 = require("../Resolvers/WorkspaceUIPreferencesResolver");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
const MembershipConverter_1 = require("./MembershipConverter");
const NotebookConverter_1 = require("./NotebookConverter");
const ProfileConverter_1 = require("./ProfileConverter");
const WS_PREF_REFETCH_INTERVAL = 5 * 60 * 1000;
exports.PINNED_CONTENTS_FIELD_NAME = 'pinnedContents';
function toWorkspaceType(t) {
    switch (t) {
        case en_conduit_sync_types_1.TWorkspaceType.INVITE_ONLY:
            return en_core_entity_types_1.WorkspaceType.INVITE_ONLY;
        case en_conduit_sync_types_1.TWorkspaceType.DISCOVERABLE:
            return en_core_entity_types_1.WorkspaceType.DISCOVERABLE;
        case en_conduit_sync_types_1.TWorkspaceType.OPEN:
            return en_core_entity_types_1.WorkspaceType.OPEN;
        default:
            throw conduit_utils_1.absurd(t, 'Unknown service workspace type');
    }
}
function toServiceWorkspaceType(t) {
    switch (t) {
        case en_core_entity_types_1.WorkspaceType.INVITE_ONLY:
            return en_conduit_sync_types_1.TWorkspaceType.INVITE_ONLY;
        case en_core_entity_types_1.WorkspaceType.DISCOVERABLE:
            return en_conduit_sync_types_1.TWorkspaceType.DISCOVERABLE;
        case en_core_entity_types_1.WorkspaceType.OPEN:
            return en_conduit_sync_types_1.TWorkspaceType.OPEN;
        default:
            throw conduit_utils_1.absurd(t, 'Unknown internal workspace type');
    }
}
function toMembershipPrivilege(t) {
    switch (t) {
        case en_conduit_sync_types_1.TWorkspacePrivilegeLevel.READ:
            return en_core_entity_types_1.MembershipPrivilege.READ;
        case en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT:
            return en_core_entity_types_1.MembershipPrivilege.EDIT;
        case en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT_AND_MANAGE:
            return en_core_entity_types_1.MembershipPrivilege.MANAGE;
        default:
            return null;
    }
}
function toServicePrivilegeLevel(t) {
    switch (t) {
        case en_core_entity_types_1.MembershipPrivilege.READ:
            return en_conduit_sync_types_1.TWorkspacePrivilegeLevel.READ;
        case en_core_entity_types_1.MembershipPrivilege.EDIT:
            return en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT;
        case en_core_entity_types_1.MembershipPrivilege.MANAGE:
            return en_conduit_sync_types_1.TWorkspacePrivilegeLevel.EDIT_AND_MANAGE;
        default:
            return null;
    }
}
function getAccessStatus(isMember, accessInfo, wsType) {
    var _a;
    if (isMember) {
        return en_core_entity_types_1.WorkspaceAccessStatusEnum.MEMBER;
    }
    if (wsType === en_core_entity_types_1.WorkspaceType.OPEN) {
        return en_core_entity_types_1.WorkspaceAccessStatusEnum.OPEN;
    }
    const accessRequestedTime = (_a = accessInfo === null || accessInfo === void 0 ? void 0 : accessInfo.accessRequestedTimestamp) !== null && _a !== void 0 ? _a : null;
    if (accessRequestedTime) {
        return en_core_entity_types_1.WorkspaceAccessStatusEnum.PENDING;
    }
    return en_core_entity_types_1.WorkspaceAccessStatusEnum.DISCOVERABLE;
}
function workspaceFromService(serviceData) {
    var _a, _b, _c, _d, _e, _f;
    const workspace = serviceData.workspace;
    const wsType = toWorkspaceType(workspace.workspaceType || en_conduit_sync_types_1.TWorkspaceType.INVITE_ONLY);
    const accessStatus = getAccessStatus((_a = serviceData.member) !== null && _a !== void 0 ? _a : null, (_b = serviceData.accessInfo) !== null && _b !== void 0 ? _b : null, wsType);
    const workspaceOut = {
        id: Converters_1.convertGuidFromService(workspace.guid, en_core_entity_types_1.CoreEntityTypes.Workspace),
        type: en_core_entity_types_1.CoreEntityTypes.Workspace,
        version: workspace.updateSequenceNum || 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: workspace.name || '',
        NodeFields: {
            accessStatus,
            notesCount: (_d = (_c = serviceData.aggregations) === null || _c === void 0 ? void 0 : _c.notesCount) !== null && _d !== void 0 ? _d : 0,
            notebooksCount: (_f = (_e = serviceData.aggregations) === null || _e === void 0 ? void 0 : _e.notebooksCount) !== null && _f !== void 0 ? _f : 0,
            description: workspace.descriptionText || '',
            workspaceType: wsType,
            created: workspace.serviceCreated || 0,
            updated: workspace.serviceUpdated || 0,
            viewed: Boolean(serviceData.accessInfo ? serviceData.accessInfo.viewed : false),
            isSample: workspace.sample || false,
            defaultRole: toMembershipPrivilege(workspace.defaultPrivilegeLevel),
            internal_shareCountProfiles: {},
        },
        inputs: {},
        outputs: {
            children: {},
            childrenInTrash: {},
            memberships: {},
            shortcut: {},
            manager: {},
        },
    };
    return workspaceOut;
}
exports.workspaceFromService = workspaceFromService;
async function workspaceUpdateSyncState(trc, params, workspaceID, backingNbID) {
    params.backingNbToWs = SimplyImmutable.replaceImmutable(params.backingNbToWs, [backingNbID], workspaceID);
    await params.graphTransaction.replaceSyncState(trc, ['workspaces', 'wsToBackingNb', workspaceID], backingNbID);
    await params.graphTransaction.replaceSyncState(trc, ['workspaces', 'backingNbToWs', backingNbID], workspaceID);
}
// function to walk through workspace nb edges and create a
// map object for notebookColor and noteDisplayOrder
async function curateWorkspacePreferencesMap(trc, params, wsNode, backingNbId, field, mutatedValue) {
    const wsId = wsNode.id;
    const wsRef = { id: wsId, type: en_core_entity_types_1.CoreEntityTypes.Workspace };
    const res = {};
    const nbEdges = wsNode.outputs.children;
    for (const nb of Object.keys(wsNode.outputs.children)) {
        const nbId = nbEdges[nb].dstID;
        if (nbId === mutatedValue.id) {
            res[Converters_1.convertGuidToService(nbId, en_core_entity_types_1.CoreEntityTypes.Notebook)] = mutatedValue.val;
            continue;
        }
        const cacheVal = await params.graphTransaction.getNodeCachedField(trc, null, { id: nbId, type: en_core_entity_types_1.CoreEntityTypes.Notebook }, field);
        if (cacheVal) {
            res[Converters_1.convertGuidToService(nbId, en_core_entity_types_1.CoreEntityTypes.Notebook)] = cacheVal.values[field];
        }
    }
    if (field === 'noteDisplayOrder') {
        if (mutatedValue.id === wsId) {
            res[Converters_1.convertGuidToService(backingNbId, en_core_entity_types_1.CoreEntityTypes.Notebook)] = mutatedValue.val;
        }
        else {
            // fetch cached value of noteOrder for ws
            const cacheVal = await params.graphTransaction.getNodeCachedField(trc, null, wsRef, field);
            if (cacheVal) {
                res[Converters_1.convertGuidToService(backingNbId, en_core_entity_types_1.CoreEntityTypes.Notebook)] = cacheVal.values[field];
            }
        }
    }
    return res;
}
async function updateWorkspaceUiPreferencesToService(trc, params, syncContext, noteStore, fields, wsId, nbId) {
    if (!fields) {
        return;
    }
    const wsGuid = Converters_1.convertGuidToService(wsId, en_core_entity_types_1.CoreEntityTypes.Workspace);
    const wsRef = { id: wsId, type: en_core_entity_types_1.CoreEntityTypes.Workspace };
    const wsToBackingNb = await params.graphTransaction.getSyncState(trc, null, ['workspaces', 'wsToBackingNb']);
    if (!wsToBackingNb) {
        throw new conduit_utils_1.NotFoundError(wsId, 'Workspace to backing nb mapping not found in sync state');
    }
    const backingNbId = wsToBackingNb[wsId];
    if (!backingNbId) {
        throw new conduit_utils_1.NotFoundError(wsId, 'Backing notebook ID not found for ws');
    }
    const wsNode = await params.graphTransaction.getNode(trc, null, wsRef);
    if (!wsNode) {
        throw new conduit_utils_1.NotFoundError(wsId, 'Workspace not found in graph');
    }
    const lastFetch = WorkspaceUIPreferencesResolver_1.getWsPreferencesLastFetch(wsId);
    if (!lastFetch || lastFetch + WS_PREF_REFETCH_INTERVAL < Date.now()) {
        // downsync ws preferences before upsyncing changes if fetch interval elapsed before last fetch.
        await WorkspaceUIPreferencesResolver_1.asyncFetchandCacheWsPreferences(trc, null, params.graphTransaction, params.thriftComm, wsNode, syncContext);
    }
    const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
    if (fields.layoutStyle) {
        await noteStore.setWorkspaceUserInterfaceLayoutStyle(trc, auth.token, wsGuid, fields.layoutStyle === en_core_entity_types_1.WorkspaceLayoutStyle.BOARD ? 1 : 0);
        await params.graphTransaction.setNodeCachedField(trc, wsRef, 'layoutStyle', fields.layoutStyle, {});
    }
    const isBoardView = fields.layoutStyle === en_core_entity_types_1.WorkspaceLayoutStyle.BOARD || (wsNode.CacheFields && wsNode.CacheFields.layoutStyle === en_core_entity_types_1.WorkspaceLayoutStyle.BOARD);
    if (isBoardView) {
        if (fields.notebookDisplayOrder) {
            const nbOrder = fields.notebookDisplayOrder.map(id => {
                return Converters_1.convertGuidToService(id === wsId ? backingNbId : id, en_core_entity_types_1.CoreEntityTypes.Notebook);
            });
            await noteStore.setNotebookUserInterfaceDisplayOrder(trc, auth.token, wsGuid, nbOrder);
            await params.graphTransaction.setNodeCachedField(trc, wsRef, 'notebookDisplayOrder', fields.notebookDisplayOrder, {});
        }
        if (fields.noteDisplayOrder) {
            const noteOrder = await curateWorkspacePreferencesMap(trc, params, wsNode, backingNbId, 'noteDisplayOrder', {
                id: nbId ? nbId : wsId,
                val: fields.noteDisplayOrder.map(id => Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Note)),
            });
            await noteStore.setNoteUserInterfaceDisplayOrder(trc, auth.token, wsGuid, noteOrder);
            await params.graphTransaction.setNodeCachedField(trc, nbId ? { id: nbId, type: en_core_entity_types_1.CoreEntityTypes.Notebook } : wsRef, 'noteDisplayOrder', fields.noteDisplayOrder, {});
        }
        if (fields.displayColor && nbId) {
            const displayColorMap = await curateWorkspacePreferencesMap(trc, params, wsNode, backingNbId, 'displayColor', { id: nbId, val: fields.displayColor });
            await noteStore.setNotebookUserInterfaceColors(trc, auth.token, wsGuid, displayColorMap);
            await params.graphTransaction.setNodeCachedField(trc, { id: nbId, type: en_core_entity_types_1.CoreEntityTypes.Notebook }, 'displayColor', fields.displayColor, {});
        }
    }
    else {
        if (fields.notebookDisplayOrder || fields.noteDisplayOrder || fields.displayColor) {
            throw new Error('Mutation allowed only when board view is enabled');
        }
    }
}
exports.updateWorkspaceUiPreferencesToService = updateWorkspaceUiPreferencesToService;
async function removeBackingNotebookNode(trc, params, syncContext, nbID, wsID) {
    const edgesToAdd = [];
    const edgesToRemove = [];
    const backingNotebookNode = await params.graphTransaction.getNode(trc, null, { id: nbID, type: en_core_entity_types_1.CoreEntityTypes.Notebook }, true);
    if (backingNotebookNode) {
        // During inital downsync a backing notebook node might be created if we don't already have
        // workspace to backing nb mappings. Backing nb node might be a dummy node if notes are synced before nb.
        // Copy note edges from backing nb to workspace and delete
        // backing nb node. Future notes will have an edge directly to workspace.
        function fixEdges(port, node) {
            const spaceEdgesToChildNote = node.outputs[port] || {};
            for (const k in spaceEdgesToChildNote) {
                const edge = spaceEdgesToChildNote[k];
                edgesToAdd.push({
                    srcID: wsID,
                    srcType: exports.WorkspaceConverter.nodeType,
                    srcPort: port,
                    dstID: edge.dstID,
                    dstType: edge.dstType,
                    dstPort: edge.dstPort,
                });
                edgesToRemove.push({
                    srcID: nbID,
                    srcType: en_core_entity_types_1.CoreEntityTypes.Notebook,
                    srcPort: port,
                    dstID: edge.dstID,
                    dstType: edge.dstType,
                    dstPort: edge.dstPort,
                });
            }
        }
        fixEdges('children', backingNotebookNode);
        fixEdges('childrenInTrash', backingNotebookNode);
        edgesToRemove.push({
            srcID: wsID,
            srcType: exports.WorkspaceConverter.nodeType,
            srcPort: 'children',
            dstID: nbID,
            dstType: NotebookConverter_1.NotebookConverter.nodeType,
            dstPort: 'parent',
        });
        edgesToRemove.push({
            srcID: wsID,
            srcType: exports.WorkspaceConverter.nodeType,
            srcPort: 'childrenInTrash',
            dstID: nbID,
            dstType: NotebookConverter_1.NotebookConverter.nodeType,
            dstPort: 'parent',
        });
        await params.graphTransaction.replaceEdges(trc, edgesToRemove, edgesToAdd);
        await params.graphTransaction.deleteNode(trc, syncContext, { id: nbID, type: en_core_entity_types_1.CoreEntityTypes.Notebook }, true);
    }
}
exports.removeBackingNotebookNode = removeBackingNotebookNode;
function isPinnedContent(maybePinnedContent) {
    if (maybePinnedContent.hasOwnProperty('pinID') &&
        maybePinnedContent.hasOwnProperty('entity') &&
        maybePinnedContent.hasOwnProperty('sortIndex')) {
        return true;
    }
    return false;
}
function checkPinnedContentsField(maybeSupport) {
    if (maybeSupport.hasOwnProperty('pinnedContents') &&
        Array.isArray(maybeSupport.pinnedContents) &&
        maybeSupport.pinnedContents.every(isPinnedContent)) {
        return true;
    }
    return false;
}
function convertPinnedContentTypeFromService(fromService) {
    switch (fromService) {
        case en_conduit_sync_types_1.TPinnedEntityType.NOTE:
            return en_core_entity_types_1.PinnedContentTypeEnum.NOTE;
        case en_conduit_sync_types_1.TPinnedEntityType.NOTEBOOK:
            return en_core_entity_types_1.PinnedContentTypeEnum.NOTEBOOK;
        case en_conduit_sync_types_1.TPinnedEntityType.EXTERNAL:
            return en_core_entity_types_1.PinnedContentTypeEnum.EXTERNAL;
        default:
            conduit_utils_1.logger.warn(`PinnedEntityType from server ${fromService} does not match any PinnedEntityType in data model.`);
            return null;
    }
}
function convertPinnedContentTypeToService(toService) {
    switch (toService) {
        case en_core_entity_types_1.PinnedContentTypeEnum.NOTE:
            return en_conduit_sync_types_1.TPinnedEntityType.NOTE;
        case en_core_entity_types_1.PinnedContentTypeEnum.NOTEBOOK:
            return en_conduit_sync_types_1.TPinnedEntityType.NOTEBOOK;
        case en_core_entity_types_1.PinnedContentTypeEnum.EXTERNAL:
            return en_conduit_sync_types_1.TPinnedEntityType.EXTERNAL;
        default:
            conduit_utils_1.logger.warn(`PinnedEntityType from server ${toService} does not match any PinnedEntityType in data model.`);
            return null;
    }
}
function convertPinnedContentFromService(fromService) {
    var _a, _b, _c, _d, _e;
    if (!fromService.guid) {
        conduit_utils_1.logger.warn('Property guid not found for a PinnedContent from the service');
        return null;
    }
    if (fromService.entityType === null || fromService.entityType === undefined) {
        conduit_utils_1.logger.warn(`Property entityType not found for PinnedContent id ${fromService.guid} from the service`);
        return null;
    }
    if (fromService.sortIndex === null || fromService.sortIndex === undefined) {
        conduit_utils_1.logger.warn(`Property sortIndex not found for PinnedContent id ${fromService.guid} from the service`);
        return null;
    }
    const entityType = convertPinnedContentTypeFromService(fromService.entityType);
    let contentNodeID = null;
    if (entityType === null) {
        return null;
    }
    else if (entityType === en_core_entity_types_1.PinnedContentTypeEnum.NOTE) {
        contentNodeID = Converters_1.convertGuidFromService(fromService.entityGuid, en_core_entity_types_1.CoreEntityTypes.Note); // Typecasting because entityGuid comes as string from Thrift call
    }
    else if (entityType === en_core_entity_types_1.PinnedContentTypeEnum.NOTEBOOK) {
        contentNodeID = Converters_1.convertGuidFromService(fromService.entityGuid, en_core_entity_types_1.CoreEntityTypes.Notebook); // Typecasting because entityGuid comes as string from Thrift call
    }
    else {
        conduit_utils_1.logger.debug(`Cannot convert guid from service for type ${entityType}`);
        contentNodeID = (_a = fromService.entityGuid) !== null && _a !== void 0 ? _a : null;
    }
    const pinnedContentOut = {
        pinID: fromService.guid,
        uri: (_b = fromService.entityUri) !== null && _b !== void 0 ? _b : null,
        label: (_c = fromService.entityTitle) !== null && _c !== void 0 ? _c : null,
        entity: entityType === en_core_entity_types_1.PinnedContentTypeEnum.EXTERNAL ? null : {
            type: entityType,
            id: contentNodeID,
        },
        created: (_d = fromService.serviceCreated) !== null && _d !== void 0 ? _d : null,
        updated: (_e = fromService.serviceUpdated) !== null && _e !== void 0 ? _e : null,
        sortIndex: fromService.sortIndex,
    };
    return pinnedContentOut;
}
exports.convertPinnedContentFromService = convertPinnedContentFromService;
async function cachePinnedContentsDataFromThrift(trc, workspace, metadata, graphTransaction, thriftFetchFunction) {
    const auth = Auth.decodeAuthData(metadata.authToken);
    const pinnedContentsFromServer = await thriftFetchFunction(auth.token, Converters_1.convertGuidToService(workspace.id, en_core_entity_types_1.CoreEntityTypes.Workspace));
    const pinnedContents = [];
    for (const pContent of pinnedContentsFromServer) {
        const convertResult = convertPinnedContentFromService(pContent);
        if (convertResult) {
            pinnedContents.push(convertResult);
        }
    }
    await graphTransaction.setNodeCachedField(trc, workspace, exports.PINNED_CONTENTS_FIELD_NAME, pinnedContents, {});
    return pinnedContents;
}
exports.cachePinnedContentsDataFromThrift = cachePinnedContentsDataFromThrift;
async function mapContentIDAndTypeToContentUpdate(trc, thriftGraphTransaction, workspaceGuid, nodeIDs, contentype) {
    if (contentype !== en_core_entity_types_1.PinnedContentTypeEnum.NOTE && contentype !== en_core_entity_types_1.PinnedContentTypeEnum.NOTEBOOK) {
        throw Error(`Pinned Content entity type ${contentype} is not supported`);
    }
    const res = [];
    for (const nodeID of nodeIDs) {
        const node = await thriftGraphTransaction.getNode(trc, null, { id: nodeID, type: contentype });
        const entityType = convertPinnedContentTypeToService(contentype);
        if (!node) {
            throw new conduit_utils_1.NotFoundError(nodeID, `Cannot find ${contentype} ${nodeID}`);
        }
        if (entityType === null || entityType === undefined) {
            conduit_utils_1.logger.warn(`${contentype} is not supported. ${nodeID} will be ignored.`);
        }
        else {
            res.push({
                entityGuid: Converters_1.convertGuidToService(nodeID, contentype),
                entityType,
                workspaceGuid: Converters_1.convertGuidToService(workspaceGuid, en_core_entity_types_1.CoreEntityTypes.Workspace),
            });
        }
    }
    return res;
}
class WorkspaceConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Workspace;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, workspaceResponse) {
        const workspaceOut = workspaceFromService(workspaceResponse);
        const currentWorkspace = await params.graphTransaction.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.Workspace, id: workspaceOut.id });
        if (workspaceResponse.memberships) {
            const currentIDs = [];
            for (const membership of workspaceResponse.memberships) {
                currentIDs.push(membership.common.guid);
                // This will add entries into note.internal_shareCountProfiles, and must be called before writing to the DB
                await MembershipConverter_1.MembershipConverter.convertFromService(trc, params, syncContext, membership, workspaceOut);
            }
            if (currentWorkspace) {
                for (const m in currentWorkspace.outputs.memberships) {
                    const membershipNodeID = currentWorkspace.outputs.memberships[m].dstID;
                    const membershipID = Converters_1.convertGuidToService(membershipNodeID, en_core_entity_types_1.CoreEntityTypes.Membership);
                    if (currentIDs.indexOf(membershipID) === -1) {
                        await MembershipConverter_1.deleteMembershipHelper(trc, params, syncContext, membershipNodeID);
                    }
                }
            }
        }
        if (workspaceResponse.workspace && workspaceResponse.workspace.backingNotebookGuid) {
            const id = Converters_1.convertGuidFromService(workspaceResponse.workspace.backingNotebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook);
            await removeBackingNotebookNode(trc, params, syncContext, id, workspaceOut.id);
            // update sync state mappings between ws guid and backing nb guid
            await workspaceUpdateSyncState(trc, params, workspaceOut.id, id);
        }
        if (workspaceResponse.workspace && workspaceResponse.workspace.contactId) {
            conduit_storage_1.addOutputEdgeToNode(workspaceOut, 'manager', {
                id: Converters_1.convertGuidFromService(workspaceResponse.workspace.contactId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
                type: en_core_entity_types_1.CoreEntityTypes.Profile,
                port: null,
            });
        }
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, workspaceOut);
        return !prevNode;
    }
    async createOnService(trc, params, syncContext, workspace, serviceGuidSeed) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            seed: serviceGuidSeed,
            name: workspace.label,
            descriptionText: workspace.NodeFields.description,
            workspaceType: toServiceWorkspaceType(workspace.NodeFields.workspaceType),
            defaultPrivilegeLevel: toServicePrivilegeLevel(workspace.NodeFields.defaultRole),
        };
        const workspaceResponse = await noteStore.createWorkspace(trc, auth.token, serviceData, { includeMemberships: true });
        if (workspaceResponse.workspace) {
            // create ws to backing nb mappings
            const workspaceId = Converters_1.convertGuidFromService(workspaceResponse.workspace.guid, en_core_entity_types_1.CoreEntityTypes.Workspace);
            const backingNbId = Converters_1.convertGuidFromService(workspaceResponse.workspace.backingNotebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook);
            await workspaceUpdateSyncState(trc, params, workspaceId, backingNbId);
            await this.convertFromService(trc, params, syncContext, workspaceResponse);
        }
        return true;
    }
    async customToService(trc, params, commandRun, syncContext) {
        var _a, _b, _c, _d;
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        switch (commandRun.command) {
            case 'WorkspaceJoin': {
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                await utilityStore.joinWorkspace(trc, auth.token, commandRun.params.workspace);
                return null;
            }
            case 'WorkspaceInvite': {
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                const inviteArgs = commandRun.params;
                const profileIDs = [];
                for (const profileID of inviteArgs.users) {
                    const emailAndID = await ProfileConverter_1.getUserProfileIDAndEmailFromProfileID(trc, params.graphTransaction, profileID);
                    if (!emailAndID.profileID) {
                        throw new Error(`Profile ID does not resolve to a userID: ${profileID}`);
                    }
                    // TODO handle email invites? Is that allowed for workspaces?
                    profileIDs.push(emailAndID.profileID);
                }
                const privilege = inviteArgs.privilege === undefined ? en_conduit_sync_types_1.TWorkspacePrivilegeLevel.READ : MembershipConverter_1.membershipPrivilegeToWorkspacePrivilege(inviteArgs.privilege);
                const inviteRequest = {
                    workspaceGuid: Converters_1.convertGuidToService(inviteArgs.workspace, en_core_entity_types_1.CoreEntityTypes.Workspace),
                    invitationsToCreateOrUpdate: profileIDs.map(profileID => {
                        return {
                            contact: {
                                id: Converters_1.convertGuidToService(profileID, en_core_entity_types_1.CoreEntityTypes.Profile),
                                type: en_conduit_sync_types_1.TContactType.EVERNOTE,
                            },
                            privilege,
                        };
                    }),
                };
                await noteStore.manageWorkspaceSharing(trc, auth.token, inviteRequest);
                return null;
            }
            case 'WorkspaceRequestAccess': {
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                await utilityStore.requestAccessToWorkspace(trc, auth.token, commandRun.params.workspace);
                return null;
            }
            case 'WorkspaceChangePinnedContentPosition': {
                const args = commandRun.params;
                const workspaceNode = await params.graphTransaction.getNode(trc, null, { id: args.workspace, type: en_core_entity_types_1.CoreEntityTypes.Workspace });
                if (!workspaceNode) {
                    throw new conduit_utils_1.NotFoundError(args.workspace, `Cannot find workspace id ${args.workspace}`);
                }
                const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                if (!syncContextMetadata) {
                    throw new conduit_utils_1.NotFoundError(syncContext, 'Missing syncContextMetadata for syncContext');
                }
                let cacheField = await params.graphTransaction.getNodeCachedField(trc, null, workspaceNode, exports.PINNED_CONTENTS_FIELD_NAME);
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                if (!cacheField || cacheField.isStale) {
                    await cachePinnedContentsDataFromThrift(trc, workspaceNode, syncContextMetadata, params.graphTransaction, async (authToken, workspaceID) => {
                        return await utilityStore.listPinnedContent(trc, authToken, workspaceID);
                    });
                    cacheField = await params.graphTransaction.getNodeCachedField(trc, null, workspaceNode, exports.PINNED_CONTENTS_FIELD_NAME);
                }
                if (!cacheField) {
                    throw new conduit_utils_1.NotFoundError(args.workspace, `No cache for workspace ${args.workspace}`);
                }
                const cacheFieldValues = cacheField.values;
                if (!checkPinnedContentsField(cacheFieldValues)) {
                    throw new Error(`Invalid Pinned Contents cache data: ${args.workspace}`);
                }
                const pinnedItems = cacheFieldValues.pinnedContents;
                const currentItem = pinnedItems.find(item => item.entity && item.entity.id === args.contentNodeID);
                if (!pinnedItems || !currentItem) {
                    throw new conduit_utils_1.NotFoundError(args.contentNodeID, `Cannot find ${args.contentNodeID} in Pinned Contents list`);
                }
                let referencePosition;
                if (args.index === 0) {
                    referencePosition = 'FIRST';
                }
                else if (args.index >= (pinnedItems.length - 1)) {
                    referencePosition = 'LAST';
                }
                else if (currentItem.sortIndex === args.index) {
                    conduit_utils_1.logger.debug('Current index. Does not do anything');
                    return null;
                }
                else {
                    const referencePositionItemIdx = args.index >= currentItem.sortIndex ? args.index + 1 : args.index;
                    const targetPositionItem = pinnedItems.find(item => item.sortIndex === referencePositionItemIdx);
                    if (!targetPositionItem) {
                        throw new conduit_utils_1.NotFoundError(String(referencePositionItemIdx), `Cannot find pinned item at index ${referencePositionItemIdx}`);
                    }
                    referencePosition = targetPositionItem.pinID;
                }
                const changePositionRequest = {
                    guid: currentItem.pinID,
                    referencePosition,
                };
                await cachePinnedContentsDataFromThrift(trc, workspaceNode, syncContextMetadata, params.graphTransaction, async (authToken, workspaceID) => {
                    return await utilityStore.changePinnedContentPosition(trc, authToken, workspaceID, changePositionRequest);
                });
                return null;
            }
            case 'WorkspaceUpdatePinnedContents': {
                const args = commandRun.params;
                if (!args.noteIDsToAdd && !args.noteIDsToRemove && !args.nbIDsToAdd && !args.nbIDsToRemove) {
                    conduit_utils_1.logger.debug('No node ids are passed.');
                    return null;
                }
                const workspaceNode = await params.graphTransaction.getNode(trc, null, { id: args.workspace, type: en_core_entity_types_1.CoreEntityTypes.Workspace });
                if (!workspaceNode) {
                    throw new conduit_utils_1.NotFoundError(args.workspace, `Cannot find workspace id ${args.workspace}`);
                }
                const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                if (!syncContextMetadata) {
                    throw new conduit_utils_1.NotFoundError(syncContext, 'Missing syncContextMetadata for syncContext');
                }
                const noteToAdd = await mapContentIDAndTypeToContentUpdate(trc, params.graphTransaction, args.workspace, (_a = args.noteIDsToAdd) !== null && _a !== void 0 ? _a : [], en_core_entity_types_1.PinnedContentTypeEnum.NOTE);
                const noteToRemove = await mapContentIDAndTypeToContentUpdate(trc, params.graphTransaction, args.workspace, (_b = args.noteIDsToRemove) !== null && _b !== void 0 ? _b : [], en_core_entity_types_1.PinnedContentTypeEnum.NOTE);
                const nbToAdd = await mapContentIDAndTypeToContentUpdate(trc, params.graphTransaction, args.workspace, (_c = args.nbIDsToAdd) !== null && _c !== void 0 ? _c : [], en_core_entity_types_1.PinnedContentTypeEnum.NOTEBOOK);
                const nbToRemove = await mapContentIDAndTypeToContentUpdate(trc, params.graphTransaction, args.workspace, (_d = args.nbIDsToRemove) !== null && _d !== void 0 ? _d : [], en_core_entity_types_1.PinnedContentTypeEnum.NOTEBOOK);
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                await cachePinnedContentsDataFromThrift(trc, workspaceNode, syncContextMetadata, params.graphTransaction, async (authToken, workspaceID) => {
                    return await utilityStore.updateContentOfPinnedWidget(trc, authToken, workspaceID, [...noteToAdd, ...nbToAdd], [...noteToRemove, ...nbToRemove]);
                });
                return null;
            }
            default:
                throw new Error(`Unknown customToService command for Workspace ${commandRun.command}`);
        }
    }
    async deleteFromService() {
        // called by leaveWorkspace. return false so node can be cleaned up from graph.
        return false;
    }
    async onDelete(trc, tx, workspaceID) {
        const backingNbID = await tx.getSyncState(trc, null, ['workspaces', 'wsToBackingNb', workspaceID]);
        await tx.deleteSyncState(trc, ['workspaces', 'wsToBackingNb', workspaceID]);
        if (backingNbID) {
            await tx.deleteSyncState(trc, ['workspaces', 'backingNbToWs', backingNbID]);
        }
    }
    async updateToService(trc, params, syncContext, wsID, diff) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            guid: Converters_1.convertGuidToService(wsID, en_core_entity_types_1.CoreEntityTypes.Workspace),
        };
        const spaceFields = diff.NodeFields;
        if (diff.hasOwnProperty('label')) {
            serviceData.name = diff.label;
        }
        if (spaceFields && spaceFields.hasOwnProperty('description')) {
            serviceData.descriptionText = spaceFields.description;
        }
        if (spaceFields && spaceFields.hasOwnProperty('workspaceType')) {
            serviceData.workspaceType = toServiceWorkspaceType(spaceFields.workspaceType);
        }
        if (spaceFields && spaceFields.hasOwnProperty('defaultRole')) {
            serviceData.defaultPrivilegeLevel = toServicePrivilegeLevel(spaceFields.defaultRole);
        }
        if (spaceFields && spaceFields.viewed === true) {
            // NOTE: there is no API for setting `viewed` back to false
            const workspace = await params.graphTransaction.getNode(trc, null, { id: wsID, type: en_core_entity_types_1.CoreEntityTypes.Workspace });
            if (workspace && !workspace.NodeFields.viewed) {
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                await utilityStore.sendWorkspaceViewedEvent(trc, auth.token, serviceData.guid);
            }
        }
        if (diff.CacheFields) {
            await updateWorkspaceUiPreferencesToService(trc, params, syncContext, noteStore, diff.CacheFields, wsID);
        }
        if (Object.keys(serviceData).length > 1) {
            await noteStore.updateWorkspace(trc, auth.token, serviceData);
        }
        return false;
    }
    async applyEdgeChangesToService() {
        // edge changes handled in Notebook Converter
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Workspace)
], WorkspaceConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Workspace)
], WorkspaceConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Workspace)
], WorkspaceConverterClass.prototype, "customToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Workspace)
], WorkspaceConverterClass.prototype, "deleteFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Workspace)
], WorkspaceConverterClass.prototype, "onDelete", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Workspace)
], WorkspaceConverterClass.prototype, "updateToService", null);
exports.WorkspaceConverter = new WorkspaceConverterClass();
//# sourceMappingURL=WorkspaceConverter.js.map