"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
// tslint:disable:import-blacklist
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThriftComm = exports.AsyncMaestroService = exports.AsyncCommunicationEngine = exports.AsyncUtilityStore = exports.AsyncUserStore = exports.AsyncNoteStore = exports.AsyncMessageStore = void 0;
const CommunicationEngine_1 = require("en-thrift-internal/lib/CommunicationEngine");
const ExperimentsService_1 = require("en-thrift-internal/lib/ExperimentsService");
const MessageStore_1 = require("en-thrift-internal/lib/MessageStore");
const NoteStore_1 = require("en-thrift-internal/lib/NoteStore");
const UserStore_1 = require("en-thrift-internal/lib/UserStore");
const Utility_1 = require("en-thrift-internal/lib/Utility");
const ThriftRpc_1 = require("./ThriftRpc");
// tslint:disable:max-line-length
class AsyncMessageStore {
    constructor(messageStore) {
        this.messageStore = messageStore;
        this.getMessageSyncChunk = (trc, authenticationToken, filter) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getMessageSyncChunk', this.messageStore, this.messageStore.getMessageSyncChunk, authenticationToken, filter);
        };
        this.createMessageThread = (trc, authenticationToken, spec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createMessageThread', this.messageStore, this.messageStore.createMessageThread, authenticationToken, spec);
        };
        this.messageSendToThread = (trc, authenticationToken, spec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'sendMessageToThread', this.messageStore, this.messageStore.sendMessageToThread, authenticationToken, spec);
        };
        this.updateThreadReadStatus = (trc, authenticationToken, threadId, messageId) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateReadStatus', this.messageStore, this.messageStore.updateReadStatus, authenticationToken, threadId, messageId);
        };
        this.updateThreadDeleteStatus = (trc, authenticationToken, threadId, messageId) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateDeleteStatus', this.messageStore, this.messageStore.updateDeleteStatus, authenticationToken, threadId, messageId);
        };
        this.updateProfileBlockStatus = (trc, authenticationToken, userId, blockStatus) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateBlockStatus', this.messageStore, this.messageStore.updateBlockStatus, authenticationToken, userId, blockStatus);
        };
        this.validateThreadRecipients = (trc, authenticationToken, contacts) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'validateRecipients', this.messageStore, this.messageStore.validateRecipients, authenticationToken, contacts);
        };
        this.hasNonEmptyMessages = (trc, authenticationToken, dateFilter) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'hasNonEmptyMessages', this.messageStore, this.messageStore.hasNonEmptyMessages, authenticationToken, dateFilter);
        };
        this.getThreads = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getThreads', this.messageStore, this.messageStore.getThreads, authenticationToken);
        };
        this.findMessages = (trc, authenticationToken, filter, resultSpec, maxMessages, pagination) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findMessages', this.messageStore, this.messageStore.findMessages, authenticationToken, filter, resultSpec, maxMessages, pagination);
        };
    }
}
exports.AsyncMessageStore = AsyncMessageStore;
class AsyncNoteStore {
    constructor(noteStore) {
        this.noteStore = noteStore;
        this.getSyncState = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getSyncState', this.noteStore, this.noteStore.getSyncState, authenticationToken);
        };
        this.getSyncStateWithMetrics = (trc, authenticationToken, sessions) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getSyncStateWithMetrics', this.noteStore, this.noteStore.getSyncStateWithMetrics, authenticationToken, { sessions });
        };
        this.getSyncChunk = (trc, authenticationToken, afterUSN, maxEntries, fullSyncOnly) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getSyncChunk', this.noteStore, this.noteStore.getSyncChunk, authenticationToken, afterUSN, maxEntries, fullSyncOnly);
        };
        this.getFilteredSyncChunk = (trc, authenticationToken, afterUSN, maxEntries, filter) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getFilteredSyncChunk', this.noteStore, this.noteStore.getFilteredSyncChunk, authenticationToken, afterUSN, maxEntries, filter);
        };
        this.getLinkedNotebookSyncState = (trc, authenticationToken, linkedNotebook) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getLinkedNotebookSyncState', this.noteStore, this.noteStore.getLinkedNotebookSyncState, authenticationToken, linkedNotebook);
        };
        this.getLinkedNotebookSyncChunk = (trc, authenticationToken, linkedNotebook, afterUSN, maxEntries, fullSyncOnly) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getLinkedNotebookSyncChunk', this.noteStore, this.noteStore.getLinkedNotebookSyncChunk, authenticationToken, linkedNotebook, afterUSN, maxEntries, fullSyncOnly);
        };
        this.listLinkedNotebooks = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listLinkedNotebooks', this.noteStore, this.noteStore.listLinkedNotebooks, authenticationToken);
        };
        this.getWorkspace = (trc, authenticationToken, guid, responseSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getWorkspace', this.noteStore, this.noteStore.getWorkspace, authenticationToken, guid, responseSpec);
        };
        this.createWorkspace = (trc, authenticationToken, space, responseSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createWorkspace', this.noteStore, this.noteStore.createWorkspace, authenticationToken, space, responseSpec);
        };
        this.updateWorkspace = (trc, authenticationToken, space) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateWorkspace', this.noteStore, this.noteStore.updateWorkspace, authenticationToken, space);
        };
        this.listWorkspaces = (trc, authenticationToken, workspaceResponseSpec, filter) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listWorkspaces', this.noteStore, this.noteStore.listWorkspaces, authenticationToken, workspaceResponseSpec, filter);
        };
        this.getNotebook = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNotebook', this.noteStore, this.noteStore.getNotebook, authenticationToken, guid);
        };
        this.createNotebook = (trc, authenticationToken, notebook) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createNotebook', this.noteStore, this.noteStore.createNotebook, authenticationToken, notebook);
        };
        this.updateNotebookWithResultSpec = (trc, authenticationToken, notebook, resultSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateNotebookWithResultSpec', this.noteStore, this.noteStore.updateNotebookWithResultSpec, authenticationToken, notebook, resultSpec);
        };
        this.expungeNotebook = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeNotebook', this.noteStore, this.noteStore.expungeNotebook, authenticationToken, guid);
        };
        this.renameNotebook = (trc, authenticationToken, notebookGuid, name) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'renameNotebook', this.noteStore, this.noteStore.renameNotebook, authenticationToken, notebookGuid, name);
        };
        this.getDefaultNotebook = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getDefaultNotebook', this.noteStore, this.noteStore.getDefaultNotebook, authenticationToken);
        };
        this.setNotebookRecipientSettings = (trc, authenticationToken, notebookGuid, recipientSettings) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setNotebookRecipientSettings', this.noteStore, this.noteStore.setNotebookRecipientSettings, authenticationToken, notebookGuid, recipientSettings);
        };
        this.getUserNotebook = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getUserNotebook', this.noteStore, this.noteStore.getUserNotebook, authenticationToken);
        };
        this.listNotebooks = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listNotebooks', this.noteStore, this.noteStore.listNotebooks, authenticationToken);
        };
        this.getNote = (trc, authenticationToken, guid, withContent, withResourcesData, withResourcesRecognition, withResourcesAlternateData) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNote', this.noteStore, this.noteStore.getNote, authenticationToken, guid, withContent, withResourcesData, withResourcesRecognition, withResourcesAlternateData);
        };
        this.getNoteWithResultSpec = (trc, authenticationToken, guid, specs) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteWithResultSpec', this.noteStore, this.noteStore.getNoteWithResultSpec, authenticationToken, guid, specs);
        };
        this.getNoteContent = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteContent', this.noteStore, this.noteStore.getNoteContent, authenticationToken, guid);
        };
        this.getNoteSnippetsV2 = (trc, authenticationToken, guids, maxSnippetLength) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteSnippetsV2', this.noteStore, this.noteStore.getNoteSnippetsV2, authenticationToken, guids, maxSnippetLength);
        };
        this.createNote = (trc, authenticationToken, note) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createNote', this.noteStore, this.noteStore.createNote, authenticationToken, note);
        };
        this.copyNote = (trc, authenticationToken, noteGuid, toNotebookGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'copyNote', this.noteStore, this.noteStore.copyNote, authenticationToken, noteGuid, toNotebookGuid);
        };
        this.updateNote = (trc, authenticationToken, note) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateNote', this.noteStore, this.noteStore.updateNote, authenticationToken, note);
        };
        this.setContentClass = (trc, authenticationToken, noteGuid, contentClass) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setContentClass', this.noteStore, this.noteStore.setContentClass, authenticationToken, noteGuid, contentClass);
        };
        this.expungeNote = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeNote', this.noteStore, this.noteStore.expungeNote, authenticationToken, guid);
        };
        this.acquireNoteLock = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'acquireNoteLock', this.noteStore, this.noteStore.acquireNoteLock, authenticationToken, guid);
        };
        this.releaseNoteLock = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'releaseNoteLock', this.noteStore, this.noteStore.releaseNoteLock, authenticationToken, guid);
        };
        this.getNoteLockStatus = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteLockStatus', this.noteStore, this.noteStore.getNoteLockStatus, authenticationToken, guid);
        };
        this.expungeNotes = (trc, authenticationToken, noteGuids) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeNotes', this.noteStore, this.noteStore.expungeNotes, authenticationToken, noteGuids);
        };
        this.emailNote = (trc, authenticationToken, parameters) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'emailNote', this.noteStore, this.noteStore.emailNote, authenticationToken, parameters);
        };
        this.getTag = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getTag', this.noteStore, this.noteStore.getTag, authenticationToken, guid);
        };
        this.createTag = (trc, authenticationToken, tag) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createTag', this.noteStore, this.noteStore.createTag, authenticationToken, tag);
        };
        this.updateTag = (trc, authenticationToken, tag) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateTag', this.noteStore, this.noteStore.updateTag, authenticationToken, tag);
        };
        this.expungeTag = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeTag', this.noteStore, this.noteStore.expungeTag, authenticationToken, guid);
        };
        this.listTags = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listTags', this.noteStore, this.noteStore.listTags, authenticationToken);
        };
        this.getPreferences = (trc, authenticationToken, names) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getPreferences', this.noteStore, this.noteStore.getPreferences, authenticationToken, names);
        };
        this.updatePreferences = (trc, authenticationToken, preferences) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updatePreferences', this.noteStore, this.noteStore.updatePreferences, authenticationToken, preferences);
        };
        this.getResource = (trc, authenticationToken, guid, withData, withRecognition, withAttributes, withAlternateData) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getResource', this.noteStore, this.noteStore.getResource, authenticationToken, guid, withData, withRecognition, withAttributes, withAlternateData);
        };
        this.updateResource = (trc, authenticationToken, resource) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateResource', this.noteStore, this.noteStore.updateResource, authenticationToken, resource);
        };
        this.authenticateToSharedNotebook = (trc, shareKeyOrGlobalId, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'authenticateToSharedNotebook', this.noteStore, this.noteStore.authenticateToSharedNotebook, shareKeyOrGlobalId, authenticationToken);
        };
        this.getSharedNotebookByAuth = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getSharedNotebookByAuth', this.noteStore, this.noteStore.getSharedNotebookByAuth, authenticationToken);
        };
        this.createOrUpdateNotebookShares = (trc, authenticationToken, shareTemplate) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createOrUpdateNotebookShares', this.noteStore, this.noteStore.createOrUpdateNotebookShares, authenticationToken, shareTemplate);
        };
        this.manageNotebookShares = (trc, authenticationToken, manageShareParams) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'manageNotebookShares', this.noteStore, this.noteStore.manageNotebookShares, authenticationToken, manageShareParams);
        };
        this.getNotebookShares = (trc, authenticationToken, notebookGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNotebookShares', this.noteStore, this.noteStore.getNotebookShares, authenticationToken, notebookGuid);
        };
        this.listSharedNotebooks = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listSharedNotebooks', this.noteStore, this.noteStore.listSharedNotebooks, authenticationToken);
        };
        this.getNoteShares = (trc, authenticationToken, noteGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteShares', this.noteStore, this.noteStore.getNoteShares, authenticationToken, noteGuid);
        };
        this.getOrCreateLinkedNotebook = (trc, authenticationToken, notebook) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getOrCreateLinkedNotebook', this.noteStore, this.noteStore.getOrCreateLinkedNotebook, authenticationToken, notebook);
        };
        this.listPublishedBusinessNotebooks = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listPublishedBusinessNotebooks', this.noteStore, this.noteStore.listPublishedBusinessNotebooks, authenticationToken);
        };
        this.unpublishNotebook = (trc, authenticationToken, notebookGuid, convertGroupSharesToIndividual) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'unpublishNotebook', this.noteStore, this.noteStore.unpublishNotebook, authenticationToken, notebookGuid, convertGroupSharesToIndividual);
        };
        this.updateLinkedNotebook = (trc, authenticationToken, notebook) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateLinkedNotebook', this.noteStore, this.noteStore.updateLinkedNotebook, authenticationToken, notebook);
        };
        this.expungeLinkedNotebook = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeLinkedNotebook', this.noteStore, this.noteStore.expungeLinkedNotebook, authenticationToken, guid);
        };
        this.findNotesMetadata = (trc, authenticationToken, filter, offset, maxNotes, resultSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findNotesMetadata', this.noteStore, this.noteStore.findNotesMetadata, authenticationToken, filter, offset, maxNotes, resultSpec);
        };
        this.findNoteCounts = (trc, authenticationToken, filter, withTrash) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findNoteCounts', this.noteStore, this.noteStore.findNoteCounts, authenticationToken, filter, withTrash);
        };
        this.findRelated = (trc, authenticationToken, request, resultSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findRelated', this.noteStore, this.noteStore.findRelated, authenticationToken, request, resultSpec);
        };
        this.findSearchSuggestionsV2 = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findSearchSuggestionsV2', this.noteStore, this.noteStore.findSearchSuggestionsV2, authenticationToken, request);
        };
        this.manageWorkspaceSharing = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'manageWorkspaceSharing', this.noteStore, this.noteStore.manageWorkspaceSharing, authenticationToken, request);
        };
        this.getWorkspaceUserInterfaceProperties = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getWorkspaceUserInterfaceProperties', this.noteStore, this.noteStore.getWorkspaceUserInterfaceProperties, authenticationToken, request);
        };
        this.setWorkspaceUserInterfaceLayoutStyle = (trc, authenticationToken, guid, layoutStyle) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setWorkspaceUserInterfaceLayoutStyle', this.noteStore, this.noteStore.setWorkspaceUserInterfaceLayoutStyle, authenticationToken, guid, layoutStyle);
        };
        this.setNotebookUserInterfaceDisplayOrder = (trc, authenticationToken, guid, displayOrder) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setNotebookUserInterfaceDisplayOrder', this.noteStore, this.noteStore.setNotebookUserInterfaceDisplayOrder, authenticationToken, guid, displayOrder);
        };
        this.setNoteUserInterfaceDisplayOrder = (trc, authenticationToken, guid, displayOrder) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setNoteUserInterfaceDisplayOrder', this.noteStore, this.noteStore.setNoteUserInterfaceDisplayOrder, authenticationToken, guid, displayOrder);
        };
        this.setNotebookUserInterfaceColors = (trc, authenticationToken, guid, colorMap) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setNotebookUserInterfaceColors', this.noteStore, this.noteStore.setNotebookUserInterfaceColors, authenticationToken, guid, colorMap);
        };
        this.shareNote = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'shareNote', this.noteStore, this.noteStore.shareNote, authenticationToken, guid);
        };
        this.stopSharingNote = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'stopSharingNote', this.noteStore, this.noteStore.stopSharingNote, authenticationToken, guid);
        };
        this.createOrUpdateSharedNotes = (trc, authenticationToken, template) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createOrUpdateSharedNotes', this.noteStore, this.noteStore.createOrUpdateSharedNotes, authenticationToken, template);
        };
        this.stopSharingNoteWithRecipients = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'stopSharingNoteWithRecipients', this.noteStore, this.noteStore.stopSharingNoteWithRecipients, authenticationToken, guid);
        };
        this.manageNoteShares = (trc, authenticationToken, paramters) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'manageNoteShares', this.noteStore, this.noteStore.manageNoteShares, authenticationToken, paramters);
        };
        this.authenticateToSharedNote = (trc, authenticationToken, guid, noteKey) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'authenticateToSharedNote', this.noteStore, this.noteStore.authenticateToSharedNote, guid, noteKey, authenticationToken);
        };
        this.authenticateToNote = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'authenticateToNote', this.noteStore, this.noteStore.authenticateToNote, authenticationToken, guid);
        };
        this.sendLogRequest = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'sendLogRequest', this.noteStore, this.noteStore.sendLogRequest, authenticationToken, request);
        };
        this.createSearch = (trc, authenticationToken, search) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createSearch', this.noteStore, this.noteStore.createSearch, authenticationToken, search);
        };
        this.updateSearch = (trc, authenticationToken, search) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateSearch', this.noteStore, this.noteStore.updateSearch, authenticationToken, search);
        };
        this.expungeSearch = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeSearch', this.noteStore, this.noteStore.expungeSearch, authenticationToken, guid);
        };
        this.listSearches = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listSearches', this.noteStore, this.noteStore.listSearches, authenticationToken);
        };
        this.updateUserSetting = (trc, authenticationToken, settings, value) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateUserSetting', this.noteStore, this.noteStore.updateUserSetting, authenticationToken, settings, value);
        };
        this.getNoteApplicationData = async (trc, authenticationToken, guid) => {
            const lazyMap = await ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteApplicationData', this.noteStore, this.noteStore.getNoteApplicationData, authenticationToken, guid);
            return lazyMap.fullMap || {};
        };
        this.getNoteApplicationDataEntry = (trc, authenticationToken, guid, key) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNoteApplicationDataEntry', this.noteStore, this.noteStore.getNoteApplicationDataEntry, authenticationToken, guid, key);
        };
        this.setNoteApplicationDataEntry = (trc, authenticationToken, guid, key, value) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setNoteApplicationDataEntry', this.noteStore, this.noteStore.setNoteApplicationDataEntry, authenticationToken, guid, key, value);
        };
        this.unsetNoteApplicationDataEntry = (trc, authenticationToken, guid, key) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'unsetNoteApplicationDataEntry', this.noteStore, this.noteStore.unsetNoteApplicationDataEntry, authenticationToken, guid, key);
        };
        this.getResourceApplicationData = async (trc, authenticationToken, guid) => {
            const lazyMap = await ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getResourceApplicationData', this.noteStore, this.noteStore.getResourceApplicationData, authenticationToken, guid);
            return lazyMap.fullMap || {};
        };
        this.getResourceApplicationDataEntry = (trc, authenticationToken, guid, key) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getResourceApplicationDataEntry', this.noteStore, this.noteStore.getResourceApplicationDataEntry, authenticationToken, guid, key);
        };
        this.setResourceApplicationDataEntry = (trc, authenticationToken, guid, key, value) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setResourceApplicationDataEntry', this.noteStore, this.noteStore.setResourceApplicationDataEntry, authenticationToken, guid, key, value);
        };
        this.unsetResourceApplicationDataEntry = (trc, authenticationToken, guid, key) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'unsetResourceApplicationDataEntry', this.noteStore, this.noteStore.unsetResourceApplicationDataEntry, authenticationToken, guid, key);
        };
        this.findInBusiness = (trc, authenticationToken, query) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findInBusiness', this.noteStore, this.noteStore.findInBusiness, authenticationToken, query);
        };
    }
}
exports.AsyncNoteStore = AsyncNoteStore;
class AsyncUserStore {
    constructor(userStore) {
        this.userStore = userStore;
        this.authenticateLongSessionV2 = (trc, authParams) => {
            return ThriftRpc_1.wrapThriftCall(trc, '', 'authenticateLongSessionV2', this.userStore, this.userStore.authenticateLongSessionV2, authParams);
        };
        this.authenticateToBusiness = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'authenticateToBusiness', this.userStore, this.userStore.authenticateToBusiness, authenticationToken);
        };
        this.createSessionAuthenticationToken = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'createSessionAuthenticationToken', this.userStore, this.userStore.createSessionAuthenticationToken, authenticationToken);
        };
        this.completeTwoFactorAuthentication = (trc, authenticationToken, oneTimeCode, deviceIdentifier, deviceDescription) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'completeTwoFactorAuthentication', this.userStore, this.userStore.completeTwoFactorAuthentication, authenticationToken, oneTimeCode, deviceIdentifier, deviceDescription);
        };
        this.getUser = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getUser', this.userStore, this.userStore.getUser, authenticationToken);
        };
        this.getUserUrls = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getUserUrls', this.userStore, this.userStore.getUserUrls, authenticationToken);
        };
        this.getSubscriptionInfo = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getSubscriptionInfo', this.userStore, this.userStore.getSubscriptionInfo, authenticationToken);
        };
        this.revokeLongSession = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'revokeLongSession', this.userStore, this.userStore.revokeLongSession, authenticationToken);
        };
        this.listBusinessUsers = (trc, authenticationToken, filter) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listBusinessUsers', this.userStore, this.userStore.listBusinessUsers, authenticationToken, filter);
        };
        this.getLoginInfo = (trc, infoRequest) => {
            return ThriftRpc_1.wrapThriftCall(trc, '', 'getLoginInfo', this.userStore, this.userStore.getLoginInfo, infoRequest);
        };
        this.checkVersion = (trc, clientName) => {
            return ThriftRpc_1.wrapThriftCall(trc, '', 'checkVersion', this.userStore, this.userStore.checkVersion, clientName, UserStore_1.EDAM_VERSION_MAJOR, UserStore_1.EDAM_VERSION_MINOR);
        };
        this.getConnectedIdentities = (trc, authenticationToken, identityIds) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getConnectedIdentities', this.userStore, this.userStore.getConnectedIdentities, authenticationToken, identityIds);
        };
        this.authenticateOpenID = (trc, credential, consumerKey, consumerSecret, deviceIdentifier, deviceDescription, authLongSession, supportsTwoFactor) => {
            return ThriftRpc_1.wrapThriftCall(trc, '', 'authenticateOpenID', this.userStore, this.userStore.authenticateOpenID, credential, consumerKey, consumerSecret, deviceIdentifier, deviceDescription, authLongSession, supportsTwoFactor);
        };
        this.getNAPAccessJWT = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNAPAccessJWT', this.userStore, this.userStore.getNAPAccessJWT, authenticationToken, request);
        };
    }
}
exports.AsyncUserStore = AsyncUserStore;
class AsyncUtilityStore {
    constructor(utilityStore) {
        this.utilityStore = utilityStore;
        this.associateOpenIDWithUser = (trc, authenticationToken, credential) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'associateOpenIDWithUser', this.utilityStore, this.utilityStore.associateOpenIDWithUser, authenticationToken, credential);
        };
        this.expungeWorkspace = (trc, authenticationToken, guid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'expungeWorkspace', this.utilityStore, this.utilityStore.expungeWorkspace, authenticationToken, guid);
        };
        this.addResource = (trc, authenticationToken, resource) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'addResource', this.utilityStore, this.utilityStore.addResource, authenticationToken, resource);
        };
        this.updateNoteIfUsnMatches = (trc, authenticationToken, note, resourcesUpdateRequest) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateNoteIfUsnMatches', this.utilityStore, this.utilityStore.updateNoteIfUsnMatches, authenticationToken, note, resourcesUpdateRequest);
        };
        this.getCrossPromotionInfo = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getCrossPromotionInfo', this.utilityStore, this.utilityStore.getCrossPromotionInfo, authenticationToken);
        };
        this.getTsdEligibility = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getTsdEligibility', this.utilityStore, this.utilityStore.getTsdEligibility, authenticationToken, request);
        };
        this.joinWorkspace = (trc, authenticationToken, workspaceGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'joinWorkspace', this.utilityStore, this.utilityStore.joinWorkspace, authenticationToken, workspaceGuid);
        };
        this.leaveWorkspace = (trc, authenticationToken, workspaceGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'leaveWorkspace', this.utilityStore, this.utilityStore.leaveWorkspace, authenticationToken, workspaceGuid);
        };
        this.listWorkspacesWithResultSpec = (trc, authenticationToken, resultSpec, filterSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listWorkspacesWithResultSpec', this.utilityStore, this.utilityStore.listWorkspacesWithResultSpec, authenticationToken, resultSpec, filterSpec);
        };
        this.requestAccessToWorkspace = (trc, authenticationToken, workspaceGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'requestAccessToWorkspace', this.utilityStore, this.utilityStore.requestAccessToWorkspace, authenticationToken, workspaceGuid);
        };
        this.moveNotebookToAccount = (trc, authenticationToken, notebookGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'moveNotebookToAccount', this.utilityStore, this.utilityStore.moveNotebookToAccount, authenticationToken, notebookGuid);
        };
        this.listNotebooksForIonOnly = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listNotebooksForIonOnly', this.utilityStore, this.utilityStore.listNotebooksForIonOnly, authenticationToken);
        };
        this.getUserRestrictions = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getUserRestrictions', this.utilityStore, this.utilityStore.getUserRestrictions, authenticationToken);
        };
        this.getPromotionStatus = (trc, authenticationToken, promotionIds) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getPromotionStatus', this.utilityStore, this.utilityStore.getPromotionStatus, authenticationToken, promotionIds);
        };
        this.promotionOptedOut = (trc, authenticationToken, promotionId) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'promotionOptedOut', this.utilityStore, this.utilityStore.promotionOptedOut, authenticationToken, promotionId);
        };
        this.promotionsShown = (trc, authenticationToken, promotionIds) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'promotionsShown', this.utilityStore, this.utilityStore.promotionsShown, authenticationToken, promotionIds);
        };
        this.sendMarketingEmail = (trc, authenticationToken, marketingEmailParameters) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'sendMarketingEmail', this.utilityStore, this.utilityStore.sendMarketingEmail, authenticationToken, marketingEmailParameters);
        };
        this.sendOneTimeCode = (trc, authenticationToken, sendToBackupPhone, textMsgTemplate, useVoice) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'sendOneTimeCode', this.utilityStore, this.utilityStore.sendOneTimeCode, authenticationToken, sendToBackupPhone, textMsgTemplate, useVoice);
        };
        this.getMasked2FAMobileNumbers = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getMasked2FAMobileNumbers', this.utilityStore, this.utilityStore.getMasked2FAMobileNumbers, authenticationToken);
        };
        this.sendWorkspaceViewedEvent = (trc, authenticationToken, workspaceGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'sendWorkspaceViewedEvent', this.utilityStore, this.utilityStore.sendWorkspaceViewedEvent, authenticationToken, workspaceGuid);
        };
        this.sendVerificationEmail = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'sendVerificationEmail', this.utilityStore, this.utilityStore.sendVerificationEmail, authenticationToken);
        };
        this.findNotesMetadataForIon = (trc, authenticationToken, filter, offset, maxNotes, resultSpec) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'findNotesMetadataForIon', this.utilityStore, this.utilityStore.findNotesMetadataForIon, authenticationToken, filter, offset, maxNotes, resultSpec);
        };
        this.getScopedGoogleOAuthCredential = (trc, authenticationToken, thriftTokenToCheck, googleOAuthScope) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getScopedGoogleOAuthCredential', this.utilityStore, this.utilityStore.getScopedGoogleOAuthCredential, thriftTokenToCheck, googleOAuthScope);
        };
        this.getOAuthCredential = (trc, authenticationToken, serviceId) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getOAuthCredential', this.utilityStore, this.utilityStore.getOAuthCredential, authenticationToken, serviceId);
        };
        this.setOAuthCredential = (trc, authenticationToken, oAuthToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'setOAuthCredential', this.utilityStore, this.utilityStore.setOAuthCredential, authenticationToken, oAuthToken);
        };
        this.listPinnedContent = (trc, authenticationToken, workspaceGuid) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'listPinnedContent', this.utilityStore, this.utilityStore.listPinnedContent, authenticationToken, workspaceGuid);
        };
        this.changePinnedContentPosition = (trc, authenticationToken, workspaceGuid, changePositionRequest) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'changePinnedContentPosition', this.utilityStore, this.utilityStore.changePinnedContentPosition, authenticationToken, workspaceGuid, changePositionRequest);
        };
        this.checkUserFeatures = (trc, authenticationToken, featuresToCheck) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'checkUserFeatures', this.utilityStore, this.utilityStore.checkUserFeatures, authenticationToken, featuresToCheck);
        };
        this.updateContentOfPinnedWidget = (trc, authenticationToken, workspaceGuid, toBePinnedContentlist, ToBeUnpinnedContentList) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'updateContentOfPinnedWidget', this.utilityStore, this.utilityStore.updateContentOfPinnedWidget, authenticationToken, workspaceGuid, toBePinnedContentlist, ToBeUnpinnedContentList);
        };
        this.fileSupportTicket = (trc, authenticationToken, ticket) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'fileSupportTicket', this.utilityStore, this.utilityStore.fileSupportTicket, authenticationToken, ticket);
        };
        this.registerSession = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'registerSession', this.utilityStore, this.utilityStore.registerSession, request);
        };
        this.hasActiveSessions = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'hasActiveSessions', this.utilityStore, this.utilityStore.hasActiveSessions, request);
        };
        this.getNsvcThirdPartyAuthorizationToken = (trc, authenticationToken) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNsvcThirdPartyAuthorizationToken', this.utilityStore, this.utilityStore.getNsvcThirdPartyAuthorizationToken, authenticationToken);
        };
        this.getNsvcThirdPartyAuthorizationTokenByType = (trc, authenticationToken, nsvcTokenType) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getNsvcThirdPartyAuthorizationTokenByType', this.utilityStore, this.utilityStore.getNsvcThirdPartyAuthorizationTokenByType, authenticationToken, nsvcTokenType);
        };
        this.mmsvcGetPaywallState = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'mmsvcGetPaywallState', this.utilityStore, this.utilityStore.mmsvcGetPaywallState, authenticationToken, request);
        };
        this.mmsvcCreateDeviceSync = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'mmsvcCreateDeviceSync', this.utilityStore, this.utilityStore.mmsvcCreateDeviceSync, authenticationToken);
        };
        this.revokeSession = (trc, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, request.authenticationToken, 'revokeSession', this.utilityStore, this.utilityStore.revokeSession, request);
        };
    }
}
exports.AsyncUtilityStore = AsyncUtilityStore;
class AsyncCommunicationEngine {
    constructor(commEngine) {
        this.commEngine = commEngine;
        this.syncMessages = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'syncMessages', this.commEngine, this.commEngine.syncMessages, authenticationToken, request);
        };
    }
}
exports.AsyncCommunicationEngine = AsyncCommunicationEngine;
class AsyncMaestroService {
    constructor(experimentsService) {
        this.experimentsService = experimentsService;
        this.getProps2 = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getProps2', this.experimentsService, this.experimentsService.getProps2, authenticationToken, request);
        };
        this.getServiceState2 = (trc, authenticationToken, request) => {
            return ThriftRpc_1.wrapThriftCall(trc, authenticationToken, 'getServiceState2', this.experimentsService, this.experimentsService.getServiceState2, authenticationToken, request);
        };
    }
}
exports.AsyncMaestroService = AsyncMaestroService;
function verifyUrl(url) {
    if (!url) {
        throw new Error('Conduit internal error: missing url');
    }
}
class ThriftComm {
    constructor(di) {
        this.di = di;
    }
    getMessageStore(messageStoreUrl) {
        verifyUrl(messageStoreUrl);
        const protocol = this.di.getProtocol(messageStoreUrl);
        return new AsyncMessageStore(new MessageStore_1.MessageStore.Client(protocol));
    }
    getNoteStore(noteStoreUrl) {
        verifyUrl(noteStoreUrl);
        const protocol = this.di.getProtocol(noteStoreUrl);
        return new AsyncNoteStore(new NoteStore_1.NoteStore.Client(protocol));
    }
    getUserStore(userStoreUrl) {
        verifyUrl(userStoreUrl);
        const protocol = this.di.getProtocol(userStoreUrl);
        return new AsyncUserStore(new UserStore_1.UserStore.Client(protocol));
    }
    getUtilityStore(utilityStoreUrl) {
        verifyUrl(utilityStoreUrl);
        const protocol = this.di.getProtocol(utilityStoreUrl);
        return new AsyncUtilityStore(new Utility_1.Utility.Client(protocol));
    }
    getCommunicationEngine(communicationEngineUrl) {
        verifyUrl(communicationEngineUrl);
        const protocol = this.di.getProtocol(communicationEngineUrl);
        return new AsyncCommunicationEngine(new CommunicationEngine_1.CommunicationEngine.Client(protocol));
    }
    getMaestroService(maestroUrl) {
        verifyUrl(maestroUrl);
        const protocol = this.di.getProtocol(maestroUrl);
        return new AsyncMaestroService(new ExperimentsService_1.ExperimentsService.Client(protocol));
    }
}
exports.ThriftComm = ThriftComm;
//# sourceMappingURL=Thrift.js.map