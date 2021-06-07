"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskGroupUpsertInNoteContentInfo = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const TaskUtils_1 = require("../TaskUtils");
const NoteContentInfo_1 = require("./Helpers/NoteContentInfo");
/* Insert/Update TaskGroups in NoteContentInfo */
exports.taskGroupUpsertInNoteContentInfo = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        taskGroupNoteLevelIDs: conduit_utils_1.ListOf('string'),
        noteID: conduit_utils_1.NullableID,
        sourceOfChange: conduit_utils_1.NullableString,
    },
    resultTypes: conduit_core_1.GenericMutatorResultsSchema,
    initParams: async (trc, ctx, paramsIn, paramsOut) => {
        var _a;
        paramsOut.sourceOfChange = (_a = paramsIn.sourceOfChange) !== null && _a !== void 0 ? _a : '';
        if (!conduit_utils_1.isNullish(paramsOut.noteID)) {
            return;
        }
        const taskUserSettings = await ctx.fetchEntity(trc, { id: TaskUtils_1.getTaskUserSettingsIdByMutationContext(ctx), type: en_data_model_1.EntityTypes.TaskUserSettings });
        if (!taskUserSettings) {
            throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_ID, 'TaskUserSettings does not exist');
        }
        const defaultTaskNotes = await ctx.traverseGraph(trc, taskUserSettings, [{ edge: ['outputs', 'defaultTaskNote'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        if (!defaultTaskNotes || !defaultTaskNotes.length) {
            throw new conduit_utils_1.NotFoundError('Missing default task note');
        }
        paramsOut.noteID = defaultTaskNotes[0].id;
    },
    execute: async (trc, ctx, params) => {
        const upsertParams = Object.assign(Object.assign({}, params), { noteID: params.noteID, sourceOfChange: params.sourceOfChange });
        return await NoteContentInfo_1.taskGroupUpsertPlan(trc, ctx, upsertParams);
    },
};
//# sourceMappingURL=NoteContentInfoMutators.js.map