"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteImportInternal = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
const en_core_entity_types_1 = require("en-core-entity-types");
exports.noteImportInternal = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    isInternal: true,
    requiredParams: {
        noteContent: 'string',
        untitledNoteLabel: 'string',
        noteGenID: 'string[]',
        attachments: 'string',
    },
    optionalParams: {
        tags: 'ID[]',
        newTagLabels: 'string[]',
        tasksData: 'string',
        container: 'ID',
        label: 'string',
        created: 'number',
        updated: 'number',
        subjectDate: 'number',
        contentClass: 'string',
        latitude: 'number',
        longitude: 'number',
        altitude: 'number',
        placeName: 'string',
        reminderTime: 'number',
        reminderDoneTime: 'number',
        reminderOrder: 'number',
        author: 'string',
        source: 'string',
        sourceUrl: 'string',
        sourceApplication: 'string',
        applicationData: 'map<string>',
        sourceNoteID: 'ID',
        deleteSourceNote: 'boolean',
        notesToTrash: 'ID[]',
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        var _a;
        const attachments = en_core_entity_types_1.parseAndValidateAttachmentCreateData(params.attachments);
        // Check account limit
        const accountLimits = await ctx.fetchEntity(trc, en_core_entity_types_1.ACCOUNT_LIMITS_REF);
        if (!accountLimits) {
            throw new conduit_utils_1.NotFoundError(en_core_entity_types_1.ACCOUNT_LIMITS_REF.id, 'Missing limits');
        }
        const count = accountLimits.NodeFields.Counts.userNoteCount;
        const max = accountLimits.NodeFields.Limits.userNoteCountMax;
        if (count >= max) {
            // TODO: make errors use actual fields once conduit errors are fully separated from thrift errors
            new conduit_utils_1.ServiceError('LIMIT_REACHED', en_core_entity_types_1.CoreEntityTypes.Note, 'type=LIMIT_REACHED thriftExceptionParameter=Note limit=userNoteCountMax');
        }
        // check maxNoteSize and uploaded resources
        const updatedLimits = en_core_entity_types_1.validateAccountLimits(accountLimits, {
            prevNoteContentSize: 0,
            prevNoteResourceSize: 0,
            newNoteContentSize: params.noteContent.length,
            uploadResourceSize: attachments.reduce((total, data) => total + data.size, 0),
        });
        const plan = {
            results: {
                result: null,
            },
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: en_core_entity_types_1.ACCOUNT_LIMITS_REF,
                    node: updatedLimits,
                }],
        };
        const { noteID, owner } = await en_core_entity_types_1.genNoteCreate(trc, ctx, Object.assign(Object.assign({}, params), { attachmentHashes: attachments.map(data => data.hash) }), plan);
        const tagLabels = (_a = params.newTagLabels) !== null && _a !== void 0 ? _a : [];
        for (let i = 0; i < tagLabels.length; i++) {
            const tagLabel = tagLabels[i];
            tagLabel && await en_core_entity_types_1.genTagCreate(trc, ctx, {
                name: tagLabel,
                note: noteID,
            }, plan, false, i);
        }
        plan.results.result = noteID;
        const noteRef = { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        for (const data of attachments) {
            await en_core_entity_types_1.genAttachmentCreateOps(trc, ctx, data, plan, noteRef, owner, true, true);
        }
        // Recreate taskGroups and tasks
        const tasksExportData = en_conduit_plugin_task_1.parseAndValidateTasksExportData(params.tasksData);
        if (tasksExportData) {
            await en_conduit_plugin_task_1.genTasksDataCreateOps(trc, ctx, tasksExportData, noteID, plan, owner);
        }
        return plan;
    },
};
//# sourceMappingURL=NoteImportMutators.js.map