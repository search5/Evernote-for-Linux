"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadConverter = exports.threadFromService = exports.getInternalParticipantsListID = exports.getMaxReadWorkChatMessageID = exports.populateThreadMaxMessageFields = exports.getMaxSupportedMessageForThread = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const MessageConverter_1 = require("./MessageConverter");
const ProfileConverter_1 = require("./ProfileConverter");
const WorkChatUtils_1 = require("./WorkChatUtils");
// getting 2 stashes here:
// max:  max message id for per thread
// maxWorkChatMessage: max supported message id
function getMaxSupportedMessageForThread(messages) {
    const groupByThread = messages.reduce((h, obj) => {
        var _a;
        const hasAttachments = Boolean((_a = obj.attachments) === null || _a === void 0 ? void 0 : _a.length);
        const maxMessage = h.maxMessage[obj.messageThreadId] || obj;
        h.maxMessage[obj.messageThreadId] = maxMessage.sentAt <= obj.sentAt ? obj : maxMessage;
        if (WorkChatUtils_1.supportedForWorkChat(hasAttachments, obj.sentAt)) {
            const maxWorkChatMessage = h.maxWorkChatMessage[obj.messageThreadId] || obj;
            h.maxWorkChatMessage[obj.messageThreadId] = maxWorkChatMessage.sentAt <= obj.sentAt ? obj : maxWorkChatMessage;
            // just grouping messages
            h.supportedMessages[obj.messageThreadId] = h.supportedMessages[obj.messageThreadId] || [];
            h.supportedMessages[obj.messageThreadId].push(obj);
        }
        return h;
    }, { maxMessage: {}, maxWorkChatMessage: {}, supportedMessages: {} });
    return groupByThread;
}
exports.getMaxSupportedMessageForThread = getMaxSupportedMessageForThread;
function populateThreadMaxMessageFields(maxMessage, maxWorkChatMessage, maxWorkchatMessageFromUser) {
    const nodeFields = {};
    const messageId = Converters_1.convertGuidFromService(maxMessage.id, en_core_entity_types_1.CoreEntityTypes.Message);
    nodeFields.internal_maxMessageID = messageId;
    if (!maxWorkChatMessage) { // only not supported for workchat messages in chunk.
        return nodeFields;
    }
    const messageSupportedId = Converters_1.convertGuidFromService(maxWorkChatMessage.id, en_core_entity_types_1.CoreEntityTypes.Message);
    nodeFields.maxMessageID = messageSupportedId;
    nodeFields.lastMessageSentAt = maxWorkChatMessage.sentAt;
    if (maxWorkchatMessageFromUser) {
        nodeFields.maxReadMessageID = messageSupportedId;
        nodeFields.internal_maxReadMessageID = messageId;
    }
    return nodeFields;
}
exports.populateThreadMaxMessageFields = populateThreadMaxMessageFields;
function getMaxReadWorkChatMessageID(internalMaxMessageID = null, maxMessageID = null, internalMaxReadMessage = null, maxReadMessageID = null, supportedServerMessagesChunk = []) {
    if (!internalMaxReadMessage || !internalMaxMessageID) {
        return null;
    }
    // this mean no new messages
    if (internalMaxMessageID === internalMaxReadMessage.id) {
        return maxMessageID;
    }
    if (WorkChatUtils_1.supportedForWorkChat(internalMaxReadMessage.NodeFields.hasAttachments, internalMaxReadMessage.NodeFields.created)) {
        return internalMaxReadMessage.id;
    }
    const supportedAndRead = supportedServerMessagesChunk.filter(m => m && m.sentAt && m.sentAt <= internalMaxReadMessage.NodeFields.created);
    // just fallback to what was the last message id
    if (!supportedAndRead.length) {
        return maxReadMessageID;
    }
    // if we here it mean we need to scan chunk and find most recent supported message that was read
    const maxMessage = supportedAndRead.reduce((max, next) => {
        if (next.sentAt && (next.sentAt > max.sentAt)) {
            return next;
        }
        else {
            return max;
        }
    }, supportedAndRead[0]);
    return Converters_1.convertGuidFromService(maxMessage.id, en_core_entity_types_1.CoreEntityTypes.Message);
}
exports.getMaxReadWorkChatMessageID = getMaxReadWorkChatMessageID;
/**
 *  getting internal id (not exposed to clients) to uniquely identify participants list
 * @param profileIDs
 * @param email
 */
async function getInternalParticipantsListID(trc, params, profileIDs, emails = []) {
    var _a;
    const contacts = await convertToContacts(trc, params.graphTransaction, profileIDs, emails);
    const userID = params.personalUserId.toString();
    const userMail = (_a = params.personalProfile) === null || _a === void 0 ? void 0 : _a.NodeFields.email;
    return getIDfromContacts(contacts.filter(c => c.id !== userID && c.id !== userMail));
}
exports.getInternalParticipantsListID = getInternalParticipantsListID;
function getIDfromContacts(contacts) {
    return contacts.map(c => (c.id || '').toLowerCase()).sort().join(';');
}
function threadFromService(serviceData) {
    const thread = {
        id: Converters_1.convertGuidFromService(serviceData.messageThread.id, en_core_entity_types_1.CoreEntityTypes.Thread),
        type: en_core_entity_types_1.CoreEntityTypes.Thread,
        syncContexts: [],
        label: serviceData.messageThread.name || '',
        version: 0,
        localChangeTimestamp: 0,
        NodeFields: {
            snippet: serviceData.messageThread.snippet || '',
            lastMessageSentAt: 0,
            groupThread: serviceData.messageThread.groupThread || false,
            internal_participantsID: '',
            // this is service max message id to be compatible with legacy chat
            internal_maxReadMessageID: serviceData.lastReadMessageId ? Converters_1.convertGuidFromService(serviceData.lastReadMessageId, en_core_entity_types_1.CoreEntityTypes.Message) : null,
            // this is service max message id to be compatible with legacy chat
            internal_maxMessageID: serviceData.messageThread.threadMaxMessageId ? Converters_1.convertGuidFromService(serviceData.messageThread.threadMaxMessageId, en_core_entity_types_1.CoreEntityTypes.Message) : null,
            maxMessageID: null,
            maxDeletedMessageID: serviceData.maxDeletedMessageId ? Converters_1.convertGuidFromService(serviceData.maxDeletedMessageId, en_core_entity_types_1.CoreEntityTypes.Message) : null,
            maxReadMessageID: null,
        },
        inputs: {},
        outputs: {
            participants: {},
            messages: {},
        },
    };
    // TODO figure out proper way to resolve profile source
    if (serviceData.messageThread.participantIds.length) {
        const participantIds = serviceData.messageThread.participantIds;
        participantIds.forEach(p => {
            conduit_storage_1.addOutputEdgeToNode(thread, 'participants', {
                id: Converters_1.convertGuidFromService(p, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity),
                port: null,
                type: en_core_entity_types_1.CoreEntityTypes.Thread,
            });
        });
    }
    return thread;
}
exports.threadFromService = threadFromService;
async function convertToContacts(trc, graphTransaction, participants = [], emails = []) {
    const contacts = [];
    const profileIDPromises = participants.map(pID => ProfileConverter_1.getUserProfileIDAndEmailFromProfileID(trc, graphTransaction, pID));
    const profileIDs = await conduit_utils_1.allSettled(profileIDPromises);
    for (const emailOrID of profileIDs) {
        // prefer email as id fails if users are not connected
        if (emailOrID.email) {
            contacts.push({
                id: emailOrID.email,
                type: en_conduit_sync_types_1.TContactType.EMAIL,
            });
        }
        else if (emailOrID.profileID) {
            contacts.push({
                id: Converters_1.convertGuidToService(emailOrID.profileID, en_core_entity_types_1.CoreEntityTypes.Profile),
                type: en_conduit_sync_types_1.TContactType.EVERNOTE,
            });
        }
        else {
            conduit_utils_1.logger.debug(`Cannot find Email or User ID for ${emailOrID.nodeID}. This thread could be a duplicate.`);
        }
        // Commented by CON-969
        // else {
        //   throw new NotFoundError(emailOrID.nodeID, `Profile ID ${emailOrID.nodeID} does not resolve to a userID or an email`);
        // }
    }
    return contacts.concat(emails.map(email => ({ id: email, type: en_conduit_sync_types_1.TContactType.EMAIL })));
}
class ThreadConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Thread;
    }
    convertGuidFromService(guid) {
        return ('Thread:' + guid);
    }
    convertGuidToService(guid) {
        return guid.slice('Thread:'.length);
    }
    async convertFromService(trc, params, syncContext, thread) {
        const participants = thread.messageThread.participantIds;
        const threadOut = threadFromService(thread);
        const internalParticipantsID = await getInternalParticipantsListID(trc, params, participants.map(id => Converters_1.convertGuidFromService(id, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.Identity)));
        const currentNode = await params.graphTransaction.getNode(trc, null, { id: threadOut.id, type: en_core_entity_types_1.CoreEntityTypes.Thread });
        threadOut.NodeFields.lastMessageSentAt = thread.messageThread.lastMessageSentAt || currentNode && currentNode.NodeFields.lastMessageSentAt || 0;
        threadOut.NodeFields.internal_participantsID = internalParticipantsID;
        // thread not deleted
        if (conduit_utils_1.isNotNullish(threadOut.NodeFields.internal_maxMessageID)) {
            threadOut.NodeFields.maxMessageID = currentNode && currentNode.NodeFields.maxMessageID;
        }
        // check if read status got updated and update our status accordingly.
        if (conduit_utils_1.isNotNullish(threadOut.NodeFields.internal_maxReadMessageID)) {
            const maxReadMessage = await params.graphTransaction.getNode(trc, null, { id: threadOut.NodeFields.internal_maxReadMessageID, type: en_core_entity_types_1.CoreEntityTypes.Message });
            const maxReadMessageID = getMaxReadWorkChatMessageID(threadOut.NodeFields.internal_maxMessageID, threadOut.NodeFields.maxMessageID, maxReadMessage, threadOut.NodeFields.maxReadMessageID, []);
            threadOut.NodeFields.maxReadMessageID = maxReadMessageID;
        }
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, threadOut);
        return !prevNode;
    }
    async createOnService() {
        // TODO https://evernote.jira.com/browse/CZ-11
        return false;
    }
    async deleteFromService(trc, params, syncContext, ids) {
        const messageStore = params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl);
        for (const id of ids) {
            const messageThreadId = Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Thread);
            const thread = await params.graphTransaction.getNode(trc, null, { id, type: en_core_entity_types_1.CoreEntityTypes.Thread });
            // if thread was already deleted then it has internal_maxMessageID = null
            if (thread && thread.NodeFields.internal_maxMessageID) {
                const messageId = Converters_1.convertGuidToService(thread.NodeFields.internal_maxMessageID, en_core_entity_types_1.CoreEntityTypes.Message);
                await messageStore.updateThreadDeleteStatus(trc, params.personalAuth.token, messageThreadId, messageId);
            }
        }
        return false;
    }
    async updateToService(trc, params, syncContext, threadID, diff) {
        if (!params.personalAuth) {
            throw new Error('Personal auth token needed');
        }
        const messageStore = params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl);
        if (diff.NodeFields && diff.NodeFields.internal_maxReadMessageID) {
            const messageId = Converters_1.convertGuidToService(diff.NodeFields.internal_maxReadMessageID, en_core_entity_types_1.CoreEntityTypes.Message);
            const messageThreadId = Converters_1.convertGuidToService(threadID, en_core_entity_types_1.CoreEntityTypes.Thread);
            await messageStore.updateThreadReadStatus(trc, params.personalAuth.token, messageThreadId, messageId);
        }
        return false;
    }
    async applyEdgeChangesToService() {
        // TODO https://evernote.jira.com/browse/CZ-11
        return false;
    }
    async customToService(trc, params, commandRun, syncContext) {
        if (!params.personalAuth) {
            throw new Error('Personal auth token needed');
        }
        const messageStore = params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl);
        switch (commandRun.command) {
            case 'CreateThread': {
                const createParams = commandRun.params;
                const contacts = await convertToContacts(trc, params.graphTransaction, createParams.participants, createParams.emails);
                if (!contacts.length) {
                    throw new Error(`cannot create thread with no participants`);
                }
                const internalID = getIDfromContacts(contacts);
                const nodes = await params.graphTransaction.getGraphNodesByType(trc, null, en_core_entity_types_1.CoreEntityTypes.Thread);
                const messageBody = MessageConverter_1.validateAndCreateMessageBody(createParams.message);
                const existingThread = nodes.find(n => n.NodeFields.internal_participantsID === internalID);
                if (!existingThread) {
                    const messageThread = {
                        message: {
                            body: messageBody,
                        },
                        participants: contacts,
                        groupThread: contacts.length >= 2,
                    };
                    const result = await messageStore.createMessageThread(trc, params.personalAuth.token, messageThread);
                    if (!result.messageThreadId) {
                        throw new Error('thread returned without messageThreadId');
                    }
                    return {
                        id: Converters_1.convertGuidFromService(result.messageThreadId, en_core_entity_types_1.CoreEntityTypes.Thread),
                        type: en_core_entity_types_1.CoreEntityTypes.Thread,
                    };
                }
                else {
                    const messageThread = {
                        messageThreadId: Converters_1.convertGuidToService(existingThread.id, en_core_entity_types_1.CoreEntityTypes.Thread),
                        body: messageBody,
                    };
                    const resp = await messageStore.messageSendToThread(trc, params.personalAuth.token, messageThread);
                    await MessageConverter_1.MessageConverter.convertFromService(trc, params, syncContext, resp);
                    return {
                        id: existingThread.id,
                        type: en_core_entity_types_1.CoreEntityTypes.Thread,
                    };
                }
            }
            case 'validateThreadRecipients': {
                const validateParams = commandRun.params;
                const contacts = await convertToContacts(trc, params.graphTransaction, validateParams.participants, validateParams.emails);
                if (!contacts.length) {
                    throw new Error(`cannot validate empty list of participants`);
                }
                await messageStore.validateThreadRecipients(trc, params.personalAuth.token, contacts);
                return null;
            }
            default:
                throw new Error(`Unknown customToService command for Thread ${commandRun.command}`);
        }
    }
    async updateMessageMaxForThreads(trc, converterParams, syncContext, messageUpdates) {
        if (!messageUpdates || !messageUpdates.length) {
            return;
        }
        const pairOfMaxPerThread = getMaxSupportedMessageForThread(messageUpdates);
        const threadsServerIds = Object.keys(pairOfMaxPerThread.maxMessage);
        // it mean no updates at all
        if (!threadsServerIds.length) {
            return;
        }
        const threads = await converterParams.graphTransaction.batchGetNodes(trc, null, en_core_entity_types_1.CoreEntityTypes.Thread, threadsServerIds.map(id => Converters_1.convertGuidFromService(Number(id), en_core_entity_types_1.CoreEntityTypes.Thread)));
        for (let i = 0; i < threadsServerIds.length; i++) {
            const maxMessage = pairOfMaxPerThread.maxMessage[threadsServerIds[i]];
            const maxWorkChatMessage = pairOfMaxPerThread.maxWorkChatMessage[threadsServerIds[i]];
            const thread = threads[i];
            if (maxMessage && thread) {
                const maxWorkchatMessageFromUser = Boolean(maxWorkChatMessage && maxWorkChatMessage.senderId && maxWorkChatMessage.senderId === converterParams.personalUserId);
                const supportedServerMessages = pairOfMaxPerThread.supportedMessages[threadsServerIds[i]];
                const nodeFields = populateThreadMaxMessageFields(maxMessage, maxWorkChatMessage, maxWorkchatMessageFromUser);
                if (!maxWorkchatMessageFromUser) {
                    const maxReadMessage = thread.NodeFields.internal_maxReadMessageID ?
                        await converterParams.graphTransaction.getNode(trc, null, { id: thread.NodeFields.internal_maxReadMessageID, type: en_core_entity_types_1.CoreEntityTypes.Message }) : null;
                    const maxReadMessageID = getMaxReadWorkChatMessageID(nodeFields.internal_maxMessageID, nodeFields.maxMessageID, maxReadMessage, thread.NodeFields.maxReadMessageID, supportedServerMessages);
                    // FIX-ME make converter simplier CON-1411
                    if (maxReadMessageID) {
                        nodeFields.maxReadMessageID = maxReadMessageID;
                    }
                }
                await converterParams.graphTransaction.updateNode(trc, syncContext, { id: thread.id, type: en_core_entity_types_1.CoreEntityTypes.Thread }, {
                    NodeFields: nodeFields,
                });
            }
        }
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Thread)
], ThreadConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Thread)
], ThreadConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Thread)
], ThreadConverterClass.prototype, "customToService", null);
exports.ThreadConverter = new ThreadConverterClass();
//# sourceMappingURL=ThreadConverter.js.map