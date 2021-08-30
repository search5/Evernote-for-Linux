"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMembershipOps = exports.createMembershipProfileEdges = exports.validateAndCalculateSizeLimits = exports.validateAccountLimits = exports.validateNoteTagsCount = exports.validateMaxNoteSize = exports.getNoteSize = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const AccountLimits_1 = require("../AccountLimits");
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
        throw new conduit_utils_1.LimitExceededError('noteSizeMax', 'thriftExceptionParameter=Note.size limit=noteSizeMax', noteSizeMax);
    }
}
exports.validateMaxNoteSize = validateMaxNoteSize;
function validateNoteTagsCount(accountLimits, noteTagsCount) {
    throwIfAccountLimitsNull(accountLimits);
    const noteTagCountMax = accountLimits.NodeFields.Limits.noteTagCountMax;
    if (conduit_utils_1.isNotNullish(noteTagsCount) && noteTagsCount > noteTagCountMax) {
        throw new conduit_utils_1.LimitExceededError('Note.tagGuids', 'thriftExceptionParameter=Note.tagGuids limit=noteTagCountMax', noteTagCountMax);
    }
}
exports.validateNoteTagsCount = validateNoteTagsCount;
function validateAccountLimits(currentAccountLimits, diff) {
    throwIfAccountLimitsNull(currentAccountLimits);
    const limits = currentAccountLimits.NodeFields.Limits;
    const counts = currentAccountLimits.NodeFields.Counts;
    throwIfLimitReached(limits.userNoteCountMax, counts.userNoteCount, diff.userNoteCountChange, 'Note', 'userNoteCountMax');
    throwIfLimitReached(limits.userNotebookCountMax, counts.userNotebookCount, diff.userNotebookCountChange, 'Notebook', 'userNotebookCountMax');
    throwIfLimitReached(limits.userLinkedNotebookMax, counts.userLinkedNotebookCount, diff.userLinkedNotebookCountChange, 'Notebook', 'userLinkedNotebookMax');
    throwIfLimitReached(limits.userTagCountMax, counts.userTagCount, diff.userTagCountChange, 'Tag', 'userTagCountMax');
    throwIfLimitReached(limits.userSavedSearchesMax, counts.userSavedSearchesCount, diff.userSavedSearchesCountChange, 'SavedSearches', 'userSavedSearchesMax');
    throwIfLimitReached(limits.userDeviceLimit, counts.userDeviceCount, diff.userDeviceCountChange, 'Device', 'userDeviceLimit');
    throwIfLimitReached(limits.userWorkspaceCountMax, counts.userWorkspaceCount, diff.userWorkspaceCountChange, 'Workspace', 'userWorkspaceCountMax');
    throwIfLimitReached(limits.uploadLimit, counts.userUploadedAmount, diff.userUploadedAmountChange, 'uploadLimit', 'uploadLimit');
    throwIfLimitReached(limits.taskAssignmentLimitDaily, counts.taskAssignmentLimitDaily, diff.taskAssignmentLimitDaily, 'taskAssignmentLimitDaily', 'taskAssignmentLimitDaily');
}
exports.validateAccountLimits = validateAccountLimits;
function throwIfLimitReached(limit, currentValue, diff, errorKey, limitName) {
    if (conduit_utils_1.isNotNullish(diff) && currentValue + diff > limit) {
        throw new conduit_utils_1.LimitExceededError(errorKey, `thriftExceptionParameter=${errorKey} limitName=${limitName} limit=${limit}`, limit);
    }
}
function throwIfAccountLimitsNull(accountLimits) {
    if (!accountLimits) {
        throw new conduit_utils_1.NotFoundError(AccountLimits_1.ACCOUNT_LIMITS_ID, 'Missing limits');
    }
}
function validateAndCalculateSizeLimits(accountLimits, accountLimitsValidationParams) {
    throwIfAccountLimitsNull(accountLimits);
    const { prevNoteContentSize, newNoteContentSize, prevNoteResourceSize, uploadResourceSize } = accountLimitsValidationParams;
    // 1. Check monthly upload limits
    // 2. Check resource limits
    // 3. check max note size
    // monthly upload limits check includes content size and resource size
    const totalUploadSize = (newNoteContentSize ? newNoteContentSize - prevNoteContentSize : 0) + (uploadResourceSize !== null && uploadResourceSize !== void 0 ? uploadResourceSize : 0);
    const uploadLimit = accountLimits.NodeFields.Limits.uploadLimit;
    const uploaded = accountLimits.NodeFields.Counts.userUploadedAmount + totalUploadSize;
    if (uploaded > uploadLimit) {
        throw new conduit_utils_1.LimitExceededError('userUploadedLimit', `thriftExceptionParameter=Accounting.uploadLimit limit=userUploadedLimit`, uploadLimit);
    }
    if (uploadResourceSize) {
        const resourceLimit = accountLimits.NodeFields.Limits.resourceSizeMax;
        if (uploadResourceSize > resourceLimit) {
            throw new conduit_utils_1.LimitExceededError('resourceSizeMax', `thriftExceptionParameter=Resource.data.size limit=resourceSizeMax`, resourceLimit);
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
exports.validateAndCalculateSizeLimits = validateAndCalculateSizeLimits;
async function createMembershipProfileEdges(membershipID, profileIDsPerEdge) {
    return Object.entries(profileIDsPerEdge).map(([srcPort, profileID]) => ({
        srcID: membershipID, srcType: EntityConstants_1.CoreEntityTypes.Membership, srcPort,
        dstID: profileID, dstType: EntityConstants_1.CoreEntityTypes.Profile, dstPort: null,
    }));
}
exports.createMembershipProfileEdges = createMembershipProfileEdges;
async function createMembershipOps(trc, ctx, owner, params) {
    const membershipGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Membership);
    const membershipID = membershipGenID[1];
    const membership = ctx.createEntity({ id: membershipID, type: EntityConstants_1.CoreEntityTypes.Membership }, {
        privilege: params.privilege,
        recipientType: en_conduit_sync_types_1.MembershipRecipientType.USER,
        recipientIsMe: params.recipientIsMe,
    });
    const membershipProfileEdges = await createMembershipProfileEdges(membershipID, params.profileEdgeMap);
    return [
        {
            changeType: 'Node:CREATE',
            node: membership,
            id: membershipGenID,
        }, {
            changeType: 'Edge:MODIFY',
            edgesToCreate: [
                {
                    srcID: params.parentRef.id, srcType: params.parentRef.type, srcPort: 'memberships',
                    dstID: membership.id, dstType: EntityConstants_1.CoreEntityTypes.Membership, dstPort: 'parent',
                },
                ...membershipProfileEdges,
            ],
        },
    ];
}
exports.createMembershipOps = createMembershipOps;
//# sourceMappingURL=MutatorHelpers.js.map