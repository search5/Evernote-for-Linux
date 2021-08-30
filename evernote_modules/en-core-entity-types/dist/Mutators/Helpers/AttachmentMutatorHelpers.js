"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAttachmentCreateOps = exports.processApplicationData = exports.parseAndValidateAttachmentCreateData = void 0;
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../../EntityConstants");
const AttachmentCreateDataSchema = {
    filename: 'string',
    mime: 'string',
    hash: 'string',
    size: 'number',
    stagedBlobID: 'string',
    applicationData: conduit_utils_1.NullableMapOf('string'),
    url: conduit_utils_1.NullableUrl,
    attachmentGenID: conduit_utils_1.NullableListOf('string'),
    sourceURL: conduit_utils_1.NullableUrl,
};
function parseAndValidateAttachmentCreateData(jsonStr) {
    const res = conduit_utils_1.safeParse(jsonStr);
    for (const data of res) {
        for (const key in AttachmentCreateDataSchema) {
            conduit_utils_1.validateSchemaType(AttachmentCreateDataSchema[key], key, data[key]);
        }
    }
    return res;
}
exports.parseAndValidateAttachmentCreateData = parseAndValidateAttachmentCreateData;
function processApplicationData(applicationDataString) {
    let applicationData;
    let applicationDataKeys;
    const parsedApplicationData = conduit_utils_1.safeParse(applicationDataString);
    if (parsedApplicationData) {
        applicationData = parsedApplicationData;
        conduit_utils_1.verifyStash(applicationData, 'ApplicationData');
        applicationDataKeys = Object.keys(applicationData || {});
    }
    return { applicationData, applicationDataKeys };
}
exports.processApplicationData = processApplicationData;
async function genAttachmentCreateOps(trc, ctx, data, plan, noteRef, owner, isActive, lateUpload) {
    let attachmentGenID = await ctx.generateID(trc, owner, 'Resource', data.hash); // note: this requires the _service_ type, so Resource as long as we are on Thrift
    if (data.attachmentGenID) {
        if (attachmentGenID[2].toString() !== data.attachmentGenID[2]) {
            throw new conduit_utils_1.InternalError(`attachmentCreateInternal picked a different owner (${attachmentGenID[2]}) from the one passed in to the mutator (${data.attachmentGenID[2]})`);
        }
        attachmentGenID = [
            data.attachmentGenID[0],
            data.attachmentGenID[1],
            attachmentGenID[2],
            attachmentGenID[3],
        ];
    }
    const attachmentID = attachmentGenID[1];
    const nodeRef = { id: attachmentID, type: EntityConstants_1.CoreEntityTypes.Attachment };
    const attachmentEntity = ctx.createEntity(nodeRef, {
        label: data.filename,
        mime: data.mime,
        filename: data.filename,
        isActive,
        ['data.hash']: data.hash,
        ['data.size']: data.size,
        ['data.url']: data.url || null,
        applicationDataKeys: Object.keys(data.applicationData || {}),
        Attributes: data.sourceURL ? { sourceURL: data.sourceURL } : undefined,
    });
    if (lateUpload) {
        plan.lateOps = plan.lateOps || [];
    }
    (lateUpload ? plan.lateOps : plan.ops).push({
        changeType: 'Blob:UPLOAD',
        stagedBlobID: data.stagedBlobID,
        id: attachmentGenID,
        remoteFields: {
            parentID: noteRef.id,
            filename: data.filename,
            mimeType: data.mime,
            hash: data.hash,
            size: data.size,
            attachmentID,
            applicationData: data.applicationData,
            sourceURL: data.sourceURL,
        },
    });
    plan.ops.push({
        changeType: 'Node:CREATE',
        node: attachmentEntity,
        id: attachmentGenID,
        remoteFields: {},
    });
    plan.ops.push({
        changeType: 'Edge:MODIFY',
        edgesToCreate: [{
                srcID: noteRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: isActive ? 'attachments' : 'inactiveAttachments',
                dstID: attachmentID, dstType: EntityConstants_1.CoreEntityTypes.Attachment, dstPort: 'parent',
            }],
    });
    return attachmentID;
}
exports.genAttachmentCreateOps = genAttachmentCreateOps;
//# sourceMappingURL=AttachmentMutatorHelpers.js.map