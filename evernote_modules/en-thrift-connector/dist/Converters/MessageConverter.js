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
exports.MessageConverter = exports.validateAndCreateMessageBody = exports.messageFromService = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const WorkChatUtils_1 = require("./WorkChatUtils");
const sanitazeMessageExp = /(<!--(\s|\S)*?\/-->)|(<\/?(\s|\S)*?>)/g;
function messageFromService(serviceData) {
    var _a;
    const messageId = serviceData.id || 0;
    const hasAttachments = Boolean((_a = serviceData === null || serviceData === void 0 ? void 0 : serviceData.attachments) === null || _a === void 0 ? void 0 : _a.length);
    const supportedMessage = WorkChatUtils_1.supportedForWorkChat(hasAttachments, serviceData.sentAt);
    const message = {
        id: Converters_1.convertGuidFromService(messageId, en_core_entity_types_1.CoreEntityTypes.Message),
        type: en_core_entity_types_1.CoreEntityTypes.Message,
        syncContexts: [],
        label: (serviceData.body || '').replace(sanitazeMessageExp, ''),
        version: 0,
        localChangeTimestamp: 0,
        NodeFields: {
            created: serviceData.sentAt || 0,
            reshareMessage: serviceData.reshareMessage || false,
            creator: Converters_1.convertGuidFromService(serviceData.senderId || 0, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            hasAttachments,
            supportedForWorkChat: supportedMessage,
        },
        inputs: {
            thread: {},
        },
        outputs: {
            notes: {},
            notebooks: {},
        },
    };
    if (serviceData.messageThreadId) {
        const threadID = serviceData.messageThreadId;
        conduit_storage_1.addInputEdgeToNode(message, 'thread', {
            id: Converters_1.convertGuidFromService(threadID, en_core_entity_types_1.CoreEntityTypes.Thread),
            port: 'messages',
            type: en_core_entity_types_1.CoreEntityTypes.Thread,
        });
    }
    for (const attachment of (serviceData.attachments || [])) {
        if (attachment.type === en_conduit_sync_types_1.TMessageAttachmentType.NOTE) {
            conduit_storage_1.addOutputEdgeToNode(message, 'notes', {
                id: Converters_1.convertGuidFromService(attachment.guid, en_core_entity_types_1.CoreEntityTypes.Note),
                port: null,
                type: en_core_entity_types_1.CoreEntityTypes.Note,
            });
        }
        if (attachment.type === en_conduit_sync_types_1.TMessageAttachmentType.NOTEBOOK) {
            conduit_storage_1.addOutputEdgeToNode(message, 'notebooks', {
                id: Converters_1.convertGuidFromService(attachment.guid, en_core_entity_types_1.CoreEntityTypes.Notebook),
                port: null,
                type: en_core_entity_types_1.CoreEntityTypes.Notebook,
            });
        }
    }
    return message;
}
exports.messageFromService = messageFromService;
function validateAndCreateMessageBody(message = '') {
    const messageBody = `<msg>${message}</msg>`;
    if (messageBody.length > en_core_entity_types_1.WORKCHAT_MESSAGE_BODY_LEN_MAX) {
        throw new conduit_utils_1.MalformedDataError('Validation Failed: message too long');
    }
    return messageBody;
}
exports.validateAndCreateMessageBody = validateAndCreateMessageBody;
class MessageConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Message;
    }
    convertGuidFromService(guid) {
        return ('Message:' + guid);
    }
    convertGuidToService(guid) {
        return guid.slice('Message:'.length);
    }
    async convertFromService(trc, params, syncContext, message) {
        const messageOut = messageFromService(message);
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, messageOut);
        return !prevNode;
    }
    async createOnService(trc, params, syncContext, message, serviceGuidSeed, remoteFields) {
        if (!remoteFields.threadID) {
            throw new Error('Missing remoteFields.threadID in thread command');
        }
        const auth = params.personalAuth;
        const messageStore = params.thriftComm.getMessageStore(auth.urls.messageStoreUrl);
        const messageBody = validateAndCreateMessageBody(message.label);
        const messageThread = {
            messageThreadId: Converters_1.convertGuidToService(remoteFields.threadID, en_core_entity_types_1.CoreEntityTypes.Thread),
            body: messageBody,
        };
        const resp = await messageStore.messageSendToThread(trc, auth.token, messageThread);
        await exports.MessageConverter.convertFromService(trc, params, conduit_core_1.PERSONAL_USER_CONTEXT, resp);
        return true;
    }
    async deleteFromService() {
        // TODO https://evernote.jira.com/browse/CZ-11
        return false;
    }
    async updateToService() {
        // TODO https://evernote.jira.com/browse/CZ-11
        return false;
    }
    async applyEdgeChangesToService() {
        // TODO https://evernote.jira.com/browse/CZ-11
        return false;
    }
    async customToService() {
        return null;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Message)
], MessageConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Thread)
], MessageConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Thread)
], MessageConverterClass.prototype, "customToService", null);
exports.MessageConverter = new MessageConverterClass();
//# sourceMappingURL=MessageConverter.js.map