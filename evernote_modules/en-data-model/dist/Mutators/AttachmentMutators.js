"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentSetFileName = exports.attachmentCreateInternal = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
const index_1 = require("../index");
const AttachmentMutatorHelpers_1 = require("./Helpers/AttachmentMutatorHelpers");
const MutatorHelpers_1 = require("./MutatorHelpers");
exports.attachmentCreateInternal = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    isInternal: true,
    requiredParams: {
        noteID: 'ID',
        filename: 'string',
        mime: 'string',
        hash: 'string',
        size: 'number',
        stagedBlobID: 'string',
    },
    optionalParams: {
        applicationData: 'string',
        url: 'string',
        attachmentGenID: 'string[]',
        sourceURL: 'string',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.noteID, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.noteID, 'note id listed is not valid');
        }
        const accountLimits = await ctx.fetchEntity(trc, index_1.ACCOUNT_LIMITS_REF);
        if (!accountLimits) {
            throw new conduit_utils_1.NotFoundError(index_1.ACCOUNT_LIMITS_ID, 'Missing account limits');
        }
        const { contentSize, resourceSize } = await MutatorHelpers_1.getNoteSize(trc, ctx, note);
        const updatedLimits = MutatorHelpers_1.validateAccountLimits(accountLimits, {
            prevNoteContentSize: contentSize,
            prevNoteResourceSize: resourceSize,
            uploadResourceSize: params.size,
        });
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: index_1.ACCOUNT_LIMITS_REF,
                    node: updatedLimits,
                }],
        };
        const { applicationData } = AttachmentMutatorHelpers_1.processApplicationData(params.applicationData);
        const data = Object.assign(Object.assign({}, params), { applicationData });
        plan.result = await AttachmentMutatorHelpers_1.genAttachmentCreateOps(trc, ctx, data, plan, noteRef, noteRef, false, false);
        return plan;
    },
};
exports.attachmentSetFileName = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        attachmentID: 'ID',
        fileName: 'string',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const plan = {
            result: null,
            ops: [],
        };
        const attachmentRef = { id: params.attachmentID, type: EntityConstants_1.CoreEntityTypes.Attachment };
        const fields = {
            filename: params.fileName,
            label: params.fileName,
        };
        plan.ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: attachmentRef,
            node: ctx.assignFields(attachmentRef.type, fields),
        });
        return plan;
    },
};
//# sourceMappingURL=AttachmentMutators.js.map