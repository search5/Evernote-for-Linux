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
    params: {
        noteContent: 'string',
        untitledNoteLabel: 'string',
        noteGenID: conduit_utils_1.ListOf('string'),
        attachments: 'string',
        tags: conduit_utils_1.NullableListOf('ID'),
        newTagLabels: conduit_utils_1.NullableListOf('string'),
        tasksData: conduit_utils_1.NullableString,
        container: conduit_utils_1.NullableID,
        label: conduit_utils_1.NullableString,
        created: conduit_utils_1.NullableTimestamp,
        updated: conduit_utils_1.NullableTimestamp,
        subjectDate: conduit_utils_1.NullableTimestamp,
        contentClass: conduit_utils_1.NullableString,
        latitude: conduit_utils_1.NullableNumber,
        longitude: conduit_utils_1.NullableNumber,
        altitude: conduit_utils_1.NullableNumber,
        placeName: conduit_utils_1.NullableString,
        reminderTime: conduit_utils_1.NullableTimestamp,
        reminderDoneTime: conduit_utils_1.NullableTimestamp,
        reminderOrder: conduit_utils_1.NullableTimestamp,
        author: conduit_utils_1.NullableString,
        source: conduit_utils_1.NullableString,
        sourceUrl: conduit_utils_1.NullableString,
        sourceApplication: conduit_utils_1.NullableString,
        applicationData: conduit_utils_1.NullableMapOf('string'),
        sourceNoteID: conduit_utils_1.NullableID,
        deleteSourceNote: conduit_utils_1.NullableBoolean,
        notesToTrash: conduit_utils_1.NullableListOf('ID'),
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    execute: async (trc, ctx, params) => {
        var _a, _b, _c;
        const attachments = en_core_entity_types_1.parseAndValidateAttachmentCreateData(params.attachments);
        // Check account limit
        const accountLimits = await ctx.fetchEntity(trc, en_core_entity_types_1.ACCOUNT_LIMITS_REF);
        const newTagsCount = ((_a = params.newTagLabels) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const noteTagsCount = ((_b = params.tags) === null || _b === void 0 ? void 0 : _b.length) || 0;
        en_core_entity_types_1.validateNoteTagsCount(accountLimits, newTagsCount + noteTagsCount);
        en_core_entity_types_1.validateAccountLimits(accountLimits, { userNoteCountChange: 1, userTagCountChange: newTagsCount });
        // check maxNoteSize and uploaded resources
        const updatedLimits = en_core_entity_types_1.validateAndCalculateSizeLimits(accountLimits, {
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
        const tagLabels = (_c = params.newTagLabels) !== null && _c !== void 0 ? _c : [];
        for (let i = 0; i < tagLabels.length; i++) {
            const tagLabel = tagLabels[i];
            tagLabel && await en_core_entity_types_1.genTagCreate(trc, ctx, {
                name: tagLabel,
                note: noteID,
            }, plan, null, i);
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