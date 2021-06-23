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
exports.NoteConverter = exports.getNoteShareUrlPlaceholder = exports.getNoteShareUrl = exports.updateNoteContentToService = exports.fetchAndCacheNoteContentData = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Auth_1 = require("../Auth");
const AccountLimitsConverter = __importStar(require("./AccountLimitsConverter"));
const BlobConverter_1 = require("./BlobConverter");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
const MembershipConverter_1 = require("./MembershipConverter");
const MessageConverter_1 = require("./MessageConverter");
const NotebookConverter_1 = require("./NotebookConverter");
const ProfileConverter_1 = require("./ProfileConverter");
const ResourceConverter_1 = require("./ResourceConverter");
async function shareNoteWithContacts(trc, params, syncContext, syncContextMetadata, inviteParams, title, contacts, splitMessages) {
    if (!params.personalAuth) {
        throw new Error('Personal auth token needed');
    }
    if (!syncContextMetadata || !syncContextMetadata.userID) {
        throw new Error(`Unable to find owningUserID for syncContext ${syncContext}`);
    }
    const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const messageStore = params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl);
    const messageThreads = [];
    const messageBody = MessageConverter_1.validateAndCreateMessageBody(inviteParams.message);
    if (splitMessages) {
        for (const contact of contacts) {
            messageThreads.push({
                message: {
                    body: messageBody,
                    attachments: [{
                            type: en_conduit_sync_types_1.TMessageAttachmentType.NOTE,
                            title,
                            guid: Converters_1.convertGuidToService(inviteParams.note, en_core_entity_types_1.CoreEntityTypes.Note),
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
                body: messageBody,
                attachments: [{
                        type: en_conduit_sync_types_1.TMessageAttachmentType.NOTE,
                        title,
                        guid: Converters_1.convertGuidToService(inviteParams.note, en_core_entity_types_1.CoreEntityTypes.Note),
                        shardId: auth.shard,
                        userId: syncContextMetadata.userID,
                    }],
            },
            participants: contacts,
            groupThread: contacts.length >= 2,
        });
    }
    const shareTemplate = {
        noteGuid: Converters_1.convertGuidToService(inviteParams.note, en_core_entity_types_1.CoreEntityTypes.Note),
        recipientContacts: contacts,
        privilege: inviteParams.privilege,
    };
    const resultingShares = await noteStore.createOrUpdateSharedNotes(trc, auth.token, shareTemplate);
    let firstError = null;
    const membershipsToUnshare = [];
    const invitationsToUnshare = [];
    for (const message of messageThreads) {
        try {
            await messageStore.createMessageThread(trc, params.personalAuth.token, message);
        }
        catch (e) {
            for (const share of resultingShares) {
                if (share.serviceCreated === share.serviceUpdated) {
                    // This call created the share, but was unable to send the invite message. Roll back the share.
                    if (splitMessages) {
                        // Only the problem one should get removed
                        if (share.recipientIdentity.contact.type === en_conduit_sync_types_1.TContactType.EMAIL) {
                            if (share.recipientIdentity.contact.id === message.participants[0].id) {
                                invitationsToUnshare.push(share.recipientIdentity.id);
                            }
                        }
                        else {
                            if (share.recipientIdentity.userId === Number(message.participants[0].id)) {
                                membershipsToUnshare.push(share.recipientIdentity.userId);
                            }
                        }
                    }
                    else {
                        if (share.recipientIdentity.contact.type === en_conduit_sync_types_1.TContactType.EMAIL) {
                            invitationsToUnshare.push(share.recipientIdentity.id);
                        }
                        else {
                            membershipsToUnshare.push(share.recipientIdentity.userId);
                        }
                    }
                }
            }
            firstError = firstError || e;
        }
    }
    if (membershipsToUnshare.length || invitationsToUnshare.length) {
        await noteStore.manageNoteShares(trc, auth.token, {
            noteGuid: inviteParams.note,
            membershipsToUnshare,
            invitationsToUnshare,
        });
    }
    if (firstError) {
        throw firstError;
    }
    return resultingShares;
}
function noteFromService(trc, params, syncContext, syncContextMetadata, serviceData, contentDownloaded = false) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const limits = serviceData.limits || {};
    const noteID = Converters_1.convertGuidFromService(serviceData.guid, en_core_entity_types_1.CoreEntityTypes.Note);
    const contentBlobData = {
        bodyHash: serviceData.contentHash,
        size: serviceData.contentLength,
        body: serviceData.content,
    };
    const isExternal = en_core_entity_types_1.isExternalSyncContext(syncContext);
    const note = {
        id: noteID,
        type: en_core_entity_types_1.CoreEntityTypes.Note,
        version: serviceData.updateSequenceNum || 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: serviceData.title || 'Untitled',
        NodeFields: {
            isMetadata: Boolean(serviceData.isMetadata),
            isUntitled: Boolean(((_a = serviceData.attributes) === null || _a === void 0 ? void 0 : _a.noteTitleQuality) === en_conduit_sync_types_1.EDAM_NOTE_TITLE_QUALITY_UNTITLED),
            deleted: serviceData.deleted || null,
            created: serviceData.created || 0,
            updated: serviceData.updated || 0,
            isExternal,
            content: BlobConverter_1.convertBlobFieldsFromService(contentBlobData),
            thumbnailUrl: serviceData.resources && serviceData.resources.length > 0
                ? ResourceConverter_1.generateResourceUrl(syncContextMetadata, 'thm/note', serviceData.guid) : null,
            // shareUrl is generated on demand by the service (with a different secret at each generation time):
            // http://${host}/shard/${shardId}/sh/${noteGuid}/${secret} (see NoteFieldResolver#fetchCachedShareUrl)
            // Clients can use a placeholder, missing the secret at the end, to show something before asking the service to generate it for real
            shareUrlPlaceholder: getNoteShareUrlPlaceholder(syncContextMetadata, noteID),
            contentDownloaded,
            Attributes: {
                contentClass: ((_b = serviceData.attributes) === null || _b === void 0 ? void 0 : _b.contentClass) || null,
                subjectDate: ((_c = serviceData.attributes) === null || _c === void 0 ? void 0 : _c.subjectDate) || null,
                Location: {
                    latitude: ((_d = serviceData.attributes) === null || _d === void 0 ? void 0 : _d.latitude) || null,
                    longitude: ((_e = serviceData.attributes) === null || _e === void 0 ? void 0 : _e.longitude) || null,
                    altitude: ((_f = serviceData.attributes) === null || _f === void 0 ? void 0 : _f.altitude) || null,
                    placeName: ((_g = serviceData.attributes) === null || _g === void 0 ? void 0 : _g.placeName) || null,
                },
                Reminder: {
                    reminderOrder: ((_h = serviceData.attributes) === null || _h === void 0 ? void 0 : _h.reminderOrder) || null,
                    reminderDoneTime: ((_j = serviceData.attributes) === null || _j === void 0 ? void 0 : _j.reminderDoneTime) || null,
                    reminderTime: ((_k = serviceData.attributes) === null || _k === void 0 ? void 0 : _k.reminderTime) || null,
                },
                Share: {
                    shareDate: ((_l = serviceData.attributes) === null || _l === void 0 ? void 0 : _l.shareDate) || null,
                    sharedWithBusiness: ((_m = serviceData.attributes) === null || _m === void 0 ? void 0 : _m.sharedWithBusiness) || null,
                },
                Editor: {
                    author: ((_o = serviceData.attributes) === null || _o === void 0 ? void 0 : _o.author) || null,
                    lastEditedBy: ((_p = serviceData.attributes) === null || _p === void 0 ? void 0 : _p.lastEditedBy) || null,
                },
                Source: {
                    source: ((_q = serviceData.attributes) === null || _q === void 0 ? void 0 : _q.source) || null,
                    sourceURL: ((_r = serviceData.attributes) === null || _r === void 0 ? void 0 : _r.sourceURL) || null,
                    sourceApplication: ((_s = serviceData.attributes) === null || _s === void 0 ? void 0 : _s.sourceApplication) || null,
                },
            },
            noteResourceCountMax: limits.noteResourceCountMax || null,
            uploadLimit: limits.uploadLimit || null,
            resourceSizeMax: limits.resourceSizeMax || null,
            noteSizeMax: limits.noteSizeMax || null,
            uploaded: limits.uploaded || null,
            internal_shareCountProfiles: {},
        },
        inputs: {
            parent: {},
            sourceNote: {},
            contentHandler: {},
            taskUserSettingsForDefaultNote: {},
        },
        outputs: {
            attachments: {},
            inactiveAttachments: {},
            tags: {},
            creator: {},
            lastEditor: {},
            memberships: {},
            shortcut: {},
            noteContentInfo: {},
            tasks: {},
        },
    };
    if (serviceData.isMetadata) {
        // -1 so that metadata doesn't overwrite real note data
        note.version -= 1;
    }
    // For Business, Creator != Owner so server send creatorId to client
    // For notes from a personal account, syncContextMetadata.userID should work.
    const creatorId = ((_t = serviceData.attributes) === null || _t === void 0 ? void 0 : _t.creatorId) || syncContextMetadata.userID;
    if (creatorId !== null) {
        conduit_storage_1.addOutputEdgeToNode(note, 'creator', {
            id: Converters_1.convertGuidFromService(creatorId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
    }
    else {
        conduit_utils_1.logger.error(`Cannot find Creator ID for note guid ${serviceData.guid}`);
    }
    if (serviceData.attributes && serviceData.attributes.lastEditorId) {
        conduit_storage_1.addOutputEdgeToNode(note, 'lastEditor', {
            id: Converters_1.convertGuidFromService(serviceData.attributes.lastEditorId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
            port: null,
        });
    }
    if (serviceData.notebookGuid) {
        const port = note.NodeFields.deleted ? 'childrenInTrash' : 'children';
        const notebookID = Converters_1.convertGuidFromService(serviceData.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook);
        const wsId = params.backingNbToWs[notebookID];
        if (wsId) {
            // note belongs to backing nb of a workspace. Add direct link to ws instead
            conduit_storage_1.addInputEdgeToNode(note, 'parent', {
                id: wsId,
                port,
                type: en_core_entity_types_1.CoreEntityTypes.Workspace,
            });
        }
        else {
            conduit_storage_1.addInputEdgeToNode(note, 'parent', {
                id: notebookID,
                port,
                type: en_core_entity_types_1.CoreEntityTypes.Notebook,
            });
        }
    }
    if (serviceData.attributes && serviceData.attributes.conflictSourceNoteGuid) {
        conduit_storage_1.addInputEdgeToNode(note, 'sourceNote', {
            id: Converters_1.convertGuidFromService(serviceData.attributes.conflictSourceNoteGuid, en_core_entity_types_1.CoreEntityTypes.Note),
            port: null,
            type: en_core_entity_types_1.CoreEntityTypes.Note,
        });
    }
    const refsPort = serviceData.deleted ? 'refsInTrash' : 'refs';
    for (const tagGuid of (serviceData.tagGuids || [])) {
        conduit_storage_1.addOutputEdgeToNode(note, 'tags', {
            id: Converters_1.convertGuidFromService(tagGuid, en_core_entity_types_1.CoreEntityTypes.Tag),
            port: refsPort,
            type: en_core_entity_types_1.CoreEntityTypes.Tag,
        });
    }
    return note;
}
async function fetchNoteWithContentFromService(trc, thriftComm, auth, noteID) {
    const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const serviceGuid = Converters_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note);
    const specs = new en_conduit_sync_types_1.TNoteResultSpec({ includeContent: true });
    return await noteStore.getNoteWithResultSpec(trc, auth.token, serviceGuid, specs);
}
async function fetchAndCacheNoteContentData(trc, thriftComm, auth, noteID, syncContext, db, localSettings, offlineContentStrategy) {
    const serviceData = await fetchNoteWithContentFromService(trc, thriftComm, auth, noteID);
    await db.transactSyncedStorage(trc, 'fetchAndCacheNoteContentData', async (graphTransaction) => {
        const personalMetadata = await graphTransaction.getSyncContextMetadata(trc, null, conduit_core_1.PERSONAL_USER_CONTEXT);
        const personalUserId = personalMetadata ? personalMetadata.userID : conduit_utils_1.NullUserID;
        const vaultMetadata = await graphTransaction.getSyncContextMetadata(trc, null, conduit_core_1.VAULT_USER_CONTEXT);
        const vaultUserId = vaultMetadata ? vaultMetadata.userID : conduit_utils_1.NullUserID;
        const params = await Helpers_1.makeConverterParams({
            trc,
            graphTransaction,
            personalUserId,
            vaultUserId,
            localSettings,
            offlineContentStrategy,
        });
        await convertNoteFromServiceImpl(trc, params, syncContext, serviceData, { skipShares: true });
    });
    return serviceData.content;
}
exports.fetchAndCacheNoteContentData = fetchAndCacheNoteContentData;
async function getOrFetchNoteContentData(trc, params, auth, curNote, syncContext) {
    const cached = await params.graphTransaction.getNodeCachedField(trc, null, curNote, 'content.content');
    if (cached && !cached.isStale) {
        return cached.values['content.content'];
    }
    const serviceData = await fetchNoteWithContentFromService(trc, params.thriftComm, auth, curNote.id);
    return serviceData.content;
}
async function getNoteServiceNotebookGuid(trc, params, noteID) {
    const note = await params.graphTransaction.getNode(trc, null, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
    if (!note) {
        throw new conduit_utils_1.NotFoundError(noteID, 'note not found');
    }
    const parentEdge = Object.values(note.inputs.parent)[0];
    if (!parentEdge) {
        throw new Error('note has no parent');
    }
    if (parentEdge.srcType === en_core_entity_types_1.CoreEntityTypes.Workspace) {
        const nbId = await params.graphTransaction.getSyncState(trc, null, ['workspaces', 'wsToBackingNb', parentEdge.srcID]);
        if (nbId) {
            return Converters_1.convertGuidToService(nbId, en_core_entity_types_1.CoreEntityTypes.Notebook);
        }
        else {
            throw new conduit_utils_1.NotFoundError(parentEdge.srcID, `Missing workspace to backing nb mapping ${parentEdge.srcID}`);
        }
    }
    if (parentEdge.srcType === en_core_entity_types_1.CoreEntityTypes.Notebook) {
        return Converters_1.convertGuidToService(parentEdge.srcID, en_core_entity_types_1.CoreEntityTypes.Notebook);
    }
    throw new Error('unhandled note parent type: ' + parentEdge.srcType);
}
async function backupNoteOnConflict(trc, params, noteRef) {
    // copy note as a backup, then proceed with setting our new content into the current note
    conduit_utils_1.logger.warn('Note content conflict detected, copying original note to a backup before proceeding', noteRef.id);
    const noteNode = await params.graphTransaction.getNode(trc, null, noteRef);
    if (!noteNode) {
        throw new conduit_utils_1.NotFoundError(noteRef.id, 'Note not found');
    }
    const { auth, syncContext } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, noteNode);
    const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const noteGuid = Converters_1.convertGuidToService(noteRef.id, en_core_entity_types_1.CoreEntityTypes.Note);
    const notebookGuid = await getNoteServiceNotebookGuid(trc, params, noteRef.id);
    let noteCopy = await noteStore.copyNote(trc, auth.token, noteGuid, notebookGuid);
    noteCopy.attributes = noteCopy.attributes || {};
    noteCopy.attributes.conflictSourceNoteGuid = noteGuid;
    noteCopy = await noteStore.updateNote(trc, auth.token, noteCopy);
    // skip processing shares because updateNote does not include shares
    await convertNoteFromServiceImpl(trc, params, syncContext, noteCopy, { skipShares: true });
}
async function convertNoteFromServiceImpl(trc, params, syncContext, serviceData, option = { skipShares: false }) {
    var _a, _b;
    const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
    if (!syncContextMetadata) {
        throw new Error(`no SyncContextMetadata found for syncContext ${syncContext}`);
    }
    const nbID = serviceData.notebookGuid ? Converters_1.convertGuidFromService(serviceData.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook) : undefined;
    const isNbOffline = nbID && (params.offlineContentStrategy === conduit_view_types_1.OfflineContentStrategy.EVERYTHING || params.nbsMarkedOffline && params.nbsMarkedOffline[nbID]);
    let contentDownloaded = false;
    if (isNbOffline) {
        const noteID = Converters_1.convertGuidFromService(serviceData.guid, en_core_entity_types_1.CoreEntityTypes.Note);
        const currentSyncState = await NotebookConverter_1.getPendingOfflineNote(trc, params.graphTransaction, noteID);
        contentDownloaded = conduit_utils_1.isStashEmpty(currentSyncState);
    }
    let note = noteFromService(trc, params, syncContext, syncContextMetadata, serviceData, contentDownloaded);
    await Helpers_1.ensureIsExternal(trc, params, syncContext, note);
    const prevNote = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, note);
    if (prevNote && prevNote.version > note.version) {
        // new note data is out of date and did not get stored, so don't do any of the membership and attachment reconciliation
        return false;
    }
    if (note.NodeFields.isMetadata && !prevNote) {
        // skip further processing for metadata notes
        return !prevNote;
    }
    if (option.editSequenceNumber !== undefined) {
        await params.graphTransaction.setNodeCachedField(trc, note, 'content.editSequenceNumber', option.editSequenceNumber, {});
    }
    else if (prevNote && prevNote.NodeFields.content.hash !== note.NodeFields.content.hash) {
        const editSequenceNumber = ((_b = (_a = prevNote.CacheFields) === null || _a === void 0 ? void 0 : _a['content.editSequenceNumber']) !== null && _b !== void 0 ? _b : 0) + 1;
        await params.graphTransaction.setNodeCachedField(trc, note, 'content.editSequenceNumber', editSequenceNumber, {});
        en_core_entity_types_1.NoteConflictLogger.logEvent(note.id, 'note_content_changed_remote', {
            usn: serviceData.updateSequenceNum,
            hash: note.NodeFields.content.hash,
            editSequenceNumber,
        });
    }
    const membershipIDs = !option.skipShares ? await updateSharesForNote(trc, params, syncContext, serviceData, note) : {};
    // updateSharesForNote will update internal_shareCountProfiles based on shares. So, we need to update Note again
    // unless both prevNote and current note don't have shareCountProfiles which means note has no shares.
    const skipShareCountUpdate = conduit_utils_1.isStashEmpty((prevNote === null || prevNote === void 0 ? void 0 : prevNote.NodeFields.internal_shareCountProfiles) || {}) && conduit_utils_1.isStashEmpty(note.NodeFields.internal_shareCountProfiles);
    if (!skipShareCountUpdate) {
        // If skipShares is true, updateSharesForNote is not processed. So need to preserve internal_shareCountProfiles from prevNote.
        const noteObjToCommit = prevNote && option.skipShares ? prevNote : note;
        await params.graphTransaction.updateNode(trc, syncContext, note, {
            NodeFields: {
                internal_shareCountProfiles: noteObjToCommit.NodeFields.internal_shareCountProfiles,
            },
        });
        // we do not have to request new note object after run `updateNode` method.
    }
    const noteOfflineSyncState = nbID ? {
        needsInit: false,
        notebookID: nbID,
    } : undefined;
    const resources = serviceData.resources || [];
    if (resources.length) {
        for (const resource of resources) {
            await ResourceConverter_1.ResourceConverter.convertFromService(trc, params, syncContext, resource, nbID, noteOfflineSyncState);
        }
        // resources will update the note, so refetch
        note = (await params.graphTransaction.getNode(trc, null, note));
    }
    await BlobConverter_1.fillBlobCache(trc, params.graphTransaction, note, 'content', note.NodeFields.content, serviceData.content);
    if (prevNote) {
        if (!option.skipShares) {
            // Remove the shares that have been removed from the note
            await deleteOldSharesForNote(trc, params, syncContext, membershipIDs, prevNote);
        }
        // delete removed active attachments (do NOT remove inactive attachments, as we added those through
        // uploading and want to keep them until they are activated)
        const newAttachmentIDs = resources.map(r => Converters_1.convertGuidFromService(r.guid, en_core_entity_types_1.CoreEntityTypes.Attachment));
        const oldAttachmentEdges = Object.values(prevNote.outputs.attachments);
        for (const edge of oldAttachmentEdges) {
            const oldAttachmentID = edge.dstID;
            if (!newAttachmentIDs.includes(oldAttachmentID)) {
                await params.graphTransaction.deleteNode(trc, syncContext, { id: oldAttachmentID, type: en_core_entity_types_1.CoreEntityTypes.Attachment });
            }
        }
    }
    // check if note content needs to be downloaded.
    if (isNbOffline && noteOfflineSyncState && nbID) {
        if (!prevNote || BlobConverter_1.hasBlobChanged(prevNote.NodeFields.content, note.NodeFields.content)) {
            noteOfflineSyncState.fetchContent = true;
        }
        if (noteOfflineSyncState.fetchContent || !conduit_utils_1.isStashEmpty(noteOfflineSyncState.resources)) {
            await NotebookConverter_1.updateContentDownloadForNote(trc, params.graphTransaction, syncContext, note.id, false);
            await NotebookConverter_1.updatePendingOfflineNoteSyncState(trc, params.graphTransaction, note.id, noteOfflineSyncState);
            conduit_utils_1.traceEventStart(trc, 'updateContentDownloadForNotebook');
            await conduit_utils_1.traceEventEndWhenSettled(trc, 'updateContentDownloadForNotebook', NotebookConverter_1.updateContentDownloadForNotebook(trc, params.graphTransaction, nbID, false));
        }
    }
    return !prevNote;
}
async function getNotebookGuid(trc, params, note) {
    const notebookEdge = conduit_utils_1.firstStashEntry(note.inputs.parent);
    if (!notebookEdge) {
        return null;
    }
    if (notebookEdge.srcType === en_core_entity_types_1.CoreEntityTypes.Workspace) {
        // lookup backing notebook for workspace
        const workspaceID = notebookEdge.srcID;
        const nbId = await params.graphTransaction.getSyncState(trc, null, ['workspaces', 'wsToBackingNb', workspaceID]);
        if (nbId) {
            return Converters_1.convertGuidToService(nbId, en_core_entity_types_1.CoreEntityTypes.Notebook);
        }
        else {
            throw new conduit_utils_1.NotFoundError(workspaceID, 'workspace to backing nb mapping not found');
        }
    }
    return Converters_1.convertGuidToService(notebookEdge.srcID, notebookEdge.srcType);
}
async function updateNote(trc, params, curNote, noteServiceData, hashUpdate, editSequenceNumber) {
    if (noteServiceData.hasOwnProperty('notebookGuid') && noteServiceData.notebookGuid === await getNotebookGuid(trc, params, curNote)) {
        // no change
        delete noteServiceData.notebookGuid;
    }
    if (noteServiceData.tagGuids) {
        const curTagGuids = new Set(Object.values(curNote.outputs.tags || {}).map(edge => Converters_1.convertGuidToService(edge.dstID, en_core_entity_types_1.CoreEntityTypes.Tag)));
        const newTagGuids = new Set(noteServiceData.tagGuids);
        if (conduit_utils_1.setEquals(curTagGuids, newTagGuids)) {
            // no change
            delete noteServiceData.tagGuids;
        }
    }
    if (conduit_utils_1.isStashEmpty(noteServiceData)) {
        // no change to upsync
        if (editSequenceNumber !== undefined) {
            await params.graphTransaction.setNodeCachedField(trc, curNote, 'content.editSequenceNumber', editSequenceNumber, {});
        }
        return;
    }
    noteServiceData.guid = Converters_1.convertGuidToService(curNote.id, en_core_entity_types_1.CoreEntityTypes.Note);
    noteServiceData.updateSequenceNum = curNote.version;
    if (!noteServiceData.hasOwnProperty('title')) {
        // The Thrift API requires the title to be set for all updateNote calls for no good reason
        noteServiceData.title = curNote.label;
    }
    const { auth, syncContext } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, curNote);
    const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
    const res = await utilityStore.updateNoteIfUsnMatches(trc, auth.token, noteServiceData, hashUpdate !== null && hashUpdate !== void 0 ? hashUpdate : {});
    conduit_utils_1.traceTestCounts(trc, {
        'NoteConverter.updateNote': 1,
        'NoteConverter.updateNote.success': res.updated ? 1 : 0,
    });
    const resNote = res.note;
    if (!res.updated) {
        // usn mismatch between local and remote, apply new note data back to local graph and retry (using handleErrorToService mechanism)
        if (resNote) {
            const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
            const specs = new en_conduit_sync_types_1.TNoteResultSpec({ includeContent: true, includeSharedNotes: true });
            const latestNote = await noteStore.getNoteWithResultSpec(trc, auth.token, noteServiceData.guid, specs);
            await convertNoteFromServiceImpl(trc, params, syncContext, latestNote);
        }
        en_core_entity_types_1.NoteConflictLogger.logEvent(curNote.id, 'usn_mismatch', {
            noteInResponse: Boolean(resNote),
            reqUsn: noteServiceData.updateSequenceNum,
            resUsn: resNote === null || resNote === void 0 ? void 0 : resNote.updateSequenceNum,
            resHash: Helpers_1.convertHashFromService(resNote === null || resNote === void 0 ? void 0 : resNote.contentHash),
        });
        throw new conduit_utils_1.ConflictError(curNote.id, en_core_entity_types_1.CoreEntityTypes.Note, resNote ? 'NotePresent' : 'NoteAbsent');
    }
    if (resNote) {
        en_core_entity_types_1.NoteConflictLogger.logEvent(curNote.id, 'note_upsynced', {
            reqUsn: noteServiceData.updateSequenceNum,
            resUsn: resNote.updateSequenceNum,
            resHash: Helpers_1.convertHashFromService(resNote.contentHash),
        });
        if (noteServiceData.content) {
            // shove result blob data back into our synced graph storage (so we don't refetch it)
            const contentBlobData = {
                bodyHash: resNote.contentHash,
                size: resNote.contentLength,
                body: resNote.content || noteServiceData.content,
            };
            await BlobConverter_1.updateBlobToGraph(trc, params.graphTransaction, contentBlobData, curNote, 'content', syncContext);
        }
        // not converting shares into memberships because updateNoteIfUsnMatches does not return existing shares.
        await convertNoteFromServiceImpl(trc, params, syncContext, resNote, { skipShares: true, editSequenceNumber });
    }
    else {
        en_core_entity_types_1.NoteConflictLogger.logEvent(curNote.id, 'no_note_resp', {
            reqUsn: noteServiceData.updateSequenceNum,
        });
    }
}
async function updateNoteContentToService(trc, params, noteID, syncContext, remoteFields, content, hash) {
    const noteRef = { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
    const curNote = await params.graphTransaction.getNode(trc, null, noteRef);
    if (!curNote) {
        throw new conduit_utils_1.NotFoundError(noteRef.id, `Missing note ${noteRef.id} from local graph storage`);
    }
    let noteServiceData = {
        content,
        updated: remoteFields.updated,
    };
    let hadConflict = false;
    if (remoteFields.prevNoteHash) {
        const contentIsInExpectedState = (
        // check if currently synced blob hash is equal to the expected previous value
        (curNote.NodeFields.content.hash === remoteFields.prevNoteHash) ||
            // or if the currently synced blob hash is equal to what we are trying to set
            (curNote.NodeFields.content.hash === hash));
        if (!contentIsInExpectedState) {
            hadConflict = true;
            en_core_entity_types_1.NoteConflictLogger.logEvent(noteRef.id, 'conflict_detected', {
                clientPrevNoteHash: remoteFields.prevNoteHash,
                mutatorPrevNoteHash: remoteFields.graphPrevNoteHash,
                actualNoteHash: curNote.NodeFields.content.hash,
                actualNoteSize: curNote.NodeFields.content.size,
            });
            en_core_entity_types_1.NoteConflictLogger.dumpEventsForKey('warn', noteRef.id);
            try {
                await backupNoteOnConflict(trc, params, noteRef);
                conduit_utils_1.recordEvent({ category: 'note', action: 'merge_conflict', noteID: noteRef.id });
            }
            catch (err) {
                conduit_utils_1.logger.error('Failed to copy note on content hash conflict', err);
            }
        }
    }
    let hashDiff = remoteFields.hashDiff;
    if (!hashDiff || hadConflict) {
        // diff resource hashes in new content against old content to get the resourcesUpdate
        const { auth } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, curNote);
        const oldContent = await getOrFetchNoteContentData(trc, params, auth, curNote, syncContext);
        hashDiff = conduit_core_1.extractResourceHashDiff(oldContent, content);
    }
    if (curNote.NodeFields.content.hash === hash) {
        // noop, skip upsync (but still let updateNote modify editSequenceNumber if it needs to)
        noteServiceData = {};
    }
    await updateNote(trc, params, curNote, noteServiceData, conduit_core_1.hashDiffToResourceUpdate(hashDiff), remoteFields.editSequenceNumber);
}
exports.updateNoteContentToService = updateNoteContentToService;
function getNoteShareUrl(host, shard, noteID, secret) {
    return `${host}/shard/${shard}/sh/${noteID}/${secret}`;
}
exports.getNoteShareUrl = getNoteShareUrl;
function getNoteShareUrlPlaceholder(syncContextMetadata, noteID) {
    const auth = Auth_1.decodeAuthData(syncContextMetadata.authToken);
    return getNoteShareUrl(auth.urlHost, auth.shard, noteID, '');
}
exports.getNoteShareUrlPlaceholder = getNoteShareUrlPlaceholder;
// Translate note attributes from graph node to service.
// Service replaces attributes in updateNote call. Need to populate all attributes.
function fillNoteAttributes(serviceData, attributesChanges, isUntitled, creatorUserId, curNote) {
    const attributes = curNote ? SimplyImmutable.deepUpdateImmutable(curNote.NodeFields.Attributes, attributesChanges) : attributesChanges;
    const serviceAttributes = {};
    serviceAttributes.subjectDate = attributes.subjectDate;
    serviceAttributes.noteTitleQuality = isUntitled ? en_conduit_sync_types_1.EDAM_NOTE_TITLE_QUALITY_UNTITLED : null;
    serviceAttributes.contentClass = attributes.contentClass;
    const sEdge = curNote && conduit_utils_1.firstStashEntry(curNote.inputs.sourceNote);
    const sourceNoteID = sEdge ? sEdge.srcID : null;
    serviceAttributes.conflictSourceNoteGuid = sourceNoteID ? Converters_1.convertGuidToService(sourceNoteID, en_core_entity_types_1.CoreEntityTypes.Note) : null;
    if (attributes.Location) {
        serviceAttributes.latitude = attributes.Location.latitude;
        serviceAttributes.longitude = attributes.Location.longitude;
        serviceAttributes.altitude = attributes.Location.altitude;
        serviceAttributes.placeName = attributes.Location.placeName;
    }
    if (attributes.Reminder) {
        serviceAttributes.reminderTime = attributes.Reminder.reminderTime;
        serviceAttributes.reminderOrder = attributes.Reminder.reminderOrder;
        serviceAttributes.reminderDoneTime = attributes.Reminder.reminderDoneTime;
    }
    if (attributes.Share) {
        serviceAttributes.shareDate = attributes.Share.shareDate;
        serviceAttributes.sharedWithBusiness = attributes.Share.sharedWithBusiness;
    }
    const lEdge = curNote && conduit_utils_1.firstStashEntry(curNote.outputs.lastEditor);
    const lastEditorId = lEdge ? lEdge.dstID : null;
    if (attributes.Editor) {
        serviceAttributes.author = attributes.Editor.author;
        serviceAttributes.creatorId = creatorUserId;
        serviceAttributes.lastEditorId = lastEditorId ? Number(Converters_1.convertGuidToService(lastEditorId, en_core_entity_types_1.CoreEntityTypes.Profile)) : null;
        serviceAttributes.lastEditedBy = attributes.Editor.lastEditedBy;
    }
    if (attributes.Source) {
        serviceAttributes.source = attributes.Source.source;
        serviceAttributes.sourceURL = attributes.Source.sourceURL;
        serviceAttributes.sourceApplication = attributes.Source.sourceApplication;
    }
    serviceData.attributes = serviceAttributes;
}
async function updateSharesForNote(trc, params, syncContext, serviceData, note) {
    const createdIds = {};
    for (const share of (serviceData.sharedNotes || [])) {
        // This will add entries into note.internal_shareCountProfiles, and must be called before writing to the DB
        await MembershipConverter_1.MembershipConverter.convertFromService(trc, params, syncContext, share, note);
        const membershipID = MembershipConverter_1.convertSharedNoteMembershipGuidFromService(note.id, share.recipientIdentity).id;
        createdIds[membershipID] = true;
    }
    return createdIds;
}
async function deleteOldSharesForNote(trc, params, syncContext, newIDs, oldNote) {
    const oldMembershipEdges = oldNote ? oldNote.outputs.memberships : {};
    for (const key in oldMembershipEdges) {
        const edge = oldMembershipEdges[key];
        const id = edge.dstID;
        if (!newIDs[id]) {
            await MembershipConverter_1.deleteMembershipHelper(trc, params, syncContext, id);
        }
    }
}
class NoteConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Note;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, serviceData, option = { skipShares: false }) {
        return await convertNoteFromServiceImpl(trc, params, syncContext, serviceData, option);
    }
    async customToService(trc, params, commandRun, syncContext) {
        switch (commandRun.command) {
            case 'setShare': {
                const shareParams = commandRun.params;
                const noteNode = await params.graphTransaction.getNode(trc, null, { id: shareParams.note, type: en_core_entity_types_1.CoreEntityTypes.Note });
                if (!noteNode) {
                    throw new conduit_utils_1.NotFoundError(shareParams.note, 'Note not found');
                }
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                if (shareParams.enable) {
                    const secret = await noteStore.shareNote(trc, auth.token, Converters_1.convertGuidToService(shareParams.note, en_core_entity_types_1.CoreEntityTypes.Note));
                    const shareUrl = getNoteShareUrl(auth.urlHost, auth.shard, shareParams.note, secret);
                    const note = await noteStore.getNote(trc, auth.token, Converters_1.convertGuidToService(shareParams.note, en_core_entity_types_1.CoreEntityTypes.Note), false, false, false, false);
                    if (note.attributes && note.attributes.shareDate) {
                        await params.graphTransaction.updateNode(trc, syncContext, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: shareParams.note }, {
                            NodeFields: {
                                Attributes: { Share: { shareDate: note.attributes.shareDate } },
                            },
                        });
                        await params.graphTransaction.setNodeCachedField(trc, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: shareParams.note }, 'shareUrl', shareUrl, { 'Attributes.Share.shareDate': note.attributes.shareDate });
                    }
                    return shareUrl;
                }
                else {
                    await noteStore.stopSharingNote(trc, auth.token, Converters_1.convertGuidToService(shareParams.note, en_core_entity_types_1.CoreEntityTypes.Note));
                    await params.graphTransaction.updateNode(trc, syncContext, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: shareParams.note }, {
                        NodeFields: {
                            Attributes: { Share: { shareDate: null } },
                        },
                    });
                    await params.graphTransaction.setNodeCachedField(trc, { type: en_core_entity_types_1.CoreEntityTypes.Note, id: shareParams.note }, 'shareUrl', null, { 'Attributes.Share.shareDate': null });
                }
                return null;
            }
            case 'NoteInvite': {
                if (!params.personalAuth) {
                    throw new Error('Personal auth token needed');
                }
                const inviteMutationParams = commandRun.params;
                const inviteParams = Object.assign(Object.assign({}, inviteMutationParams), { privilege: MembershipConverter_1.membershipPrivilegeToSharedNotePrivilegeLevel(inviteMutationParams.privilege) });
                const noteNode = await params.graphTransaction.getNode(trc, null, { id: inviteParams.note, type: en_core_entity_types_1.CoreEntityTypes.Note });
                if (!noteNode) {
                    throw new conduit_utils_1.NotFoundError(inviteParams.note, 'Note not found');
                }
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
                const note = await noteStore.getNote(trc, auth.token, Converters_1.convertGuidToService(inviteParams.note, en_core_entity_types_1.CoreEntityTypes.Note), false, false, false, false);
                const contacts = [];
                const emailContacts = [];
                if (!syncContextMetadata || !syncContextMetadata.userID) {
                    throw new Error(`Unable to find owningUserID for syncContext ${syncContext}`);
                }
                if (!note) {
                    throw new conduit_utils_1.NotFoundError(Converters_1.convertGuidToService(inviteParams.note, en_core_entity_types_1.CoreEntityTypes.Note), `Unable to find note`);
                }
                const profileIDs = inviteParams.profileIDs || [];
                if (inviteParams.userIDs) {
                    conduit_utils_1.logger.warn('Note invite userIDs is deprecated, please use profileIDs');
                    profileIDs.push(...inviteParams.userIDs);
                }
                if (inviteParams.profileIDs) {
                    for (const profileID of inviteParams.profileIDs) {
                        const emailAndID = await ProfileConverter_1.getUserProfileIDAndEmailFromProfileID(trc, params.graphTransaction, profileID);
                        if (emailAndID.email) {
                            emailContacts.push({
                                id: emailAndID.email,
                                type: en_conduit_sync_types_1.TContactType.EMAIL,
                            });
                            // prefer email as id fails if users are not connected
                        }
                        else if (emailAndID.profileID) {
                            const contactWithUserId = {
                                id: Converters_1.convertGuidToService(emailAndID.profileID, en_core_entity_types_1.CoreEntityTypes.Profile),
                                type: en_conduit_sync_types_1.TContactType.EVERNOTE,
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
                }
                if (inviteParams.emails) {
                    for (const email of inviteParams.emails) {
                        emailContacts.push({
                            id: email,
                            type: en_conduit_sync_types_1.TContactType.EMAIL,
                        });
                    }
                }
                let allShares = [];
                if (contacts.length) {
                    allShares = allShares.concat(await shareNoteWithContacts(trc, params, syncContext, syncContextMetadata, inviteParams, note.title || 'Untitled Note', contacts, false));
                    await AccountLimitsConverter.updateNodeTypeCount(trc, params.graphTransaction, syncContext, en_core_entity_types_1.CoreEntityTypes.Notebook, contacts.length, 'userNoteAndNotebookSharesSentCount');
                }
                if (emailContacts.length) {
                    allShares = allShares.concat(await shareNoteWithContacts(trc, params, syncContext, syncContextMetadata, inviteParams, note.title || 'Untitled Note', emailContacts, true));
                    await AccountLimitsConverter.updateNodeTypeCount(trc, params.graphTransaction, syncContext, en_core_entity_types_1.CoreEntityTypes.Notebook, emailContacts.length, 'userNoteAndNotebookSharesSentCount');
                }
                if (allShares.length) {
                    return {
                        id: MembershipConverter_1.convertSharedNoteMembershipGuidFromService(inviteParams.note, allShares[0].recipientIdentity).id,
                        type: en_core_entity_types_1.CoreEntityTypes.Membership,
                    };
                }
                // Contrary to createOrUpdateNotebookSharesc(), reateOrUpdateSharedNotes()
                // returns a record if there was already an identical share record.
                // So we return an error if service didn't return anything, instead of null for notebooks.
                // A common case is resending a pending invitation.
                throw new Error('Service returned no new memberships');
            }
            case 'sendByEmail': {
                const commandParams = commandRun.params;
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                await noteStore.emailNote(trc, auth.token, {
                    guid: Converters_1.convertGuidToService(commandParams.note, en_core_entity_types_1.CoreEntityTypes.Note),
                    toAddresses: commandParams.toEmails,
                    ccAddresses: commandParams.ccEmails,
                    subject: commandParams.subject,
                    message: commandParams.message,
                });
                return null;
            }
            case 'noteSetAppData': {
                const commandParams = commandRun.params;
                const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
                const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                const guid = Converters_1.convertGuidToService(commandParams.id, en_core_entity_types_1.CoreEntityTypes.Note);
                if (commandParams.value !== null) {
                    await noteStore.setNoteApplicationDataEntry(trc, auth.token, guid, commandParams.key, commandParams.value);
                }
                else {
                    await noteStore.unsetNoteApplicationDataEntry(trc, auth.token, guid, commandParams.key);
                }
                return null;
            }
            default:
                throw new Error(`Unknown customToService command for Note ${commandRun.command}`);
        }
    }
    async createOrGetNote(trc, thriftComm, auth, serviceData, noteID) {
        const noteStore = thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const res = await conduit_utils_1.withError(noteStore.createNote(trc, auth.token, serviceData));
        if (res.err) {
            const err = res.err;
            if (err instanceof conduit_utils_1.ServiceError && err.errorType === 'DATA_CONFLICT' && err.errorKey === 'Note.guid' && err.errorCode === 10) {
                // guid is already in use, probably this is a retry
                const guid = Converters_1.convertGuidToService(noteID, en_core_entity_types_1.CoreEntityTypes.Note);
                return await noteStore.getNote(trc, auth.token, guid, true, true, false, false);
            }
            else {
                throw err;
            }
        }
        en_core_entity_types_1.NoteConflictLogger.logEvent(noteID, 'note_created', {
            respHash: Helpers_1.convertHashFromService(res.data.contentHash),
        });
        // shove content string into service response so it gets cached in the content blob
        res.data.content = serviceData.content;
        return res.data;
    }
    async fetchNoteApplicationData(trc, params, noteID) {
        if (!noteID) {
            return undefined;
        }
        const note = await params.graphTransaction.getNode(trc, null, { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
        if (!note) {
            return undefined;
        }
        const { auth } = await Helpers_1.getAuthAndSyncContextForNode(trc, params.graphTransaction, params.authCache, note);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        const { data: applicationData } = await conduit_utils_1.withError(noteStore.getNoteApplicationData(trc, auth.token, Converters_1.convertGuidToService(note.id, en_core_entity_types_1.CoreEntityTypes.Note)));
        return applicationData;
    }
    async createOnService(trc, params, syncContext, note, serviceGuidSeed, remoteFields, blobs) {
        var _a;
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const serviceData = {
            seed: serviceGuidSeed,
            title: note.label || 'Untitled',
            content: ((_a = blobs === null || blobs === void 0 ? void 0 : blobs.content) === null || _a === void 0 ? void 0 : _a.content) || en_core_entity_types_1.DEFAULT_NOTE_CONTENT,
            active: !note.NodeFields.deleted,
            created: note.NodeFields.created,
            updated: note.NodeFields.updated,
        };
        fillNoteAttributes(serviceData, note.NodeFields.Attributes, note.NodeFields.isUntitled, auth.userID);
        if (remoteFields.notebookID) {
            serviceData.notebookGuid = Converters_1.convertGuidToService(remoteFields.notebookID, en_core_entity_types_1.CoreEntityTypes.Notebook);
        }
        else if (remoteFields.workspaceID) {
            // lookup backing notebook for workspace
            const nbId = await params.graphTransaction.getSyncState(trc, null, ['workspaces', 'wsToBackingNb', remoteFields.workspaceID]);
            if (nbId) {
                serviceData.notebookGuid = Converters_1.convertGuidToService(nbId, en_core_entity_types_1.CoreEntityTypes.Notebook);
            }
            else {
                throw new conduit_utils_1.NotFoundError(remoteFields.workspaceID, 'workspace to backing nb mapping not found');
            }
        }
        if (remoteFields.tagIDs.length) {
            serviceData.tagGuids = remoteFields.tagIDs.map(id => Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Tag));
        }
        const resp = await this.createOrGetNote(trc, params.thriftComm, auth, serviceData, note.id);
        if (resp.guid !== Converters_1.convertGuidToService(note.id, en_core_entity_types_1.CoreEntityTypes.Note)) {
            throw new conduit_utils_1.InternalError(`Service generated a different guid than Conduit: ${note.id} vs ${resp.guid}`);
        }
        await convertNoteFromServiceImpl(trc, params, syncContext, resp);
        if (remoteFields.attachmentHashes.length) {
            const curNote = await params.graphTransaction.getNode(trc, null, { id: note.id, type: en_core_entity_types_1.CoreEntityTypes.Note });
            if (!curNote) {
                throw new conduit_utils_1.InternalError(`Failed to fetch newly created note from the graph right after upsyncing it: ${note.id}`);
            }
            await updateNote(trc, params, curNote, {
                // pipe through updated timestamp so that it doesn't change
                updated: resp.updated,
            }, {
                activateResourcesWithBodyHashes: remoteFields.attachmentHashes,
                deactivateResourcesWithBodyHashes: [],
            }, 0);
        }
        // if a sourceNoteID is specified and no applicationData is passed in, do a last-minute best-effort fetch of the source note applicationData to apply here
        const applicationData = remoteFields.applicationData || await this.fetchNoteApplicationData(trc, params, remoteFields.sourceNoteID);
        if (applicationData) {
            const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
            for (const key in applicationData) {
                const value = applicationData[key];
                await noteStore.setNoteApplicationDataEntry(trc, auth.token, resp.guid, key, value);
            }
        }
        return true;
    }
    async deleteFromService(trc, params, syncContext, noteIDs) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
        // expungeNotes thrift call recommends deleting 100 notes or less in each call.
        const batchNoteIDs = conduit_utils_1.chunkArray(noteIDs, 100);
        for (const noteIDChunk of batchNoteIDs) {
            await noteStore.expungeNotes(trc, auth.token, noteIDChunk.map(id => Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Note)));
        }
        return false;
    }
    async updateToService(trc, params, syncContext, noteID, diff) {
        const noteRef = { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        const curNote = await params.graphTransaction.getNode(trc, null, noteRef);
        if (!curNote) {
            throw new conduit_utils_1.NotFoundError(noteRef.id, `Missing note ${noteRef.id} from local graph storage`);
        }
        let hasChanges = false;
        const serviceData = {};
        let attributesChanges = {};
        const NodeFields = diff.NodeFields;
        if (diff.hasOwnProperty('label')) {
            hasChanges = true;
            serviceData.title = diff.label;
        }
        if (NodeFields && NodeFields.hasOwnProperty('deleted')) {
            hasChanges = true;
            serviceData.active = !NodeFields.deleted;
        }
        if (NodeFields && NodeFields.hasOwnProperty('created')) {
            hasChanges = true;
            serviceData.created = NodeFields.created;
        }
        if (NodeFields && NodeFields.hasOwnProperty('updated')) {
            hasChanges = true;
            serviceData.updated = NodeFields.updated;
        }
        if ((NodeFields && NodeFields.Attributes) || Object.keys(attributesChanges).length || (NodeFields && NodeFields.hasOwnProperty('isUntitled'))) {
            hasChanges = true;
            const isUntitled = Boolean(NodeFields && NodeFields.hasOwnProperty('isUntitled') ? NodeFields.isUntitled : curNote.NodeFields.isUntitled);
            if (NodeFields && NodeFields.Attributes) {
                attributesChanges = SimplyImmutable.deepUpdateImmutable(NodeFields.Attributes, attributesChanges);
            }
            const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
            fillNoteAttributes(serviceData, attributesChanges, isUntitled, (syncContextMetadata === null || syncContextMetadata === void 0 ? void 0 : syncContextMetadata.userID) || conduit_utils_1.NullUserID, curNote);
        }
        if (hasChanges) {
            await updateNote(trc, params, curNote, serviceData, null, undefined);
        }
        return true;
    }
    async handleErrorToService(trc, err, params, change) {
        if (err instanceof conduit_utils_1.ConflictError) {
            if (err.message === 'NoteAbsent') {
                // we didn't get new note data back from the service, so throw a RetryError to wait for downsync to update it
                throw new conduit_utils_1.RetryError(err.message, 500);
            }
            return change;
        }
        switch (change.changeType) {
            case 'Node:CREATE': {
                if (err instanceof conduit_utils_1.AuthError) {
                    if (err.errorCode === conduit_utils_1.AuthErrorCode.PERMISSION_DENIED) {
                        // Request has failed because of insufficient privileges for the container.
                        // Attempt to fallback to a container that we have create privileges in...
                        const user = await params.graphTransaction.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.User, id: conduit_core_1.PERSONAL_USER_ID });
                        if (!user) {
                            throw new Error('User not found');
                        }
                        const defaultNotebook = conduit_utils_1.firstStashEntry(user.outputs.defaultNotebook);
                        const changeUpdatePath = ['remoteFields', 'notebookID'];
                        const hasFailedInDefault = defaultNotebook && change.remoteFields && defaultNotebook.dstID === change.remoteFields.notebookID;
                        if (!defaultNotebook || hasFailedInDefault) {
                            // It appears we've lost access to the default notebook, resync it before we try again...
                            const auth = params.personalAuth;
                            const noteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
                            let nextDefaultNotebook;
                            try {
                                nextDefaultNotebook = await noteStore.getDefaultNotebook(trc, auth.token);
                            }
                            catch (e) {
                                // There was an issue creating the note in the default notebook, fallback to the user notebook.
                                conduit_utils_1.logger.error(e);
                                if (user.NodeFields.serviceLevel !== en_conduit_sync_types_1.ServiceLevel.BUSINESS) {
                                    // It should be unrealistic for a non-business user to loose access to their default notebook.
                                    throw new Error('Personal user has no default notebook!');
                                }
                                // FIXME SB-902 Currently the service has an open issue where it is not proactively
                                // setting a new value for the default notebook when it should change, for example
                                // in a case where the user has lost access it it. Once this issue is addressed
                                // by the service, we can remove most of this defensive coding.
                                const userNotebook = user && conduit_utils_1.firstStashEntry(user.outputs.userNotebook);
                                if (!userNotebook) {
                                    // A business user with no user notebook is an unrealistic scenario.
                                    throw new Error('Missing user notebook!');
                                }
                                if (!defaultNotebook || e instanceof conduit_utils_1.AuthError) {
                                    // Retry with user notebook.
                                    return SimplyImmutable.replaceImmutable(change, changeUpdatePath, userNotebook.dstID);
                                }
                                // Unhandled error, retry same request again.
                                return SimplyImmutable.replaceImmutable(change, changeUpdatePath, defaultNotebook.dstID);
                            }
                            // Update conduit's state with the new default notebook.
                            await NotebookConverter_1.NotebookConverter.convertFromService(trc, params, conduit_core_1.PERSONAL_USER_CONTEXT, nextDefaultNotebook);
                            // Retry the request with the correct default notebook.
                            return SimplyImmutable.replaceImmutable(change, changeUpdatePath, Converters_1.convertGuidFromService(nextDefaultNotebook.guid, en_core_entity_types_1.CoreEntityTypes.Notebook));
                        }
                        // Retry the request, this time with the default notebook.
                        return SimplyImmutable.replaceImmutable(change, changeUpdatePath, defaultNotebook.dstID);
                    }
                }
                break;
            }
            case 'Node:DELETE_MULTI': {
                if (err instanceof conduit_utils_1.ServiceError && err.errorType === 'EDAMNotFoundException') {
                    const { message } = err;
                    const messageTokenPairs = message.split(' ').map(token => (token.split('=')));
                    if (messageTokenPairs.length >= 1 && messageTokenPairs[1].length > 0 && messageTokenPairs[1][0] === 'key') {
                        const nodes = change.nodes.filter(node => node.id !== messageTokenPairs[1][1]);
                        if (nodes.length === 0) {
                            return null;
                        }
                        const changeUpdatePath = ['nodes'];
                        return SimplyImmutable.replaceImmutable(change, changeUpdatePath, nodes);
                    }
                }
            }
        }
        return null;
    }
    async applyEdgeChangesToService(trc, params, syncContext, nodeID, changes) {
        var _a;
        const noteRef = { id: nodeID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        const curNote = await params.graphTransaction.getNode(trc, null, noteRef);
        if (!curNote) {
            throw new conduit_utils_1.NotFoundError(noteRef.id, `Missing note ${noteRef.id} from local graph storage`);
        }
        const serviceData = {};
        const tagsChanges = changes['outputs:tags'];
        if (tagsChanges) {
            // Thrift requires all tags, not deltas
            serviceData.tagGuids = Object.values(curNote.outputs.tags || {}).map(edge => Converters_1.convertGuidToService(edge.dstID, en_core_entity_types_1.CoreEntityTypes.Tag));
            for (const tagID of tagsChanges.deletes) {
                if (tagID) {
                    const removedTagGuid = Converters_1.convertGuidToService(tagID, en_core_entity_types_1.CoreEntityTypes.Tag);
                    serviceData.tagGuids = serviceData.tagGuids.filter(guid => guid !== removedTagGuid);
                }
                else {
                    serviceData.tagGuids = [];
                }
            }
            for (const edge of tagsChanges.creates) {
                const { id, type } = conduit_storage_1.getEdgeConnection(edge, nodeID);
                if (type === en_core_entity_types_1.CoreEntityTypes.Tag) {
                    serviceData.tagGuids.push(Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Tag));
                }
            }
        }
        const parentChanges = changes['inputs:parent'];
        if (parentChanges) {
            if (parentChanges.deletes.length) {
                serviceData.notebookGuid = null;
            }
            for (const edge of parentChanges.creates) {
                const { id, type } = conduit_storage_1.getEdgeConnection(edge, nodeID);
                if (type === en_core_entity_types_1.CoreEntityTypes.Notebook) {
                    serviceData.notebookGuid = Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Notebook);
                }
                else if (type === en_core_entity_types_1.CoreEntityTypes.Workspace) {
                    // lookup backing notebook for workspace
                    const nbId = await params.graphTransaction.getSyncState(trc, null, ['workspaces', 'wsToBackingNb', id]);
                    if (nbId) {
                        serviceData.notebookGuid = Converters_1.convertGuidToService(nbId, en_core_entity_types_1.CoreEntityTypes.Notebook);
                    }
                    else {
                        throw new conduit_utils_1.NotFoundError(id, 'workspace to backing nb mapping not found');
                    }
                }
            }
        }
        const conflictStateChanges = changes['inputs:sourceNote'];
        if (conflictStateChanges && ((_a = conflictStateChanges.deletes) === null || _a === void 0 ? void 0 : _a.length) && !conduit_utils_1.isStashEmpty(curNote.inputs.sourceNote)) {
            const syncContextMetadata = await params.graphTransaction.getSyncContextMetadata(trc, null, syncContext);
            fillNoteAttributes(serviceData, {}, curNote.NodeFields.isUntitled, (syncContextMetadata === null || syncContextMetadata === void 0 ? void 0 : syncContextMetadata.userID) || conduit_utils_1.NullUserID, curNote);
            if (serviceData.attributes) {
                serviceData.attributes.conflictSourceNoteGuid = undefined;
            }
        }
        await updateNote(trc, params, curNote, serviceData, null, undefined);
        return true;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "customToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "deleteFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "handleErrorToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Note)
], NoteConverterClass.prototype, "applyEdgeChangesToService", null);
exports.NoteConverter = new NoteConverterClass();
//# sourceMappingURL=NoteConverter.js.map