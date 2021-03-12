"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountLimits = exports.validateMaxNoteSize = exports.getNoteSize = void 0;
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
async function getNoteSize(trc, context, note) {
    let resourceSize = 0;
    const attachmentIDs = [];
    const activeIDs = new Set();
    for (const edge of Object.values(note.outputs.attachments)) {
        attachmentIDs.push(edge.dstID);
        activeIDs.add(edge.dstID);
    }
    for (const edge of Object.values(note.outputs.inactiveAttachments)) {
        attachmentIDs.push(edge.dstID);
    }
    const attachments = await context.fetchEntities(trc, EntityConstants_1.CoreEntityTypes.Attachment, attachmentIDs);
    const activeAttachmentHashes = new Set();
    for (let i = 0; i < attachments.length; ++i) {
        const attachment = attachments[i];
        if (!attachment) {
            conduit_utils_1.logger.warn('Missing attachment for Note->Attachment edge', { noteID: note.id, attachmentID: attachmentIDs[i] });
            continue;
        }
        resourceSize += attachment.NodeFields.data.size;
        if (activeIDs.has(attachment.id)) {
            activeAttachmentHashes.add(attachment.NodeFields.data.hash);
        }
    }
    return { contentSize: note.NodeFields.content.size, resourceSize, attachments, activeAttachmentHashes };
}
exports.getNoteSize = getNoteSize;
function validateMaxNoteSize(accountLimits, noteSize) {
    const noteSizeMax = accountLimits.NodeFields.Limits.noteSizeMax;
    if (noteSize > noteSizeMax) {
        throw new conduit_utils_1.ServiceError('LIMIT_REACHED', 'noteSizeMax', 'type=LIMIT_REACHED thriftExceptionParameter=Note.size limit=noteSizeMax');
    }
}
exports.validateMaxNoteSize = validateMaxNoteSize;
function validateAccountLimits(accountLimits, accountLimitsValidationParams) {
    const { prevNoteContentSize, newNoteContentSize, prevNoteResourceSize, uploadResourceSize } = accountLimitsValidationParams;
    // 1. Check monthly upload limits
    // 2. Check resource limits
    // 3. check max note size
    // monthly upload limits check includes content size and resource size
    const totalUploadSize = (newNoteContentSize ? newNoteContentSize - prevNoteContentSize : 0) + (uploadResourceSize !== null && uploadResourceSize !== void 0 ? uploadResourceSize : 0);
    const uploadLimit = accountLimits.NodeFields.Limits.uploadLimit;
    const uploaded = accountLimits.NodeFields.Counts.userUploadedAmount + totalUploadSize;
    if (uploaded > uploadLimit) {
        throw new conduit_utils_1.ServiceError('LIMIT_REACHED', 'userUploadedLimit', 'type=LIMIT_REACHED thriftExceptionParameter=Accounting.uploadLimit limit=userUploadedLimit');
    }
    if (uploadResourceSize) {
        const resourceLimit = accountLimits.NodeFields.Limits.resourceSizeMax;
        if (uploadResourceSize > resourceLimit) {
            throw new conduit_utils_1.ServiceError('LIMIT_REACHED', 'resourceSizeMax', 'type=LIMIT_REACHED thriftExceptionParameter=Resource.data.size limit=resourceSizeMax');
        }
    }
    const newNoteSize = (newNoteContentSize !== null && newNoteContentSize !== void 0 ? newNoteContentSize : prevNoteContentSize) + prevNoteResourceSize + (uploadResourceSize !== null && uploadResourceSize !== void 0 ? uploadResourceSize : 0);
    validateMaxNoteSize(accountLimits, newNoteSize);
    return {
        NodeFields: {
            Counts: {
                userUploadedAmount: uploaded,
            },
        },
    };
}
exports.validateAccountLimits = validateAccountLimits;
//# sourceMappingURL=MutatorHelpers.js.map