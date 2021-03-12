"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
exports.InvitationConverter = exports.acceptSharedNote = exports.acceptSharedNotebook = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth = __importStar(require("../Auth"));
const ThriftGraphInterface_1 = require("../ThriftGraphInterface");
const Converters_1 = require("./Converters");
const LinkedNotebookHelpers_1 = require("./LinkedNotebookHelpers");
async function acceptSharedNotebook(trc, params, syncContext, acceptParams) {
    const auth = params.personalAuth;
    if (!auth) {
        throw new Error('missing auth');
    }
    const sharedNotebook = await Auth.authenticateToSharedNotebook(trc, params.thriftComm, auth, acceptParams.shareKey, acceptParams.noteStoreUrl);
    if (!sharedNotebook) {
        // notebook has been unshared
        if (acceptParams.invitationNodeID) {
            // delete invitation node.
            await params.graphTransaction.deleteNode(trc, conduit_core_1.PERSONAL_USER_CONTEXT, { id: acceptParams.invitationNodeID, type: en_core_entity_types_1.CoreEntityTypes.Invitation });
        }
        else {
            // cleanup partial notebook.
            await LinkedNotebookHelpers_1.removePartialNotebook(trc, params, syncContext, acceptParams.shareKey, true);
        }
        // throw ErrorWithCleanup so that graph cleanup changes above go through.
        throw new ThriftGraphInterface_1.ErrorWithCleanup(new conduit_utils_1.NoAccessError(acceptParams.shareKey));
    }
    const personalNoteStore = params.thriftComm.getNoteStore(auth.urls.noteStoreUrl);
    const linkedNotebook = await personalNoteStore.getOrCreateLinkedNotebook(trc, auth.token, {
        shareName: acceptParams.shareName,
        username: sharedNotebook.username || '',
        shardId: acceptParams.shardId,
        sharedNotebookGlobalId: sharedNotebook.globalId,
    });
    const shareGuid = sharedNotebook.globalId;
    let shareState = await params.graphTransaction.getSyncState(trc, null, ['sharing', 'sharedNotebooks', shareGuid]);
    if (!shareState) {
        shareState = {
            guid: shareGuid,
            notebookGuid: Converters_1.convertGuidFromService(sharedNotebook.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook),
            noteStoreUrl: acceptParams.noteStoreUrl,
            authStr: sharedNotebook.authStr,
            sharedNotebookId: sharedNotebook.id || null,
            linkedNotebook,
            shardId: acceptParams.shardId,
            sharerId: sharedNotebook.sharerUserId ? sharedNotebook.sharerUserId : null,
            ownerId: sharedNotebook.userId,
        };
        await params.graphTransaction.replaceSyncState(trc, ['sharing', 'sharedNotebooks', shareState.guid], shareState);
    }
    // cleanup any partial notebook for shared nb.
    await LinkedNotebookHelpers_1.removePartialNotebook(trc, params, syncContext, shareGuid, false);
    return {
        notebookID: sharedNotebook.notebookGuid || null,
        shareState,
    };
}
exports.acceptSharedNotebook = acceptSharedNotebook;
async function acceptSharedNotebookFromInvitation(trc, params, syncContext, invitation) {
    const attachment = invitation.NodeFields.internal_attachment;
    if (!attachment.guid || !attachment.noteStoreUrl || !attachment.shardId) {
        throw new conduit_utils_1.MissingParameterError(`Missing information to accept share ${attachment}`);
    }
    const shareData = await acceptSharedNotebook(trc, params, syncContext, {
        shardId: attachment.shardId,
        shareKey: attachment.guid,
        shareName: attachment.title || '',
        noteStoreUrl: attachment.noteStoreUrl,
        invitationNodeID: invitation.id,
    });
    return shareData.notebookID;
}
async function acceptSharedNote(trc, params, invitation) {
    const auth = params.personalAuth;
    if (!auth) {
        throw new Error('missing auth');
    }
    const attachment = invitation.NodeFields.internal_attachment;
    const sharedNote = await Auth.authenticateToNote(trc, params.thriftComm, auth, attachment.guid, attachment.noteStoreUrl, attachment.shardId);
    if (!sharedNote) {
        // Note has been unshared
        throw new conduit_utils_1.NoAccessError(invitation.id);
    }
    const sharedNoteGuid = sharedNote.guid;
    let shareState = await params.graphTransaction.getSyncState(trc, null, ['sharing', 'sharedNotes', sharedNoteGuid]);
    if (!shareState) {
        shareState = {
            noteGuid: sharedNoteGuid,
            noteStoreUrl: attachment.noteStoreUrl,
            authStr: sharedNote.authStr,
            shardId: attachment.shardId,
            ownerId: attachment.userId ? attachment.userId : null,
        };
        await params.graphTransaction.replaceSyncState(trc, ['sharing', 'sharedNotes', sharedNoteGuid], shareState);
    }
    return {
        noteID: Converters_1.convertGuidFromService(sharedNoteGuid, en_core_entity_types_1.CoreEntityTypes.Note),
        shareState,
    };
}
exports.acceptSharedNote = acceptSharedNote;
class InvitationConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Invitation;
    }
    convertGuidFromService(guid) {
        return `Invitation:${guid}`;
    }
    convertGuidToService(guid) {
        return guid.slice(guid.indexOf(':') + 1);
    }
    async convertFromService() {
        // Inbound shares are created from message attachments, and are created in the file MessageAttachmentConverter.ts
        throw new Error('Unable to create from service');
    }
    async createOnService() {
        throw new Error('Unable to make your own Inbound share');
    }
    async customToService(trc, params, commandRun, syncContext) {
        switch (commandRun.command) {
            case 'AcceptInvitation':
                const acceptParams = commandRun.params;
                const invitation = await params.graphTransaction.getNode(trc, null, { type: en_core_entity_types_1.CoreEntityTypes.Invitation, id: acceptParams.invitation });
                if (!invitation) {
                    throw new conduit_utils_1.NotFoundError(acceptParams.invitation, `unable to find invitation`);
                }
                switch (invitation.NodeFields.invitationType) {
                    case 'NOTE':
                        const shareData = await acceptSharedNote(trc, params, invitation);
                        return shareData.noteID;
                    case 'NOTEBOOK':
                        return await acceptSharedNotebookFromInvitation(trc, params, syncContext, invitation);
                    default:
                        throw new Error('Unknown invitation type');
                }
            default:
                throw new Error(`Unknown customToService command for Invitation ${commandRun.command}`);
        }
    }
    async deleteFromService() {
        throw new Error('Unable to delete inbound shares');
    }
    async updateToService() {
        throw new Error('Unable to update inbound shares');
    }
    async applyEdgeChangesToService() {
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Invitation)
], InvitationConverterClass.prototype, "customToService", null);
exports.InvitationConverter = new InvitationConverterClass();
//# sourceMappingURL=InvitationConverter.js.map