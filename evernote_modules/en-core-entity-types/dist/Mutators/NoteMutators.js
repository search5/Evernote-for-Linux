"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteSetApplicationDataEntry = exports.noteSetCreated = exports.noteUnlinkConflictBackup = exports.noteInvite = exports.noteSetAuthor = exports.noteSetSourceApplication = exports.noteSetSourceUrl = exports.noteSetSource = exports.noteSetContentClass = exports.noteSetReminderOrder = exports.noteSetReminderDone = exports.noteClearReminder = exports.noteSetReminder = exports.noteSetSubjectDate = exports.noteSetPlaceName = exports.noteSetLocation = exports.noteSendByEmail = exports.noteSetSharePublic = exports.noteSetContent = exports.noteMoveInternal = exports.notesExpunge = exports.noteExpunge = exports.noteSetLabel = exports.noteRestore = exports.noteDelete = exports.noteCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const __1 = require("..");
const AccountLimits_1 = require("../AccountLimits");
const CommandPolicyRules_1 = require("../CommandPolicyRules");
const EntityConstants_1 = require("../EntityConstants");
const MembershipPrivilege_1 = require("../MembershipPrivilege");
const Note_1 = require("../NodeTypes/Note");
const ShareUtils_1 = require("../ShareUtils");
const NoteMutatorHelpers_1 = require("./Helpers/NoteMutatorHelpers");
const MutatorHelpers_1 = require("./MutatorHelpers");
exports.noteCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        untitledNoteLabel: 'string',
        noteContent: conduit_utils_1.NullableString,
        container: conduit_utils_1.NullableID,
        label: conduit_utils_1.NullableString,
        tags: conduit_utils_1.NullableListOf('ID'),
        created: conduit_utils_1.NullableNumber,
        updated: conduit_utils_1.NullableNumber,
        subjectDate: conduit_utils_1.NullableNumber,
        contentClass: conduit_utils_1.NullableString,
        latitude: conduit_utils_1.NullableNumber,
        longitude: conduit_utils_1.NullableNumber,
        altitude: conduit_utils_1.NullableNumber,
        placeName: conduit_utils_1.NullableString,
        reminderTime: conduit_utils_1.NullableNumber,
        reminderDoneTime: conduit_utils_1.NullableNumber,
        reminderOrder: conduit_utils_1.NullableNumber,
        author: conduit_utils_1.NullableString,
        source: conduit_utils_1.NullableString,
        sourceUrl: conduit_utils_1.NullableString,
        sourceApplication: conduit_utils_1.NullableString,
        attachmentHashes: conduit_utils_1.NullableListOf('string'),
        applicationData: conduit_utils_1.NullableMapOf('string'),
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        paramsOut.noteContent = paramsIn.noteContent || Note_1.DEFAULT_NOTE_CONTENT;
    },
    execute: async (trc, ctx, params) => {
        var _a, _b;
        // Check account limit
        const accountLimits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        MutatorHelpers_1.validateNoteTagsCount(accountLimits, (_a = params.tags) === null || _a === void 0 ? void 0 : _a.length);
        MutatorHelpers_1.validateAccountLimits(accountLimits, { userNoteCountChange: 1 });
        // check maxNoteSize and uploaded resources
        const updatedLimits = MutatorHelpers_1.validateAndCalculateSizeLimits(accountLimits, {
            prevNoteContentSize: 0,
            newNoteContentSize: (_b = params.noteContent.length) !== null && _b !== void 0 ? _b : 0,
            prevNoteResourceSize: 0,
        });
        const plan = {
            results: {
                result: null,
            },
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: AccountLimits_1.ACCOUNT_LIMITS_REF,
                    node: updatedLimits,
                }],
        };
        const { noteID } = await NoteMutatorHelpers_1.genNoteCreate(trc, ctx, params, plan);
        plan.results.result = noteID;
        return plan;
    },
};
exports.noteDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const plan = {
            results: {},
            ops: [],
        };
        await NoteMutatorHelpers_1.genNoteMoveToTrashOps(trc, ctx, noteRef, plan.ops);
        return plan;
    },
};
exports.noteRestore = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to delete');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canRestoreFromTrash) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot restore from trash');
        }
        const parentID = NoteMutatorHelpers_1.getNoteParentID(note);
        if (!parentID) {
            throw new conduit_utils_1.GraphNodeError(noteRef.id, noteRef.type, 'Missing parent!');
        }
        const container = await NoteMutatorHelpers_1.fetchContainer(trc, ctx, parentID);
        if (!container) {
            throw new conduit_utils_1.NotFoundError(parentID, 'Parent not found');
        }
        const fields = {
            deleted: null,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: noteRef,
                    node: ctx.assignFields(noteRef.type, fields),
                }, {
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [],
                    edgesToDelete: [{
                            dstID: noteRef.id, dstType: noteRef.type, dstPort: 'parent',
                        }],
                }],
        };
        if (container.type === EntityConstants_1.CoreEntityTypes.Notebook) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: container.id, srcType: container.type, srcPort: 'children',
                        dstID: note.id, dstType: note.type, dstPort: 'parent',
                    }],
            });
        }
        else if (container.type === EntityConstants_1.CoreEntityTypes.Workspace) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: container.id, srcType: container.type, srcPort: 'children',
                        dstID: note.id, dstType: note.type, dstPort: 'parent',
                    }],
            });
        }
        const tags = await ctx.traverseGraph(trc, noteRef, [{ edge: ['outputs', 'tags'], type: EntityConstants_1.CoreEntityTypes.Tag }]);
        plan.ops.push({
            changeType: 'Edge:MODIFY',
            edgesToCreate: tags.map(tag => {
                return {
                    srcID: note.id, srcType: note.type, srcPort: 'tags',
                    dstID: tag.id, dstType: tag.type, dstPort: 'refs',
                };
            }),
            edgesToDelete: tags.map(tag => {
                return {
                    srcID: note.id, srcType: note.type, srcPort: 'tags',
                    dstID: tag.id, dstType: tag.type, dstPort: 'refsInTrash',
                };
            }),
        });
        return plan;
    },
};
exports.noteSetLabel = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        untitledNoteLabel: 'string',
        label: conduit_utils_1.NullableString,
    },
    buffering: {
        time: 2000,
    },
    rollupStrategy: {
        ifParamsMatch: [{ prev: 'note', next: 'note' }],
        combineParams: { label: 'last', untitledNoteLabel: 'last' },
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to share');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canEditLabel) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit label');
        }
        const fields = {
            label: params.label || params.untitledNoteLabel,
            updated: ctx.thriftTimestamp,
            isUntitled: !params.label,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: noteRef,
                    node: ctx.assignFields(noteRef.type, fields),
                }],
        };
        if (ctx.isOptimistic) {
            // push note label into membership label, for membership sorting
            const memberships = await ctx.traverseGraph(trc, noteRef, [{ edge: ['outputs', 'memberships'], type: EntityConstants_1.CoreEntityTypes.Membership }]);
            const memField = {
                label: params.label || params.untitledNoteLabel,
            };
            for (const membership of memberships) {
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: membership.id, type: EntityConstants_1.CoreEntityTypes.Membership },
                    node: ctx.assignFields(EntityConstants_1.CoreEntityTypes.Membership, memField),
                });
            }
        }
        return plan;
    },
};
exports.noteExpunge = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to expunge');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canExpunge) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot expunge note');
        }
        return {
            results: {},
            ops: [{
                    // delete note
                    changeType: 'Node:DELETE',
                    nodeRef: noteRef,
                }],
        };
    },
};
exports.notesExpunge = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        notes: conduit_utils_1.ListOf('ID'),
    },
    execute: async (trc, ctx, params) => {
        if (!params.notes.length) {
            conduit_utils_1.logger.warn('Empty array of node ids given to expunge');
            return {
                results: {},
                ops: [],
            };
        }
        const notes = await ctx.fetchEntities(trc, EntityConstants_1.CoreEntityTypes.Note, params.notes);
        const noteRefs = notes.map((note, i) => {
            if (!note) {
                throw new conduit_utils_1.NotFoundError(params.notes[i], `Missing note to expunge`);
            }
            return { id: note.id, type: note.type };
        });
        return {
            results: {},
            ops: [{
                    // delete notes
                    changeType: 'Node:DELETE_MULTI',
                    nodes: noteRefs,
                }],
        };
    },
};
exports.noteMoveInternal = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    isInternal: true,
    params: {
        note: 'ID',
        targetContainer: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to move');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canMove) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot move note');
        }
        const containerNode = await NoteMutatorHelpers_1.fetchContainer(trc, ctx, params.targetContainer);
        if (!containerNode) {
            throw new conduit_utils_1.NotFoundError(params.targetContainer, 'Container for move does not exist');
        }
        return {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: containerNode.id, srcType: containerNode.type, srcPort: 'children',
                            dstID: note.id, dstType: note.type, dstPort: 'parent',
                        }],
                    edgesToDelete: [{
                            dstID: note.id, dstType: note.type, dstPort: 'parent',
                        }],
                }],
        };
    },
};
exports.noteSetContent = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        noteContent: 'string',
        nextActiveAttachments: conduit_utils_1.NullableListOf('string'),
        nextTaskGroups: conduit_utils_1.NullableListOf('string'),
        prevNoteHash: conduit_utils_1.NullableString,
        isInternalUpdate: conduit_utils_1.NullableBoolean,
    },
    failSafeKey: 'note',
    resultTypes: {
        result: 'string',
        editSequenceNumber: conduit_utils_1.NullableInt,
    },
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a, _b;
        const note = await ctx.fetchEntity(trc, { type: EntityConstants_1.CoreEntityTypes.Note, id: paramsIn.note });
        paramsOut.prevNoteHash = paramsIn.prevNoteHash || (note === null || note === void 0 ? void 0 : note.NodeFields.content.hash) || '';
        paramsOut.graphPrevNoteHash = (note === null || note === void 0 ? void 0 : note.NodeFields.content.hash) || '';
        paramsOut.noteHash = ctx.md5(paramsIn.noteContent);
        paramsOut.noteSize = paramsIn.noteContent.length;
        if (paramsOut.noteHash !== paramsOut.prevNoteHash) {
            paramsOut.editSequenceNumber = ((_b = (_a = note === null || note === void 0 ? void 0 : note.CacheFields) === null || _a === void 0 ? void 0 : _a['content.editSequenceNumber']) !== null && _b !== void 0 ? _b : 0) + 1;
        }
    },
    buffering: {
        time: 'turboSyncNoteIdleUpdateBuffer',
        rollupFlush: 'turboSyncNoteEditUpdateBuffer',
    },
    rollupStrategy: {
        ifParamsMatch: [
            { prev: 'note', next: 'note' },
            // make sure to only rollup if the mutations actually build on each other, otherwise it is a conflict
            { prev: 'noteHash', next: 'prevNoteHash' },
        ],
        combineParams: {
            noteContent: 'last',
            graphPrevNoteHash: 'first',
            prevNoteHash: 'first',
            noteHash: 'last',
            noteSize: 'last',
            nextActiveAttachments: 'last',
            nextTaskGroups: 'last',
            isInternalUpdate: 'and',
            editSequenceNumber: 'or',
        },
        onRollup: (mPrev, mNext) => {
            __1.NoteConflictLogger.logEvent(mNext.params.note, 'noteSetContent.rollup', {
                prevNoteHash: mPrev.params.prevNoteHash,
                rolledUpHash: mNext.params.prevNoteHash,
                noteHash: mNext.params.noteHash,
            });
        },
    },
    execute: async (trc, ctx, params) => {
        var _a, _b;
        if (ctx.isOptimistic && !ctx.isOptimisticRerun) {
            __1.NoteConflictLogger.logEvent(params.note, 'noteSetContent', {
                noteHash: params.noteHash,
                prevNoteHash: params.prevNoteHash,
                graphPrevNoteHash: params.graphPrevNoteHash,
                isInternalUpdate: params.isInternalUpdate,
            });
        }
        const plan = {
            results: {
                result: params.noteHash,
                editSequenceNumber: params.editSequenceNumber,
            },
            ops: [],
        };
        // TODO permissions checks? or is it implicitly checked under the hood by nature of the execution plan's instructions?
        // If the note hash did not change from the prevNoteHash there were no local changes to the content
        // so skip the mutation. Need to check editSequenceNumber though, because a rollup of change+undo still
        // needs to write the updated ESN into the DB, even though there is no content change to upsync.
        if (params.noteHash === params.prevNoteHash && !params.editSequenceNumber) {
            conduit_utils_1.logger.info('Hash of note did not change, skipping update:', { id: params.note, hash: params.noteHash });
            return plan;
        }
        const nodeRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, nodeRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to set content');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canEditContent) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit note content');
        }
        const accountLimits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        const { contentSize, resourceSize, attachments, activeAttachmentHashes } = await MutatorHelpers_1.getNoteSize(trc, ctx, note);
        // check account limits
        const updatedLimits = MutatorHelpers_1.validateAndCalculateSizeLimits(accountLimits, {
            prevNoteContentSize: contentSize,
            newNoteContentSize: (_b = (_a = params.noteContent) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
            prevNoteResourceSize: resourceSize,
        });
        const remoteFields = {
            nextActiveAttachments: params.nextActiveAttachments,
            prevNoteHash: params.prevNoteHash,
            graphPrevNoteHash: params.graphPrevNoteHash,
            hashDiff: {},
            updated: params.isInternalUpdate ? note.NodeFields.updated : ctx.thriftTimestamp,
            editSequenceNumber: params.editSequenceNumber,
        };
        plan.ops.push({
            changeType: 'Blob:REPLACE',
            nodeRef,
            blob: {
                name: 'content',
                content: params.noteContent,
                hash: params.noteHash,
                size: params.noteSize,
                editSequenceNumber: params.editSequenceNumber,
            },
            remoteFields,
        });
        plan.ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: AccountLimits_1.ACCOUNT_LIMITS_REF,
            node: updatedLimits,
        });
        if (ctx.isOptimistic && !params.isInternalUpdate) {
            // for remote, the updated timestamp gets pushed through the content blob update
            plan.ops.push({
                changeType: 'Node:UPDATE',
                nodeRef,
                node: {
                    NodeFields: {
                        updated: ctx.thriftTimestamp,
                    },
                },
            });
        }
        // diff content and update attachments
        const hashDiff = conduit_core_1.extractResourceHashDiff(activeAttachmentHashes, params.nextActiveAttachments ? new Set(params.nextActiveAttachments) : params.noteContent);
        remoteFields.hashDiff = hashDiff;
        if (ctx.isOptimistic && !conduit_utils_1.isStashEmpty(hashDiff)) {
            const edgesToCreate = [];
            const edgesToDelete = [];
            const hashLookup = {};
            for (const attachment of attachments) {
                if (attachment) {
                    hashLookup[attachment.NodeFields.data.hash] = attachment;
                }
            }
            for (const hash in hashDiff) {
                const diff = hashDiff[hash];
                const attachment = hashLookup[hash];
                if (!attachment) {
                    continue;
                }
                plan.ops.push({
                    changeType: 'Node:UPDATE',
                    nodeRef: {
                        type: EntityConstants_1.CoreEntityTypes.Attachment,
                        id: attachment.id,
                    },
                    node: {
                        NodeFields: {
                            isActive: diff,
                        },
                    },
                });
                if (diff === true) {
                    // move from inactiveAttachments to attachments
                    edgesToDelete.push({
                        srcID: nodeRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'inactiveAttachments',
                        dstID: attachment.id, dstType: EntityConstants_1.CoreEntityTypes.Attachment, dstPort: 'parent',
                    });
                    edgesToCreate.push({
                        srcID: nodeRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'attachments',
                        dstID: attachment.id, dstType: EntityConstants_1.CoreEntityTypes.Attachment, dstPort: 'parent',
                    });
                }
                else {
                    // move from attachments to inactiveAttachments
                    edgesToDelete.push({
                        srcID: nodeRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'attachments',
                        dstID: attachment.id, dstType: EntityConstants_1.CoreEntityTypes.Attachment, dstPort: 'parent',
                    });
                    edgesToCreate.push({
                        srcID: nodeRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'inactiveAttachments',
                        dstID: attachment.id, dstType: EntityConstants_1.CoreEntityTypes.Attachment, dstPort: 'parent',
                    });
                }
                plan.ops.push({
                    changeType: 'Edge:MODIFY',
                    edgesToCreate,
                    edgesToDelete,
                });
            }
        }
        if (params.nextTaskGroups) {
            // TODO diff tasks and issue plan operations for modifying them, similar to Attachments above
            // these ops will handle the optimistic changes and do nothing in the Thrift connector because there is no Task converter
            plan.ops.push({
                changeType: 'Custom',
                commandName: 'taskUpdateNoteTaskGroups',
                params: {
                    noteID: nodeRef.id,
                    taskGroups: params.nextTaskGroups,
                    noteContentHash: params.noteHash,
                    noteContentSize: params.noteSize,
                },
            });
        }
        return plan;
    },
};
exports.noteSetSharePublic = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        enable: 'boolean',
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to share');
        }
        return {
            command: 'setShare',
            nodeType: EntityConstants_1.CoreEntityTypes.Note,
            params,
            owner: noteRef,
        };
    },
};
exports.noteSendByEmail = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        toEmails: conduit_utils_1.NullableListOf('string'),
        ccEmails: conduit_utils_1.NullableListOf('string'),
        subject: conduit_utils_1.NullableString,
        message: conduit_utils_1.NullableString,
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to send by email');
        }
        return {
            command: 'sendByEmail',
            nodeType: EntityConstants_1.CoreEntityTypes.Note,
            params,
            owner: noteRef,
        };
    },
};
exports.noteSetLocation = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        latitude: 'number',
        longitude: 'number',
        altitude: 'number',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to set location');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canEditContent) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit note content');
        }
        const fields = {
            'Attributes.Location.latitude': params.latitude,
            'Attributes.Location.longitude': params.longitude,
            'Attributes.Location.altitude': params.altitude,
        };
        return {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: note.id, type: note.type },
                    node: ctx.assignFields(note.type, fields),
                }],
        };
    },
};
exports.noteSetPlaceName = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        placeName: 'string',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to set placeName');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canUpdateMetadata) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit note metadata');
        }
        const fields = {
            'Attributes.Location.placeName': params.placeName || null,
        };
        return {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: note.id, type: note.type },
                    node: ctx.assignFields(note.type, fields),
                }],
        };
    },
};
exports.noteSetSubjectDate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        date: 'timestamp',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to set date');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canEditContent) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit note content');
        }
        const fields = {
            'Attributes.subjectDate': params.date,
        };
        return {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: note.id, type: note.type },
                    node: ctx.assignFields(note.type, fields),
                }],
        };
    },
};
async function genericNoteUpdatePlan(trc, ctx, noteID, fields) {
    const noteRef = { id: noteID, type: EntityConstants_1.CoreEntityTypes.Note };
    const note = await ctx.fetchEntity(trc, noteRef);
    if (!note) {
        throw new conduit_utils_1.NotFoundError(noteID, 'Missing note for update');
    }
    return {
        results: {},
        ops: [{
                changeType: 'Node:UPDATE',
                nodeRef: { id: note.id, type: note.type },
                node: ctx.assignFields(note.type, fields),
            }],
    };
}
exports.noteSetReminder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        reminderTime: conduit_utils_1.NullableTimestamp,
        eventLabel: conduit_utils_1.NullableString,
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to set date');
        }
        const fields = {
            ['Attributes.Reminder.reminderTime']: params.reminderTime,
            ['Attributes.Reminder.reminderOrder']: note.NodeFields.Attributes.Reminder.reminderOrder || ctx.thriftTimestamp,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: note.id, type: note.type },
                    node: ctx.assignFields(note.type, fields),
                }],
        };
        // would update analytics be better as an op?
        ctx.updateAnalytics({
            reminderWithDate: {
                category: 'reminder',
                action: params.reminderTime ? 'create-withdate' : 'create-withoutdate',
                label: params.eventLabel,
                dimensions: {
                    // TODO(ME) need to check entity owner
                    ['is-content-owner']: note.syncContexts.includes(conduit_core_1.PERSONAL_USER_CONTEXT),
                },
            },
        });
        return plan;
    },
};
exports.noteClearReminder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to clear');
        }
        const label = note.label;
        ctx.updateAnalytics({
            removeReminder: {
                category: 'reminder',
                action: 'remove-reminder',
                label,
                dimensions: {
                    // TODO(ME) need to check entity owner
                    ['is-content-owner']: note.syncContexts.includes(conduit_core_1.PERSONAL_USER_CONTEXT),
                },
            },
        });
        const fields = {
            'Attributes.Reminder.reminderOrder': null,
            'Attributes.Reminder.reminderTime': null,
            'Attributes.Reminder.reminderDoneTime': null,
        };
        return {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: note.id, type: note.type },
                    node: ctx.assignFields(note.type, fields),
                }],
        };
    },
};
exports.noteSetReminderDone = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        reminderDoneTime: 'timestamp',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            'Attributes.Reminder.reminderDoneTime': params.reminderDoneTime,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteSetReminderOrder = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        reminderOrder: 'timestamp',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            'Attributes.Reminder.reminderOrder': params.reminderOrder,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteSetContentClass = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        contentClass: conduit_utils_1.NullableString,
    },
    execute: async (trc, ctx, params) => {
        var _a;
        const fields = {
            'Attributes.contentClass': (_a = params.contentClass) !== null && _a !== void 0 ? _a : null,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteSetSource = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        source: 'string',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            'Attributes.Source.source': params.source,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteSetSourceUrl = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        url: 'url',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            'Attributes.Source.sourceURL': params.url,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteSetSourceApplication = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        application: 'string',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            'Attributes.Source.sourceApplication': params.application,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteSetAuthor = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        author: 'string',
    },
    execute: async (trc, ctx, params) => {
        const fields = {
            'Attributes.Editor.author': params.author,
        };
        return genericNoteUpdatePlan(trc, ctx, params.note, fields);
    },
};
exports.noteInvite = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        privilege: MembershipPrivilege_1.MembershipPrivilegeSchema,
        emails: conduit_utils_1.NullableListOf('string'),
        userIDs: conduit_utils_1.NullableListOf('ID'),
        profileIDs: conduit_utils_1.NullableListOf('ID'),
        message: conduit_utils_1.NullableString,
    },
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to invite');
        }
        return {
            command: 'NoteInvite',
            nodeType: EntityConstants_1.CoreEntityTypes.Note,
            params,
            owner: noteRef,
        };
    },
};
exports.noteUnlinkConflictBackup = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        conflictNote: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const conflictNoteRef = { id: params.conflictNote, type: EntityConstants_1.CoreEntityTypes.Note };
        return {
            results: {},
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: undefined,
                    edgesToDelete: [{
                            srcID: noteRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: null,
                            dstID: conflictNoteRef.id, dstType: EntityConstants_1.CoreEntityTypes.Note, dstPort: 'sourceNote',
                        }],
                }],
        };
    },
};
exports.noteSetCreated = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        note: 'ID',
        created: 'timestamp',
    },
    execute: async (trc, ctx, params) => {
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.note, 'Missing note to set created timestamp');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canEditLabel) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot edit note');
        }
        const fields = {
            created: params.created,
        };
        const plan = {
            results: {},
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: { id: note.id, type: note.type },
                    node: ctx.assignFields(note.type, fields),
                }],
        };
        return plan;
    },
};
exports.noteSetApplicationDataEntry = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    params: {
        id: 'ID',
        key: 'string',
        value: conduit_utils_1.NullableString,
    },
    executeOnService: async (trc, ctx, params) => {
        const nodeRef = { id: params.id, type: EntityConstants_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, nodeRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(params.id, 'Missing note to set application data');
        }
        return {
            command: 'noteSetAppData',
            nodeType: EntityConstants_1.CoreEntityTypes.Note,
            params,
            owner: nodeRef,
        };
    },
};
//# sourceMappingURL=NoteMutators.js.map