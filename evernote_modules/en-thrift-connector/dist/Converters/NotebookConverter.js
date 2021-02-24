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
exports.NotebookConverter = exports.convertNotebookFromServiceImpl = exports.notebookObjectFromService = exports.initPendingOfflineNoteSyncStates = exports.updateContentDownloadForNote = exports.updateContentDownloadForNotebook = exports.resetOfflineNbsSyncStateOnInit = exports.deletePendingOfflineNotebookSyncState = exports.deletePendingOfflineNoteSyncState = exports.updatePendingOfflineNoteSyncState = exports.getPendingOfflineNoteIDs = exports.getPendingOfflineNote = exports.updateOfflineNbsInLocalSettings = exports.getOfflineNbsFromLocalSettings = exports.OfflineEntityDownloadState = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_data_model_1 = require("en-data-model");
const simply_immutable_1 = require("simply-immutable");
const ThriftTypes_1 = require("../ThriftTypes");
const AccountLimitsConverter = __importStar(require("./AccountLimitsConverter"));
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
const InvitationConverter_1 = require("./InvitationConverter");
const LinkedNotebookHelpers_1 = require("./LinkedNotebookHelpers");
const MembershipConverter_1 = require("./MembershipConverter");
const ProfileConverter_1 = require("./ProfileConverter");
const ShortcutConverter_1 = require("./ShortcutConverter");
const WorkspaceConverter_1 = require("./WorkspaceConverter");
const OFFLINE_NBS_LOCALDB_KEY = 'NotebooksMarkedOffline';
var OfflineEntityDownloadState;
(function (OfflineEntityDownloadState) {
    OfflineEntityDownloadState["NEEDS_DOWNLOAD"] = "NeedsDownload";
    OfflineEntityDownloadState["IN_PROGRESS"] = "InProgress";
})(OfflineEntityDownloadState = exports.OfflineEntityDownloadState || (exports.OfflineEntityDownloadState = {}));
const PENDING_OFFLINE_NOTES_KEY = 'PendingOfflineNotes';
async function getOfflineNbsFromLocalSettings(trc, localSettings, userID) {
    const offlineNbsStr = await localSettings.getConduitValue(trc, userID, OFFLINE_NBS_LOCALDB_KEY);
    return conduit_utils_1.safeParse(offlineNbsStr);
}
exports.getOfflineNbsFromLocalSettings = getOfflineNbsFromLocalSettings;
async function updateOfflineNbsInLocalSettings(trc, localSettings, userID, offlineNbs, nbId, isSet) {
    let notebooks = offlineNbs;
    if (!notebooks) {
        notebooks = await getOfflineNbsFromLocalSettings(trc, localSettings, userID) || {};
    }
    isSet ? notebooks[nbId] = true : delete notebooks[nbId];
    await localSettings.setConduitValue(trc, userID, OFFLINE_NBS_LOCALDB_KEY, conduit_utils_1.safeStringify(notebooks));
}
exports.updateOfflineNbsInLocalSettings = updateOfflineNbsInLocalSettings;
async function getPendingOfflineNote(trc, tx, noteID) {
    conduit_utils_1.traceTestCounts(trc, { getPendingOfflineNote: 1 });
    return await tx.getCustomSyncState(trc, null, PENDING_OFFLINE_NOTES_KEY, noteID);
}
exports.getPendingOfflineNote = getPendingOfflineNote;
async function getPendingOfflineNoteIDs(trc, tx) {
    return await tx.getCustomSyncStateKeys(trc, null, PENDING_OFFLINE_NOTES_KEY);
}
exports.getPendingOfflineNoteIDs = getPendingOfflineNoteIDs;
async function updatePendingOfflineNoteSyncState(trc, tx, noteID, value) {
    conduit_utils_1.traceEventStart(trc, 'updatePendingOfflineNoteSyncState');
    await conduit_utils_1.traceEventEndWhenSettled(trc, 'updatePendingOfflineNoteSyncState', tx.replaceCustomSyncState(trc, PENDING_OFFLINE_NOTES_KEY, noteID, value));
}
exports.updatePendingOfflineNoteSyncState = updatePendingOfflineNoteSyncState;
async function deletePendingOfflineNoteSyncState(trc, tx, noteID) {
    const noteSyncState = await tx.getCustomSyncState(trc, null, PENDING_OFFLINE_NOTES_KEY, noteID);
    if (noteSyncState) {
        await tx.deleteCustomSyncState(trc, PENDING_OFFLINE_NOTES_KEY, noteID);
        if (noteSyncState.notebookID) {
            await updateContentDownloadForNotebook(trc, tx, noteSyncState.notebookID);
        }
    }
}
exports.deletePendingOfflineNoteSyncState = deletePendingOfflineNoteSyncState;
async function deletePendingOfflineNotebookSyncState(trc, tx, notebookID, syncContext) {
    const noteIDs = await getNotebookNoteIDs(trc, tx, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook });
    for (const noteID of noteIDs) {
        await tx.deleteCustomSyncState(trc, PENDING_OFFLINE_NOTES_KEY, noteID);
    }
    await updateContentDownloadForNotebook(trc, tx, notebookID, false);
}
exports.deletePendingOfflineNotebookSyncState = deletePendingOfflineNotebookSyncState;
// app might have quit while some resources downsync is in progress. Need to reset resources sync state on init.
async function resetOfflineNbsSyncStateOnInit(trc, graphStorage) {
    const pendingNoteIDs = await getPendingOfflineNoteIDs(trc, graphStorage);
    const chunks = conduit_utils_1.chunkArray(pendingNoteIDs, 200);
    for (const chunk of chunks) {
        await graphStorage.transact(trc, 'resetOfflineNbsSyncStateOnInit', async (tx) => {
            const noteStates = await tx.batchGetCustomSyncState(trc, null, PENDING_OFFLINE_NOTES_KEY, chunk);
            for (const noteID of chunk) {
                const noteState = noteStates[noteID];
                if (!noteState) {
                    continue;
                }
                let newState = noteState;
                const resources = noteState.resources || {};
                for (const resourceID in resources) {
                    if (resources[resourceID] === OfflineEntityDownloadState.IN_PROGRESS) {
                        if (noteState === newState) {
                            newState = simply_immutable_1.cloneMutable(noteState);
                        }
                        newState.resources[resourceID] = OfflineEntityDownloadState.NEEDS_DOWNLOAD;
                    }
                }
                if (noteState !== newState) {
                    await updatePendingOfflineNoteSyncState(trc, tx, noteID, newState);
                }
            }
        });
    }
}
exports.resetOfflineNbsSyncStateOnInit = resetOfflineNbsSyncStateOnInit;
async function getNotebookNoteIDs(trc, tx, ref) {
    const notebook = conduit_storage_1.isGraphNode(ref) ? ref : await tx.getNode(trc, null, ref);
    if (!notebook) {
        return [];
    }
    return Object.values(notebook.outputs.children).concat(Object.values(notebook.outputs.childrenInTrash))
        .filter(edge => edge.dstType === en_data_model_1.CoreEntityTypes.Note)
        .map(edge => edge.dstID);
}
async function updateContentDownloadForNotebook(trc, tx, notebookID, contentDownloaded) {
    if (contentDownloaded === undefined) {
        conduit_utils_1.traceEventStart(trc, 'computeContentDownloaded');
        contentDownloaded = true;
        const noteIDs = await getNotebookNoteIDs(trc, tx, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook });
        for (const noteID of noteIDs) {
            if (await tx.hasCustomSyncStateKey(trc, null, PENDING_OFFLINE_NOTES_KEY, noteID)) {
                contentDownloaded = false;
                break;
            }
        }
        conduit_utils_1.traceEventEnd(trc, 'computeContentDownloaded');
    }
    await tx.updateNodeDeferred(trc, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook }, ['NodeFields', 'contentDownloaded'], contentDownloaded);
}
exports.updateContentDownloadForNotebook = updateContentDownloadForNotebook;
async function updateContentDownloadForNote(trc, tx, syncContext, noteID, value) {
    conduit_utils_1.traceTestCounts(trc, { updateContentDownloadForNote: 1 });
    await tx.updateNode(trc, syncContext, { id: noteID, type: en_data_model_1.CoreEntityTypes.Note }, {
        NodeFields: {
            contentDownloaded: value,
        },
    });
}
exports.updateContentDownloadForNote = updateContentDownloadForNote;
async function initPendingOfflineNoteSyncStates(trc, tx, offlineContentStrategy, localSettings, userID) {
    if (offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.EVERYTHING) {
        // NOTE: this includes dummy nodes, but that's ok because downsyncNote() will clean it up properly
        const allNoteRefs = await tx.getGraphNodeRefsByType(trc, null, en_data_model_1.CoreEntityTypes.Note);
        for (const noteRef of allNoteRefs) {
            await updatePendingOfflineNoteSyncState(trc, tx, noteRef.id, {
                needsInit: true,
                notebookID: null,
            });
        }
    }
    else if (offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.SELECTIVE) {
        const notebooks = await getOfflineNbsFromLocalSettings(trc, localSettings, userID) || {};
        for (const notebookID in notebooks) {
            const noteIDs = await getNotebookNoteIDs(trc, tx, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook });
            for (const noteID of noteIDs) {
                await updatePendingOfflineNoteSyncState(trc, tx, noteID, {
                    needsInit: true,
                    notebookID: notebookID,
                });
            }
        }
    }
}
exports.initPendingOfflineNoteSyncStates = initPendingOfflineNoteSyncStates;
async function shareNotebookWithContacts(trc, params, syncContext, syncContextMetadata, createParams, notebookName, contacts, splitMessages) {
    if (!params.personalAuth) {
        throw new Error('Personal auth token needed');
    }
    if (!syncContextMetadata || !syncContextMetadata.userID) {
        throw new Error(`Unable to find owningUserID for syncContext ${syncContext}`);
    }
    const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const messageStore = params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl);
    const notebookGuid = Converters_1.convertGuidToService(createParams.notebook, en_data_model_1.CoreEntityTypes.Notebook);
    const messageThreads = [];
    const shareTemplate = {
        notebookGuid,
        recipientContacts: contacts,
        privilege: MembershipConverter_1.membershipPrivilegeToSharedNotebookPrivilege(createParams.privilege),
    };
    if (splitMessages) {
        for (const contact of contacts) {
            messageThreads.push({
                message: {
                    body: `<msg>${createParams.message}</msg>`,
                    attachments: [{
                            type: ThriftTypes_1.TMessageAttachmentType.NOTEBOOK,
                            title: notebookName,
                            guid: Converters_1.convertGuidToService(createParams.notebook, en_data_model_1.CoreEntityTypes.Notebook),
                            shardId: auth.shard,
                            userId: syncContextMetadata.userID,
                        }],
                },
                participants: [contact],
                groupThread: false,
            });
        }
    }
    else {
        messageThreads.push({
            message: {
                body: `<msg>${createParams.message}</msg>`,
                attachments: [{
                        type: ThriftTypes_1.TMessageAttachmentType.NOTEBOOK,
                        title: notebookName,
                        guid: Converters_1.convertGuidToService(createParams.notebook, en_data_model_1.CoreEntityTypes.Notebook),
                        shardId: auth.shard,
                        userId: syncContextMetadata.userID,
                    }],
            },
            participants: contacts,
            groupThread: contacts.length >= 2,
        });
    }
    const result = await noteStore.createOrUpdateNotebookShares(trc, auth.token, shareTemplate);
    let firstError = null;
    const sharesToRevoke = [];
    for (const message of messageThreads) {
        try {
            await messageStore.createMessageThread(trc, params.personalAuth.token, message);
        }
        catch (e) {
            if (result.matchingShares && result.matchingShares.length) {
                for (const share of result.matchingShares) {
                    if (share.serviceCreated === share.serviceUpdated) {
                        if (splitMessages) {
                            if (message.participants[0].type === ThriftTypes_1.TContactType.EMAIL) {
                                if (share.email !== message.participants[0].id) {
                                    continue;
                                }
                            }
                            else {
                                if (share.userId !== Number(message.participants[0].id)) {
                                    continue;
                                }
                            }
                        }
                        // This user created this share, but was unable to send the invite message, roll back the share.
                        sharesToRevoke.push({
                            type: ThriftTypes_1.TUserIdentityType.IDENTITYID,
                            longIdentifier: share.recipientIdentityId,
                        });
                    }
                }
            }
            firstError = firstError || e;
        }
    }
    if (sharesToRevoke.length) {
        await noteStore.manageNotebookShares(trc, auth.token, {
            notebookGuid,
            unshares: sharesToRevoke,
        });
    }
    if (firstError) {
        throw firstError;
    }
    return result.matchingShares || [];
}
function notebookObjectFromService(syncContext, serviceData, nbsMarkedOffline) {
    var _a, _b, _c, _d;
    // inWorkspace field is not set on service side, so have to mimic what Ion does.
    // if user has access to nb but not to parent ws, worskpaceGuid will be null. So, have to derive inWorkspace based on restrictions.
    const nbInWorkspace = ((_b = (_a = serviceData.restrictions) === null || _a === void 0 ? void 0 : _a.canMoveToContainerRestrictions) === null || _b === void 0 ? void 0 : _b.canMoveToContainer) === ThriftTypes_1.TCanMoveToContainerStatus.INSUFFICIENT_CONTAINER_PRIVILEGE || false;
    const isExternal = Boolean(syncContext.match(en_data_model_1.EXTERNAL_CONTEXT_REGEX));
    const reminderNotifyEmail = serviceData.recipientSettings ? ((_c = serviceData.recipientSettings.reminderNotifyEmail) !== null && _c !== void 0 ? _c : false) : false;
    const reminderNotifyInApp = serviceData.recipientSettings ? ((_d = serviceData.recipientSettings.reminderNotifyInApp) !== null && _d !== void 0 ? _d : false) : false;
    const nbId = Converters_1.convertGuidFromService(serviceData.guid, en_data_model_1.CoreEntityTypes.Notebook);
    const notebook = {
        id: nbId,
        type: en_data_model_1.CoreEntityTypes.Notebook,
        version: serviceData.updateSequenceNum || 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: serviceData.name || '',
        NodeFields: {
            created: serviceData.serviceCreated || 0,
            updated: serviceData.serviceUpdated || 0,
            isPublished: serviceData.published || false,
            inWorkspace: (serviceData.workspaceGuid !== null && serviceData.workspaceGuid !== undefined) || nbInWorkspace,
            isExternal,
            internal_shareCountProfiles: {},
            markedForOffline: nbsMarkedOffline && nbsMarkedOffline[nbId] || false,
            reminderNotifyEmail,
            reminderNotifyInApp,
            isPartialNotebook: serviceData.isPartialNotebook || false,
            internal_linkedNotebookParams: serviceData.isPartialNotebook ? {
                noteStoreUrl: serviceData.noteStoreUrl,
                shardId: serviceData.shardId,
            } : null,
        },
        inputs: {
            parent: {},
            stack: {},
            userForDefaultNotebook: {},
            userForUserNotebook: {},
        },
        outputs: {
            children: {},
            childrenInTrash: {},
            memberships: {},
            creator: {},
            shortcut: {},
        },
    };
    return notebook;
}
exports.notebookObjectFromService = notebookObjectFromService;
async function notebookFromService(trc, params, syncContext, serviceData) {
    const notebook = notebookObjectFromService(syncContext, serviceData, params.nbsMarkedOffline);
    if (serviceData.workspaceGuid) {
        conduit_storage_1.addInputEdgeToNode(notebook, 'parent', {
            id: Converters_1.convertGuidFromService(serviceData.workspaceGuid, en_data_model_1.CoreEntityTypes.Workspace),
            port: 'children',
            type: en_data_model_1.CoreEntityTypes.Workspace,
        });
    }
    const stack = serviceData.recipientSettings && serviceData.recipientSettings.stack ? serviceData.recipientSettings.stack : serviceData.stack;
    if (stack) {
        conduit_storage_1.addInputEdgeToNode(notebook, 'stack', {
            id: Converters_1.convertGuidFromService(stack, en_data_model_1.CoreEntityTypes.Stack),
            port: 'notebooks',
            type: en_data_model_1.CoreEntityTypes.Stack,
        });
    }
    if (serviceData.contact && serviceData.contact.id) {
        await ProfileConverter_1.ProfileConverter.convertFromService(trc, params, syncContext, ProfileConverter_1.profileFromUser(serviceData.contact));
        conduit_storage_1.addOutputEdgeToNode(notebook, 'creator', {
            id: Converters_1.convertGuidFromService(serviceData.contact.id, en_data_model_1.CoreEntityTypes.Profile, en_data_model_1.PROFILE_SOURCE.User),
            port: null,
            type: en_data_model_1.CoreEntityTypes.Profile,
        });
    }
    else {
        const metadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
        if (metadata) {
            conduit_storage_1.addOutputEdgeToNode(notebook, 'creator', {
                id: Converters_1.convertGuidFromService(metadata.userID, en_data_model_1.CoreEntityTypes.Profile, en_data_model_1.PROFILE_SOURCE.User),
                port: null,
                type: en_data_model_1.CoreEntityTypes.Profile,
            });
        }
    }
    return notebook;
}
async function updateStackInGraph(trc, params, serviceData) {
    const serviceStack = serviceData.recipientSettings && serviceData.recipientSettings.stack ? serviceData.recipientSettings.stack : serviceData.stack;
    if (serviceStack) {
        const stack = {
            id: Converters_1.convertGuidFromService(serviceStack, en_data_model_1.CoreEntityTypes.Stack),
            type: en_data_model_1.CoreEntityTypes.Stack,
            version: serviceData.updateSequenceNum || 0,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: serviceStack,
            NodeFields: {},
            inputs: {},
            outputs: {
                notebooks: {},
                shortcut: {},
            },
        };
        await params.graphTransaction.replaceNodeAndEdges(trc, conduit_core_1.PERSONAL_USER_CONTEXT, stack);
    }
}
async function getCurrentShareIDs(trc, params, oldNotebook) {
    const out = [];
    const oldMembershipEdges = oldNotebook ? oldNotebook.outputs.memberships : {};
    for (const key in oldMembershipEdges) {
        const edge = oldMembershipEdges[key];
        if (edge.dstType === en_data_model_1.CoreEntityTypes.Membership) {
            const membership = await params.graphTransaction.getNode(trc, null, { id: edge.dstID, type: en_data_model_1.CoreEntityTypes.Membership });
            if (membership) {
                out.push({
                    sharedNotebookID: membership.NodeFields.internal_sharedNotebookID,
                    globalShareID: Converters_1.convertGuidToService(edge.dstID, en_data_model_1.CoreEntityTypes.Membership),
                });
            }
        }
    }
    return out;
}
async function updateSharesInGraph(trc, params, syncContext, serviceData, notebook) {
    if (serviceData.sharedNotebooks) {
        for (const share of serviceData.sharedNotebooks) {
            await MembershipConverter_1.MembershipConverter.convertFromService(trc, params, syncContext, share, notebook);
        }
    }
}
async function deleteOldSharesFromGraph(trc, params, syncContext, serviceData, notebook, oldNotebook) {
    const currentShares = await getCurrentShareIDs(trc, params, oldNotebook);
    for (const share of currentShares) {
        if (!serviceData.sharedNotebookIds || serviceData.sharedNotebookIds.indexOf(share.sharedNotebookID) === -1) {
            await MembershipConverter_1.deleteMembershipHelper(trc, params, syncContext, Converters_1.convertGuidFromService(share.globalShareID, en_data_model_1.CoreEntityTypes.Membership));
        }
    }
}
async function updateNotebookWsPreferencesToService(trc, params, syncContext, notebookID, noteStore, fields) {
    const nodeRefs = await params.graphTransaction.traverseGraph(trc, null, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook }, [{ edge: ['inputs', 'parent'], type: en_data_model_1.CoreEntityTypes.Workspace }]);
    if (!nodeRefs.length) {
        throw new conduit_utils_1.NotFoundError(notebookID, 'Workspace node not found for notebook');
    }
    await WorkspaceConverter_1.updateWorkspaceUiPreferencesToService(trc, params, syncContext, noteStore, fields, nodeRefs[0].id, notebookID);
}
async function convertNotebookFromServiceImpl(trc, params, syncContext, serviceData, option = { skipShare: false }) {
    if (serviceData.workspaceGuid) {
        const nbID = exports.NotebookConverter.convertGuidFromService(serviceData.guid);
        const wsID = params.backingNbToWs[nbID];
        if (wsID) {
            // notebook is a backing nb. Swap any note edges to ws and remove backing nb dummy node if present.
            await WorkspaceConverter_1.removeBackingNotebookNode(trc, params, syncContext, nbID, wsID);
            return false;
        }
    }
    const notebook = await notebookFromService(trc, params, syncContext, serviceData);
    await Helpers_1.ensureIsExternal(trc, params, syncContext, notebook);
    const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
    if (!syncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(syncContext, `Missing syncContextMetadata ${syncContext}`);
    }
    const isDefaultNotebook = ((syncContextMetadata.isUser && serviceData.defaultNotebook) ||
        ((syncContextMetadata.isVaultUser || syncContextMetadata.sharedNotebookGlobalID)
            && serviceData.recipientSettings
            && serviceData.recipientSettings.recipientStatus === ThriftTypes_1.TRecipientStatus.IN_MY_LIST_AND_DEFAULT_NOTEBOOK));
    if (isDefaultNotebook || serviceData.userNotebook) {
        const edgesToDelete = [];
        const edgesToCreate = [];
        if (isDefaultNotebook) {
            // we have to manually remove this edge because the service doesn't always give us the value
            // (if the user has never set it), so we have to manually set the flag the first time we sync (see initDefaultNotebook)
            // and not clear it when we legit sync the notebook; instead let the next default notebook replace the edge manually
            edgesToDelete.push({
                srcID: conduit_core_1.PERSONAL_USER_ID,
                srcType: en_data_model_1.CoreEntityTypes.User,
                srcPort: 'defaultNotebook',
            });
            edgesToCreate.push({
                srcID: conduit_core_1.PERSONAL_USER_ID,
                srcType: en_data_model_1.CoreEntityTypes.User,
                srcPort: 'defaultNotebook',
                dstID: notebook.id,
                dstType: notebook.type,
                dstPort: 'userForDefaultNotebook',
            });
        }
        if (serviceData.userNotebook) {
            // see comment above for default notebook
            edgesToDelete.push({
                srcID: conduit_core_1.PERSONAL_USER_ID,
                srcType: en_data_model_1.CoreEntityTypes.User,
                srcPort: 'userNotebook',
            });
            edgesToCreate.push({
                srcID: conduit_core_1.PERSONAL_USER_ID,
                srcType: en_data_model_1.CoreEntityTypes.User,
                srcPort: 'userNotebook',
                dstID: notebook.id,
                dstType: notebook.type,
                dstPort: 'userForUserNotebook',
            });
        }
        if (edgesToDelete.length || edgesToCreate.length) {
            await params.graphTransaction.replaceEdges(trc, edgesToDelete, edgesToCreate);
        }
    }
    // order is important
    // 1, updateSharesInGraph
    // 2. replaceNodeAndEdges
    // 3. deleteOldSharesFromGraph
    if (!option.skipShare) {
        await updateSharesInGraph(trc, params, syncContext, serviceData, notebook);
    }
    const oldNotebook = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, notebook);
    if (!option.skipShare) {
        await deleteOldSharesFromGraph(trc, params, syncContext, serviceData, notebook, oldNotebook);
    }
    await updateStackInGraph(trc, params, serviceData);
    return !oldNotebook;
}
exports.convertNotebookFromServiceImpl = convertNotebookFromServiceImpl;
class NotebookConverterClass {
    constructor() {
        this.nodeType = en_data_model_1.CoreEntityTypes.Notebook;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, serviceData) {
        return await convertNotebookFromServiceImpl(trc, params, syncContext, serviceData);
    }
    async onDelete(trc, tx, localSettings, notebookID) {
        const personalMetadata = await tx.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
        if (personalMetadata) {
            await updateOfflineNbsInLocalSettings(trc, localSettings, personalMetadata.userID, undefined, notebookID, false);
        }
    }
    async createOnService(trc, params, syncContext, notebook, serviceGuidSeed, remoteFields) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            seed: serviceGuidSeed,
            name: notebook.label,
        };
        if (remoteFields.workspaceID) {
            serviceData.workspaceGuid = Converters_1.convertGuidToService(remoteFields.workspaceID, en_data_model_1.CoreEntityTypes.Workspace);
        }
        const resp = await noteStore.createNotebook(trc, auth.token, serviceData);
        await exports.NotebookConverter.convertFromService(trc, params, syncContext, resp);
        return true;
    }
    async customToService(trc, params, commandRun, syncContext) {
        switch (commandRun.command) {
            case 'NotebookInvite': {
                if (!params.personalAuth) {
                    throw new Error('Personal auth token needed');
                }
                const createParams = commandRun.params;
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                const notebook = await noteStore.getNotebook(trc, auth.token, Converters_1.convertGuidToService(createParams.notebook, en_data_model_1.CoreEntityTypes.Notebook));
                if (!syncContextMetadata || !syncContextMetadata.userID) {
                    throw new conduit_utils_1.NotFoundError(syncContext, 'Unable to find owningUserID for syncContext');
                }
                if (!notebook) {
                    throw new conduit_utils_1.NotFoundError(Converters_1.convertGuidToService(createParams.notebook, en_data_model_1.CoreEntityTypes.Notebook), 'Unable to find notebook');
                }
                const contacts = [];
                const emailContacts = [];
                const profileIDs = createParams.profileIDs || [];
                if (createParams.userIDs) {
                    conduit_utils_1.logger.warn('userIDs is deprecated, use profileIDs instead');
                    profileIDs.push(...createParams.userIDs);
                }
                for (const profileID of profileIDs) {
                    const emailAndID = await ProfileConverter_1.getUserProfileIDAndEmailFromProfileID(trc, params.graphTransaction, profileID);
                    if (emailAndID.email) {
                        emailContacts.push({
                            id: emailAndID.email,
                            type: ThriftTypes_1.TContactType.EMAIL,
                        });
                        // prefer email as id fails if users are not connected
                    }
                    else if (emailAndID.profileID) {
                        const contactWithUserId = {
                            id: Converters_1.convertGuidToService(emailAndID.profileID, en_data_model_1.CoreEntityTypes.Profile),
                            type: ThriftTypes_1.TContactType.EVERNOTE,
                        };
                        const connectionCheckResult = await Helpers_1.checkUserConnection(trc, params, contactWithUserId);
                        if (connectionCheckResult) {
                            contacts.push(contactWithUserId);
                        }
                        else {
                            throw new Error(`${profileID} is not connected with the current account. Please try to invite with email.`);
                        }
                    }
                    else {
                        throw new Error(`Profile ID does not resolve to a userID or an email: ${profileID}`);
                    }
                }
                if (createParams.emails) {
                    createParams.emails.forEach(email => {
                        emailContacts.push({
                            id: email,
                            type: ThriftTypes_1.TContactType.EMAIL,
                        });
                    });
                }
                let allShares = [];
                if (contacts.length) {
                    allShares = allShares.concat(await shareNotebookWithContacts(trc, params, syncContext, syncContextMetadata, createParams, notebook.name, contacts, false));
                    await AccountLimitsConverter.updateNodeTypeCount(trc, params.graphTransaction, syncContext, en_data_model_1.CoreEntityTypes.Notebook, contacts.length, 'userNoteAndNotebookSharesSentCount');
                }
                if (emailContacts.length) {
                    allShares = allShares.concat(await shareNotebookWithContacts(trc, params, syncContext, syncContextMetadata, createParams, notebook.name, emailContacts, true));
                    await AccountLimitsConverter.updateNodeTypeCount(trc, params.graphTransaction, syncContext, en_data_model_1.CoreEntityTypes.Notebook, emailContacts.length, 'userNoteAndNotebookSharesSentCount');
                }
                if (allShares.length) {
                    return {
                        id: Converters_1.convertGuidFromService(allShares[0].globalId, en_data_model_1.CoreEntityTypes.Membership),
                        type: en_data_model_1.CoreEntityTypes.Membership,
                    };
                }
                // Contrary to createOrUpdateSharedNotes(), createOrUpdateNotebookShares() doesn't
                // return any record if there was already an identical share record.
                // So we return null instead of a 'Service returned no new memberships' error.
                // A common case is resending a pending invitation.
                return null;
            }
            case 'NotebookLeave': {
                if (!params.personalAuth) {
                    throw new Error('Unable to leave notebook without personal auth token');
                }
                const nbID = commandRun.params.notebook;
                const node = await params.graphTransaction.getNode(trc, null, { id: nbID, type: en_data_model_1.CoreEntityTypes.Notebook });
                if (!node) {
                    throw new conduit_utils_1.NotFoundError(nbID, 'Unable to leave a not found notebook');
                }
                const serviceGuid = exports.NotebookConverter.convertGuidToService(nbID);
                const metadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                let noteStoreUrl;
                if (!metadata || !metadata.sharedNotebookGlobalID) {
                    // Either shared notebook that belongs to the same business.
                    // Or internal error, then rely on service backend to reject invalid request.
                    noteStoreUrl = params.personalAuth.urls.noteStoreUrl;
                }
                else {
                    noteStoreUrl = await params.graphTransaction.getSyncState(trc, null, ['sharing', 'sharedNotebooks', metadata.sharedNotebookGlobalID, 'noteStoreUrl']);
                }
                if (!noteStoreUrl) {
                    throw new conduit_utils_1.InvalidOperationError('noteStoreUrl not provided');
                }
                const authToken = params.personalAuth.token;
                const noteStore = params.thriftComm.getNoteStore(noteStoreUrl);
                const recipientSettings = new ThriftTypes_1.TNotebookRecipientSettings({ recipientStatus: ThriftTypes_1.TRecipientStatus.NOT_IN_MY_LIST });
                await noteStore.setNotebookRecipientSettings(trc, authToken, serviceGuid, recipientSettings);
                const shortcutID = Converters_1.convertGuidFromService(`Notebook:${nbID}`, en_data_model_1.CoreEntityTypes.Shortcut);
                const shortcut = await params.graphTransaction.getNode(trc, null, { id: shortcutID, type: en_data_model_1.CoreEntityTypes.Shortcut });
                if (shortcut) {
                    await ShortcutConverter_1.updateShortcutsToService(trc, params, [], [shortcutID]);
                }
                if (metadata && metadata.sharedNotebookGlobalID) {
                    const syncStatePath = ['sharing', 'sharedNotebooks', metadata.sharedNotebookGlobalID];
                    await params.graphTransaction.deleteSyncState(trc, syncStatePath);
                }
                // now we can wipe sync context once new recepient is set
                await params.graphTransaction.deleteSyncContext(trc, syncContext);
                await params.graphTransaction.deleteSyncState(trc, [syncContext]);
                return null;
            }
            case 'NotebookAcceptShare': {
                const nbID = commandRun.params.notebook;
                const node = await params.graphTransaction.getNode(trc, null, { id: nbID, type: en_data_model_1.CoreEntityTypes.Notebook });
                if (!node) {
                    throw new conduit_utils_1.NotFoundError(nbID, 'Notebook not found in graph');
                }
                const sharedNotebookGlobalID = LinkedNotebookHelpers_1.convertPartialNbGuidToSharedNbGuid(Converters_1.convertGuidToService(nbID, en_data_model_1.CoreEntityTypes.Notebook));
                const { noteStoreUrl, shardId } = node.NodeFields.internal_linkedNotebookParams;
                const shareData = await InvitationConverter_1.acceptSharedNotebook(trc, params, syncContext, {
                    shareName: node.label,
                    shareKey: sharedNotebookGlobalID,
                    noteStoreUrl,
                    shardId,
                });
                return shareData.notebookID;
            }
            default:
                throw new Error(`Unknown customToService command for Notebook ${commandRun.command}`);
        }
    }
    async deleteFromService(trc, params, syncContext, ids) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        for (const id of ids) {
            const serviceGuid = Converters_1.convertGuidToService(id, en_data_model_1.CoreEntityTypes.Notebook);
            await noteStore.expungeNotebook(trc, auth.token, serviceGuid);
        }
        return false;
    }
    async updateToService(trc, params, _, notebookID, diff) {
        const curNotebook = await params.graphTransaction.getNode(trc, null, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook });
        if (!curNotebook) {
            throw new conduit_utils_1.NotFoundError(notebookID, `Missing notebook ${notebookID} from local graph storage`);
        }
        const { auth, syncContext } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, curNotebook);
        const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
        if (!syncContextMetadata) {
            throw new conduit_utils_1.NotFoundError(syncContext, `Missing syncContextMetadata ${syncContext}`);
        }
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const serviceData = {
            guid: Converters_1.convertGuidToService(notebookID, en_data_model_1.CoreEntityTypes.Notebook),
        };
        if (diff.hasOwnProperty('label')) {
            serviceData.name = diff.label;
        }
        if (serviceData.hasOwnProperty('name')) {
            // special case for renaming, because the service has a bug
            const usn = await noteStore.renameNotebook(trc, auth.token, serviceData.guid, serviceData.name);
            await params.graphTransaction.updateNode(trc, syncContext, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook }, {
                version: usn,
                label: serviceData.name,
            });
            delete serviceData.name;
        }
        if (diff.CacheFields) {
            await updateNotebookWsPreferencesToService(trc, params, syncContext, notebookID, noteStore, diff.CacheFields);
        }
        let resp = null;
        let skipShare = false;
        if (diff.NodeFields && (diff.NodeFields.hasOwnProperty('reminderNotifyEmail') || diff.NodeFields.hasOwnProperty('reminderNotifyInApp'))) {
            const recipientSettings = new ThriftTypes_1.TNotebookRecipientSettings({
                reminderNotifyEmail: diff.NodeFields ? diff.NodeFields.reminderNotifyEmail : null,
                reminderNotifyInApp: diff.NodeFields ? diff.NodeFields.reminderNotifyInApp : null,
            });
            // for business user, we need to use personal user auth token for setNotebookRecipientSettings call
            const authToken = (syncContextMetadata.isVaultUser || syncContextMetadata.sharedNotebookGlobalID) && params.personalAuth
                ? params.personalAuth.token :
                auth.token;
            resp = await noteStore.setNotebookRecipientSettings(trc, authToken, serviceData.guid, recipientSettings);
            skipShare = true;
        }
        if (Object.keys(serviceData).filter(k => k !== 'reminderNotifyEmail' && k !== 'reminderNotifyInApp').length > 1) {
            resp = await noteStore.updateNotebookWithResultSpec(trc, auth.token, serviceData, {
                // TODO this might be overkill, but currently necessary without extra work in convertFromService
                includeSharedNotebooks: true,
                includeNotebookRestrictions: true,
                includeNotebookRecipientSettings: true,
            });
            skipShare = false;
        }
        if (resp) {
            await convertNotebookFromServiceImpl(trc, params, syncContext, resp, { skipShare });
        }
        return true;
    }
    async handleErrorToService(trc, err, params, change) {
        switch (change.changeType) {
            case 'Node:CREATE': {
                if (err instanceof conduit_utils_1.ServiceError) {
                    if (err.errorKey === 'Notebook.name' && err.errorCode === ThriftTypes_1.EDAMErrorCode.DATA_CONFLICT) {
                        // Duplicate nodes, rename it, and try again!
                        return simply_immutable_1.replaceImmutable(change, ['node', 'label'], `${change.node.label} (${Date.now().toString().slice(-6)})`);
                    }
                }
                break;
            }
            case 'Node:UPDATE': {
                if (err instanceof conduit_utils_1.ServiceError) {
                    if (err.errorKey === 'Notebook.name' && err.errorCode === ThriftTypes_1.EDAMErrorCode.DATA_CONFLICT) {
                        // Duplicate nodes, rename it, and try again!
                        return simply_immutable_1.replaceImmutable(change, ['node', 'label'], `${change.node.label} (${Date.now().toString().slice(-6)})`);
                    }
                }
                break;
            }
        }
        return null;
    }
    async applyEdgeChangesToService(trc, params, _, notebookID, changes) {
        const curNotebook = await params.graphTransaction.getNode(trc, null, { id: notebookID, type: en_data_model_1.CoreEntityTypes.Notebook });
        if (!curNotebook) {
            throw new conduit_utils_1.NotFoundError(notebookID, `Missing notebook ${notebookID} from local graph storage`);
        }
        const { auth, syncContext } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, curNotebook);
        const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
        if (!syncContextMetadata) {
            throw new conduit_utils_1.NotFoundError(syncContext, `Missing syncContextMetadata ${syncContext}`);
        }
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const nbGuid = Converters_1.convertGuidToService(notebookID, en_data_model_1.CoreEntityTypes.Notebook);
        let recipientSettings;
        let resp;
        let partialNbServiceData = null;
        const serviceData = {
            guid: nbGuid,
        };
        const parentChanges = changes['inputs:parent'];
        if (parentChanges) {
            const parentEdge = Object.values(curNotebook.inputs.parent)[0];
            const oldParent = parentEdge ? conduit_storage_1.getEdgeConnection(parentEdge, notebookID) : null;
            let newParent = oldParent;
            for (const parentID of parentChanges.deletes) {
                if (oldParent && oldParent.id === parentID) {
                    newParent = null;
                }
            }
            for (const edge of parentChanges.creates) {
                newParent = conduit_storage_1.getEdgeConnection(edge, notebookID);
            }
            if (!newParent && !oldParent) {
                // no change
            }
            else if (newParent && oldParent && newParent.id === oldParent.id && newParent.type === oldParent.type) {
                // no change
            }
            else if (!newParent && oldParent && oldParent.type === en_data_model_1.CoreEntityTypes.Workspace) {
                // remove from workspace
                const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
                await utilityStore.moveNotebookToAccount(trc, auth.token, nbGuid);
                resp = await noteStore.getNotebook(trc, auth.token, nbGuid);
            }
            else if (newParent && newParent.type === en_data_model_1.CoreEntityTypes.Workspace) {
                // move to workspace
                serviceData.workspaceGuid = Converters_1.convertGuidToService(newParent.id, en_data_model_1.CoreEntityTypes.Workspace);
                if (!oldParent) {
                    // TODO moveNotebookBetweenAccounts to move from account to workspace?
                }
            }
        }
        const stackChanges = changes['inputs:stack'];
        if (stackChanges) {
            if (stackChanges.deletes.length && !conduit_utils_1.isStashEmpty(curNotebook.inputs.stack)) {
                if (curNotebook.NodeFields.isPartialNotebook) {
                    partialNbServiceData = await LinkedNotebookHelpers_1.updateStackToServiceForPartialNb(trc, params, curNotebook, '');
                }
                else if (syncContextMetadata.isVaultUser || syncContextMetadata.sharedNotebookGlobalID) {
                    // Shared notebook requires empty string for the stack name field to be removed from stack
                    recipientSettings = new ThriftTypes_1.TNotebookRecipientSettings({ stack: '' });
                }
                else {
                    serviceData.stack = null;
                }
            }
            for (const edge of stackChanges.creates) {
                const { id: stackID, type } = conduit_storage_1.getEdgeConnection(edge, notebookID);
                if (type !== en_data_model_1.CoreEntityTypes.Stack) {
                    continue;
                }
                const stackNode = await params.graphTransaction.getNode(trc, null, { id: stackID, type: en_data_model_1.CoreEntityTypes.Stack });
                if (!stackNode) {
                    throw new conduit_utils_1.NotFoundError(stackID, `stack node not found`);
                }
                if (curNotebook.NodeFields.isPartialNotebook) {
                    partialNbServiceData = await LinkedNotebookHelpers_1.updateStackToServiceForPartialNb(trc, params, curNotebook, stackNode.label);
                }
                else if (syncContextMetadata.isVaultUser || syncContextMetadata.sharedNotebookGlobalID) {
                    recipientSettings = new ThriftTypes_1.TNotebookRecipientSettings({ stack: stackNode.label });
                }
                else {
                    serviceData.stack = stackNode.label;
                }
            }
        }
        let skipShare = false;
        if (partialNbServiceData) {
            if (recipientSettings || Object.keys(serviceData).length > 1) {
                throw new Error(`Changes not permitted on partial notebooks ${conduit_utils_1.safeStringify(curNotebook)} ${conduit_utils_1.safeStringify(changes)}`);
            }
            resp = partialNbServiceData;
            skipShare = true;
        }
        if (recipientSettings) {
            // for business user, we need to use personal user auth token for setNotebookRecipientSettings call
            const authToken = (syncContextMetadata.isVaultUser || syncContextMetadata.sharedNotebookGlobalID) && params.personalAuth ? params.personalAuth.token : auth.token;
            resp = await noteStore.setNotebookRecipientSettings(trc, authToken, nbGuid, recipientSettings);
            skipShare = true;
        }
        if (Object.keys(serviceData).length > 1) {
            // thrift call fails if name is not added
            serviceData.name = curNotebook.label;
            resp = await noteStore.updateNotebookWithResultSpec(trc, auth.token, serviceData, {
                includeSharedNotebooks: true,
                includeNotebookRestrictions: true,
                includeNotebookRecipientSettings: true,
            });
            skipShare = false; // assign here too because of the order
        }
        if (resp) {
            await convertNotebookFromServiceImpl(trc, params, syncContext, resp, { skipShare });
        }
        return true;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "onDelete", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "customToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "deleteFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "handleErrorToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Notebook)
], NotebookConverterClass.prototype, "applyEdgeChangesToService", null);
exports.NotebookConverter = new NotebookConverterClass();
//# sourceMappingURL=NotebookConverter.js.map